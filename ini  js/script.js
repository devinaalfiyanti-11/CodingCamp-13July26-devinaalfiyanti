/* ================================================
   LIFE DASHBOARD — script.js
   ================================================ */

'use strict';

/* ------------------------------------------------
   1. DOM REFERENCES
   ------------------------------------------------ */

// Header
const greetingEl   = document.getElementById('greeting-text');
const timeEl       = document.getElementById('current-time');
const dateEl       = document.getElementById('current-date');
const footerYearEl = document.getElementById('footer-year');

// Timer
const timerMinutesEl  = document.getElementById('timer-minutes');
const timerSecondsEl  = document.getElementById('timer-seconds');
const sessionCountEl  = document.getElementById('session-count');
const btnStart        = document.getElementById('btn-start');
const btnPause        = document.getElementById('btn-pause');
const btnReset        = document.getElementById('btn-reset');
const btnPomodoro     = document.getElementById('btn-pomodoro');
const btnShortBreak   = document.getElementById('btn-short-break');
const btnLongBreak    = document.getElementById('btn-long-break');

// To-Do
const todoForm        = document.getElementById('todo-form');
const todoInput       = document.getElementById('todo-input');
const todoItemsEl     = document.getElementById('todo-items');
const tasksCompletedEl= document.getElementById('tasks-completed');
const tasksTotalEl    = document.getElementById('tasks-total');
const btnClearDone    = document.getElementById('btn-clear-completed');
const filterBtns      = document.querySelectorAll('.todo__filter-btn');

// Quick Links
const linksList  = document.getElementById('links-list');
const btnAddLink = document.getElementById('btn-add-link');


/* ================================================
   2. USER NAME
   ================================================ */

const NAME_KEY   = 'dashboard_username';
const nameModal  = document.getElementById('name-modal');
const nameForm   = document.getElementById('name-form');
const nameInput  = document.getElementById('name-input');

/** Returns the saved name, or null if not set. */
function getSavedName() {
  return localStorage.getItem(NAME_KEY);
}

/** Saves name to localStorage. */
function saveName(name) {
  localStorage.setItem(NAME_KEY, name);
}

/** Shows the name prompt modal. */
function showNameModal() {
  nameInput.value = getSavedName() ?? '';
  nameModal.removeAttribute('hidden');
  nameInput.focus();
}

/** Hides the name prompt modal. */
function hideNameModal() {
  nameModal.setAttribute('hidden', '');
}

// Submit handler — save name and close modal
nameForm.addEventListener('submit', e => {
  e.preventDefault();
  const entered = nameInput.value.trim();
  if (!entered) return;
  saveName(entered);
  hideNameModal();
});

// Add an "Edit name" button to the header greeting area
function addEditNameBtn() {
  if (document.getElementById('btn-edit-name')) return; // already added
  const btn = document.createElement('button');
  btn.id          = 'btn-edit-name';
  btn.type        = 'button';
  btn.className   = 'header__name-edit';
  btn.textContent = '✏️ Change name';
  btn.setAttribute('aria-label', 'Change your name');
  btn.addEventListener('click', showNameModal);
  greetingEl.insertAdjacentElement('afterend', btn);
}

// Show modal on first visit (no saved name)
if (!getSavedName()) {
  showNameModal();
}

addEditNameBtn();


/* ================================================
   3. CLOCK & GREETING
   ================================================ */

/**
 * Returns a greeting string with the user's name included.
 * @param {number} hour - 0–23
 * @returns {string}
 */
function getGreeting(hour) {
  const name   = getSavedName();
  const suffix = name ? `, ${name}!` : '!';

  if (hour >= 5 && hour < 12)  return `Good Morning${suffix} ☀️`;
  if (hour >= 12 && hour < 17) return `Good Afternoon${suffix} 🌤️`;
  if (hour >= 17 && hour < 21) return `Good Evening${suffix} 🌆`;
  return `Good Night${suffix} 🌙`;
}

/**
 * Formats a number so it always has at least two digits.
 * @param {number} n
 * @returns {string}
 */
function pad(n) {
  return String(n).padStart(2, '0');
}

/** Updates time, date, and greeting every second. */
function updateClock() {
  const now = new Date();
  const h   = now.getHours();
  const m   = now.getMinutes();
  const s   = now.getSeconds();

  timeEl.textContent     = `${pad(h)}:${pad(m)}:${pad(s)}`;
  greetingEl.textContent = getGreeting(h);

  dateEl.textContent = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year:    'numeric',
    month:   'long',
    day:     'numeric',
  });

  if (footerYearEl) footerYearEl.textContent = now.getFullYear();
}

// Kick off immediately, then repeat every second
updateClock();
setInterval(updateClock, 1000);



/* ================================================
   4. POMODORO TIMER
   ================================================ */

const DURATION_KEY = 'dashboard_pomodoro_duration';

/** Loads saved pomodoro duration in minutes, defaulting to 25. */
function loadPomodoroDuration() {
  const saved = parseInt(localStorage.getItem(DURATION_KEY), 10);
  return [15, 20, 25, 45, 60].includes(saved) ? saved : 25;
}

/** Saves selected pomodoro duration to localStorage. */
function savePomodoroDuration(minutes) {
  localStorage.setItem(DURATION_KEY, String(minutes));
}

const TIMER_MODES = {
  pomodoro:   loadPomodoroDuration() * 60,
  shortBreak:  5 * 60,
  longBreak:  15 * 60,
};

const timerState = {
  mode:         'pomodoro',
  totalSeconds: TIMER_MODES.pomodoro,
  remaining:    TIMER_MODES.pomodoro,
  isRunning:    false,
  intervalId:   null,
  sessionsDone: 0,
};

/** Renders the current remaining time onto the display. */
function renderTimer() {
  const mins = Math.floor(timerState.remaining / 60);
  const secs = timerState.remaining % 60;
  timerMinutesEl.textContent = pad(mins);   // pad() already defined in section 3
  timerSecondsEl.textContent = pad(secs);
  document.title = `${pad(mins)}:${pad(secs)} — Life Dashboard`;
}

/** Switches the active mode button highlight. */
function setActiveModeBtn(activeBtn) {
  [btnPomodoro, btnShortBreak, btnLongBreak].forEach(btn => {
    btn.classList.toggle('timer__mode-btn--active', btn === activeBtn);
  });
}

/** Called every second while the timer is running. */
function timerTick() {
  if (timerState.remaining <= 0) {
    clearInterval(timerState.intervalId);
    timerState.isRunning = false;
    timerState.remaining = 0;
    renderTimer();
    handleTimerComplete();
    return;
  }
  timerState.remaining -= 1;
  renderTimer();
}

/** Handles what happens when a session reaches zero. */
function handleTimerComplete() {
  if (timerState.mode === 'pomodoro') {
    timerState.sessionsDone += 1;
    sessionCountEl.textContent = timerState.sessionsDone;
    alert('🍅 Pomodoro complete! Take a break.');
  } else {
    alert('⏰ Break over! Time to focus.');
  }
  document.title = 'Life Dashboard';
}

/** Starts (or resumes) the timer. */
function startTimer() {
  if (timerState.isRunning) return;
  timerState.isRunning  = true;
  timerState.intervalId = setInterval(timerTick, 1000);
}

/** Pauses the timer without resetting. */
function pauseTimer() {
  clearInterval(timerState.intervalId);
  timerState.isRunning = false;
}

/** Resets the timer to the beginning of the current mode. */
function resetTimer() {
  pauseTimer();
  timerState.remaining = timerState.totalSeconds;
  renderTimer();
  document.title = 'Life Dashboard';
}

/** Switches to a named mode and resets. */
function switchMode(mode, activeBtn) {
  pauseTimer();
  timerState.mode         = mode;
  timerState.totalSeconds = TIMER_MODES[mode];
  timerState.remaining    = TIMER_MODES[mode];
  setActiveModeBtn(activeBtn);
  renderTimer();
  document.title = 'Life Dashboard';
}

// Mode & control button listeners
btnStart.addEventListener('click', startTimer);
btnPause.addEventListener('click', pauseTimer);
btnReset.addEventListener('click', resetTimer);
btnPomodoro.addEventListener('click',   () => switchMode('pomodoro',   btnPomodoro));
btnShortBreak.addEventListener('click', () => switchMode('shortBreak', btnShortBreak));
btnLongBreak.addEventListener('click',  () => switchMode('longBreak',  btnLongBreak));

// Initial timer render
renderTimer();

/* ------------------------------------------------
   DURATION PICKER
   ------------------------------------------------ */
const durationBtns = document.querySelectorAll('.timer__duration-btn');

/** Syncs the active highlight to the given minute value. */
function setActiveDurationBtn(minutes) {
  durationBtns.forEach(btn => {
    btn.classList.toggle(
      'timer__duration-btn--active',
      parseInt(btn.dataset.minutes, 10) === minutes
    );
  });
}

/** Applies a new pomodoro duration, saves it, resets display if needed. */
function applyPomodoroDuration(minutes) {
  TIMER_MODES.pomodoro = minutes * 60;
  savePomodoroDuration(minutes);
  setActiveDurationBtn(minutes);

  // Only reset when in pomodoro mode — don't interrupt a short/long break
  if (timerState.mode === 'pomodoro') {
    pauseTimer();
    timerState.totalSeconds = TIMER_MODES.pomodoro;
    timerState.remaining    = TIMER_MODES.pomodoro;
    renderTimer();
    document.title = 'Life Dashboard';
  }
}

durationBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    applyPomodoroDuration(parseInt(btn.dataset.minutes, 10));
  });
});

// Restore saved duration highlight on page load
setActiveDurationBtn(loadPomodoroDuration());



/* ================================================
   4. TO-DO LIST
   ================================================ */

/** @type {'all'|'active'|'completed'} */
let currentFilter = 'all';

/**
 * Loads tasks from localStorage.
 * @returns {Array<{id:string, text:string, completed:boolean}>}
 */
function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem('dashboard_tasks')) ?? [];
  } catch {
    return [];
  }
}

/**
 * Saves the task array to localStorage.
 * @param {Array} tasks
 */
function saveTasks(tasks) {
  localStorage.setItem('dashboard_tasks', JSON.stringify(tasks));
}

/** Generates a simple unique ID. */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

/** Re-renders the full task list based on current filter. */
function renderTasks() {
  const tasks = loadTasks();
  const filtered = tasks.filter(task => {
    if (currentFilter === 'active')    return !task.completed;
    if (currentFilter === 'completed') return  task.completed;
    return true;
  });

  // Update counter
  const total     = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  tasksCompletedEl.textContent = completed;
  tasksTotalEl.textContent     = total;

  // Clear list
  todoItemsEl.innerHTML = '';

  if (filtered.length === 0) {
    const empty = document.createElement('li');
    empty.className   = 'todo__empty-state';
    empty.textContent = currentFilter === 'completed'
      ? 'No completed tasks yet.'
      : 'No tasks here. Add one above!';
    todoItemsEl.appendChild(empty);
    return;
  }

  filtered.forEach(task => {
    todoItemsEl.appendChild(createTaskEl(task));
  });
}

/**
 * Builds a single task <li> element.
 * @param {{id:string, text:string, completed:boolean}} task
 * @returns {HTMLLIElement}
 */
function createTaskEl(task) {
  const li = document.createElement('li');
  li.className = `todo__item${task.completed ? ' todo__item--completed' : ''}`;
  li.dataset.id = task.id;

  // Checkbox
  const checkbox = document.createElement('input');
  checkbox.type      = 'checkbox';
  checkbox.className = 'todo__item-checkbox';
  checkbox.checked   = task.completed;
  checkbox.setAttribute('aria-label', `Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`);
  checkbox.addEventListener('change', () => toggleTask(task.id));

  // Text
  const span = document.createElement('span');
  span.className   = 'todo__item-text';
  span.textContent = task.text;

  // Delete button
  const del = document.createElement('button');
  del.type      = 'button';
  del.className = 'todo__item-delete';
  del.textContent = '✕';
  del.setAttribute('aria-label', `Delete task: ${task.text}`);
  del.addEventListener('click', () => deleteTask(task.id));

  li.append(checkbox, span, del);
  return li;
}

/** Adds a new task, rejecting duplicates (case-insensitive, trimmed). */
function addTask(text) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const tasks = loadTasks();

  const isDuplicate = tasks.some(
    task => task.text.trim().toLowerCase() === trimmed.toLowerCase()
  );

  if (isDuplicate) {
    alert('⚠️ This task already exists.');
    return;
  }

  tasks.push({ id: uid(), text: trimmed, completed: false });
  saveTasks(tasks);
  renderTasks();
}


/** Toggles the completed state of a task by ID. */
function toggleTask(id) {
  const tasks = loadTasks().map(task =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );
  saveTasks(tasks);
  renderTasks();
}

/** Deletes a task by ID. */
function deleteTask(id) {
  saveTasks(loadTasks().filter(task => task.id !== id));
  renderTasks();
}

/** Clears all completed tasks. */
function clearCompleted() {
  saveTasks(loadTasks().filter(task => !task.completed));
  renderTasks();
}

// Form submit
todoForm.addEventListener('submit', e => {
  e.preventDefault();
  addTask(todoInput.value);
  todoInput.value = '';
  todoInput.focus();
});

// Filter buttons
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('todo__filter-btn--active'));
    btn.classList.add('todo__filter-btn--active');

    if (btn.id === 'filter-active')    currentFilter = 'active';
    else if (btn.id === 'filter-completed') currentFilter = 'completed';
    else currentFilter = 'all';

    renderTasks();
  });
});

// Clear completed
btnClearDone.addEventListener('click', clearCompleted);

// Initial render
renderTasks();


/* ================================================
   5. QUICK LINKS
   ================================================ */

/**
 * Loads links from localStorage.
 * @returns {Array<{id:string, label:string, url:string, icon:string}>}
 */
function loadLinks() {
  try {
    return JSON.parse(localStorage.getItem('dashboard_links')) ?? getDefaultLinks();
  } catch {
    return getDefaultLinks();
  }
}

/** Default links shown on first load. */
function getDefaultLinks() {
  return [
    { id: uid(), label: 'GitHub',         url: 'https://github.com',               icon: '🐙' },
    { id: uid(), label: 'MDN Docs',       url: 'https://developer.mozilla.org',    icon: '📖' },
    { id: uid(), label: 'Stack Overflow', url: 'https://stackoverflow.com',        icon: '💬' },
    { id: uid(), label: 'CodePen',        url: 'https://codepen.io',               icon: '✏️' },
  ];
}

/**
 * Saves links to localStorage.
 * @param {Array} links
 */
function saveLinks(links) {
  localStorage.setItem('dashboard_links', JSON.stringify(links));
}

/** Re-renders the quick links grid. */
function renderLinks() {
  const links = loadLinks();

  // Remove all existing link items (keep the "Add Link" button item)
  const existingItems = linksList.querySelectorAll('.links__item:not(.links__item--add)');
  existingItems.forEach(item => item.remove());

  // Insert link items before the "Add Link" button
  const addItem = linksList.querySelector('.links__item--add');
  links.forEach(link => {
    const li = createLinkEl(link);
    linksList.insertBefore(li, addItem);
  });
}

/**
 * Builds a single link <li> element.
 * @param {{id:string, label:string, url:string, icon:string}} link
 * @returns {HTMLLIElement}
 */
function createLinkEl(link) {
  const li = document.createElement('li');
  li.className  = 'links__item';
  li.dataset.id = link.id;

  const a = document.createElement('a');
  a.href      = link.url;
  a.target    = '_blank';
  a.rel       = 'noopener noreferrer';
  a.className = 'links__anchor';
  a.setAttribute('aria-label', `${link.label} - opens in new tab`);

  const iconSpan = document.createElement('span');
  iconSpan.className          = 'links__icon';
  iconSpan.setAttribute('aria-hidden', 'true');
  iconSpan.textContent        = link.icon;

  const labelSpan = document.createElement('span');
  labelSpan.className   = 'links__label';
  labelSpan.textContent = link.label;

  // Delete button (small × in corner)
  const del = document.createElement('button');
  del.type      = 'button';
  del.className = 'links__delete';
  del.textContent = '✕';
  del.setAttribute('aria-label', `Remove ${link.label}`);
  del.addEventListener('click', e => {
    e.preventDefault();   // stop link from firing
    e.stopPropagation();
    deleteLink(link.id);
  });

  a.append(iconSpan, labelSpan);
  li.append(a, del);
  return li;
}

/** Deletes a link by ID. */
function deleteLink(id) {
  saveLinks(loadLinks().filter(link => link.id !== id));
  renderLinks();
}

/** Opens a prompt dialog to collect new link details, then saves. */
function promptAddLink() {
  const label = prompt('Link name (e.g. YouTube):');
  if (!label?.trim()) return;

  let url = prompt('URL (e.g. https://youtube.com):');
  if (!url?.trim()) return;

  // Ensure the URL has a protocol
  if (!/^https?:\/\//i.test(url)) {
    url = 'https://' + url.trim();
  }

  const icon = prompt('Emoji icon (leave blank for 🔗):')?.trim() || '🔗';

  const links = loadLinks();
  links.push({ id: uid(), label: label.trim(), url, icon });
  saveLinks(links);
  renderLinks();
}

// Save default links on very first visit
if (!localStorage.getItem('dashboard_links')) {
  saveLinks(getDefaultLinks());
}

btnAddLink.addEventListener('click', promptAddLink);

// Initial render
renderLinks();
