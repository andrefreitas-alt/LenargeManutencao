// services/usuarioService.js
// Equivalente ao Services/UsuarioService.cs original.

const db = require('../db');
const { hashPassword } = require('./passwordHasher');
const { isValidEmail, isValidTelefone, onlyDigits } = require('./validation');
const { mapUsuario, isLenargeEmail } = require('./authService');

async function obterTodos() {
  const res = await db.query('SELECT * FROM usuarios ORDER BY nome');
  return res.rows.map(mapUsuario);
}

async function criar({ nome, nomeUsuario, email, telefone, senha, papel }) {
  if (!nome?.trim() || !nomeUsuario?.trim() || !email?.trim() || !telefone?.trim()) {
    return { sucesso: false, erro: 'Preencha nome, usuário, e-mail e telefone.' };
  }

  if (!isValidEmail(email)) {
    return { sucesso: false, erro: 'Informe um e-mail em um formato válido.' };
  }

  if (!isLenargeEmail(email)) {
    return { sucesso: false, erro: 'Somente usuários com e-mail corporativo @lenarge.com.br podem se cadastrar.' };
  }

  if (!isValidTelefone(telefone)) {
    return { sucesso: false, erro: 'Informe um telefone válido, com DDD.' };
  }

  if (!senha || senha.length < 6) {
    return { sucesso: false, erro: 'A senha precisa ter pelo menos 6 caracteres.' };
  }

  const usuarioExisteRes = await db.query('SELECT 1 FROM usuarios WHERE LOWER(nome_usuario) = LOWER($1)', [nomeUsuario.trim()]);
  if (usuarioExisteRes.rows.length > 0) return { sucesso: false, erro: 'Já existe um usuário com esse login.' };

  const emailExisteRes = await db.query('SELECT 1 FROM usuarios WHERE LOWER(email) = LOWER($1)', [email.trim()]);
  if (emailExisteRes.rows.length > 0) return { sucesso: false, erro: 'Já existe uma conta com esse e-mail.' };

  const { hash, salt } = hashPassword(senha);
  const telefoneDigits = onlyDigits(telefone);

  const insertRes = await db.query(`
    INSERT INTO usuarios (nome, nome_usuario, email, telefone, password_hash, password_salt, papel, criado_em)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `, [nome.trim(), nomeUsuario.trim(), email.trim(), telefoneDigits, hash, salt, papel, new Date().toISOString()]);

  const row = insertRes.rows[0];
  return { sucesso: true, usuario: mapUsuario(row) };
}

async function redefinirSenha(usuarioId, novaSenha) {
  if (!novaSenha || novaSenha.length < 6) {
    return { ok: false, erro: 'A senha precisa ter pelo menos 6 caracteres.' };
  }

  const res = await db.query('SELECT * FROM usuarios WHERE id = $1', [usuarioId]);
  const usuario = res.rows[0];
  if (!usuario) return { ok: false, erro: 'Usuário não encontrado.' };

  const { hash, salt } = hashPassword(novaSenha);
  await db.query('UPDATE usuarios SET password_hash = $1, password_salt = $2 WHERE id = $3', [hash, salt, usuarioId]);
  return { ok: true };
}

async function excluir(usuarioId, usuarioLogadoId) {
  if (usuarioId === usuarioLogadoId) {
    return { ok: false, erro: 'Você não pode excluir seu próprio usuário logado.' };
  }

  const res = await db.query('SELECT * FROM usuarios WHERE id = $1', [usuarioId]);
  const usuario = res.rows[0];
  if (!usuario) return { ok: false, erro: 'Usuário não encontrado.' };

  if (usuario.papel === 'Administrador') {
    const totalAdminsRes = await db.query("SELECT COUNT(*) AS c FROM usuarios WHERE papel = 'Administrador'");
    const totalAdmins = parseInt(totalAdminsRes.rows[0].c);
    if (totalAdmins <= 1) {
      return { ok: false, erro: 'Precisa existir ao menos um Administrador.' };
    }
  }

  await db.query('DELETE FROM usuarios WHERE id = $1', [usuarioId]);
  return { ok: true };
}

module.exports = { obterTodos, criar, redefinirSenha, excluir };