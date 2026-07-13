// services/solicitacaoService.js
// Equivalente ao Services/SolicitacaoService.cs original.

const db = require('../db');
const { statusToDisplay } = require('./enums');

function mapSolicitacao(row) {
  if (!row) return null;
  const tempoResolucaoHoras =
    row.data_inicio && row.data_conclusao
      ? (new Date(row.data_conclusao) - new Date(row.data_inicio)) / (1000 * 60 * 60)
      : null;

  return {
    id: row.id,
    solicitante: row.solicitante,
    placa: row.placa,
    local: row.local,
    tipo: row.tipo,
    descricao: row.descricao,
    responsavel: row.responsavel,
    observacoes: row.observacoes,
    prioridade: row.prioridade,
    status: row.status,
    dataAbertura: row.data_abertura,
    dataAgendada: row.data_agendada,
    dataInicio: row.data_inicio,
    dataConclusao: row.data_conclusao,
    criadoPorUsuarioId: row.criado_por_usuario_id,
    tempoResolucaoHoras
  };
}

async function carregarHistorico(solicitacaoId) {
  const res = await db.query('SELECT * FROM historico WHERE solicitacao_id = $1 ORDER BY data DESC', [solicitacaoId]);
  return res.rows.map(h => ({ id: h.id, acao: h.acao, usuario: h.usuario, detalhe: h.detalhe, data: h.data }));
}

// Todos os papéis (Administrador e Solicitante) veem todas as solicitações,
// ordenadas pela data agendada (mais próxima primeiro)
async function obterTodas(usuarioAtual) {
  const res = await db.query('SELECT * FROM solicitacoes ORDER BY data_agendada ASC');
  return res.rows.map(mapSolicitacao);
}

async function obterPorId(id) {
  const res = await db.query('SELECT * FROM solicitacoes WHERE id = $1', [id]);
  const row = res.rows[0];
  if (!row) return null;
  const item = mapSolicitacao(row);
  item.historico = await carregarHistorico(id);
  return item;
}

async function criar(nova, usuarioAtual) {
  const agora = new Date().toISOString();

  const insertSolicitacao = await db.query(`
    INSERT INTO solicitacoes
      (solicitante, placa, local, tipo, descricao, responsavel, observacoes, prioridade, status, data_abertura, data_agendada, criado_por_usuario_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pendente', $9, $10, $11)
    RETURNING id
  `, [
    nova.solicitante, nova.placa, nova.local, nova.tipo, nova.descricao,
    nova.responsavel, nova.observacoes, nova.prioridade, agora, nova.dataAgendada, usuarioAtual.id
  ]);

  const novoId = insertSolicitacao.rows[0].id;

  await db.query(`
    INSERT INTO historico (solicitacao_id, acao, usuario, detalhe, data)
    VALUES ($1, 'Criação', $2, 'Solicitação criada', $3)
  `, [novoId, usuarioAtual.nome, agora]);

  return await obterPorId(novoId);
}

async function mudarStatus(solicitacaoId, novoStatus, usuarioAtual) {
  if (usuarioAtual.papel !== 'Administrador') {
    throw Object.assign(new Error('Apenas Administradores podem alterar o status.'), { status: 403 });
  }

  const res = await db.query('SELECT * FROM solicitacoes WHERE id = $1', [solicitacaoId]);
  const item = res.rows[0];
  if (!item) throw Object.assign(new Error('Solicitação não encontrada.'), { status: 404 });

  const statusAntigo = item.status;
  const agora = new Date().toISOString();

  const dataInicio = (novoStatus === 'EmAndamento' && !item.data_inicio) ? agora : item.data_inicio;
  const dataConclusao = (novoStatus === 'Concluido') ? agora : item.data_conclusao;

  await db.query(`
    UPDATE solicitacoes SET status = $1, data_inicio = $2, data_conclusao = $3 WHERE id = $4
  `, [novoStatus, dataInicio, dataConclusao, solicitacaoId]);

  await db.query(`
    INSERT INTO historico (solicitacao_id, acao, usuario, detalhe, data)
    VALUES ($1, 'Status alterado', $2, $3, $4)
  `, [solicitacaoId, usuarioAtual.nome, `${statusToDisplay(statusAntigo)} → ${statusToDisplay(novoStatus)}`, agora]);

  return await obterPorId(solicitacaoId);
}

async function duplicar(solicitacaoId, usuarioAtual) {
  const res = await db.query('SELECT * FROM solicitacoes WHERE id = $1', [solicitacaoId]);
  const original = res.rows[0];
  if (!original) throw Object.assign(new Error('Solicitação não encontrada.'), { status: 404 });

  const agora = new Date().toISOString();

  const insertDuplicada = await db.query(`
    INSERT INTO solicitacoes
      (solicitante, placa, local, tipo, descricao, responsavel, observacoes, prioridade, status, data_abertura, data_agendada, criado_por_usuario_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pendente', $9, $10, $11)
    RETURNING id
  `, [
    original.solicitante, original.placa, original.local, original.tipo, original.descricao,
    original.responsavel, original.observacoes, original.prioridade, agora, original.data_agendada, usuarioAtual.id
  ]);

  const novoId = insertDuplicada.rows[0].id;

  await db.query(`
    INSERT INTO historico (solicitacao_id, acao, usuario, detalhe, data)
    VALUES ($1, 'Criação', $2, $3, $4)
  `, [novoId, usuarioAtual.nome, `Duplicado da solicitação #${original.id}`, agora]);

  return await obterPorId(novoId);
}

async function excluir(solicitacaoId, usuarioAtual) {
  if (usuarioAtual.papel !== 'Administrador') {
    throw Object.assign(new Error('Apenas Administradores podem excluir solicitações.'), { status: 403 });
  }
  await db.query('DELETE FROM solicitacoes WHERE id = $1', [solicitacaoId]);
}

module.exports = { obterTodas, obterPorId, criar, mudarStatus, duplicar, excluir, mapSolicitacao };