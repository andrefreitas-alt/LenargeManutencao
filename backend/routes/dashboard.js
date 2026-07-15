// routes/dashboard.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const dashboardService = require('../services/dashboardService');

router.use(requireAuth);

router.get('/', async (req, res) => {
  try {
    const dados = await dashboardService.obterDashboard(req.session.usuario);
    res.json(dados);
  } catch (err) {
    console.error('Erro ao carregar dashboard:', err);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
});

module.exports = router;