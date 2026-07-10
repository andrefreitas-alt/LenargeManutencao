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

// Transformada em async
async function login(nomeUsuario, senha) {
  if (!nomeUsuario || !nomeUsuario.trim() || !senha || !senha.trim()) {
    return { sucesso: false, erro: 'Preencha usuário e senha.' };
  }

  // Ajustado para a sintaxe do Postgres ($1 e db.query)
  const res = await db.query(`
    SELECT * FROM usuarios WHERE LOWER(nome_usuario) = LOWER($1)
  `, [nomeUsuario.trim()]);

  const row = res.rows[0]; // O pacote 'pg' coloca os resultados dentro do array rows

  if (!row || !verifyPassword(senha, row.password_hash, row.password_salt)) {
    return { sucesso: false, erro: 'Usuário ou senha inválidos.' };
  }

  return { sucesso: true, usuario: mapUsuario(row) };
}

// Autocadastro — sempre cria conta como Solicitante.
// Transformada em async
async function cadastrarSolicitante({ nome, email, telefone, nomeUsuario, senha, confirmarSenha }) {
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

  // Verificações adaptadas para async/await e sintaxe Postgres
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

  // No Postgres, usamos RETURNING * para obter a linha inserida na hora!
  const insertRes = await db.query(`
    INSERT INTO usuarios (nome, nome_usuario, email, telefone, password_hash, password_salt, papel, criado_em)
    VALUES ($1, $2, $3, $4, $5, $6, 'Solicitante', $7)
    RETURNING *
  `, [nome.trim(), nomeUsuario.trim(), email.trim(), telefoneDigits, hash, salt, new Date().toISOString()]);

  const row = insertRes.rows[0];
  return { sucesso: true, usuario: mapUsuario(row) };
}

module.exports = { login, cadastrarSolicitante, mapUsuario };