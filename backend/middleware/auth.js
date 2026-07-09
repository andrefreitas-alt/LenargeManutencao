// middleware/auth.js

function requireAuth(req, res, next) {
  if (!req.session.usuario) {
    return res.status(401).json({ erro: 'Não autenticado.' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.session.usuario) {
    return res.status(401).json({ erro: 'Não autenticado.' });
  }
  if (req.session.usuario.papel !== 'Administrador') {
    return res.status(403).json({ erro: 'Apenas Administradores podem realizar essa ação.' });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
