// db.js
// Configurado para conectar dinamicamente ao PostgreSQL (Docker ou Render)
const { Pool } = require('pg');
const { hashPassword } = require('./services/passwordHasher');

// Configuração dinâmica: prioriza o Render se a DATABASE_URL existir
const pool = new Pool(
  process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Exigido pelo Render para conexões em produção
      }
    : {
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'suasenha', // <-- COLOQUE AQUI A SUA SENHA LOCAL DO DOCKER
        database: 'postgres',
      }
);

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Criar Tabelas (Sintaxe adaptada para PostgreSQL)
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id              SERIAL PRIMARY KEY,
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
        id   SERIAL PRIMARY KEY,
        nome TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS locais (
        id   SERIAL PRIMARY KEY,
        nome TEXT NOT NULL UNIQUE
      );

      CREATE TABLE IF NOT EXISTS solicitacoes (
        id                    SERIAL PRIMARY KEY,
        solicitante           TEXT NOT NULL DEFAULT '',
        placa                 TEXT NOT NULL DEFAULT '',
        local                 TEXT NOT NULL DEFAULT '',
        tipo                  TEXT NOT NULL DEFAULT '',
        descricao             TEXT NOT NULL DEFAULT '',
        responsavel           TEXT NOT NULL DEFAULT '',
        observacoes           TEXT NOT NULL DEFAULT '',
        prioridade            TEXT NOT NULL DEFAULT 'Media' CHECK (prioridade IN ('Baixa','Media','Alta','Critica')),
        status                TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente','EmAndamento','AguardandoPeca','Concluido','Cancelado')),
        data_abertura         TEXT NOT NULL,
        data_inicio           TEXT,
        data_conclusao        TEXT,
        criado_by_usuario_id INTEGER NOT NULL REFERENCES usuarios(id)
      );

      CREATE TABLE IF NOT EXISTS historico (
        id             SERIAL PRIMARY KEY,
        solicitacao_id INTEGER NOT NULL REFERENCES solicitacoes(id) ON DELETE CASCADE,
        acao           TEXT NOT NULL,
        usuario        TEXT NOT NULL,
        detalhe        TEXT NOT NULL,
        data           TEXT NOT NULL
      );
    `);

    // 2. Seed de Usuário Admin
    const usuariosRes = await client.query('SELECT COUNT(*) AS c FROM usuarios');
    if (parseInt(usuariosRes.rows[0].c) === 0) {
      const { hash, salt } = hashPassword('admin123');
      await client.query(`
        INSERT INTO usuarios (nome, nome_usuario, email, telefone, password_hash, password_salt, papel, criado_em)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, ['Administrador', 'admin', 'admin@lenarge.com.br', '', hash, salt, 'Administrador', new Date().toISOString()]);
    }

    // 3. Seed de Tipos
    const tiposRes = await client.query('SELECT COUNT(*) AS c FROM tipos');
    if (parseInt(tiposRes.rows[0].c) === 0) {
      const tipos = [
        'Tablet', 'T4S Instalação', 'SASMDT Instalação', 'Rastreio Travado',
        'Base de Carregamento', 'Buzzer/Sirene', 'Impressora', 'Energia', 'Rede', 'Outros'
      ];
      for (const t of tipos) {
        await client.query('INSERT INTO tipos (nome) VALUES ($1)', [t]);
      }
    }

    // 4. Seed de Locais
    const locaisRes = await client.query('SELECT COUNT(*) AS c FROM locais');
    if (parseInt(locaisRes.rows[0].c) === 0) {
      const locais = [
        'Pátio Santa Luzia', 'Filial BH', 'Oficina Central',
        'Base de Carregamento 1', 'Base de Carregamento 2'
      ];
      for (const l of locais) {
        await client.query('INSERT INTO locais (nome) VALUES ($1)', [l]);
      }
    }

    await client.query('COMMIT');
    console.log('Banco PostgreSQL integrado e migrado com sucesso!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao executar migrações no Postgres:', err);
  } finally {
    client.release();
  }
}

migrate();

module.exports = pool;