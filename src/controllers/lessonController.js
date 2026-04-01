const LessonModel  = require('../models/lessonModel');
const StudentModel = require('../models/studentModel');
const AuditService = require('../services/auditService');

const WEEKDAYS = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];

function getWeekday(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return WEEKDAYS[new Date(y, m - 1, d).getDay()];
}

const LessonController = {
  create(req, res) {
    try {
      const { studentName, date, time, trainingType, duration, observations } = req.body;
      
      // Auto-registro/busca do aluno
      const student = StudentModel.ensureStudent(studentName);
      if (!student) return res.status(400).json({ error: 'Nome do aluno inválido.' });
      
      // Regra: Não permitir aula para aluno inativo (bloqueado pelo admin)
      if (!student.active) {
        return res.status(403).json({ error: `O aluno "${student.name}" está com o cadastro INATIVO. Contate o administrador.` });
      }

      // VALIDAÇÃO: Não permitir mais de uma aula no mesmo horário considerando duração
      const durationToCheck = duration ? Number(duration) : 60;
      const conflictingLesson = LessonModel.findConflictingLesson(req.user.id, date, time, durationToCheck);
      if (conflictingLesson) {
        const conflictTime = conflictingLesson.time;
        const conflictDuration = conflictingLesson.duration || 60;
        return res.status(400).json({ 
          error: `Conflito de horário! Você já possui uma aula às ${conflictTime} com duração de ${conflictDuration} minutos.` 
        });
      }

      const weekday = getWeekday(date);

      const id = LessonModel.create({
        professorId:   req.user.id,
        studentName:   student.name, // Usar o nome normalizado do banco
        date, time, weekday,
        trainingType:  trainingType?.trim() || null,
        duration:      duration ? Number(duration) : 60, // Padrão 60 minutos
        observations:  observations?.trim() || null,
      });

      AuditService.log(req.user.id, 'LESSON_CREATED', { id, studentName: student.name, date }, req.ip);
      return res.status(201).json({ message: 'Aula registrada com sucesso.', id, weekday });
    } catch (err) {
      console.error('[LESSON] create:', err);
      return res.status(500).json({ error: 'Erro ao registrar aula.' });
    }
  },

  getMyLessons(req, res) {
    try {
      const { year, month } = req.query;
      const lessons = LessonModel.findByProfessor(
        req.user.id,
        year ? Number(year) : null,
        month ? Number(month) : null
      );
      return res.json({ lessons });
    } catch (err) {
      console.error('[LESSON] getMyLessons:', err);
      return res.status(500).json({ error: 'Erro ao buscar aulas.' });
    }
  },

  getAllLessons(req, res) {
    try {
      const { year, month } = req.query;
      const lessons = LessonModel.findAll(
        year  ? Number(year)  : null,
        month ? Number(month) : null
      );
      return res.json({ lessons });
    } catch (err) {
      console.error('[LESSON] getAllLessons:', err);
      return res.status(500).json({ error: 'Erro ao buscar aulas.' });
    }
  },

  update(req, res) {
    try {
      const { id } = req.params;
      const { studentName, date, time, trainingType, duration, observations } = req.body;

      const lesson = LessonModel.findById(id);
      if (!lesson) return res.status(404).json({ error: 'Aula não encontrada.' });

      // Professor só edita suas próprias aulas
      if (req.user.role === 'professor' && Number(lesson.professor_id) !== Number(req.user.id)) {
        return res.status(403).json({ error: 'Você não pode editar aulas de outros professores.' });
      }

      // Auto-registro/busca do aluno ao editar (caso mude o nome)
      const student = StudentModel.ensureStudent(studentName);
      if (!student) return res.status(400).json({ error: 'Nome do aluno inválido.' });
      
      // Permitir editar mesmo se inativo? Geralmente sim se já existir a aula, 
      // mas vamos bloquear se mudar para um aluno inativo novo
      if (!student.active) {
        return res.status(403).json({ error: `O aluno "${student.name}" está INATIVO e não pode ser selecionado.` });
      }

      // VALIDAÇÃO: Não permitir sobreposição de horários considerando duração (exceto a própria aula)
      // Usar o professor_id da aula original para verificar conflitos
      const professorIdToCheck = lesson.professor_id;
      const durationToCheck = duration ? Number(duration) : 60;
      const conflictingLesson = LessonModel.findConflictingLesson(professorIdToCheck, date, time, durationToCheck, Number(id));
      if (conflictingLesson) {
        const conflictTime = conflictingLesson.time;
        const conflictDuration = conflictingLesson.duration || 60;
        return res.status(400).json({ 
          error: `Conflito de horário! Já existe uma aula às ${conflictTime} com duração de ${conflictDuration} minutos.` 
        });
      }

      const weekday = getWeekday(date);
      LessonModel.update(id, {
        studentName: student.name, date, time, weekday,
        trainingType: trainingType?.trim() || null,
        duration:     duration ? Number(duration) : 60,
        observations: observations?.trim() || null,
      });

      AuditService.log(req.user.id, 'LESSON_UPDATED', { id, studentName: student.name, date }, req.ip);
      return res.json({ message: 'Aula atualizada com sucesso.', weekday });
    } catch (err) {
      console.error('[LESSON] update:', err);
      return res.status(500).json({ error: 'Erro ao atualizar aula.' });
    }
  },

  delete(req, res) {
    try {
      const { id } = req.params;
      const lesson = LessonModel.findById(id);
      if (!lesson) return res.status(404).json({ error: 'Aula não encontrada.' });

      if (req.user.role === 'professor' && Number(lesson.professor_id) !== Number(req.user.id)) {
        return res.status(403).json({ error: 'Você não pode excluir aulas de outros professores.' });
      }

      LessonModel.delete(id);
      AuditService.log(req.user.id, 'LESSON_DELETED', { id }, req.ip);
      return res.json({ message: 'Aula excluída com sucesso.' });
    } catch (err) {
      console.error('[LESSON] delete:', err);
      return res.status(500).json({ error: 'Erro ao excluir aula.' });
    }
  },

  monthlyCount(req, res) {
    try {
      const now   = new Date();
      const year  = Number(req.query.year)  || now.getFullYear();
      const month = Number(req.query.month) || (now.getMonth() + 1);
      const count = LessonModel.countByProfessorMonth(req.user.id, year, month);
      return res.json({ count, year, month });
    } catch (err) {
      console.error('[LESSON] monthlyCount:', err);
      return res.status(500).json({ error: 'Erro ao buscar contagem.' });
    }
  },
};

module.exports = LessonController;
