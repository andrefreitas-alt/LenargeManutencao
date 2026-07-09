// services/authService.js
// Equivalente ao Services/AuthService.cs original.

const db = require('../db');
const { hashPassword, verifyPassword } = require('./passwordHasher');
const { isValidEmail, isValidTelefone, onlyDigits } = require('./validation');

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

function login(nomeUsuario, senha) {
  if (!nomeUsuario || !nomeUsuario.trim() || !senha || !senha.trim()) {
    return { sucesso: false, erro: 'Preencha usuário e senha.' };
  }

  const row = db.prepare(`
    SELECT * FROM usuarios WHERE LOWER(nome_usuario) = LOWER(?)
  `).get(nomeUsuario.trim());

  if (!row || !verifyPassword(senha, row.password_hash, row.password_salt)) {
    return { sucesso: false, erro: 'Usuário ou senha inválidos.' };
  }

  return { sucesso: true, usuario: mapUsuario(row) };
}

// Autocadastro — sempre cria conta como Solicitante. Um Administrador só é
// criado por outro Administrador já autenticado (ver Configurações →
// Usuários), nunca por autocadastro.
function cadastrarSolicitante({ nome, email, telefone, nomeUsuario, senha, confirmarSenha }) {
  if (!nome?.trim() || !email?.trim() || !telefone?.trim() || !nomeUsuario?.trim() || !senha?.trim()) {
    return { sucesso: false, erro: 'Preencha todos os campos.' };
  }

  if (!isValidEmail(email)) {
    return { sucesso: false, erro: 'Informe um e-mail em um formato válido (ex: nome@empresa.com).' };
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

  const usuarioExiste = db.prepare('SELECT 1 FROM usuarios WHERE LOWER(nome_usuario) = LOWER(?)').get(nomeUsuario.trim());
  if (usuarioExiste) {
    return { sucesso: false, erro: 'Esse usuário já existe, escolha outro.' };
  }

  const emailExiste = db.prepare('SELECT 1 FROM usuarios WHERE LOWER(email) = LOWER(?)').get(email.trim());
  if (emailExiste) {
    return { sucesso: false, erro: 'Já existe uma conta com esse e-mail.' };
  }

  const telefoneDigits = onlyDigits(telefone);
  const telefoneExiste = db.prepare('SELECT 1 FROM usuarios WHERE telefone = ?').get(telefoneDigits);
  if (telefoneExiste) {
    return { sucesso: false, erro: 'Já existe uma conta com esse telefone.' };
  }

  const { hash, salt } = hashPassword(senha);
  const info = db.prepare(`
    INSERT INTO usuarios (nome, nome_usuario, email, telefone, password_hash, password_salt, papel, criado_em)
    VALUES (?, ?, ?, ?, ?, ?, 'Solicitante', ?)
  `).run(nome.trim(), nomeUsuario.trim(), email.trim(), telefoneDigits, hash, salt, new Date().toISOString());

  const row = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(info.lastInsertRowid);
  return { sucesso: true, usuario: mapUsuario(row) };
}

module.exports = { login, cadastrarSolicitante, mapUsuario };
