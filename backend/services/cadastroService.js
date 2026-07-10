// services/cadastroService.js
// Equivalente ao Services/CadastroService.cs original.

const db = require('../db');

// Convertida para async
async function obterTipos() {
  const res = await db.query('SELECT * FROM tipos ORDER BY nome');
  return res.rows;
}

// Convertida para async
async function obterLocais() {
  const res = await db.query('SELECT * FROM locais ORDER BY nome');
  return res.rows;
}

// Convertida para async
async function adicionarTipo(nome) {
  nome = (nome || '').trim();
  if (!nome) return { ok: false, erro: 'Informe um nome.' };
  
  const existeRes = await db.query('SELECT 1 FROM tipos WHERE LOWER(nome) = LOWER($1)', [nome]);
  if (existeRes.rows.length > 0) return { ok: false, erro: 'Esse tipo já existe.' };
  
  await db.query('INSERT INTO tipos (nome) VALUES ($1)', [nome]);
  return { ok: true };
}

// Convertida para async
async function removerTipo(id) {
  await db.query('DELETE FROM tipos WHERE id = $1', [id]);
}

// Convertida para async
async function adicionarLocal(nome) {
  nome = (nome || '').trim();
  if (!nome) return { ok: false, erro: 'Informe um nome.' };
  
  const existeRes = await db.query('SELECT 1 FROM locais WHERE LOWER(nome) = LOWER($1)', [nome]);
  if (existeRes.rows.length > 0) return { ok: false, erro: 'Esse local já existe.' };
  
  await db.query('INSERT INTO locais (nome) VALUES ($1)', [nome]);
  return { ok: true };
}

// Convertida para async
async function removerLocal(id) {
  await db.query('DELETE FROM locais WHERE id = $1', [id]);
}

module.exports = { obterTipos, obterLocais, adicionarTipo, removerTipo, adicionarLocal, removerLocal };