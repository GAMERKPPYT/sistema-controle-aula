const { getDb } = require('../config/database');

function monthRange(year, month) {
  const y = Number(year);
  const m = Number(month);

  const start = new Date(y, m - 1, 1);

  const end = new Date(y, m, 0); 

  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];
  
  return { start: startStr, end: endStr };
}

const LessonModel = {
  create({ professorId, studentName, date, time, weekday, trainingType, duration, observations }) {
    const result = getDb()
      .prepare(`INSERT INTO lessons
        (professor_id, student_name, date, time, weekday, training_type, duration, observations)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(professorId, studentName, date, time, weekday,
        trainingType || null, duration || null, observations || null);
    return result.lastInsertRowid;
  },

  findByProfessorDateTime(professorId, date, time) {
    return getDb()
      .prepare('SELECT * FROM lessons WHERE professor_id=? AND date=? AND time=?')
      .get(professorId, date, time);
  },

  findConflictingLesson(professorId, date, time, duration, excludeId = null) {

    const [hours, minutes] = time.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + (duration || 60);

    const lessons = getDb()
      .prepare('SELECT * FROM lessons WHERE professor_id=? AND date=?')
      .all(professorId, date);

    for (const lesson of lessons) {

      if (excludeId && lesson.id === excludeId) continue;

      const [lHours, lMinutes] = lesson.time.split(':').map(Number);
      const lStartMinutes = lHours * 60 + lMinutes;
      const lEndMinutes = lStartMinutes + (lesson.duration || 60);

      if (startMinutes < lEndMinutes && endMinutes > lStartMinutes) {
        return lesson;
      }
    }

    return null;
  },

  findById(id) {
    return getDb()
      .prepare(`SELECT l.*, u.name AS professor_name
                FROM lessons l JOIN users u ON l.professor_id = u.id
                WHERE l.id = ?`)
      .get(id);
  },

  findByProfessor(professorId, year, month) {
    if (year && month) {
      const { start, end } = monthRange(year, month);
      return getDb()
        .prepare('SELECT * FROM lessons WHERE professor_id=? AND date>=? AND date<=? ORDER BY date DESC, time DESC')
        .all(professorId, start, end);
    }
    return getDb()
      .prepare('SELECT * FROM lessons WHERE professor_id=? ORDER BY date DESC, time DESC')
      .all(professorId);
  },

  findAll(year, month) {
    if (year && month) {
      const { start, end } = monthRange(year, month);
      return getDb()
        .prepare(`SELECT l.*, u.name AS professor_name
                  FROM lessons l JOIN users u ON l.professor_id = u.id
                  WHERE l.date>=? AND l.date<=? ORDER BY l.date DESC, l.time DESC`)
        .all(start, end);
    }
    return getDb()
      .prepare(`SELECT l.*, u.name AS professor_name
                FROM lessons l JOIN users u ON l.professor_id = u.id
                ORDER BY l.date DESC, l.time DESC`)
      .all();
  },

  update(id, { studentName, date, time, weekday, trainingType, duration, observations }) {
    return getDb()
      .prepare(`UPDATE lessons SET
        student_name=?, date=?, time=?, weekday=?,
        training_type=?, duration=?, observations=?,
        updated_at=datetime('now') WHERE id=?`)
      .run(studentName, date, time, weekday,
        trainingType || null, duration || null, observations || null, id);
  },

  delete(id) {
    return getDb().prepare('DELETE FROM lessons WHERE id=?').run(id);
  },

  countByProfessorMonth(professorId, year, month) {
    const { start, end } = monthRange(year, month);
    return getDb()
      .prepare('SELECT COUNT(*) AS c FROM lessons WHERE professor_id=? AND date>=? AND date<=?')
      .get(professorId, start, end).c;
  },

  monthlyReport(year, month) {
    const { start, end } = monthRange(year, month);
    return getDb()
      .prepare(`SELECT u.id AS professor_id, u.id, u.name AS professor_name, u.email,
                  COUNT(l.id) AS total_lessons
                FROM users u
                LEFT JOIN lessons l
                  ON u.id = l.professor_id AND l.date>=? AND l.date<=?
                WHERE u.role='professor' AND u.active=1
                GROUP BY u.id ORDER BY total_lessons DESC, u.name ASC`)
      .all(start, end);
  },
};

module.exports = LessonModel;
