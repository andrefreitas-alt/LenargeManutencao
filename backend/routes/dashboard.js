// routes/dashboard.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const dashboardService = require('../services/dashboardService');

router.use(requireAuth);

router.get('/', (req, res) => {
  res.json(dashboardService.obterDashboard(req.session.usuario));
});

module.exports = router;
