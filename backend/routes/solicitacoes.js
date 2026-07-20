// routes/solicitacoes.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const solicitacaoService = require('../services/solicitacaoService');

router.use(requireAuth);

// Remove observações da resposta quando quem está vendo não é Administrador
function ocultarObservacoesSeNaoAdmin(item, usuario) {
  if (usuario.papel !== 'Administrador') {
    const { observacoes, ...resto } = item;
    return resto;
  }
  return item;
}

router.get('/', async (req, res) => {
  try {
    const itens = await solicitacaoService.obterTodas(req.session.usuario);
    const itensFiltrados = itens.map(i => ocultarObservacoesSeNaoAdmin(i, req.session.usuario));
    res.json({ itens: itensFiltrados });
  } catch (err) {
    console.error('Erro ao obter solicitações:', err);
    res.status(500).json({ erro: 'Erro interno ao buscar solicitações.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const item = await solicitacaoService.obterPorId(Number(req.params.id));
    if (!item) return res.status(404).json({ erro: 'Solicitação não encontrada.' });

    if (req.session.usuario.papel === 'Solicitante' && item.criadoPorUsuarioId !== req.session.usuario.id) {
      return res.status(403).json({ erro: 'Você não tem permissão para ver mais informações desta solicitação.' });
    }

    const itemFiltrado = ocultarObservacoesSeNaoAdmin(item, req.session.usuario);
    res.json({ item: itemFiltrado });
  } catch (err) {
    console.error('Erro ao obter solicitação por ID:', err);
    res.status(500).json({ erro: 'Erro interno ao buscar a solicitação.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { solicitante, placa, local, tipo, descricao, responsavel, prioridade, observacoes, dataAgendada } = req.body;

    if (!solicitante || !solicitante.trim()) {
      return res.status(400).json({ erro: 'Informe o nome do solicitante.' });
    }
    if (!placa || !placa.trim()) {
      return res.status(400).json({ erro: 'Informe a placa do veículo.' });
    }
    if (!local || !tipo) {
      return res.status(400).json({ erro: 'Selecione o local e o tipo da solicitação.' });
    }
    if (!dataAgendada) {
      return res.status(400).json({ erro: 'Informe a data e o horário agendados para a manutenção.' });
    }

    // Observações só podem ser preenchidas por Administrador (Solicitante nunca envia esse campo)
    const podeDefinirObservacoes = req.session.usuario.papel === 'Administrador';

    const nova = {
      solicitante: solicitante.trim(),
      placa: placa.trim().toUpperCase(),
      local,
      tipo,
      descricao: (descricao || '').trim(),
      responsavel: (responsavel || '').trim(),
      prioridade: prioridade || 'Media',
      observacoes: podeDefinirObservacoes ? (observacoes || '').trim() : '',
      dataAgendada
    };

    const criada = await solicitacaoService.criar(nova, req.session.usuario);
    const criadaFiltrada = ocultarObservacoesSeNaoAdmin(criada, req.session.usuario);
    res.status(201).json({ item: criadaFiltrada });
  } catch (err) {
    console.error('Erro ao criar solicitação:', err);
    res.status(500).json({ erro: 'Erro interno ao criar solicitação.' });
  }
});

router.post('/:id/status', async (req, res) => {
  try {
    const item = await solicitacaoService.mudarStatus(Number(req.params.id), req.body.status, req.session.usuario);
    res.json({ item });
  } catch (err) {
    res.status(err.status || 400).json({ erro: err.message });
  }
});

router.post('/:id/cancelar', async (req, res) => {
  try {
    const item = await solicitacaoService.mudarStatus(Number(req.params.id), 'Cancelado', req.session.usuario);
    res.json({ item });
  } catch (err) {
    res.status(err.status || 400).json({ erro: err.message });
  }
});

router.post('/:id/duplicar', async (req, res) => {
  try {
    const item = await solicitacaoService.duplicar(Number(req.params.id), req.session.usuario);
    res.status(201).json({ item });
  } catch (err) {
    res.status(err.status || 400).json({ erro: err.message });
  }
});

router.post('/:id/visto', async (req, res) => {
  try {
    const item = await solicitacaoService.marcarVisto(Number(req.params.id), !!req.body.visto, req.session.usuario);
    res.json({ item });
  } catch (err) {
    res.status(err.status || 400).json({ erro: err.message });
  }
});

// Anotações internas (Admin apenas) — pode ser editado a qualquer momento, em qualquer solicitação
router.post('/:id/observacoes', async (req, res) => {
  try {
    const item = await solicitacaoService.atualizarObservacoes(Number(req.params.id), req.body.observacoes, req.session.usuario);
    res.json({ item });
  } catch (err) {
    res.status(err.status || 400).json({ erro: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await solicitacaoService.excluir(Number(req.params.id), req.session.usuario);
    res.json({ ok: true });
  } catch (err) {
    res.status(err.status || 400).json({ erro: err.message });
  }
});

module.exports = router;