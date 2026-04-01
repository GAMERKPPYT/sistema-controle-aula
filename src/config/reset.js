const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../../data/aulas.db');

async function reset() {
  console.log('--- RESET DE BANCO DE DADOS (LIMPEZA TOTAL) ---');
  
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const db = new Database(DB_PATH);
  
  try {
    console.log('• Limpando dados (truncate)...');
    db.exec('PRAGMA foreign_keys = OFF;');
    
    const tables = ['lessons', 'audit_logs', 'students', 'users'];
    tables.forEach(table => {
      try { db.prepare(`DELETE FROM ${table}`).run(); } catch(e) {}
      try { db.prepare(`DELETE FROM sqlite_sequence WHERE name = ?`).run(table); } catch(e) {}
    });

    console.log('• Verificando estrutura das tabelas...');
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    NOT NULL,
        email       TEXT    UNIQUE NOT NULL,
        password_hash TEXT  NOT NULL,
        role        TEXT    NOT NULL CHECK(role IN ('admin', 'professor')),
        active      INTEGER NOT NULL DEFAULT 1,
        created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS lessons (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        professor_id  INTEGER NOT NULL,
        student_name  TEXT    NOT NULL,
        date          TEXT    NOT NULL,
        time          TEXT    NOT NULL,
        weekday       TEXT    NOT NULL,
        training_type TEXT,
        duration      INTEGER,
        observations  TEXT,
        created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at    TEXT    NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (professor_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS audit_logs (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id    INTEGER,
        action     TEXT    NOT NULL,
        details    TEXT,
        ip         TEXT,
        created_at TEXT    NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS students (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT    UNIQUE COLLATE NOCASE NOT NULL,
        active      INTEGER NOT NULL DEFAULT 1,
        created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
        updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_lessons_professor ON lessons(professor_id);
      CREATE INDEX IF NOT EXISTS idx_lessons_date      ON lessons(date);
      CREATE INDEX IF NOT EXISTS idx_audit_user        ON audit_logs(user_id);
    `);

    db.exec('PRAGMA foreign_keys = ON;');
    console.log('• Tabelas resetadas e prontas.');

    const adminName = 'Administrador';
    const adminEmail = 'admin@sistema.com';
    const adminPass = 'Admin@123';
    const hash = await bcrypt.hash(adminPass, 12);

    db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(adminName, adminEmail, hash, 'admin');

    console.log('-------------------------------');
    console.log('• Novo Administrador criado:');
    console.log(`  - Nome:  ${adminName}`);
    console.log(`  - Email: ${adminEmail}`);
    console.log(`  - Senha: ${adminPass}`);
    console.log('-------------------------------');
    console.log('✅ Sistema limpo e pronto para uso!');
    
  } catch (err) {
    console.error('❌ Erro durante o reset:', err.message);
  } finally {
    db.close();
  }
}

reset();
