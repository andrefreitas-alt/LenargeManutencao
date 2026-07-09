// routes/auth.js
const express = require('express');
const router = express.Router();
const authService = require('../services/authService');

router.post('/login', (req, res) => {
  const { nomeUsuario, senha } = req.body;
  const resultado = authService.login(nomeUsuario, senha);

  if (!resultado.sucesso) {
    return res.status(400).json({ erro: resultado.erro });
  }

  req.session.usuario = resultado.usuario;
  res.json({ usuario: resultado.usuario });
});

router.post('/signup', (req, res) => {
  const { nome, email, telefone, nomeUsuario, senha, confirmarSenha } = req.body;
  const resultado = authService.cadastrarSolicitante({ nome, email, telefone, nomeUsuario, senha, confirmarSenha });

  if (!resultado.sucesso) {
    return res.status(400).json({ erro: resultado.erro });
  }

  req.session.usuario = resultado.usuario;
  res.json({ usuario: resultado.usuario });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

router.get('/me', (req, res) => {
  if (!req.session.usuario) {
    return res.status(401).json({ erro: 'Não autenticado.' });
  }
  res.json({ usuario: req.session.usuario });
});

module.exports = router;
