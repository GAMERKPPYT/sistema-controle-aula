const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const LessonController = require('../controllers/lessonController');
const { authenticate } = require('../middlewares/auth');
const { requireAdmin, requireAny } = require('../middlewares/rbac');
const { handleValidation } = require('../middlewares/validate');

const lessonRules = [
  body('studentName').trim().notEmpty().isLength({ max: 100 }).withMessage('Nome do aluno obrigatório (máx. 100 chars).'),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('Data inválida (YYYY-MM-DD).'),
  body('time').matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('Hora inválida (HH:MM).'),
  body('trainingType').optional().trim().isLength({ max: 100 }),
  body('duration').optional({ nullable: true, checkFalsy: true }).isInt({ min: 1, max: 480 }).withMessage('Duração inválida (1-480 min).'),
  body('observations').optional().trim().isLength({ max: 500 }),
];

router.post('/', authenticate, requireAny, lessonRules, handleValidation, LessonController.create);
router.get('/my', authenticate, requireAny, LessonController.getMyLessons);
router.get('/monthly-count', authenticate, requireAny, LessonController.monthlyCount);
router.put('/:id', authenticate, requireAny, [param('id').isInt(), ...lessonRules, handleValidation], LessonController.update);
router.delete('/:id', authenticate, requireAny, [param('id').isInt(), handleValidation], LessonController.delete);

router.get('/all', authenticate, requireAdmin, LessonController.getAllLessons);

module.exports = router;
