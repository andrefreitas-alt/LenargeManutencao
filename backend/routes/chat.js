// routes/chat.js
const express = require('express');
const router = express.Router();
const { requireAuth, requireAdmin } = require('../middleware/auth');
const chatService = require('../services/chatService');

router.use(requireAuth);

// Admin: lista de conversas já iniciadas
router.get('/conversas', requireAdmin, async (req, res) => {
  try {
    const conversas = await chatService.obterConversas();
    res.json({ conversas });
  } catch (err) {
    console.error('Erro ao obter conversas:', err);
    res.status(500).json({ erro: 'Erro interno ao buscar conversas.' });
  }
});

// Admin: lista de todos os solicitantes (para iniciar conversa nova)
router.get('/solicitantes', requireAdmin, async (req, res) => {
  try {
    const solicitantes = await chatService.obterSolicitantesDisponiveis();
    res.json({ solicitantes });
  } catch (err) {
    console.error('Erro ao obter solicitantes:', err);
    res.status(500).json({ erro: 'Erro interno ao buscar solicitantes.' });
  }
});

// Contagem de não lidas (para polling/badge) — funciona para Admin e Solicitante
router.get('/nao-lidas', async (req, res) => {
  try {
    const total = await chatService.contarNaoLidas(req.session.usuario);
    res.json({ total });
  } catch (err) {
    console.error('Erro ao contar não lidas:', err);
    res.status(500).json({ erro: 'Erro interno.' });
  }
});

// Solicitante: sua própria conversa
router.get('/minha', async (req, res) => {
  try {
    if (req.session.usuario.papel !== 'Solicitante') {
      return res.status(400).json({ erro: 'Rota exclusiva de Solicitantes.' });
    }
    const mensagens = await chatService.obterMensagens(req.session.usuario.id, req.session.usuario);
    res.json({ mensagens });
  } catch (err) {
    console.error('Erro ao obter conversa:', err);
    res.status(500).json({ erro: 'Erro interno ao buscar a conversa.' });
  }
});

// Solicitante: responder na própria conversa (só se ela já existir)
router.post('/minha', async (req, res) => {
  try {
    if (req.session.usuario.papel !== 'Solicitante') {
      return res.status(400).json({ erro: 'Rota exclusiva de Solicitantes.' });
    }
    const { mensagem } = req.body;
    if (!mensagem || !mensagem.trim()) {
      return res.status(400).json({ erro: 'Digite uma mensagem.' });
    }
    const mensagens = await chatService.enviarMensagemSolicitante(req.session.usuario, mensagem);
    res.status(201).json({ mensagens });
  } catch (err) {
    res.status(err.status || 500).json({ erro: err.message || 'Erro interno ao enviar mensagem.' });
  }
});

// Admin: ver conversa com um solicitante específico
router.get('/:solicitanteId', requireAdmin, async (req, res) => {
  try {
    const mensagens = await chatService.obterMensagens(Number(req.params.solicitanteId), req.session.usuario);
    res.json({ mensagens });
  } catch (err) {
    console.error('Erro ao obter conversa:', err);
    res.status(500).json({ erro: 'Erro interno ao buscar a conversa.' });
  }
});

// Admin: enviar mensagem (inicia a conversa se ainda não existir)
router.post('/:solicitanteId', requireAdmin, async (req, res) => {
  try {
    const { mensagem, solicitacaoRefId } = req.body;
    if (!mensagem || !mensagem.trim()) {
      return res.status(400).json({ erro: 'Digite uma mensagem.' });
    }
    const mensagens = await chatService.enviarMensagemAdmin(
      Number(req.params.solicitanteId), req.session.usuario, mensagem, solicitacaoRefId ? Number(solicitacaoRefId) : null
    );
    res.status(201).json({ mensagens });
  } catch (err) {
    res.status(err.status || 500).json({ erro: err.message || 'Erro interno ao enviar mensagem.' });
  }
});

module.exports = router;