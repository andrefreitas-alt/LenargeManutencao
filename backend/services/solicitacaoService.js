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

function carregarHistorico(solicitacaoId) {
  return db.prepare('SELECT * FROM historico WHERE solicitacao_id = ? ORDER BY data DESC').all(solicitacaoId)
    .map(h => ({ id: h.id, acao: h.acao, usuario: h.usuario, detalhe: h.detalhe, data: h.data }));
}

// Administrador vê tudo. Solicitante só vê as próprias solicitações
// (equivalente a "Consultar apenas suas solicitações" do requisito original).
function obterTodas(usuarioAtual) {
  let rows;
  if (usuarioAtual.papel === 'Solicitante') {
    rows = db.prepare('SELECT * FROM solicitacoes WHERE criado_por_usuario_id = ? ORDER BY data_abertura DESC').all(usuarioAtual.id);
  } else {
    rows = db.prepare('SELECT * FROM solicitacoes ORDER BY data_abertura DESC').all();
  }
  return rows.map(mapSolicitacao);
}

function obterPorId(id) {
  const row = db.prepare('SELECT * FROM solicitacoes WHERE id = ?').get(id);
  if (!row) return null;
  const item = mapSolicitacao(row);
  item.historico = carregarHistorico(id);
  return item;
}

function criar(nova, usuarioAtual) {
  const agora = new Date().toISOString();
  const info = db.prepare(`
    INSERT INTO solicitacoes
      (solicitante, placa, local, tipo, descricao, responsavel, observacoes, prioridade, status, data_abertura, criado_por_usuario_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pendente', ?, ?)
  `).run(
    nova.solicitante, nova.placa, nova.local, nova.tipo, nova.descricao,
    nova.responsavel, nova.observacoes, nova.prioridade, agora, usuarioAtual.id
  );

  db.prepare(`
    INSERT INTO historico (solicitacao_id, acao, usuario, detalhe, data)
    VALUES (?, 'Criação', ?, 'Solicitação criada', ?)
  `).run(info.lastInsertRowid, usuarioAtual.nome, agora);

  return obterPorId(info.lastInsertRowid);
}

// Só Administrador deveria poder mudar status — a tela já esconde os
// botões para Solicitante, mas confirmamos aqui de novo (defesa em
// profundidade: nunca confiar só na UI).
function mudarStatus(solicitacaoId, novoStatus, usuarioAtual) {
  if (usuarioAtual.papel !== 'Administrador') {
    throw Object.assign(new Error('Apenas Administradores podem alterar o status.'), { status: 403 });
  }

  const item = db.prepare('SELECT * FROM solicitacoes WHERE id = ?').get(solicitacaoId);
  if (!item) throw Object.assign(new Error('Solicitação não encontrada.'), { status: 404 });

  const statusAntigo = item.status;
  const agora = new Date().toISOString();

  const dataInicio = (novoStatus === 'EmAndamento' && !item.data_inicio) ? agora : item.data_inicio;
  const dataConclusao = (novoStatus === 'Concluido') ? agora : item.data_conclusao;

  db.prepare(`
    UPDATE solicitacoes SET status = ?, data_inicio = ?, data_conclusao = ? WHERE id = ?
  `).run(novoStatus, dataInicio, dataConclusao, solicitacaoId);

  db.prepare(`
    INSERT INTO historico (solicitacao_id, acao, usuario, detalhe, data)
    VALUES (?, 'Status alterado', ?, ?, ?)
  `).run(solicitacaoId, usuarioAtual.nome, `${statusToDisplay(statusAntigo)} → ${statusToDisplay(novoStatus)}`, agora);

  return obterPorId(solicitacaoId);
}

function duplicar(solicitacaoId, usuarioAtual) {
  const original = db.prepare('SELECT * FROM solicitacoes WHERE id = ?').get(solicitacaoId);
  if (!original) throw Object.assign(new Error('Solicitação não encontrada.'), { status: 404 });

  const agora = new Date().toISOString();
  const info = db.prepare(`
    INSERT INTO solicitacoes
      (solicitante, placa, local, tipo, descricao, responsavel, observacoes, prioridade, status, data_abertura, criado_por_usuario_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pendente', ?, ?)
  `).run(
    original.solicitante, original.placa, original.local, original.tipo, original.descricao,
    original.responsavel, original.observacoes, original.prioridade, agora, usuarioAtual.id
  );

  db.prepare(`
    INSERT INTO historico (solicitacao_id, acao, usuario, detalhe, data)
    VALUES (?, 'Criação', ?, ?, ?)
  `).run(info.lastInsertRowid, usuarioAtual.nome, `Duplicado da solicitação #${original.id}`, agora);

  return obterPorId(info.lastInsertRowid);
}

function excluir(solicitacaoId, usuarioAtual) {
  if (usuarioAtual.papel !== 'Administrador') {
    throw Object.assign(new Error('Apenas Administradores podem excluir solicitações.'), { status: 403 });
  }
  db.prepare('DELETE FROM solicitacoes WHERE id = ?').run(solicitacaoId);
}

module.exports = { obterTodas, obterPorId, criar, mudarStatus, duplicar, excluir, mapSolicitacao };
