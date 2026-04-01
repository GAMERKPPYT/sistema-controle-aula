const { validationResult } = require('express-validator');

/**
 * Verifica erros de validação do express-validator.
 * Deve ser usado APÓS as regras de validação na rota.
 */
function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: 'Dados inválidos.',
      details: errors.array().map(e => ({ field: e.path, message: e.msg })),
    });
  }
  next();
}

module.exports = { handleValidation };
