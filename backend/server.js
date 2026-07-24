// server.js
const path = require('path');
const express = require('express');
const session = require('express-session');

require('./db'); // garante que o banco e as tabelas existam antes de tudo

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'lenarge-manutencao-troque-este-segredo-em-producao',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    maxAge: 8 * 60 * 60 * 1000 // 8 horas
  }
}));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/solicitacoes', require('./routes/solicitacoes'));
app.use('/api/cadastro', require('./routes/cadastro'));
app.use('/api/usuarios', require('./routes/usuarios'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/chat', require('./routes/chat'));

const frontendPath = path.join(__dirname, '..', 'frontend');
app.use(express.static(frontendPath));

// Qualquer rota que não seja /api cai no index.html (SPA)
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Lenarge Manutenção Web rodando em http://localhost:${PORT}`);
});
