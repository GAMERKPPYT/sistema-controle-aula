const secret = process.env.JWT_SECRET;

if (!secret && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET não definido. Configure a variável de ambiente.');
}

module.exports = {
  JWT_SECRET: secret || 'dev-secret-TROQUE-em-producao',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 8 * 60 * 60 * 1000,
    path: '/',
  },
};
