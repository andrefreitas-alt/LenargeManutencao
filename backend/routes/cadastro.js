// routes/cadastro.js
const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const cadastroService = require('../services/cadastroService');

router.use(requireAuth);

router.get('/tipos', (req, res) => {
  res.json({ itens: cadastroService.obterTipos() });
});

router.post('/tipos', requireAdmin, (req, res) => {
  const resultado = cadastroService.adicionarTipo(req.body.nome);
  if (!resultado.ok) return res.status(400).json({ erro: resultado.erro });
  res.status(201).json({ itens: cadastroService.obterTipos() });
});

router.delete('/tipos/:id', requireAdmin, (req, res) => {
  cadastroService.removerTipo(Number(req.params.id));
  res.json({ itens: cadastroService.obterTipos() });
});

router.get('/locais', (req, res) => {
  res.json({ itens: cadastroService.obterLocais() });
});

router.post('/locais', requireAdmin, (req, res) => {
  const resultado = cadastroService.adicionarLocal(req.body.nome);
  if (!resultado.ok) return res.status(400).json({ erro: resultado.erro });
  res.status(201).json({ itens: cadastroService.obterLocais() });
});

router.delete('/locais/:id', requireAdmin, (req, res) => {
  cadastroService.removerLocal(Number(req.params.id));
  res.json({ itens: cadastroService.obterLocais() });
});

module.exports = router;
