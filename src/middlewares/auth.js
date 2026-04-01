const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');
const UserModel = require('../models/userModel');

/**
 * Verifica o JWT no cookie HttpOnly e popula req.user.
 */
function authenticate(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ error: 'Não autenticado. Faça login.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    // Valida que o usuário ainda existe e está ativo
    const user = UserModel.findById(decoded.id);
    if (!user || !user.active) {
      res.clearCookie('token');
      return res.status(401).json({ error: 'Usuário inativo ou não encontrado.' });
    }

    req.user = user;
    next();
  } catch (err) {
    res.clearCookie('token');
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.' });
    }
    return res.status(401).json({ error: 'Token inválido.' });
  }
}

module.exports = { authenticate };
