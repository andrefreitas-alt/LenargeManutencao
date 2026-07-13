// routes/cadastro.js
const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const cadastroService = require('../services/cadastroService');

router.use(requireAuth);

router.get('/tipos', async (req, res) => {
  try {
    const itens = await cadastroService.obterTipos();
    res.json({ itens });
  } catch (err) {
    console.error('Erro ao obter tipos:', err);
    res.status(500).json({ erro: 'Erro interno ao buscar tipos.' });
  }
});

router.post('/tipos', requireAdmin, async (req, res) => {
  try {
    const nome = (req.body.nome || '').trim().toUpperCase();
    const resultado = await cadastroService.adicionarTipo(nome);
    if (!resultado.ok) return res.status(400).json({ erro: resultado.erro });

    const itensAtualizados = await cadastroService.obterTipos();
    res.status(201).json({ itens: itensAtualizados });
  } catch (err) {
    console.error('Erro ao adicionar tipo:', err);
    res.status(500).json({ erro: 'Erro interno ao adicionar tipo.' });
  }
});

router.delete('/tipos/:id', requireAdmin, async (req, res) => {
  try {
    await cadastroService.removerTipo(Number(req.params.id));
    const itensAtualizados = await cadastroService.obterTipos();
    res.json({ itens: itensAtualizados });
  } catch (err) {
    console.error('Erro ao remover tipo:', err);
    res.status(500).json({ erro: 'Erro interno ao remover tipo.' });
  }
});

router.get('/locais', async (req, res) => {
  try {
    const itens = await cadastroService.obterLocais();
    res.json({ itens });
  } catch (err) {
    console.error('Erro ao obter locais:', err);
    res.status(500).json({ erro: 'Erro interno ao buscar locais.' });
  }
});

router.post('/locais', requireAdmin, async (req, res) => {
  try {
    const nome = (req.body.nome || '').trim().toUpperCase();
    const resultado = await cadastroService.adicionarLocal(nome);
    if (!resultado.ok) return res.status(400).json({ erro: resultado.erro });

    const itensAtualizados = await cadastroService.obterLocais();
    res.status(201).json({ itens: itensAtualizados });
  } catch (err) {
    console.error('Erro ao adicionar local:', err);
    res.status(500).json({ erro: 'Erro interno ao adicionar local.' });
  }
});

router.delete('/locais/:id', requireAdmin, async (req, res) => {
  try {
    await cadastroService.removerLocal(Number(req.params.id));
    const itensAtualizados = await cadastroService.obterLocais();
    res.json({ itens: itensAtualizados });
  } catch (err) {
    console.error('Erro ao remover local:', err);
    res.status(500).json({ erro: 'Erro interno ao remover local.' });
  }
});

module.exports = router;