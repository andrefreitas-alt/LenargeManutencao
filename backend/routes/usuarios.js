// routes/usuarios.js
const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const usuarioService = require('../services/usuarioService');

router.use(requireAdmin);

router.get('/', (req, res) => {
  res.json({ itens: usuarioService.obterTodos() });
});

router.post('/', (req, res) => {
  const { nome, nomeUsuario, email, telefone, senha, papel } = req.body;
  const resultado = usuarioService.criar({ nome, nomeUsuario, email, telefone, senha, papel });
  if (!resultado.sucesso) return res.status(400).json({ erro: resultado.erro });
  res.status(201).json({ usuario: resultado.usuario });
});

router.post('/:id/senha', (req, res) => {
  const resultado = usuarioService.redefinirSenha(Number(req.params.id), req.body.novaSenha);
  if (!resultado.ok) return res.status(400).json({ erro: resultado.erro });
  res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
  const resultado = usuarioService.excluir(Number(req.params.id), req.session.usuario.id);
  if (!resultado.ok) return res.status(400).json({ erro: resultado.erro });
  res.json({ ok: true });
});

module.exports = router;
