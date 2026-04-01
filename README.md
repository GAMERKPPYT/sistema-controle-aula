# 🏋️ Sistema de Controle de Aulas

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)

Sistema completo de gerenciamento de aulas para academias e estúdios de personal training, com controle de professores, alunos e relatórios administrativos.

[Demonstração](#-demonstração) • [Funcionalidades](#-funcionalidades) • [Instalação](#-instalação) • [Tecnologias](#-tecnologias)

</div>

---

## 📋 Sobre o Projeto

O **Sistema de Controle de Aulas** é uma aplicação web full-stack desenvolvida para facilitar o gerenciamento de aulas em academias e estúdios de personal training. O sistema oferece controles diferenciados para administradores e professores, com foco em segurança, usabilidade e performance.

### 🎯 Problema Resolvido

Muitos estúdios de personal training ainda utilizam planilhas ou cadernos para controlar suas aulas, o que gera:
- ❌ Perda de informações
- ❌ Dificuldade em gerar relatórios
- ❌ Conflitos de horários
- ❌ Falta de controle sobre professores

Este sistema resolve esses problemas com uma interface moderna e intuitiva.

---

## ✨ Funcionalidades

### 👨‍💼 Painel Administrativo
- ✅ Visualização de todas as aulas do estúdio
- ✅ Gerenciamento completo de usuários (professores e admins)
- ✅ Relatórios mensais por professor
- ✅ Controle de alunos ativos/inativos
- ✅ Dashboard com estatísticas em tempo real
- ✅ Edição e exclusão de aulas de qualquer professor
- ✅ Sistema de auditoria completo

### 👨‍🏫 Painel do Professor
- ✅ Registro rápido de aulas
- ✅ Visualização das próprias aulas
- ✅ Filtros por mês e ano
- ✅ Edição e exclusão das próprias aulas
- ✅ Contador de aulas mensais
- ✅ Validação de conflitos de horário
- ✅ Auto-complete de alunos

### 🔒 Segurança
- ✅ Autenticação JWT com cookies HttpOnly
- ✅ Senhas criptografadas com bcrypt (12 rounds)
- ✅ Rate limiting para prevenir ataques
- ✅ Validação de dados com express-validator
- ✅ Proteção CSRF com SameSite cookies
- ✅ Headers de segurança com Helmet
- ✅ RBAC (Role-Based Access Control)
- ✅ Log de auditoria de todas as ações

---

## 🚀 Demonstração

### Login
<img src="docs/screenshots/login.png" alt="Tela de Login" width="600">

### Dashboard Admin
<img src="docs/screenshots/admin-dashboard.png" alt="Dashboard Admin" width="600">

### Dashboard Professor
<img src="docs/screenshots/professor-dashboard.png" alt="Dashboard Professor" width="600">

---

## 🛠️ Tecnologias

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web minimalista
- **SQLite** (better-sqlite3) - Banco de dados embutido
- **JWT** - Autenticação stateless
- **bcryptjs** - Criptografia de senhas
- **express-validator** - Validação de dados
- **helmet** - Segurança HTTP headers
- **express-rate-limit** - Proteção contra ataques

### Frontend
- **HTML5** - Estrutura semântica
- **CSS3** - Design system customizado
- **JavaScript (Vanilla)** - Sem frameworks, máxima performance
- **Google Fonts (Inter)** - Tipografia moderna

### Arquitetura
- **MVC Pattern** - Separação de responsabilidades
- **RESTful API** - Endpoints padronizados
- **SPA** - Single Page Application no frontend
- **Middleware Chain** - Validação e autenticação modular

---

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ instalado
- npm ou yarn

### Passo a passo

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/sistema-controle-aulas.git
cd sistema-controle-aulas
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
NODE_ENV=development
PORT=3000
JWT_SECRET=sua-chave-secreta-aqui
JWT_EXPIRES_IN=8h
DB_PATH=./data/studio_wellness.db
ALLOWED_ORIGIN=http://localhost:3000
```

4. **Inicialize o banco de dados**
```bash
npm run seed
```

5. **Inicie o servidor**
```bash
npm start
```

6. **Acesse a aplicação**
```
http://localhost:3000
```

### Credenciais padrão
- **Email:** admin@sistema.com
- **Senha:** Admin@123

⚠️ **IMPORTANTE:** Altere a senha após o primeiro login!

---

## 📁 Estrutura do Projeto

```
studio-wellness/
├── public/                 # Frontend (HTML, CSS, JS)
│   ├── css/
│   │   └── style.css      # Design system completo
│   ├── js/
│   │   ├── admin.js       # Lógica do painel admin
│   │   ├── auth.js        # Autenticação
│   │   └── lessons.js     # Lógica do painel professor
│   ├── pages/
│   │   ├── dashboard-admin.html
│   │   └── dashboard-professor.html
│   └── index.html         # Página de login
├── src/
│   ├── config/            # Configurações
│   │   ├── database.js    # Setup do SQLite
│   │   ├── jwt.js         # Configuração JWT
│   │   └── reset.js       # Script de reset do DB
│   ├── controllers/       # Lógica de negócio
│   │   ├── authController.js
│   │   ├── lessonController.js
│   │   ├── reportController.js
│   │   └── userController.js
│   ├── middlewares/       # Middlewares Express
│   │   ├── auth.js        # Verificação JWT
│   │   ├── rbac.js        # Controle de acesso
│   │   └── validate.js    # Validação de dados
│   ├── models/            # Camada de dados
│   │   ├── lessonModel.js
│   │   ├── studentModel.js
│   │   └── userModel.js
│   ├── routes/            # Rotas da API
│   │   ├── auth.js
│   │   ├── lessons.js
│   │   ├── reports.js
│   │   ├── students.js
│   │   └── users.js
│   └── services/          # Serviços auxiliares
│       └── auditService.js
├── data/                  # Banco de dados SQLite
├── scripts/               # Scripts utilitários
│   └── seed.js           # Seed inicial
├── .env.example          # Exemplo de variáveis
├── server.js             # Entry point
└── package.json
```

---

## 🔌 API Endpoints

### Autenticação
```
POST   /api/auth/login      - Login
POST   /api/auth/logout     - Logout
GET    /api/auth/me         - Dados do usuário logado
```

### Aulas (Professor)
```
POST   /api/lessons         - Criar aula
GET    /api/lessons/my      - Listar minhas aulas
GET    /api/lessons/monthly-count - Contador mensal
PUT    /api/lessons/:id     - Atualizar aula
DELETE /api/lessons/:id     - Excluir aula
```

### Aulas (Admin)
```
GET    /api/lessons/all     - Listar todas as aulas
```

### Usuários (Admin)
```
GET    /api/users           - Listar usuários
POST   /api/users           - Criar usuário
PUT    /api/users/:id       - Atualizar usuário
PATCH  /api/users/:id/password - Alterar senha
PATCH  /api/users/:id/toggle-active - Ativar/Desativar
DELETE /api/users/:id       - Excluir usuário
```

### Alunos
```
GET    /api/students/active - Listar alunos ativos
GET    /api/students        - Listar todos (Admin)
POST   /api/students        - Criar aluno (Admin)
PUT    /api/students/:id    - Atualizar aluno (Admin)
```

### Relatórios (Admin)
```
GET    /api/reports/monthly - Relatório mensal por professor
```

---


---

## 🔐 Segurança

### Medidas Implementadas

1. **Autenticação**
   - JWT armazenado em cookie HttpOnly
   - Tokens com expiração de 8 horas
   - Logout limpa o cookie

2. **Senhas**
   - Hash bcrypt com 12 rounds
   - Validação de força (mín. 8 chars, 1 maiúscula, 1 número)
   - Nunca armazenadas em texto plano

3. **Rate Limiting**
   - 200 requisições por 15 min (geral)
   - 5 tentativas de login por 15 min

4. **Validação**
   - Todos os inputs validados no backend
   - Sanitização de dados
   - Proteção contra SQL Injection (prepared statements)

5. **Headers de Segurança**
   - Content Security Policy
   - X-Frame-Options
   - X-Content-Type-Options
   - Strict-Transport-Security (produção)

6. **Auditoria**
   - Log de todas as ações críticas
   - Rastreamento de IP
   - Histórico de login

---

## 📱 Responsividade

O sistema é totalmente responsivo e funciona perfeitamente em:
- 📱 Smartphones (320px+)
- 📱 Tablets (768px+)
- 💻 Desktops (1024px+)
- 🖥️ Telas grandes (1440px+)

### Mobile First
- Bottom navigation em mobile
- Sidebar em desktop
- Formulários adaptáveis
- Tabelas com scroll horizontal

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Sinta-se à vontade para:

1. Fazer um fork do projeto
2. Criar uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abrir um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

Desenvolvido com ❤️ por **Gamerkppyt**

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/seu-perfil)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/seu-usuario)
[![Portfolio](https://img.shields.io/badge/Portfolio-FF5722?style=for-the-badge&logo=google-chrome&logoColor=white)](https://seu-portfolio.com)

---

## 🙏 Agradecimentos

- [Express.js](https://expressjs.com/) - Framework web
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - SQLite para Node.js
- [Google Fonts](https://fonts.google.com/) - Tipografia Inter
- [Lucide Icons](https://lucide.dev/) - Ícones SVG

---

<div align="center">

**⭐ Se este projeto foi útil, considere dar uma estrela!**

</div>
