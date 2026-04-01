const LessonModel = require('../models/lessonModel');

const ReportController = {
  monthly(req, res) {
    try {
      const now   = new Date();
      const year  = Number(req.query.year)  || now.getFullYear();
      const month = Number(req.query.month) || (now.getMonth() + 1);
      const report = LessonModel.monthlyReport(year, month);
      return res.json({ report, year, month });
    } catch (err) {
      console.error('[REPORT] monthly:', err);
      return res.status(500).json({ error: 'Erro ao gerar relatório.' });
    }
  },
};

module.exports = ReportController;
