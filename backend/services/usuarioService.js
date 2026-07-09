// services/usuarioService.js
// Equivalente ao Services/UsuarioService.cs original.

const db = require('../db');
const { hashPassword } = require('./passwordHasher');
const { isValidEmail, isValidTelefone, onlyDigits } = require('./validation');
const { mapUsuario } = require('./authService');

function obterTodos() {
  return db.prepare('SELECT * FROM usuarios ORDER BY nome').all().map(mapUsuario);
}

function criar({ nome, nomeUsuario, email, telefone, senha, papel }) {
  if (!nome?.trim() || !nomeUsuario?.trim() || !email?.trim() || !telefone?.trim()) {
    return { sucesso: false, erro: 'Preencha nome, usuário, e-mail e telefone.' };
  }

  if (!isValidEmail(email)) {
    return { sucesso: false, erro: 'Informe um e-mail em um formato válido.' };
  }

  if (!isValidTelefone(telefone)) {
    return { sucesso: false, erro: 'Informe um telefone válido, com DDD.' };
  }

  if (!senha || senha.length < 6) {
    return { sucesso: false, erro: 'A senha precisa ter pelo menos 6 caracteres.' };
  }

  const usuarioExiste = db.prepare('SELECT 1 FROM usuarios WHERE LOWER(nome_usuario) = LOWER(?)').get(nomeUsuario.trim());
  if (usuarioExiste) return { sucesso: false, erro: 'Já existe um usuário com esse login.' };

  const emailExiste = db.prepare('SELECT 1 FROM usuarios WHERE LOWER(email) = LOWER(?)').get(email.trim());
  if (emailExiste) return { sucesso: false, erro: 'Já existe uma conta com esse e-mail.' };

  const { hash, salt } = hashPassword(senha);
  const telefoneDigits = onlyDigits(telefone);

  const info = db.prepare(`
    INSERT INTO usuarios (nome, nome_usuario, email, telefone, password_hash, password_salt, papel, criado_em)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(nome.trim(), nomeUsuario.trim(), email.trim(), telefoneDigits, hash, salt, papel, new Date().toISOString());

  const row = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(info.lastInsertRowid);
  return { sucesso: true, usuario: mapUsuario(row) };
}

function redefinirSenha(usuarioId, novaSenha) {
  if (!novaSenha || novaSenha.length < 6) {
    return { ok: false, erro: 'A senha precisa ter pelo menos 6 caracteres.' };
  }

  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(usuarioId);
  if (!usuario) return { ok: false, erro: 'Usuário não encontrado.' };

  const { hash, salt } = hashPassword(novaSenha);
  db.prepare('UPDATE usuarios SET password_hash = ?, password_salt = ? WHERE id = ?').run(hash, salt, usuarioId);
  return { ok: true };
}

function excluir(usuarioId, usuarioLogadoId) {
  if (usuarioId === usuarioLogadoId) {
    return { ok: false, erro: 'Você não pode excluir seu próprio usuário logado.' };
  }

  const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(usuarioId);
  if (!usuario) return { ok: false, erro: 'Usuário não encontrado.' };

  if (usuario.papel === 'Administrador') {
    const totalAdmins = db.prepare("SELECT COUNT(*) AS c FROM usuarios WHERE papel = 'Administrador'").get().c;
    if (totalAdmins <= 1) {
      return { ok: false, erro: 'Precisa existir ao menos um Administrador.' };
    }
  }

  db.prepare('DELETE FROM usuarios WHERE id = ?').run(usuarioId);
  return { ok: true };
}

module.exports = { obterTodos, criar, redefinirSenha, excluir };
