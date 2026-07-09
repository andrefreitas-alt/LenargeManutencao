// db.js
// Equivalente ao Data/AppDbContext.cs + Data/DbInitializer.cs do projeto original.
// Usa better-sqlite3 (sincrono, simples, ideal para este volume de uso interno).

const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
const { hashPassword } = require('./services/passwordHasher');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'lenarge_manutencao.db');

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function migrate() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      nome            TEXT NOT NULL,
      nome_usuario    TEXT NOT NULL UNIQUE,
      email           TEXT NOT NULL UNIQUE,
      telefone        TEXT NOT NULL DEFAULT '',
      password_hash   TEXT NOT NULL,
      password_salt   TEXT NOT NULL,
      papel           TEXT NOT NULL CHECK (papel IN ('Administrador','Solicitante')),
      criado_em       TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tipos (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS locais (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS solicitacoes (
      id                     INTEGER PRIMARY KEY AUTOINCREMENT,
      solicitante            TEXT NOT NULL DEFAULT '',
      placa                  TEXT NOT NULL DEFAULT '',
      local                  TEXT NOT NULL DEFAULT '',
      tipo                   TEXT NOT NULL DEFAULT '',
      descricao              TEXT NOT NULL DEFAULT '',
      responsavel            TEXT NOT NULL DEFAULT '',
      observacoes            TEXT NOT NULL DEFAULT '',
      prioridade             TEXT NOT NULL DEFAULT 'Media' CHECK (prioridade IN ('Baixa','Media','Alta','Critica')),
      status                 TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente','EmAndamento','AguardandoPeca','Concluido','Cancelado')),
      data_abertura          TEXT NOT NULL,
      data_inicio            TEXT,
      data_conclusao         TEXT,
      criado_por_usuario_id  INTEGER NOT NULL REFERENCES usuarios(id)
    );

    CREATE TABLE IF NOT EXISTS historico (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      solicitacao_id  INTEGER NOT NULL REFERENCES solicitacoes(id) ON DELETE CASCADE,
      acao            TEXT NOT NULL,
      usuario         TEXT NOT NULL,
      detalhe         TEXT NOT NULL,
      data            TEXT NOT NULL
    );
  `);

  const usuariosCount = db.prepare('SELECT COUNT(*) AS c FROM usuarios').get().c;
  if (usuariosCount === 0) {
    const { hash, salt } = hashPassword('admin123');
    db.prepare(`
      INSERT INTO usuarios (nome, nome_usuario, email, telefone, password_hash, password_salt, papel, criado_em)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run('Administrador', 'admin', 'admin@lenarge.com.br', '', hash, salt, 'Administrador', new Date().toISOString());
  }

  const tiposCount = db.prepare('SELECT COUNT(*) AS c FROM tipos').get().c;
  if (tiposCount === 0) {
    const tipos = [
      'Tablet', 'T4S Instalação', 'SASMDT Instalação', 'Rastreio Travado',
      'Base de Carregamento', 'Buzzer/Sirene', 'Impressora', 'Energia', 'Rede', 'Outros'
    ];
    const insert = db.prepare('INSERT INTO tipos (nome) VALUES (?)');
    for (const t of tipos) insert.run(t);
  }

  const locaisCount = db.prepare('SELECT COUNT(*) AS c FROM locais').get().c;
  if (locaisCount === 0) {
    const locais = [
      'Pátio Santa Luzia', 'Filial BH', 'Oficina Central',
      'Base de Carregamento 1', 'Base de Carregamento 2'
    ];
    const insert = db.prepare('INSERT INTO locais (nome) VALUES (?)');
    for (const l of locais) insert.run(l);
  }
}

migrate();

module.exports = db;
