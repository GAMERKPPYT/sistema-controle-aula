const { getDb } = require('../config/database');

const StudentModel = {
  ensureStudent(name) {
    const db = getDb();
    const cleanName = name.trim();
    if (!cleanName) return null;

    let student = db.prepare('SELECT * FROM students WHERE name = ?').get(cleanName);

    if (!student) {
      try {
        const info = db.prepare('INSERT INTO students (name, active) VALUES (?, 1)').run(cleanName);
        student = { id: info.lastInsertRowid, name: cleanName, active: 1 };
      } catch (err) {
        student = db.prepare('SELECT * FROM students WHERE name = ?').get(cleanName);
      }
    }

    return student;
  },

  findAllActive() {
    return getDb().prepare('SELECT * FROM students WHERE active = 1 ORDER BY name ASC').all();
  },

  findAll() {
    return getDb().prepare('SELECT * FROM students ORDER BY name ASC').all();
  },

  findById(id) {
    return getDb().prepare('SELECT * FROM students WHERE id = ?').get(id);
  },

  update(id, { name, active }) {
    return getDb()
      .prepare('UPDATE students SET name = ?, active = ?, updated_at = datetime("now") WHERE id = ?')
      .run(name.trim(), active, id);
  },

  delete(id) {
    return getDb().prepare('DELETE FROM students WHERE id = ?').run(id);
  }
};

module.exports = StudentModel;
