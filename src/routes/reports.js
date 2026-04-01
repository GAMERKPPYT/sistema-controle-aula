const express = require('express');
const router  = express.Router();
const ReportController = require('../controllers/reportController');
const { authenticate } = require('../middlewares/auth');
const { requireAdmin }  = require('../middlewares/rbac');

router.get('/monthly', authenticate, requireAdmin, ReportController.monthly);

module.exports = router;
