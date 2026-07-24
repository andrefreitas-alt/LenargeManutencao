// services/chatService.js
// Chat interno de suporte: conversa 1-para-1 entre Administração e cada Solicitante.

const db = require('../db');

function mapMensagem(row) {
  return {
    id: row.id,
    solicitanteUsuarioId: row.solicitante_usuario_id,
    remetenteUsuarioId: row.remetente_usuario_id,
    remetenteNome: row.remetente_nome,
    remetentePapel: row.remetente_papel,
    mensagem: row.mensagem,
    solicitacaoRefId: row.solicitacao_ref_id,
    lida: row.lida,
    criadoEm: row.criado_em
  };
}

// Lista de conversas para o Admin: um item por Solicitante que já trocou mensagem
async function obterConversas() {
  const res = await db.query(`
    SELECT
      u.id AS solicitante_id,
      u.nome AS solicitante_nome,
      (SELECT mensagem FROM chat_mensagens WHERE solicitante_usuario_id = u.id ORDER BY criado_em DESC LIMIT 1) AS ultima_mensagem,
      (SELECT criado_em FROM chat_mensagens WHERE solicitante_usuario_id = u.id ORDER BY criado_em DESC LIMIT 1) AS ultima_data,
      (SELECT COUNT(*) FROM chat_mensagens WHERE solicitante_usuario_id = u.id AND remetente_usuario_id = u.id AND lida = FALSE) AS nao_lidas
    FROM usuarios u
    WHERE u.id IN (SELECT DISTINCT solicitante_usuario_id FROM chat_mensagens)
    ORDER BY ultima_data DESC
  `);
  return res.rows.map(r => ({
    solicitanteId: r.solicitante_id,
    solicitanteNome: r.solicitante_nome,
    ultimaMensagem: r.ultima_mensagem,
    ultimaData: r.ultima_data,
    naoLidas: parseInt(r.nao_lidas)
  }));
}

// Lista de todos os Solicitantes (para o Admin poder iniciar conversa com quem ainda não conversou)
async function obterSolicitantesDisponiveis() {
  const res = await db.query(`
    SELECT id, nome FROM usuarios WHERE papel = 'Solicitante' ORDER BY nome
  `);
  return res.rows.map(r => ({ id: r.id, nome: r.nome }));
}

async function obterMensagens(solicitanteUsuarioId, usuarioAtual) {
  const res = await db.query(`
    SELECT cm.*, u.nome AS remetente_nome, u.papel AS remetente_papel
    FROM chat_mensagens cm
    JOIN usuarios u ON u.id = cm.remetente_usuario_id
    WHERE cm.solicitante_usuario_id = $1
    ORDER BY cm.criado_em ASC
  `, [solicitanteUsuarioId]);

  // Marca como lida qualquer mensagem enviada pela "outra parte" em relação a quem está vendo
  await db.query(`
    UPDATE chat_mensagens
    SET lida = TRUE
    WHERE solicitante_usuario_id = $1
      AND lida = FALSE
      AND remetente_usuario_id ${usuarioAtual.papel === 'Administrador' ? '=' : '!='} $1
  `, [solicitanteUsuarioId]);

  return res.rows.map(mapMensagem);
}

async function existeConversa(solicitanteUsuarioId) {
  const res = await db.query('SELECT 1 FROM chat_mensagens WHERE solicitante_usuario_id = $1 LIMIT 1', [solicitanteUsuarioId]);
  return res.rows.length > 0;
}

async function enviarMensagemAdmin(solicitanteUsuarioId, adminUsuario, mensagem, solicitacaoRefId) {
  const solicitanteRes = await db.query("SELECT * FROM usuarios WHERE id = $1 AND papel = 'Solicitante'", [solicitanteUsuarioId]);
  if (solicitanteRes.rows.length === 0) {
    throw Object.assign(new Error('Solicitante não encontrado.'), { status: 404 });
  }

  const agora = new Date().toISOString();
  await db.query(`
    INSERT INTO chat_mensagens (solicitante_usuario_id, remetente_usuario_id, mensagem, solicitacao_ref_id, lida, criado_em)
    VALUES ($1, $2, $3, $4, FALSE, $5)
  `, [solicitanteUsuarioId, adminUsuario.id, mensagem.trim(), solicitacaoRefId || null, agora]);

  return await obterMensagens(solicitanteUsuarioId, adminUsuario);
}

async function enviarMensagemSolicitante(usuarioAtual, mensagem) {
  const jaExiste = await existeConversa(usuarioAtual.id);
  if (!jaExiste) {
    throw Object.assign(new Error('Aguarde o administrador iniciar a conversa.'), { status: 403 });
  }

  const agora = new Date().toISOString();
  await db.query(`
    INSERT INTO chat_mensagens (solicitante_usuario_id, remetente_usuario_id, mensagem, solicitacao_ref_id, lida, criado_em)
    VALUES ($1, $2, $3, NULL, FALSE, $4)
  `, [usuarioAtual.id, usuarioAtual.id, mensagem.trim(), agora]);

  return await obterMensagens(usuarioAtual.id, usuarioAtual);
}

async function contarNaoLidas(usuarioAtual) {
  if (usuarioAtual.papel === 'Administrador') {
    const res = await db.query(`
      SELECT COUNT(*) AS c FROM chat_mensagens
      WHERE remetente_usuario_id = solicitante_usuario_id AND lida = FALSE
    `);
    return parseInt(res.rows[0].c);
  } else {
    const res = await db.query(`
      SELECT COUNT(*) AS c FROM chat_mensagens
      WHERE solicitante_usuario_id = $1 AND remetente_usuario_id != $1 AND lida = FALSE
    `, [usuarioAtual.id]);
    return parseInt(res.rows[0].c);
  }
}

module.exports = {
  obterConversas,
  obterSolicitantesDisponiveis,
  obterMensagens,
  enviarMensagemAdmin,
  enviarMensagemSolicitante,
  contarNaoLidas
};