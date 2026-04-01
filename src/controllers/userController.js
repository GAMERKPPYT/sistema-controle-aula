const bcrypt      = require('bcryptjs');
const UserModel   = require('../models/userModel');
const AuditService = require('../services/auditService');

const UserController = {
  getAll(req, res) {
    try {
      return res.json({ users: UserModel.findAll() });
    } catch (err) {
      console.error('[USER] getAll:', err);
      return res.status(500).json({ error: 'Erro ao buscar usuários.' });
    }
  },

  async create(req, res) {
    try {
      const { name, email, password, role } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      if (UserModel.findByEmail(normalizedEmail)) {
        return res.status(409).json({ error: 'Email já cadastrado.' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const id = UserModel.create({ name: name.trim(), email: normalizedEmail, passwordHash, role });

      AuditService.log(req.user.id, 'USER_CREATED', { id, email: normalizedEmail, role }, req.ip);
      return res.status(201).json({ message: 'Usuário criado com sucesso.', id });
    } catch (err) {
      console.error('[USER] create:', err);
      return res.status(500).json({ error: 'Erro ao criar usuário.' });
    }
  },

  update(req, res) {
    try {
      const { id } = req.params;
      const { name, email, role, active } = req.body;

      const user = UserModel.findById(id);
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

      if ((active === false || active === 0) && user.role === 'admin') {
        if (UserModel.countAdmins() <= 1) {
          return res.status(400).json({ error: 'Não é possível desativar o único administrador ativo.' });
        }
      }

      UserModel.update(id, {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        role,
        active: active ? 1 : 0,
      });

      AuditService.log(req.user.id, 'USER_UPDATED', { id, role }, req.ip);
      return res.json({ message: 'Usuário atualizado com sucesso.' });
    } catch (err) {
      console.error('[USER] update:', err);
      return res.status(500).json({ error: 'Erro ao atualizar usuário.' });
    }
  },

  async changePassword(req, res) {
    try {
      const { id } = req.params;
      const user = UserModel.findById(id);
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

      const hash = await bcrypt.hash(req.body.password, 12);
      UserModel.updatePassword(id, hash);

      AuditService.log(req.user.id, 'PASSWORD_CHANGED', { targetUserId: id }, req.ip);
      return res.json({ message: 'Senha alterada com sucesso.' });
    } catch (err) {
      console.error('[USER] changePassword:', err);
      return res.status(500).json({ error: 'Erro ao alterar senha.' });
    }
  },

  toggleActive(req, res) {
    try {
      const { id } = req.params;
      const user = UserModel.findById(id);
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

      if (Number(id) === req.user.id) {
        return res.status(400).json({ error: 'Você não pode desativar sua própria conta.' });
      }

      if (user.role === 'admin' && user.active && UserModel.countAdmins() <= 1) {
        return res.status(400).json({ error: 'Não é possível desativar o único administrador ativo.' });
      }

      const newActive = user.active ? 0 : 1;
      UserModel.toggleActive(id, newActive);
      AuditService.log(req.user.id, newActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED', { id }, req.ip);
      return res.json({ message: `Usuário ${newActive ? 'ativado' : 'desativado'} com sucesso.`, active: newActive });
    } catch (err) {
      console.error('[USER] toggleActive:', err);
      return res.status(500).json({ error: 'Erro ao alterar status.' });
    }
  },

  delete(req, res) {
    try {
      const { id } = req.params;
      const user = UserModel.findById(id);
      if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

      if (Number(id) === req.user.id) {
        return res.status(400).json({ error: 'Você não pode excluir sua própria conta.' });
      }

      if (user.role === 'admin' && UserModel.countAdmins() <= 1) {
        return res.status(400).json({ error: 'Não é possível excluir o único administrador ativo.' });
      }

      UserModel.delete(id);
      AuditService.log(req.user.id, 'USER_DELETED', { id, name: user.name, email: user.email }, req.ip);
      return res.json({ message: 'Usuário excluído permanentemente.' });
    } catch (err) {
      console.error('[USER] delete:', err);
      return res.status(500).json({ error: 'Erro ao excluir usuário.' });
    }
  },
};

module.exports = UserController;
