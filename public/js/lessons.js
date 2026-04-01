const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
                 'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const WEEKDAYS = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];

let currentUser = null;
let pendingDeleteId = null;

(async () => {
  await checkAuth();
  initFilters();
  setTodayDate();
  setupDateWeekday('f-date', 'f-weekday');
  setupDateWeekday('e-date', 'e-weekday');
  await Promise.all([loadStats(), loadMyLessons(), loadActiveStudents()]);
})();

let activeStudentsCache = [];

async function loadActiveStudents() {
  try {
    const res = await fetch('/api/students/active', { credentials: 'include' });
    const { students } = await res.json();
    activeStudentsCache = students || [];
    
    const options = activeStudentsCache.map(s => `<option value="${esc(s.name)}">`).join('');
    
    const fList = document.getElementById('student-list');
    const eList = document.getElementById('student-list-edit');
    
    if (fList) fList.innerHTML = options;
    if (eList) eList.innerHTML = options;
  } catch (err) { console.error('Erro ao carregar alunos:', err); }
}

async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    if (!res.ok) { window.location.href = '/'; return; }
    const { user } = await res.json();
    if (user.role === 'admin') { window.location.href = '/admin'; return; }
    currentUser = user;
    setUserUI(user);
  } catch { window.location.href = '/'; }
}

function setUserUI(user) {
  const initials = user.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  const avatarEl = document.getElementById('desktop-user-avatar');
  if (avatarEl) avatarEl.textContent = initials;
  const nameEl = document.getElementById('desktop-user-name');
  if (nameEl) nameEl.textContent = user.name;
}

function switchTab(tab) {
  document.getElementById('pane-nova')?.classList.toggle('hidden', tab !== 'nova');
  document.getElementById('pane-lista')?.classList.toggle('hidden', tab !== 'lista');
  
  document.getElementById('tab-nova')?.classList.toggle('active', tab === 'nova');
  document.getElementById('tab-lista')?.classList.toggle('active', tab === 'lista');
  
  document.getElementById('nav-nova')?.classList.toggle('active', tab === 'nova');
  document.getElementById('nav-lista')?.classList.toggle('active', tab === 'lista');
  
  document.getElementById('sb-nova')?.classList.toggle('active', tab === 'nova');
  document.getElementById('sb-lista')?.classList.toggle('active', tab === 'lista');
  
  if (tab === 'lista') loadMyLessons();
}

function setTodayDate() {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  document.getElementById('f-date').value = dateStr;
  document.getElementById('f-weekday').value = WEEKDAYS[today.getDay()];
  const timeStr = today.toTimeString().slice(0,5);
  document.getElementById('f-time').value = timeStr;
  document.getElementById('f-duration').value = '60';
}

function setupDateWeekday(dateId, weekdayId) {
  document.getElementById(dateId).addEventListener('change', (e) => {
    if (!e.target.value) return;
    const [y,m,d] = e.target.value.split('-').map(Number);
    document.getElementById(weekdayId).value = WEEKDAYS[new Date(y, m-1, d).getDay()];
  });
}

function initFilters() {
  const now = new Date();
  const monthSel = document.getElementById('filter-month');
  const yearSel  = document.getElementById('filter-year');
  MONTHS.forEach((m, i) => {
    const opt = new Option(m, i + 1);
    if (i + 1 === now.getMonth() + 1) opt.selected = true;
    monthSel.appendChild(opt);
  });
  for (let y = now.getFullYear(); y >= 2024; y--) {
    const opt = new Option(y, y);
    if (y === now.getFullYear()) opt.selected = true;
    yearSel.appendChild(opt);
  }
}

async function loadStats() {
  try {
    const now = new Date();
    const res = await fetch(`/api/lessons/monthly-count?year=${now.getFullYear()}&month=${now.getMonth()+1}`, { credentials: 'include' });
    const data = await res.json();
    document.getElementById('stat-month').textContent = data.count ?? 0;
    document.getElementById('stat-month-label').textContent = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`;

    const resAll = await fetch('/api/lessons/my', { credentials: 'include' });
    const dataAll = await resAll.json();
    document.getElementById('stat-total').textContent = dataAll.lessons?.length ?? 0;
  } catch (err) { console.error(err); }
}

async function loadMyLessons() {
  const month = document.getElementById('filter-month')?.value;
  const year  = document.getElementById('filter-year')?.value;
  const list  = document.getElementById('lesson-list');
  const count = document.getElementById('lesson-count');

  list.innerHTML = `<div class="empty-state"><p>Carregando...</p></div>`;
  try {
    const qs  = month && year ? `?year=${year}&month=${month}` : '';
    const res = await fetch(`/api/lessons/my${qs}`, { credentials: 'include' });
    const { lessons } = await res.json();

    count.textContent = lessons?.length ? `(${lessons.length})` : '';
    if (!lessons?.length) {
      list.innerHTML = `<div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/>
        </svg><p>Nenhuma aula encontrada neste período.</p></div>`;
      return;
    }
    list.innerHTML = lessons.map(l => buildLessonCard(l, false)).join('');
  } catch { list.innerHTML = `<div class="empty-state"><p>Erro ao carregar aulas.</p></div>`; }
}

function buildLessonCard(l, showProfessor = false) {
  const dateFormatted = l.date ? new Date(l.date + 'T12:00:00').toLocaleDateString('pt-BR') : '';
  return `
  <div class="lesson-card" id="card-${l.id}">
    <div class="lesson-card-head">
      <div>
        <div class="lesson-student">${esc(l.student_name)}</div>
        ${showProfessor ? `<div class="text-sm text-muted mt-1">Prof. ${esc(l.professor_name || '')}</div>` : ''}
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
      <span>${dateFormatted}</span>
      ${l.weekday ? `<span class="lesson-badge">${esc(l.weekday)}</span>` : ''}
      ${l.time ? `<span>${l.time}</span>` : ''}
      ${l.training_type ? `<span class="lesson-badge green">${esc(l.training_type)}</span>` : ''}
      ${l.duration ? `<span class="lesson-badge gray">${l.duration} min</span>` : ''}
    </div>
    ${l.observations ? `<div class="lesson-obs">${esc(l.observations)}</div>` : ''}
  </div>`;
}

document.getElementById('lesson-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const alertEl = document.getElementById('form-alert');
  alertEl.classList.add('hidden');
  const btn = document.getElementById('save-btn');
  const txt = document.getElementById('save-txt');
  const load = document.getElementById('save-load');

  const date    = document.getElementById('f-date').value;
  const time    = document.getElementById('f-time').value;
  const student = document.getElementById('f-student').value;
  if (!date || !time || !student) {
    showFormAlert('Selecione uma Data, Hora e o Aluno.', 'error'); return;
  }

  btn.disabled = true; txt.classList.add('hidden'); load.classList.remove('hidden');
  try {
    const res = await fetch('/api/lessons', {
      method: 'POST', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date, time,
        studentName:  student,
        trainingType: document.getElementById('f-type').value || null,
        duration:     document.getElementById('f-duration').value || null,
        observations: document.getElementById('f-obs').value.trim() || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) { showFormAlert(data.error || 'Erro ao salvar.', 'error'); return; }
    showFormAlert('Aula registrada com sucesso!', 'success');
    document.getElementById('lesson-form').reset();
    setTodayDate();
    await Promise.all([loadStats(), loadMyLessons()]);
    setTimeout(() => switchTab('lista'), 1500);
  } catch { showFormAlert('Erro de conexão.', 'error'); }
  finally { btn.disabled = false; txt.classList.remove('hidden'); load.classList.add('hidden'); }
});

function showFormAlert(msg, type) {
  const el = document.getElementById('form-alert');
  el.textContent = msg;
  el.className = `alert alert-${type}`;
  el.classList.remove('hidden');
  if (type === 'success') setTimeout(() => el.classList.add('hidden'), 4000);
}

function openEditModal(lesson) {
  document.getElementById('edit-id').value      = lesson.id;
  document.getElementById('e-date').value       = lesson.date;
  document.getElementById('e-time').value       = lesson.time;
  document.getElementById('e-weekday').value    = lesson.weekday || '';
  document.getElementById('e-student').value    = lesson.student_name;
  document.getElementById('e-type').value       = lesson.training_type || '';
  document.getElementById('e-duration').value   = lesson.duration || '';
  document.getElementById('e-obs').value        = lesson.observations || '';
  document.getElementById('edit-alert').classList.add('hidden');
  document.getElementById('edit-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeEditModal() {
  document.getElementById('edit-modal').classList.add('hidden');
  document.body.style.overflow = '';
}

async function saveEdit() {
  const id      = document.getElementById('edit-id').value;
  const date    = document.getElementById('e-date').value;
  const time    = document.getElementById('e-time').value;
  const student = document.getElementById('e-student').value;
  if (!date || !time || !student) { showEditAlert('Preencha Data, Hora e Aluno.', 'error'); return; }

  const btn = document.getElementById('edit-save-btn');
  const txt = document.getElementById('edit-save-txt');
  const load = document.getElementById('edit-save-load');
  btn.disabled = true; txt.classList.add('hidden'); load.classList.remove('hidden');
  try {
    const res = await fetch(`/api/lessons/${id}`, {
      method: 'PUT', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date, time, studentName: student,
        trainingType: document.getElementById('e-type').value || null,
        duration:     document.getElementById('e-duration').value || null,
        observations: document.getElementById('e-obs').value.trim() || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) { showEditAlert(data.error || 'Erro ao salvar.', 'error'); return; }
    closeEditModal();
    showToast('Aula atualizada com sucesso!', 'success');
    await Promise.all([loadStats(), loadMyLessons()]);
  } catch { showEditAlert('Erro de conexão.', 'error'); }
  finally { btn.disabled = false; txt.classList.remove('hidden'); load.classList.add('hidden'); }
}

function showEditAlert(msg, type) {
  const el = document.getElementById('edit-alert');
  el.textContent = msg; el.className = `alert alert-${type}`;
  el.classList.remove('hidden');
}

function askDelete(id) {
  pendingDeleteId = id;
  document.getElementById('confirm-overlay').classList.remove('hidden');
  document.getElementById('confirm-yes').onclick = confirmDelete;
}

function closeConfirm() {
  pendingDeleteId = null;
  document.getElementById('confirm-overlay').classList.add('hidden');
}

async function confirmDelete() {
  if (!pendingDeleteId) return;
  closeConfirm();
  try {
    const res = await fetch(`/api/lessons/${pendingDeleteId}`, { method: 'DELETE', credentials: 'include' });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Erro ao excluir.', 'error'); return; }
    showToast('Aula excluída.', 'success');
    await Promise.all([loadStats(), loadMyLessons()]);
  } catch { showToast('Erro de conexão.', 'error'); }
}

async function doLogout() {
  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
  window.location.href = '/';
}
window.doLogout = doLogout;

function esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

let toastTimer;
function showToast(msg, type = 'success') {
  const el = document.getElementById('toast');
  el.textContent = msg; el.className = type;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 3500);
}
