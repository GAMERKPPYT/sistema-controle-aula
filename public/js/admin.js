const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                 'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const WEEKDAYS = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];

let currentUser  = null;
let pendingAction = null;
let allLessonsCache = [];
let professorsCache = [];
let editingUserId = null;

(async () => {
  await checkAuth();
  initFilters();
  setupDateWeekday('e-date','e-weekday');

  document.getElementById('u-toggle-pwd')?.addEventListener('click', () => {
    const inp = document.getElementById('u-password');
    if (inp) inp.type = inp.type === 'password' ? 'text' : 'password';
  });

  await Promise.all([loadAllLessons(), loadProfessors(), loadUsers(), loadReport()]);
  loadStats();
})();

async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) { window.location.href = '/'; return; }
    const { user } = await res.json();
    if (user.role !== 'admin') { window.location.href = '/professor'; return; }
    currentUser = user;
    const initials = user.name.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase();
    const avatarEl = document.getElementById('desktop-user-avatar');
    if (avatarEl) avatarEl.textContent = initials;
    const nameEl = document.getElementById('desktop-user-name');
    if (nameEl) nameEl.textContent = user.name;
  } catch { window.location.href = '/'; }
}

function switchTab(tab) {
  ['aulas','relatorio','usuarios'].forEach(t => {
    const pane = document.getElementById(`pane-${t}`);
    if (pane) pane.classList.toggle('hidden', t !== tab);
    document.getElementById(`tab-${t}`)?.classList.toggle('active', t === tab);
    document.getElementById(`nav-${t}`)?.classList.toggle('active', t === tab);
    document.getElementById(`sb-${t}`)?.classList.toggle('active', t === tab);
  });
  if (tab === 'usuarios') loadUsers();
}

function initFilters() {
  const now = new Date();
  ['af','rf'].forEach(prefix => {
    const ms = document.getElementById(`${prefix}-month`);
    const ys = document.getElementById(`${prefix}-year`);
    if (!ms || !ys) return;
    ms.innerHTML = '';
    ys.innerHTML = '';
    MONTHS.forEach((m,i) => {
      const o = new Option(m, i+1); if (i+1===now.getMonth()+1) o.selected=true; ms.appendChild(o);
    });
    for (let y=now.getFullYear(); y>=2024; y--) {
      const o = new Option(y,y); if (y===now.getFullYear()) o.selected=true; ys.appendChild(o);
    }
  });
}

function setupDateWeekday(dateId, wdId) {
  document.getElementById(dateId)?.addEventListener('change', e => {
    if (!e.target.value) return;
    const [y,m,d] = e.target.value.split('-').map(Number);
    document.getElementById(wdId).value = WEEKDAYS[new Date(y,m-1,d).getDay()];
  });
}

async function loadStats() {
  try {
    const now = new Date();
    // 1. Aulas este mês
    const resAulas = await fetch(`/api/lessons/all?year=${now.getFullYear()}&month=${now.getMonth()+1}`, { credentials:'include' });
    const dataAulas = await resAulas.json();
    const countAulasEl = document.getElementById('stat-aulas');
    if (countAulasEl) countAulasEl.textContent = dataAulas.lessons?.length ?? 0;
    
    // 2. Mês/Ano Label
    const labelEl = document.getElementById('stat-month-name');
    if (labelEl) labelEl.textContent = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;
    
    // 3. Professores Ativos
    const resUsers = await fetch('/api/users', { credentials:'include' });
    const dataUsers = await resUsers.json();
    const activeProfs = (dataUsers.users || []).filter(u => u.role === 'professor' && u.active);
    const profsEl = document.getElementById('stat-profs');
    if (profsEl) profsEl.textContent = activeProfs.length;

    // 4. Total de Alunos
    const resAlunos = await fetch('/api/students', { credentials:'include' });
    const dataAlunos = await resAlunos.json();
    const alunosEl = document.getElementById('stat-alunos');
    if (alunosEl) alunosEl.textContent = dataAlunos.students?.length ?? 0;

  } catch (err) { console.error('Stats error:', err); }
}

async function loadAllLessons() {
  const month  = document.getElementById('af-month')?.value;
  const year   = document.getElementById('af-year')?.value;
  const profId = document.getElementById('af-prof')?.value;
  const list   = document.getElementById('all-lesson-list');
  if (!list) return;

  list.innerHTML = `<div class="empty-state"><p>Carregando...</p></div>`;
  try {
    const qs  = month && year ? `?year=${year}&month=${month}` : '';
    const res = await fetch(`/api/lessons/all${qs}`, { credentials:'include' });
    let { lessons } = await res.json();
    allLessonsCache = lessons || [];

    if (profId) lessons = lessons.filter(l => String(l.professor_id) === profId);
    
    const countEl = document.getElementById('total-lessons-count');
    if (countEl) countEl.textContent = lessons.length ? `(${lessons.length})` : '';

    if (!lessons.length) {
      list.innerHTML = `<div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg><p>Nenhuma aula encontrada neste período.</p></div>`;
      return;
    }
    list.innerHTML = lessons.map(l => buildLessonCard(l, true)).join('');
  } catch { list.innerHTML = `<div class="empty-state"><p>Erro ao carregar aulas.</p></div>`; }
}

function buildLessonCard(l, showProf = false) {
  const date = l.date ? new Date(l.date+'T12:00:00').toLocaleDateString('pt-BR') : '';
  return `
  <div class="lesson-card" id="card-${l.id}">
    <div class="lesson-card-head">
      <div>
        <div class="lesson-student">${esc(l.student_name)}</div>
        ${showProf ? `<div class="text-sm text-muted mt-1">Prof. ${esc(l.professor_name||'')}</div>` : ''}
      </div>
      <div class="lesson-actions">
        <button class="btn btn-secondary btn-sm btn-icon" onclick="openEditModal(${JSON.stringify(l).replace(/"/g,'&quot;')})" aria-label="Editar">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button class="btn btn-danger btn-sm btn-icon" onclick="askDelete(${l.id})" aria-label="Excluir">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>
    </div>
    <div class="lesson-meta">
      <span>${date}</span>
      ${l.weekday ? `<span class="lesson-badge">${esc(l.weekday)}</span>` : ''}
      ${l.time ? `<span>${l.time}</span>` : ''}
      ${l.training_type ? `<span class="lesson-badge green">${esc(l.training_type)}</span>` : ''}
      ${l.duration ? `<span class="lesson-badge gray">${l.duration} min</span>` : ''}
    </div>
    ${l.observations ? `<div class="lesson-obs">${esc(l.observations)}</div>` : ''}
  </div>`;
}

async function loadProfessors() {
  try {
    const res = await fetch('/api/users', { credentials:'include' });
    const { users } = await res.json();
    professorsCache = (users||[]).filter(u => u.role==='professor');
    const sel = document.getElementById('af-prof');
    if (!sel) return;
    sel.innerHTML = '<option value="">Todos</option>';
    professorsCache.forEach(p => sel.appendChild(new Option(p.name, p.id)));
  } catch {}
}

function openEditModal(l) {
  document.getElementById('edit-id').value    = l.id;
  document.getElementById('e-date').value     = l.date;
  document.getElementById('e-time').value     = l.time;
  document.getElementById('e-weekday').value  = l.weekday||'';
  document.getElementById('e-student').value  = l.student_name;
  document.getElementById('e-type').value     = l.training_type||'';
  document.getElementById('e-duration').value = l.duration||'';
  document.getElementById('e-obs').value      = l.observations||'';

  // Populate and select student
  const studentInp = document.getElementById('e-student');
  const studentList = document.getElementById('student-list-edit');
  if (studentInp && studentList) {
    fetch('/api/students/active', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const students = data.students || [];
        studentList.innerHTML = students.map(s => `<option value="${esc(s.name)}">`).join('');
        studentInp.value = l.student_name;
      });
  }

  document.getElementById('edit-alert')?.classList.add('hidden');
  document.getElementById('edit-modal')?.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeEditModal() {
  document.getElementById('edit-modal')?.classList.add('hidden');
  document.body.style.overflow = '';
}

async function saveEdit() {
  const id      = document.getElementById('edit-id').value;
  const date    = document.getElementById('e-date').value;
  const time    = document.getElementById('e-time').value;
  const student = document.getElementById('e-student').value;
  if (!date || !time || !student) { showEditAlert('Preencha os campos obrigatórios.','error'); return; }

  const btn = document.getElementById('edit-save-btn');
  const txt = document.getElementById('edit-save-txt');
  const load = document.getElementById('edit-save-load');
  if (btn) btn.disabled=true; 
  if (txt) txt.classList.add('hidden'); 
  if (load) load.classList.remove('hidden');
  
  try {
    const res = await fetch(`/api/lessons/${id}`, {
      method:'PUT', credentials:'include',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        date, time, studentName: student,
        trainingType: document.getElementById('e-type').value || null,
        duration:     document.getElementById('e-duration').value || null,
        observations: document.getElementById('e-obs').value.trim() || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) { showEditAlert(data.error||'Erro.','error'); return; }
    closeEditModal();
    showToast('Aula atualizada!','success');
    await Promise.all([loadAllLessons(), loadReport()]);
  } catch { showEditAlert('Erro de conexão.','error'); }
  finally { 
    if (btn) btn.disabled=false; 
    if (txt) txt.classList.remove('hidden'); 
    if (load) load.classList.add('hidden'); 
  }
}

function showEditAlert(msg,type) {
  const el=document.getElementById('edit-alert');
  if (el) { el.textContent=msg; el.className=`alert alert-${type}`; el.classList.remove('hidden'); }
}

function askDelete(id) {
  document.getElementById('confirm-title').textContent = 'Excluir Aula?';
  document.getElementById('confirm-msg').textContent   = 'Esta ação não pode ser desfeita.';
  document.getElementById('confirm-overlay')?.classList.remove('hidden');
  pendingAction = async () => {
    closeConfirm();
    const res = await fetch(`/api/lessons/${id}`,{method:'DELETE',credentials:'include'});
    const data = await res.json();
    if (!res.ok) { showToast(data.error||'Erro.','error'); return; }
    showToast('Aula excluída.','success');
    await Promise.all([loadAllLessons(), loadReport()]);
  };
  const yesBtn = document.getElementById('confirm-yes');
  if (yesBtn) yesBtn.onclick = () => pendingAction?.();
}

function closeConfirm() {
  pendingAction = null;
  document.getElementById('confirm-overlay')?.classList.add('hidden');
}

async function loadReport() {
  const month = document.getElementById('rf-month')?.value;
  const year  = document.getElementById('rf-year')?.value;
  const list  = document.getElementById('report-list');
  if (!list) return;
  
  if (!month || !year) {
    list.innerHTML = `<div class="empty-state"><p>Selecione o período e clique em Gerar.</p></div>`;
    return;
  }
  
  document.getElementById('report-period').textContent = `— ${MONTHS[month-1]} ${year}`;
  list.innerHTML = `<div class="empty-state"><p>Gerando...</p></div>`;
  try {
    const res = await fetch(`/api/reports/monthly?year=${year}&month=${month}`, { credentials:'include' });
    const { report } = await res.json();
    if (!report?.length) {
      list.innerHTML = `<div class="empty-state"><p>Nenhum professor encontrado.</p></div>`; return;
    }
    list.innerHTML = report.map((r, i) => `
        <div class="report-card" onclick="openReportDetail(${r.professor_id || r.id}, '${esc(r.professor_name)}')">
          <div class="report-rank">${i+1}</div>
          <div class="report-info">
            <div class="report-name">${esc(r.professor_name)}</div>
            <div class="report-email">${esc(r.email)}</div>
          </div>
          <div class="report-count">${r.total_lessons}<small>aulas</small></div>
        </div>`).join('');
  } catch { list.innerHTML = `<div class="empty-state"><p>Erro ao gerar relatório.</p></div>`; }
}

function openReportDetail(profId, profName) {
  const month = document.getElementById('rf-month').value;
  const year  = document.getElementById('rf-year').value;
  
  document.getElementById('report-detail-title').textContent = `Relatório: ${profName} (${MONTHS[month-1]}/${year})`;
  const tbody = document.getElementById('report-detail-tbody');
  if (tbody) {
    tbody.innerHTML = `<tr><td colspan="3" class="text-center" style="padding:2rem">Carregando aulas...</td></tr>`;
  }
  
  document.getElementById('report-detail-modal')?.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  fetch(`/api/lessons/all?year=${year}&month=${month}`, { credentials:'include' })
    .then(res => res.json())
    .then(data => {
      const lessons = (data.lessons || []).filter(l => Number(l.professor_id) === Number(profId));
      
      if (!lessons.length) {
        if (tbody) tbody.innerHTML = `<tr><td colspan="3" class="text-center" style="padding:2rem;color:var(--text-dim)">Nenhuma aula encontrada.</td></tr>`;
        return;
      }
      if (tbody) {
        tbody.innerHTML = lessons.map(l => {
          const date = l.date ? new Date(l.date+'T12:00:00').toLocaleDateString('pt-BR') : '';
          return `
            <tr>
              <td><div style="font-weight:500;white-space:nowrap">${date}</div></td>
              <td><div style="color:var(--text-dim);white-space:nowrap">${l.time || '--:--'}</div></td>
              <td><div style="font-weight:500">${esc(l.student_name)}</div></td>
            </tr>
          `;
        }).join('');
      }
    })
    .catch(err => {
      console.error('Erro ao carregar detalhes:', err);
      if (tbody) tbody.innerHTML = `<tr><td colspan="3" class="text-center" style="padding:2rem;color:var(--error)">Erro ao carregar aulas.</td></tr>`;
    });
}

function closeReportDetail() {
  document.getElementById('report-detail-modal')?.classList.add('hidden');
  document.body.style.overflow = '';
}

async function loadUsers() {
  try {
    const res = await fetch('/api/users', { credentials:'include' });
    const { users } = await res.json();
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    if (!users?.length) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:2rem;color:var(--txt-2)">Nenhum usuário.</td></tr>`;
      return;
    }
    tbody.innerHTML = users.map(u => `
      <tr>
        <td><div style="font-weight:600">${esc(u.name)}</div></td>
        <td><div style="font-size:.82rem;color:var(--txt-2)">${esc(u.email)}</div></td>
        <td><span class="badge ${u.role==='admin'?'badge-blue':'badge-gray'}">${u.role==='admin'?'Admin':'Professor'}</span></td>
        <td><span class="badge ${u.active?'badge-green':'badge-red'}">${u.active?'Ativo':'Inativo'}</span></td>
        <td>
          <div style="display:flex;gap:.35rem">
            <button class="btn btn-secondary btn-sm" onclick="openEditUserModal(${JSON.stringify(u).replace(/"/g,'&quot;')})">Editar</button>
            ${u.id !== currentUser?.id ? `
            <button class="btn ${u.active?'btn-danger':'btn-secondary'} btn-sm"
              onclick="askToggleUser(${u.id},'${esc(u.name)}',${u.active})">
              ${u.active?'Desativar':'Ativar'}
            </button>
            <button class="btn btn-danger btn-sm btn-icon" title="Excluir Definitivamente"
              onclick="askDeleteUser(${u.id},'${esc(u.name)}')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M9 6V4h6v2"/>
              </svg>
            </button>` : '<span style="color:var(--txt-3);font-size:.78rem">Você</span>'}
          </div>
        </td>
      </tr>`).join('');
  } catch {}
}

function openNewUserModal() {
  editingUserId = null;
  document.getElementById('user-modal-title').textContent = 'Novo Usuário';
  document.getElementById('u-save-txt').textContent = 'Criar Usuário';
  document.getElementById('u-id').value = '';
  document.getElementById('u-name').value = '';
  document.getElementById('u-email').value = '';
  document.getElementById('u-password').value = '';
  document.getElementById('u-new-password').value = '';
  document.getElementById('u-role').value = 'professor';
  document.getElementById('u-active').value = '1';
  document.getElementById('u-pwd-group')?.classList.remove('hidden');
  document.getElementById('u-chpwd-group')?.classList.add('hidden');
  document.getElementById('u-active-group').style.display = 'none';
  document.getElementById('user-alert')?.classList.add('hidden');
  document.getElementById('user-modal')?.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function openEditUserModal(u) {
  editingUserId = u.id;
  document.getElementById('user-modal-title').textContent = 'Editar Usuário';
  document.getElementById('u-save-txt').textContent = 'Salvar';
  document.getElementById('u-id').value    = u.id;
  document.getElementById('u-name').value  = u.name;
  document.getElementById('u-email').value = u.email;
  document.getElementById('u-role').value  = u.role;
  document.getElementById('u-active').value = u.active ? '1' : '0';
  document.getElementById('u-pwd-group')?.classList.add('hidden');
  document.getElementById('u-chpwd-group')?.classList.remove('hidden');
  document.getElementById('u-new-password').value = '';
  document.getElementById('u-active-group').style.display = '';
  document.getElementById('user-alert')?.classList.add('hidden');
  document.getElementById('user-modal')?.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeUserModal() {
  document.getElementById('user-modal')?.classList.add('hidden');
  document.body.style.overflow = '';
}

async function saveUser() {
  const btn = document.getElementById('u-save-btn');
  const txt = document.getElementById('u-save-txt');
  const load = document.getElementById('u-save-load');
  const name  = document.getElementById('u-name').value.trim();
  const email = document.getElementById('u-email').value.trim();
  const role  = document.getElementById('u-role').value;

  if (!name || !email) { showUserAlert('Nome e email são obrigatórios.','error'); return; }

  if (btn) btn.disabled=true; 
  if (txt) txt.classList.add('hidden'); 
  if (load) load.classList.remove('hidden');
  
  try {
    let res, data;
    if (!editingUserId) {
      const password = document.getElementById('u-password').value;
      if (!password) { showUserAlert('Senha obrigatória.','error'); return; }
      res = await fetch('/api/users', {
        method:'POST', credentials:'include',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name, email, password, role }),
      });
      data = await res.json();
    } else {
      const active = Number(document.getElementById('u-active').value);
      res = await fetch(`/api/users/${editingUserId}`, {
        method:'PUT', credentials:'include',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name, email, role, active }),
      });
      data = await res.json();
      if (res.ok) {
        const newPwd = document.getElementById('u-new-password').value;
        if (newPwd) {
          await fetch(`/api/users/${editingUserId}/password`, {
            method:'PATCH', credentials:'include',
            headers:{'Content-Type':'application/json'},
            body: JSON.stringify({ password: newPwd }),
          });
        }
      }
    }
    if (!res.ok) {
      const msg = data.details && data.details.length > 0
        ? `${data.error}: ${data.details[0].message}`
        : (data.error || 'Erro.');
      showUserAlert(msg, 'error');
      return;
    }
    closeUserModal();
    showToast(editingUserId ? 'Usuário atualizado!' : 'Usuário criado!', 'success');
    loadUsers();
    loadProfessors();
  } catch { showUserAlert('Erro de conexão.','error'); }
  finally { 
    if (btn) btn.disabled=false; 
    if (txt) txt.classList.remove('hidden'); 
    if (load) load.classList.add('hidden'); 
  }
}

function showUserAlert(msg,type) {
  const el=document.getElementById('user-alert');
  if (el) { el.textContent=msg; el.className=`alert alert-${type}`; el.classList.remove('hidden'); }
}

function askToggleUser(id, name, active) {
  document.getElementById('confirm-title').textContent = active ? `Desativar ${name}?` : `Ativar ${name}?`;
  document.getElementById('confirm-msg').textContent = active
    ? 'O usuário não conseguirá fazer login enquanto estiver desativado.'
    : 'O usuário voltará a ter acesso ao sistema.';
  document.getElementById('confirm-overlay')?.classList.remove('hidden');
  pendingAction = async () => {
    closeConfirm();
    try {
      const res = await fetch(`/api/users/${id}/toggle-active`,{method:'PATCH',credentials:'include'});
      const data = await res.json();
      if (!res.ok) { showToast(data.error||'Erro.','error'); return; }
      showToast(data.message,'success');
      loadUsers();
    } catch { showToast('Erro de conexão.','error'); }
  };
  const yesBtn = document.getElementById('confirm-yes');
  if (yesBtn) yesBtn.onclick = () => pendingAction?.();
}

function askDeleteUser(id, name) {
  document.getElementById('confirm-title').textContent = `Excluir ${name}?`;
  document.getElementById('confirm-msg').textContent = 'O usuário e todas as suas aulas serão removidos DEFINITIVAMENTE. Esta ação não pode ser desfeita.';
  document.getElementById('confirm-overlay')?.classList.remove('hidden');
  pendingAction = async () => {
    closeConfirm();
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || 'Erro.', 'error'); return; }
      showToast('Usuário removido da base.', 'success');
      loadUsers();
    } catch { showToast('Erro de conexão.', 'error'); }
  };
  const yesBtn = document.getElementById('confirm-yes');
  if (yesBtn) yesBtn.onclick = () => pendingAction?.();
}

async function doLogout() {
  await fetch('/api/auth/logout',{method:'POST',credentials:'include'});
  window.location.href = '/';
}
window.doLogout = doLogout; 
window.logout = doLogout;

function esc(s) {
  if (!s) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
let toastTimer;
function showToast(msg, type='success') {
  const el=document.getElementById('toast');
  if (el) {
    el.textContent=msg; el.className=type;
    el.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer=setTimeout(()=>el.classList.add('hidden'),3500);
  }
}
