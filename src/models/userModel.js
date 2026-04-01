const { getDb } = require('../config/database');

const UserModel = {
  findByEmail(email) {
    return getDb()
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email);
  },

  findById(id) {
    return getDb()
      .prepare('SELECT id, name, email, role, active, created_at FROM users WHERE id = ?')
      .get(id);
  },

  findAll() {
    return getDb()
      .prepare('SELECT id, name, email, role, active, created_at FROM users ORDER BY name')
      .all();
  },

  findAllProfessors() {
    return getDb()
      .prepare("SELECT id, name FROM users WHERE role = 'professor' AND active = 1 ORDER BY name")
      .all();
  },

  create({ name, email, passwordHash, role }) {
    const result = getDb()
      .prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
      .run(name, email, passwordHash, role);
    return result.lastInsertRowid;
  },

  update(id, { name, email, role, active }) {
    return getDb()
      .prepare("UPDATE users SET name=?, email=?, role=?, active=?, updated_at=datetime('now') WHERE id=?")
      .run(name, email, role, active, id);
  },

  updatePassword(id, passwordHash) {
    return getDb()
      .prepare("UPDATE users SET password_hash=?, updated_at=datetime('now') WHERE id=?")
      .run(passwordHash, id);
  },

  toggleActive(id, active) {
    return getDb()
      .prepare("UPDATE users SET active=?, updated_at=datetime('now') WHERE id=?")
      .run(active, id);
  },

  countAdmins() {
    return getDb()
      .prepare("SELECT COUNT(*) as c FROM users WHERE role='admin' AND active=1")
      .get().c;
  },

  delete(id) {
    return getDb().prepare('DELETE FROM users WHERE id = ?').run(id);
  },
};

module.exports = UserModel;
