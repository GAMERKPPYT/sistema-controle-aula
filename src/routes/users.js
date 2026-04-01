const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const UserController = require('../controllers/userController');
const { authenticate } = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/rbac');
const { handleValidation } = require('../middlewares/validate');

const passwordRules = body('password')
  .isLength({ min: 8 }).withMessage('Mínimo 8 caracteres.')
  .matches(/[A-Z]/).withMessage('Pelo menos 1 letra maiúscula.')
  .matches(/[0-9]/).withMessage('Pelo menos 1 número.');

router.get('/', authenticate, requireAdmin, UserController.getAll);

router.post('/', authenticate, requireAdmin, [
  body('name').trim().notEmpty().isLength({ max: 100 }).withMessage('Nome obrigatório.'),
  body('email').isEmail().normalizeEmail().withMessage('Email inválido.'),
  passwordRules,
  body('role').isIn(['admin', 'professor']).withMessage('Perfil inválido.'),
  handleValidation,
], UserController.create);

router.put('/:id', authenticate, requireAdmin, [
  param('id').isInt(),
  body('name').trim().notEmpty().isLength({ max: 100 }),
  body('email').isEmail().normalizeEmail(),
  body('role').isIn(['admin', 'professor']),
  handleValidation,
], UserController.update);

router.patch('/:id/password', authenticate, requireAdmin, [
  param('id').isInt(), passwordRules, handleValidation,
], UserController.changePassword);

router.patch('/:id/toggle-active', authenticate, requireAdmin, [
  param('id').isInt(), handleValidation,
], UserController.toggleActive);

router.delete('/:id', authenticate, requireAdmin, [
  param('id').isInt(), handleValidation,
], UserController.delete);

module.exports = router;
