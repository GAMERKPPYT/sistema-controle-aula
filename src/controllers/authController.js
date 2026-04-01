const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const { JWT_SECRET, JWT_EXPIRES_IN, COOKIE_OPTIONS } = require('../config/jwt');
const UserModel   = require('../models/userModel');
const AuditService = require('../services/auditService');

const AuthController = {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      const user = UserModel.findByEmail(normalizedEmail);
      if (!user) {
        AuditService.log(null, 'LOGIN_FAILED', { email: normalizedEmail }, req.ip);
        // Mesmo erro para não revelar se o email existe
        return res.status(401).json({ error: 'Email ou senha incorretos.' });
      }

      const match = await bcrypt.compare(password, user.password_hash);
      if (!match) {
        AuditService.log(user.id, 'LOGIN_FAILED', { email: normalizedEmail }, req.ip);
        return res.status(401).json({ error: 'Email ou senha incorretos.' });
      }

      const token = jwt.sign(
        { id: user.id, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.cookie('token', token, COOKIE_OPTIONS);
      AuditService.log(user.id, 'LOGIN_SUCCESS', { email: normalizedEmail }, req.ip);

      return res.json({
        message: 'Login realizado com sucesso.',
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
      });
    } catch (err) {
      console.error('[AUTH] login error:', err);
      return res.status(500).json({ error: 'Erro interno do servidor.' });
    }
  },

  logout(req, res) {
    AuditService.log(req.user?.id, 'LOGOUT', {}, req.ip);
    res.clearCookie('token', { path: '/' });
    return res.json({ message: 'Logout realizado com sucesso.' });
  },

  me(req, res) {
    return res.json({ user: req.user });
  },
};

module.exports = AuthController;
