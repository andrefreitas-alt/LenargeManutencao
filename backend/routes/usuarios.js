// routes/usuarios.js
const express = require('express');
const router = express.Router();
const { requireAdmin } = require('../middleware/auth');
const usuarioService = require('../services/usuarioService');

router.use(requireAdmin);

router.get('/', async (req, res) => {
  try {
    const itens = await usuarioService.obterTodos();
    res.json({ itens });
  } catch (err) {
    console.error('Erro ao obter usuários:', err);
    res.status(500).json({ erro: 'Erro interno ao buscar usuários.' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { nome, nomeUsuario, email, telefone, senha, papel } = req.body;
    const resultado = await usuarioService.criar({
      nome: (nome || '').trim().toUpperCase(),
      nomeUsuario, email, telefone, senha, papel
    });

    if (!resultado.sucesso) return res.status(400).json({ erro: resultado.erro });
    res.status(201).json({ usuario: resultado.usuario });
  } catch (err) {
    console.error('Erro ao criar usuário:', err);
    res.status(500).json({ erro: 'Erro interno ao criar usuário.' });
  }
});

router.post('/:id/senha', async (req, res) => {
  try {
    const resultado = await usuarioService.redefinirSenha(Number(req.params.id), req.body.novaSenha);
    if (!resultado.ok) return res.status(400).json({ erro: resultado.erro });
    res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao redefinir senha:', err);
    res.status(500).json({ erro: 'Erro interno ao redefinir senha.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const resultado = await usuarioService.excluir(Number(req.params.id), req.session.usuario.id);
    if (!resultado.ok) return res.status(400).json({ erro: resultado.erro });
    res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao excluir usuário:', err);
    res.status(500).json({ erro: 'Erro interno ao excluir usuário.' });
  }
});

module.exports = router;