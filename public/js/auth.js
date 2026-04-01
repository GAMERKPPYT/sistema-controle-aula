const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                 'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const toggleBtn = document.getElementById('toggle-pwd');
  const pwdInput  = document.getElementById('password');
  const eyeOpen   = document.getElementById('eye-open');
  const eyeClosed = document.getElementById('eye-closed');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const show = pwdInput.type === 'password';
      pwdInput.type = show ? 'text' : 'password';
      eyeOpen.classList.toggle('hidden', show);
      eyeClosed.classList.toggle('hidden', !show);
    });
  }

  const form     = document.getElementById('login-form');
  const errBox   = document.getElementById('login-error');
  const btnText  = document.getElementById('btn-text');
  const btnLoad  = document.getElementById('btn-loading');
  const loginBtn = document.getElementById('login-btn');

  function setLoading(on) {
    loginBtn.disabled = on;
    btnText.classList.toggle('hidden', on);
    btnLoad.classList.toggle('hidden', !on);
  }

  function showError(msg) {
    errBox.textContent = msg;
    errBox.classList.remove('hidden');
  }

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errBox.classList.add('hidden');
      const email    = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;

      if (!email || !password) {
        showError('Preencha email e senha.');
        return;
      }

      setLoading(true);
      try {
        const res  = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();

        if (!res.ok) {
          showError(data.error || 'Erro ao fazer login.');
          return;
        }

        if (data.user.role === 'admin') {
          window.location.href = '/admin';
        } else {
          window.location.href = '/professor';
        }
      } catch (err) {
        showError('Erro de conexão. Tente novamente.');
      } finally {
        setLoading(false);
      }
    });
  }

  (async () => {
    try {
      const res = await fetch('/api/auth/me', { credentials: 'include' });
      if (res.ok) {
        const { user } = await res.json();
        window.location.href = user.role === 'admin' ? '/admin' : '/professor';
      }
    } catch (_) { }
  })();
});
