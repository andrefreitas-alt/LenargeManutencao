// routes/solicitacoes.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const solicitacaoService = require('../services/solicitacaoService');

router.use(requireAuth);

// Lista (com filtros aplicados no frontend, como na tela original de
// Pesquisar/Lista — o backend devolve tudo que o usuário pode ver)
router.get('/', (req, res) => {
  const itens = solicitacaoService.obterTodas(req.session.usuario);
  res.json({ itens });
});

router.get('/:id', (req, res) => {
  const item = solicitacaoService.obterPorId(Number(req.params.id));
  if (!item) return res.status(404).json({ erro: 'Solicitação não encontrada.' });

  // Solicitante só pode ver a própria solicitação
  if (req.session.usuario.papel === 'Solicitante' && item.criadoPorUsuarioId !== req.session.usuario.id) {
    return res.status(403).json({ erro: 'Você não tem acesso a essa solicitação.' });
  }

  res.json({ item });
});

router.post('/', (req, res) => {
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

  const criada = solicitacaoService.criar(nova, req.session.usuario);
  res.status(201).json({ item: criada });
});

router.post('/:id/status', (req, res) => {
  try {
    const item = solicitacaoService.mudarStatus(Number(req.params.id), req.body.status, req.session.usuario);
    res.json({ item });
  } catch (err) {
    res.status(err.status || 400).json({ erro: err.message });
  }
});

router.post('/:id/cancelar', (req, res) => {
  try {
    const item = solicitacaoService.mudarStatus(Number(req.params.id), 'Cancelado', req.session.usuario);
    res.json({ item });
  } catch (err) {
    res.status(err.status || 400).json({ erro: err.message });
  }
});

router.post('/:id/duplicar', (req, res) => {
  try {
    const item = solicitacaoService.duplicar(Number(req.params.id), req.session.usuario);
    res.status(201).json({ item });
  } catch (err) {
    res.status(err.status || 400).json({ erro: err.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    solicitacaoService.excluir(Number(req.params.id), req.session.usuario);
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 400).json({ erro: err.message });
  }
});

module.exports = router;
