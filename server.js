require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

const authRoutes = require('./src/routes/auth');
const lessonRoutes = require('./src/routes/lessons');
const userRoutes = require('./src/routes/users');
const reportRoutes = require('./src/routes/reports');
const studentRoutes = require('./src/routes/students');
const { initDatabase, getDb } = require('./src/config/database');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

initDatabase();

(async () => {
  try {
    const db = getDb();
    const existing = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role='admin'").get();
    if (existing.c === 0) {
      console.log('\n🌱 Criando usuário administrador padrão...');
      const hash = await bcrypt.hash('Admin@123', 12);
      db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
        .run('Administrador', 'admin@sistema.com', hash, 'admin');
      console.log('✅ Admin criado: admin@sistema.com / Admin@123\n');
    }
  } catch (err) {
    console.error('⚠️  Erro ao criar admin:', err.message);
  }
})();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      upgradeInsecureRequests: null,
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginResourcePolicy: false,
  originAgentCluster: false,
  hsts: false,
}));

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGIN
    : true,
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas requisições. Tente novamente em 15 minutos.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  skipSuccessfulRequests: true,
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', loginLimiter);

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/students', studentRoutes);

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'dashboard-admin.html'));
});

app.get('/professor', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pages', 'dashboard-professor.html'));
});

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Erro interno do servidor.'
      : err.message,
  });
});

app.listen(PORT, () => {
  console.log(`\n🏋️  Sistema de Controle de Aulas — Iniciado`);
  console.log(`📱  URL Local: http://localhost:${PORT}`);
  console.log(`🌍  Ambiente: ${process.env.NODE_ENV || 'development'}\n`);
});

module.exports = app;
