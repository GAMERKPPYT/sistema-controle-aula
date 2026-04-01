const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/aulas.db');

const dataDir = path.dirname(path.resolve(DB_PATH));
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

function getDb() {
  if (!db) {
    db = new Database(path.resolve(DB_PATH));
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.pragma('secure_delete = ON');
  }
  return db;
}

function initDatabase() {
  const database = getDb();

  database.exec(`
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

  console.log('✅ Banco de dados pronto.');
  return database;
}

module.exports = { getDb, initDatabase };
