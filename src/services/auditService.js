const { getDb } = require('../config/database');

const AuditService = {
  log(userId, action, details = {}, ip = null) {
    try {
      getDb()
        .prepare('INSERT INTO audit_logs (user_id, action, details, ip) VALUES (?, ?, ?, ?)')
        .run(userId || null, action, JSON.stringify(details), ip);
    } catch (err) {
      console.error('[AUDIT ERROR]', err.message);
    }
  },

  getRecent(limit = 100) {
    return getDb()
      .prepare(`SELECT a.*, u.name AS user_name, u.email AS user_email
                FROM audit_logs a
                LEFT JOIN users u ON a.user_id = u.id
                ORDER BY a.created_at DESC LIMIT ?`)
      .all(limit);
  },
};

module.exports = AuditService;
