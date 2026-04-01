const express = require('express');
const { body, param } = require('express-validator');
const { getDb } = require('../config/database');
const { authenticate } = require('../middlewares/auth');
const { requireAdmin, requireAny } = require('../middlewares/rbac');
const { handleValidation } = require('../middlewares/validate');
const router = express.Router();

function logAudit(userId, action, details) {
  try {
    const db = getDb();
    const stmt = db.prepare('INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)');
    stmt.run(userId, action, details);
  } catch (err) { console.error('Erro ao logar auditoria:', err); }
}

router.get('/active', authenticate, requireAny, (req, res) => {
  try {
    const db = getDb();
    const students = db.prepare('SELECT id, name FROM students WHERE active = 1 ORDER BY name ASC').all();
    res.json({ students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar alunos ativos' });
  }
});

router.get('/', authenticate, requireAdmin, (req, res) => {
  try {
    const db = getDb();
    const students = db.prepare('SELECT * FROM students ORDER BY name ASC').all();
    res.json({ students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao carregar lista de alunos' });
  }
});

router.post('/', authenticate, requireAdmin, [
  body('name').trim().notEmpty().isLength({ max: 100 }).withMessage('Nome é obrigatório (máx. 100 chars).'),
  handleValidation,
], (req, res) => {
  try {
    const db = getDb();
    const stmt = db.prepare('INSERT INTO students (name, active) VALUES (?, 1)');
    const info = stmt.run(req.body.name);
    logAudit(req.user.id, 'CREATE_STUDENT', `id: ${info.lastInsertRowid}`);
    res.status(201).json({ success: true, id: info.lastInsertRowid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao salvar aluno' });
  }
});

router.put('/:id', authenticate, requireAdmin, [
  param('id').isInt(),
  body('name').trim().notEmpty().isLength({ max: 100 }).withMessage('Nome é obrigatório (máx. 100 chars).'),
  body('active').isInt({ min: 0, max: 1 }),
  handleValidation,
], (req, res) => {
  try {
    const db = getDb();
    const stmt = db.prepare('UPDATE students SET name = ?, active = ? WHERE id = ?');
    stmt.run(req.body.name, req.body.active, req.params.id);
    logAudit(req.user.id, 'UPDATE_STUDENT', `id: ${req.params.id}`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar aluno' });
  }
});

module.exports = router;
