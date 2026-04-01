const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');
const { handleValidation } = require('../middlewares/validate');

router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Email inválido.'),
  body('password').notEmpty().withMessage('Senha obrigatória.'),
  handleValidation,
], AuthController.login);

router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.me);

module.exports = router;
