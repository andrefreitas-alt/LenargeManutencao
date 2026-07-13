// routes/solicitacoes.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const solicitacaoService = require('../services/solicitacaoService');

router.use(requireAuth);

// Lista (Adicionado async/await e try/catch)
router.get('/', async (req, res) => {
  try {
    const itens = await solicitacaoService.obterTodas(req.session.usuario);
    res.json({ itens });
  } catch (err) {
    console.error('Erro ao obter solicitações:', err);
    res.status(500).json({ erro: 'Erro interno ao buscar solicitações.' });
  }
});

// Buscar por ID (Adicionado async/await e try/catch)
router.get('/:id', async (req, res) => {
  try {
    const item = await solicitacaoService.obterPorId(Number(req.params.id));
    if (!item) return res.status(404).json({ erro: 'Solicitação não encontrada.' });

    // Solicitante só pode ver o detalhe da própria solicitação
    if (req.session.usuario.papel === 'Solicitante' && item.criadoPorUsuarioId !== req.session.usuario.id) {
      return res.status(403).json({ erro: 'Você não tem permissão para ver mais informações desta solicitação.' });
    }

    res.json({ item });
  } catch (err) {
    console.error('Erro ao obter solicitação por ID:', err);
    res.status(500).json({ erro: 'Erro interno ao buscar a solicitação.' });
  }
});

// Criar Solicitação (Adicionado async/await)
router.post('/', async (req, res) => {
  try {
    const { solicitante, placa, local, tipo, descricao, responsavel, prioridade, observacoes } = req.body;

    if (!solicitante || !solicitante.trim()) {
      return res.status(400).json({ erro: 'Informe o nome do solicitante.' });
    }
    if (!local || !tipo) {
      return res.status(400).json({ erro: 'Selecione o local e o tipo da solicitação.' });
    }

    const nova = {
      solicitante: solicitante.trim(),
      placa: (placa || '').trim().toUpperCase(),
      local,
      tipo,
      descricao: (descricao || '').trim(),
      responsavel: (responsavel || '').trim(),
      prioridade: prioridade || 'Media',
      observacoes: (observacoes || '').trim()
    };

    const criada = await solicitacaoService.criar(nova, req.session.usuario);
    res.status(201).json({ item: criada });
  } catch (err) {
    console.error('Erro ao criar solicitação:', err);
    res.status(500).json({ erro: 'Erro interno ao criar solicitação.' });
  }
});

// Mudar Status (Adicionado async/await)
router.post('/:id/status', async (req, res) => {
  try {
    const item = await solicitacaoService.mudarStatus(Number(req.params.id), req.body.status, req.session.usuario);
    res.json({ item });
  } catch (err) {
    res.status(err.status || 400).json({ erro: err.message });
  }
});

// Cancelar (Adicionado async/await)
router.post('/:id/cancelar', async (req, res) => {
  try {
    const item = await solicitacaoService.mudarStatus(Number(req.params.id), 'Cancelado', req.session.usuario);
    res.json({ item });
  } catch (err) {
    res.status(err.status || 400).json({ erro: err.message });
  }
});

// Duplicar (Adicionado async/await)
router.post('/:id/duplicar', async (req, res) => {
  try {
    const item = await solicitacaoService.duplicar(Number(req.params.id), req.session.usuario);
    res.status(201).json({ item });
  } catch (err) {
    res.status(err.status || 400).json({ erro: err.message });
  }
});

// Excluir (Adicionado async/await)
router.delete('/:id', async (req, res) => {
  try {
    await solicitacaoService.excluir(Number(req.params.id), req.session.usuario);
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 400).json({ erro: err.message });
  }
});

module.exports = router;