const defaultTasks = [
  { id: 1, title: 'Map the launch experience', group: 'Creative launch', color: 'lavender', due: 'Due 10:00 AM', done: false },
  { id: 2, title: 'Review homepage feedback', group: 'Creative launch', color: 'lavender', due: 'Due 12:00 PM', done: false },
  { id: 3, title: 'Book a table for Saturday', group: 'Personal', color: 'amber', due: 'Due 2:30 PM', done: false },
  { id: 4, title: 'Read “The Creative Act”', group: 'Reading list', color: 'mint', due: 'Due 7:00 PM', done: false },
  { id: 5, title: 'Send the weekly wrap-up', group: 'Creative launch', color: 'lavender', due: 'Due 5:00 PM', done: false }
];

const storedTasks = localStorage.getItem('nexus-tasks');
let tasks = storedTasks ? JSON.parse(storedTasks) : defaultTasks;
let timerSeconds = 25 * 60;
let timerId = null;

const list = document.querySelector('#taskList');
const progressBar = document.querySelector('#progressBar');
const progressLabel = document.querySelector('#progressLabel');
const pendingCount = document.querySelector('#pendingCount');
const navTaskCount = document.querySelector('#navTaskCount');
const dialog = document.querySelector('#taskDialog');
const taskForm = document.querySelector('#taskForm');
const toast = document.querySelector('#toast');

function saveTasks() {
  localStorage.setItem('nexus-tasks', JSON.stringify(tasks));
}

function tagClass(color) {
  return color === 'amber' ? 'personal' : color === 'mint' ? 'reading' : '';
}

function renderTasks() {
  list.innerHTML = tasks.map((task, index) => `
    <article class="task ${task.done ? 'done' : ''}" style="animation-delay:${index * 45}ms">
      <input class="check" type="checkbox" data-id="${task.id}" ${task.done ? 'checked' : ''} aria-label="Mark ${task.title} complete">
      <div class="task-content">
        <span class="task-name">${escapeHtml(task.title)}</span>
        <span class="task-meta"><i class="collection-dot ${task.color}"></i>${task.due}</span>
      </div>
      <span class="tag ${tagClass(task.color)}">${task.group}</span>
      <button class="delete-task" data-delete="${task.id}" aria-label="Remove ${task.title}" title="Remove task">×</button>
    </article>`).join('');
  updateProgress();
}

function updateProgress() {
  const complete = tasks.filter(task => task.done).length;
  const pending = tasks.length - complete;
  const percentage = tasks.length ? (complete / tasks.length) * 100 : 0;
  progressBar.style.width = `${percentage}%`;
  progressLabel.textContent = `${complete} of ${tasks.length} complete`;
  pendingCount.textContent = `${pending} task${pending === 1 ? '' : 's'}`;
  navTaskCount.textContent = pending;
}

function escapeHtml(value) {
  const node = document.createElement('div');
  node.textContent = value;
  return node.innerHTML;
}

function openDialog() {
  dialog.showModal();
  setTimeout(() => document.querySelector('#taskName').focus(), 100);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.classList.remove('show'), 2500);
}

function renderTimer() {
  const minutes = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
  const seconds = (timerSeconds % 60).toString().padStart(2, '0');
  document.querySelector('#timerDisplay').textContent = `${minutes}:${seconds}`;
}

function updateDate() {
  const now = new Date();
  document.querySelector('#todayLabel').textContent = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const hour = now.getHours();
  document.querySelector('#greeting').innerHTML = `${hour < 12 ? 'Make this morning' : hour < 18 ? 'Make today' : 'Finish today'} <em>matter.</em>`;
}

list.addEventListener('change', event => {
  if (!event.target.matches('.check')) return;
  const task = tasks.find(item => item.id === Number(event.target.dataset.id));
  if (!task) return;
  task.done = event.target.checked;
  saveTasks();
  renderTasks();
  if (task.done) showToast('Nice work — one step closer. ✦');
});

list.addEventListener('click', event => {
  const id = Number(event.target.dataset.delete);
  if (!id) return;
  tasks = tasks.filter(task => task.id !== id);
  saveTasks();
  renderTasks();
  showToast('Task removed');
});

document.querySelectorAll('#addTaskButton, #quickAddButton').forEach(button => button.addEventListener('click', openDialog));
document.querySelector('#closeDialog').addEventListener('click', () => dialog.close());
document.querySelector('#cancelDialog').addEventListener('click', () => dialog.close());
document.querySelector('#viewAllButton').addEventListener('click', () => { document.querySelector('#tasks').scrollIntoView({ behavior: 'smooth' }); showToast('Showing all tasks for today'); });
document.querySelector('#upgradeButton').addEventListener('click', () => showToast('Nexus Plus is coming soon ✨'));
document.querySelector('.full-calendar').addEventListener('click', () => showToast('Calendar view is ready for your next update'));

taskForm.addEventListener('submit', event => {
  event.preventDefault();
  const title = taskForm.taskName.value.trim();
  if (!title) return;
  const color = taskForm.taskColor.value;
  const groupMap = { lavender: 'Creative launch', amber: 'Personal', mint: 'Reading list' };
  tasks.unshift({ id: Date.now(), title, group: groupMap[color], color, due: 'Today', done: false });
  saveTasks();
  renderTasks();
  taskForm.reset();
  dialog.close();
  showToast('Added to your focus list');
});

document.querySelector('#themeButton').addEventListener('click', () => {
  document.body.classList.toggle('night');
  showToast(document.body.classList.contains('night') ? 'Evening mode on' : 'Daylight mode on');
});

document.querySelector('#startFocus').addEventListener('click', event => {
  if (timerId) {
    clearInterval(timerId); timerId = null;
    event.currentTarget.innerHTML = '<span>▶</span> Start focus';
    return;
  }
  event.currentTarget.innerHTML = '<span>Ⅱ</span> Pause focus';
  timerId = setInterval(() => {
    if (timerSeconds <= 0) {
      clearInterval(timerId); timerId = null; timerSeconds = 25 * 60;
      event.currentTarget.innerHTML = '<span>▶</span> Start focus';
      showToast('Focus session complete — take a breath.');
    } else { timerSeconds--; renderTimer(); }
  }, 1000);
});

document.querySelector('#resetFocus').addEventListener('click', () => {
  clearInterval(timerId); timerId = null; timerSeconds = 25 * 60; renderTimer();
  document.querySelector('#startFocus').innerHTML = '<span>▶</span> Start focus';
});

document.querySelector('#menuButton').addEventListener('click', () => document.querySelector('#sidebar').classList.toggle('open'));
document.querySelectorAll('.nav-item').forEach(item => item.addEventListener('click', () => {
  document.querySelectorAll('.nav-item').forEach(link => link.classList.remove('active'));
  item.classList.add('active'); document.querySelector('#pageTitle').textContent = item.dataset.page || item.textContent.trim();
  document.querySelector('#sidebar').classList.remove('open');
}));

updateDate();
renderTasks();
renderTimer();
