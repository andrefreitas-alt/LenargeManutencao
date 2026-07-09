// services/cadastroService.js
// Equivalente ao Services/CadastroService.cs original.

const db = require('../db');

function obterTipos() {
  return db.prepare('SELECT * FROM tipos ORDER BY nome').all();
}

function obterLocais() {
  return db.prepare('SELECT * FROM locais ORDER BY nome').all();
}

function adicionarTipo(nome) {
  nome = (nome || '').trim();
  if (!nome) return { ok: false, erro: 'Informe um nome.' };
  const existe = db.prepare('SELECT 1 FROM tipos WHERE LOWER(nome) = LOWER(?)').get(nome);
  if (existe) return { ok: false, erro: 'Esse tipo já existe.' };
  db.prepare('INSERT INTO tipos (nome) VALUES (?)').run(nome);
  return { ok: true };
}

function removerTipo(id) {
  db.prepare('DELETE FROM tipos WHERE id = ?').run(id);
}

function adicionarLocal(nome) {
  nome = (nome || '').trim();
  if (!nome) return { ok: false, erro: 'Informe um nome.' };
  const existe = db.prepare('SELECT 1 FROM locais WHERE LOWER(nome) = LOWER(?)').get(nome);
  if (existe) return { ok: false, erro: 'Esse local já existe.' };
  db.prepare('INSERT INTO locais (nome) VALUES (?)').run(nome);
  return { ok: true };
}

function removerLocal(id) {
  db.prepare('DELETE FROM locais WHERE id = ?').run(id);
}

module.exports = { obterTipos, obterLocais, adicionarTipo, removerTipo, adicionarLocal, removerLocal };
