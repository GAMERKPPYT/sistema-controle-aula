require('dotenv').config();
const bcrypt = require('bcryptjs');
const { initDatabase, getDb } = require('../src/config/database');

async function seed() {
  console.log('\n🌱 Iniciando seed do banco de dados...\n');
  initDatabase();
  const db = getDb();

  const existing = db.prepare("SELECT COUNT(*) AS c FROM users WHERE role='admin'").get();
  if (existing.c > 0) {
    console.log('⚠️  Administrador já existe. Seed ignorado para evitar duplicatas.');
    console.log('   Se quiser resetar, exclua o arquivo em ./data/aulas.db\n');
    process.exit(0);
  }

  const users = [
    { name: 'Administrador', email: 'admin@sistema.com', password: 'Admin@123', role: 'admin' },
  ];

  const insert = db.prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, 12);
    insert.run(user.name, user.email, hash, user.role);
  }

  console.log('✅ Seed concluído com sucesso!\n');
  console.log('┌─────────────────────────────────────────────────┐');
  console.log('│              CREDENCIAIS INICIAIS                │');
  console.log('├─────────────────────────────────────────────────┤');
  console.log('│  Administrador                                   │');
  console.log('│  Email: admin@sistema.com                        │');
  console.log('│  Senha: Admin@123                                │');
  console.log('└─────────────────────────────────────────────────┘');
  console.log('\n⚠️  IMPORTANTE: Altere a senha após o primeiro login!\n');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Erro no seed:', err);
  process.exit(1);
});
