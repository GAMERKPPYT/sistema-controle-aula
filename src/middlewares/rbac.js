/**
 * Middleware de controle de acesso baseado em perfil (RBAC).
 * Uso: requireRole('admin') ou requireRole('admin', 'professor')
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado. Permissão insuficiente.' });
    }
    next();
  };
}

const requireAdmin = requireRole('admin');
const requireAny   = requireRole('admin', 'professor');

module.exports = { requireRole, requireAdmin, requireAny };
