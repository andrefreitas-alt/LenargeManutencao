// services/authService.js
// Equivalente ao Services/AuthService.cs original.

const db = require('../db');
const { hashPassword, verifyPassword } = require('./passwordHasher');
const { isValidEmail, isValidTelefone, onlyDigits } = require('./validation');

function isLenargeEmail(email) {
  return /^[^\s@]+@lenarge\.com\.br$/i.test((email || '').trim());
}

function mapUsuario(row) {
  if (!row) return null;
  return {
    id: row.id,
    nome: row.nome,
    nomeUsuario: row.nome_usuario,
    email: row.email,
    telefone: row.telefone,
    papel: row.papel,
    criadoEm: row.criado_em
  };
}

async function login(nomeUsuario, senha) {
  if (!nomeUsuario || !nomeUsuario.trim() || !senha || !senha.trim()) {
    return { sucesso: false, erro: 'Preencha usuário e senha.' };
  }

  const res = await db.query(`
    SELECT * FROM usuarios WHERE LOWER(nome_usuario) = LOWER($1)
  `, [nomeUsuario.trim()]);

  const row = res.rows[0];

  if (!row || !verifyPassword(senha, row.password_hash, row.password_salt)) {
    return { sucesso: false, erro: 'Usuário ou senha inválidos.' };
  }

  return { sucesso: true, usuario: mapUsuario(row) };
}

async function cadastrarSolicitante({ nome, email, telefone, nomeUsuario, senha, confirmarSenha }) {
  if (!nome?.trim() || !email?.trim() || !telefone?.trim() || !nomeUsuario?.trim() || !senha?.trim()) {
    return { sucesso: false, erro: 'Preencha todos os campos.' };
  }

  if (!isValidEmail(email)) {
    return { sucesso: false, erro: 'Informe um e-mail em um formato válido (ex: nome@empresa.com).' };
  }

  if (!isLenargeEmail(email)) {
    return { sucesso: false, erro: 'Somente usuários com e-mail corporativo @lenarge.com.br podem se cadastrar.' };
  }

  if (!isValidTelefone(telefone)) {
    return { sucesso: false, erro: 'Informe um telefone válido, com DDD (ex: (31) 91234-5678).' };
  }

  if (senha.length < 6) {
    return { sucesso: false, erro: 'A senha precisa ter pelo menos 6 caracteres.' };
  }

  if (senha !== confirmarSenha) {
    return { sucesso: false, erro: 'As senhas não coincidem.' };
  }

  const usuarioExisteRes = await db.query('SELECT 1 FROM usuarios WHERE LOWER(nome_usuario) = LOWER($1)', [nomeUsuario.trim()]);
  if (usuarioExisteRes.rows.length > 0) {
    return { sucesso: false, erro: 'Esse usuário já existe, escolha outro.' };
  }

  const emailExisteRes = await db.query('SELECT 1 FROM usuarios WHERE LOWER(email) = LOWER($1)', [email.trim()]);
  if (emailExisteRes.rows.length > 0) {
    return { sucesso: false, erro: 'Já existe uma conta com esse e-mail.' };
  }

  const telefoneDigits = onlyDigits(telefone);
  const telefoneExisteRes = await db.query('SELECT 1 FROM usuarios WHERE telefone = $1', [telefoneDigits]);
  if (telefoneExisteRes.rows.length > 0) {
    return { sucesso: false, erro: 'Já existe uma conta com esse telefone.' };
  }

  const { hash, salt } = hashPassword(senha);

  const insertRes = await db.query(`
    INSERT INTO usuarios (nome, nome_usuario, email, telefone, password_hash, password_salt, papel, criado_em)
    VALUES ($1, $2, $3, $4, $5, $6, 'Solicitante', $7)
    RETURNING *
  `, [nome.trim(), nomeUsuario.trim(), email.trim(), telefoneDigits, hash, salt, new Date().toISOString()]);

  const row = insertRes.rows[0];
  return { sucesso: true, usuario: mapUsuario(row) };
}

module.exports = { login, cadastrarSolicitante, mapUsuario, isLenargeEmail };