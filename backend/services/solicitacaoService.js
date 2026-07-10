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
    dataInicio: row.data_inicio,
    dataConclusao: row.data_conclusao,
    criadoPorUsuarioId: row.criado_por_usuario_id,
    tempoResolucaoHoras
  };
}

// Convertida para async
async function carregarHistorico(solicitacaoId) {
  const res = await db.query('SELECT * FROM historico WHERE solicitacao_id = $1 ORDER BY data DESC', [solicitacaoId]);
  return res.rows.map(h => ({ id: h.id, acao: h.acao, usuario: h.usuario, detalhe: h.detalhe, data: h.data }));
}

// Convertida para async
async function obterTodas(usuarioAtual) {
  let res;
  if (usuarioAtual.papel === 'Solicitante') {
    res = await db.query('SELECT * FROM solicitacoes WHERE criado_por_usuario_id = $1 ORDER BY data_abertura DESC', [usuarioAtual.id]);
  } else {
    res = await db.query('SELECT * FROM solicitacoes ORDER BY data_abertura DESC');
  }
  return res.rows.map(mapSolicitacao);
}

// Convertida para async
async function obterPorId(id) {
  const res = await db.query('SELECT * FROM solicitacoes WHERE id = $1', [id]);
  const row = res.rows[0];
  if (!row) return null;
  const item = mapSolicitacao(row);
  item.historico = await carregarHistorico(id);
  return item;
}

// Convertida para async
async function criar(nova, usuarioAtual) {
  const agora = new Date().toISOString();
  
  // No Postgres, usamos RETURNING id para pegar o ID gerado
  const insertSolicitacao = await db.query(`
    INSERT INTO solicitacoes
      (solicitante, placa, local, tipo, descricao, responsavel, observacoes, prioridade, status, data_abertura, criado_por_usuario_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pendente', $9, $10)
    RETURNING id
  `, [
    nova.solicitante, nova.placa, nova.local, nova.tipo, nova.descricao,
    nova.responsavel, nova.observacoes, nova.prioridade, agora, usuarioAtual.id
  ]);

  const novoId = insertSolicitacao.rows[0].id;

  await db.query(`
    INSERT INTO historico (solicitacao_id, acao, usuario, detalhe, data)
    VALUES ($1, 'Criação', $2, 'Solicitação criada', $3)
  `, [novoId, usuarioAtual.nome, agora]);

  return await obterPorId(novoId);
}

// Convertida para async
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

// Convertida para async
async function duplicar(solicitacaoId, usuarioAtual) {
  const res = await db.query('SELECT * FROM solicitacoes WHERE id = $1', [solicitacaoId]);
  const original = res.rows[0];
  if (!original) throw Object.assign(new Error('Solicitação não encontrada.'), { status: 404 });

  const agora = new Date().toISOString();
  
  const insertDuplicada = await db.query(`
    INSERT INTO solicitacoes
      (solicitante, placa, local, tipo, descricao, responsavel, observacoes, prioridade, status, data_abertura, criado_por_usuario_id)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Pendente', $9, $10)
    RETURNING id
  `, [
    original.solicitante, original.placa, original.local, original.tipo, original.descricao,
    original.responsavel, original.observacoes, original.prioridade, agora, usuarioAtual.id
  ]);

  const novoId = insertDuplicada.rows[0].id;

  await db.query(`
    INSERT INTO historico (solicitacao_id, acao, usuario, detalhe, data)
    VALUES ($1, 'Criação', $2, $3, $4)
  `, [novoId, usuarioAtual.nome, `Duplicado da solicitação #${original.id}`, agora]);

  return await obterPorId(novoId);
}

// Convertida para async
async function excluir(solicitacaoId, usuarioAtual) {
  if (usuarioAtual.papel !== 'Administrador') {
    throw Object.assign(new Error('Apenas Administradores podem excluir solicitações.'), { status: 403 });
  }
  await db.query('DELETE FROM solicitacoes WHERE id = $1', [solicitacaoId]);
}

module.exports = { obterTodas, obterPorId, criar, mudarStatus, duplicar, excluir, mapSolicitacao };