function showToast(message, type = 'info') {
  const existing = document.getElementById('vr-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'vr-toast';
  toast.className = `vr-toast vr-toast--${type}`;
  toast.innerHTML = `
    <span class="vr-toast__icon">${getToastIcon(type)}</span>
    <span class="vr-toast__text">${message}</span>
    <button class="vr-toast__close" onclick="this.parentElement.remove()">✕</button>
  `;

  Object.assign(toast.style, {
    position: 'fixed', bottom: '24px', right: '24px',
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '14px 18px', borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
    fontSize: '14px', fontFamily: 'Arial, sans-serif',
    maxWidth: '360px', zIndex: '9999',
    animation: 'toastSlideIn 0.35s ease',
    backgroundColor: getToastColor(type), color: '#fff',
  });

  document.body.appendChild(toast);
  setTimeout(() => {
    if (toast.parentElement) {
      toast.style.animation = 'toastSlideOut 0.3s ease forwards';
      setTimeout(() => toast.remove(), 300);
    }
  }, 4000);
}

function getToastIcon(type) {
  return { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' }[type] || 'ℹ';
}
function getToastColor(type) {
  return { success: '#4a7c59', error: '#c0392b', warning: '#e67e22', info: '#2980b9' }[type] || '#2980b9';
}


(function injectStyles() {
  if (document.getElementById('vr-styles')) return;
  const style = document.createElement('style');
  style.id = 'vr-styles';
  style.textContent = `
    @keyframes toastSlideIn  { from { transform: translateX(110%); opacity:0; } to { transform:translateX(0); opacity:1; } }
    @keyframes toastSlideOut { from { transform: translateX(0); opacity:1; } to { transform:translateX(110%); opacity:0; } }
    .vr-hint { font-size:12px; margin-top:4px; min-height:18px; transition:color .2s; }
    .vr-hint--error   { color:#c0392b; }
    .vr-hint--success { color:#4a7c59; }
    .vr-hint--info    { color:#777; }
    input.vr-input--error   { border-color:#c0392b !important; box-shadow:0 0 0 3px rgba(192,57,43,.15) !important; }
    input.vr-input--success { border-color:#4a7c59 !important; box-shadow:0 0 0 3px rgba(74,124,89,.15) !important; }
    .vr-strength-bar  { height:4px; border-radius:2px; margin-top:6px; background:#eee; overflow:hidden; }
    .vr-strength-fill { height:100%; border-radius:2px; width:0%; transition:width .3s ease, background-color .3s ease; }
    .vr-strength-label { font-size:11px; margin-top:3px; }
    .vr-counter { font-size:11px; color:#aaa; text-align:right; margin-top:2px; }
    .vr-counter--warn { color:#e67e22; }
    .vr-toast__close {
  background: none;
  border: none;
  color: rgba(255,255,255,0.8);
  cursor: pointer;
  font-size: 14px;
  margin-left: 6px;
  padding: 0 2px;
  outline: none;
}
.vr-toast__close:hover { color: #fff; }

    .nav-user-block { display:flex; align-items:center; gap:12px; margin-left:auto; }
    .nav-user-name  { color:#fff; font-size:14px; opacity:.9; }
    .nav-logout-btn {
      background: rgba(255,255,255,0.2); color:#fff; border:1px solid rgba(255,255,255,0.4);
      padding:5px 14px; border-radius:4px; cursor:pointer; font-size:13px;
      transition: background .2s;
    }
    .nav-logout-btn:hover { background: rgba(255,255,255,0.35); }
    nav { display:flex; align-items:center; flex-wrap:wrap; }
  `;
  document.head.appendChild(style);
})();


const Auth = {
  getUsers() {
    return JSON.parse(localStorage.getItem('vr_users') || '[]');
  },
  saveUsers(users) {
    localStorage.setItem('vr_users', JSON.stringify(users));
  },
  register(name, email, password) {
    const users = this.getUsers();
    if (users.find(u => u.email === email)) {
      return { ok: false, error: 'Користувач з таким email вже існує' };
    }
    users.push({ name, email, password });
    this.saveUsers(users);
    return { ok: true };
  },
  login(email, password) {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) return { ok: false, error: 'Невірний email або пароль' };
    localStorage.setItem('vr_current_user', JSON.stringify({ name: user.name, email: user.email }));
    return { ok: true, user };
  },
  logout() {
    localStorage.removeItem('vr_current_user');
  },
  getCurrentUser() {
    return JSON.parse(localStorage.getItem('vr_current_user') || 'null');
  },
  isLoggedIn() {
    return !!this.getCurrentUser();
  }
};

function updateNav() {
  const nav = document.querySelector('nav');
  if (!nav) return;

  const user = Auth.getCurrentUser();
  const loginLink = [...nav.querySelectorAll('a')].find(a => a.getAttribute('href') === 'login.html');

  if (user) {
    if (loginLink) loginLink.remove();
    if (!nav.querySelector('.nav-user-block')) {
      const block = document.createElement('div');
      block.className = 'nav-user-block';
      block.innerHTML = `
        <a href="bookings.html" style="color:white; text-decoration:none; font-size:14px; opacity:.9;">📋 Бронювання</a>
        <a href="profile.html"  style="color:white; text-decoration:none; font-size:14px; opacity:.9;">👤 ${user.name}</a>
        <button class="nav-logout-btn" id="logout-btn">Вийти</button>
      `;
      nav.appendChild(block);

      document.getElementById('logout-btn').addEventListener('click', () => {
        Auth.logout();
        showToast('Ви вийшли з акаунта', 'info');
        setTimeout(() => window.location.href = 'index.html', 1500);
      });
    }
  }
}

function setHint(input, message, type = 'info') {
  let hint = input.parentElement.querySelector('.vr-hint');
  if (!hint) {
    hint = document.createElement('div');
    hint.className = 'vr-hint';
    input.parentElement.appendChild(hint);
  }
  hint.textContent = message;
  hint.className = `vr-hint vr-hint--${type}`;
}

function setInputState(input, state) {
  input.classList.remove('vr-input--error', 'vr-input--success');
  if (state) input.classList.add(`vr-input--${state}`);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function getPasswordStrength(pwd) {
  let score = 0;
  if (pwd.length >= 6)          score++;
  if (/[A-Z]/.test(pwd))        score++;
  if (/[0-9]/.test(pwd))        score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  return score;
}

function renderStrengthBar(input, pwd) {
  let wrap = input.parentElement.querySelector('.vr-strength-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.className = 'vr-strength-wrap';
    wrap.innerHTML = `<div class="vr-strength-bar"><div class="vr-strength-fill"></div></div><div class="vr-strength-label"></div>`;
    input.parentElement.appendChild(wrap);
  }
  const fill  = wrap.querySelector('.vr-strength-fill');
  const label = wrap.querySelector('.vr-strength-label');
  const score = getPasswordStrength(pwd);
  const levels = [
    { w:'0%',   color:'#eee',    text:'' },
    { w:'25%',  color:'#c0392b', text:'Слабкий' },
    { w:'50%',  color:'#e67e22', text:'Середній' },
    { w:'75%',  color:'#f1c40f', text:'Хороший' },
    { w:'100%', color:'#4a7c59', text:'Надійний' },
  ];
  const lv = levels[score];
  fill.style.width = lv.w;
  fill.style.backgroundColor = lv.color;
  label.textContent = lv.text;
  label.style.color = lv.color;
}

function getOrCreateCounter(input, max) {
  let counter = input.parentElement.querySelector('.vr-counter');
  if (!counter) {
    counter = document.createElement('div');
    counter.className = 'vr-counter';
    counter.textContent = `0/${max}`;
    input.parentElement.appendChild(counter);
  }
  return counter;
}


function initLoginForm() {
  const form = document.querySelector('form');
  if (!form) return;

  if (Auth.isLoggedIn()) {
    showToast('Ви вже увійшли до акаунта', 'info');
    setTimeout(() => window.location.href = 'index.html', 1500);
    return;
  }

  const loginIn    = document.getElementById('login-email');
  const passwordIn = document.getElementById('login-password');
  if (!loginIn || !passwordIn) return;

  loginIn.addEventListener('focus', () => setHint(loginIn, 'Введіть вашу email-адресу', 'info'));
  loginIn.addEventListener('input', () => {
    const val = loginIn.value.trim();
    if (!val) { setInputState(loginIn, null); setHint(loginIn, 'Введіть вашу email-адресу', 'info'); }
    else if (!isValidEmail(val)) { setInputState(loginIn, 'error'); setHint(loginIn, 'Невірний формат email', 'error'); }
    else { setInputState(loginIn, 'success'); setHint(loginIn, 'Email виглядає правильно ✓', 'success'); }
  });
  loginIn.addEventListener('blur', () => {
    const val = loginIn.value.trim();
    if (val && !isValidEmail(val)) setHint(loginIn, 'Будь ласка, введіть правильний email', 'error');
  });

  passwordIn.addEventListener('focus', () => { if (!passwordIn.value) setHint(passwordIn, 'Мінімум 6 символів', 'info'); });
  passwordIn.addEventListener('input', () => {
    const val = passwordIn.value;
    if (!val.length) { setInputState(passwordIn, null); setHint(passwordIn, 'Мінімум 6 символів', 'info'); }
    else if (val.length < 6) { setInputState(passwordIn, 'error'); setHint(passwordIn, `Замало символів (${val.length}/6)`, 'error'); }
    else { setInputState(passwordIn, 'success'); setHint(passwordIn, 'Пароль введено', 'success'); }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const emailVal = loginIn.value.trim();
    const passVal  = passwordIn.value;
    let hasError = false;

    if (!isValidEmail(emailVal)) { setInputState(loginIn, 'error'); setHint(loginIn, 'Введіть коректний email', 'error'); hasError = true; }
    if (passVal.length < 6)      { setInputState(passwordIn, 'error'); setHint(passwordIn, 'Пароль має бути не менше 6 символів', 'error'); hasError = true; }
    if (hasError) { showToast('Будь ласка, виправте помилки у формі', 'error'); return; }

    const result = Auth.login(emailVal, passVal);
    if (!result.ok) {
      showToast(result.error, 'error');
      setInputState(loginIn, 'error');
      setInputState(passwordIn, 'error');
      return;
    }

    showToast(`Вітаємо, ${result.user.name}!`, 'success');
    setTimeout(() => window.location.href = 'index.html', 1800);
  });
}

function initRegisterForm() {
  const form = document.querySelector('form');
  if (!form) return;

  if (Auth.isLoggedIn()) {
    showToast('Ви вже маєте акаунт', 'info');
    setTimeout(() => window.location.href = 'index.html', 1500);
    return;
  }

  const nameIn  = document.getElementById('reg-name');
  const emailIn = document.getElementById('reg-email');
  const passIn  = document.getElementById('reg-password');
  if (!nameIn || !emailIn || !passIn) return;

  nameIn.addEventListener('focus', () => setHint(nameIn, "Введіть ваше повне ім'я та прізвище", 'info'));
  nameIn.addEventListener('input', () => {
    const val = nameIn.value.trim();
    const counter = getOrCreateCounter(nameIn, 50);
    counter.textContent = `${val.length}/50`;
    counter.className = val.length > 45 ? 'vr-counter vr-counter--warn' : 'vr-counter';
    if (!val) { setInputState(nameIn, null); setHint(nameIn, "Введіть ваше повне ім'я", 'info'); }
    else if (val.length < 2) { setInputState(nameIn, 'error'); setHint(nameIn, "Ім'я занадто коротке", 'error'); }
    else { setInputState(nameIn, 'success'); setHint(nameIn, 'Чудово ✓', 'success'); }
  });

  emailIn.addEventListener('focus', () => setHint(emailIn, 'Введіть вашу email-адресу', 'info'));
  emailIn.addEventListener('input', () => {
    const val = emailIn.value.trim();
    if (!val) { setInputState(emailIn, null); setHint(emailIn, 'Введіть вашу email-адресу', 'info'); }
    else if (!isValidEmail(val)) { setInputState(emailIn, 'error'); setHint(emailIn, 'Невірний формат email', 'error'); }
    else { setInputState(emailIn, 'success'); setHint(emailIn, 'Email виглядає правильно', 'success'); }
  });

  passIn.addEventListener('focus', () => setHint(passIn, 'Мінімум 6 символів. Використовуйте літери, цифри та символи', 'info'));
  passIn.addEventListener('input', () => {
    const val = passIn.value;
    renderStrengthBar(passIn, val);
    if (!val) { setInputState(passIn, null); setHint(passIn, 'Мінімум 6 символів', 'info'); }
    else if (val.length < 6) { setInputState(passIn, 'error'); setHint(passIn, `Ще ${6 - val.length} символів для мінімальної довжини`, 'error'); }
    else if (getPasswordStrength(val) < 2) { setInputState(passIn, 'error'); setHint(passIn, 'Додайте великі літери або цифри для надійності', 'error'); }
    else { setInputState(passIn, 'success'); setHint(passIn, 'Пароль прийнято ✓', 'success'); }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameVal  = nameIn.value.trim();
    const emailVal = emailIn.value.trim();
    const passVal  = passIn.value;
    let hasError = false;

    if (nameVal.length < 2)      { setInputState(nameIn, 'error');  setHint(nameIn, "Введіть ваше ім'я", 'error'); hasError = true; }
    if (!isValidEmail(emailVal)) { setInputState(emailIn, 'error'); setHint(emailIn, 'Введіть коректний email', 'error'); hasError = true; }
    if (passVal.length < 6 || getPasswordStrength(passVal) < 2) {
      setInputState(passIn, 'error'); setHint(passIn, 'Пароль недостатньо надійний', 'error'); hasError = true;
    }
    if (hasError) { showToast('Перевірте правильність заповнення форми', 'error'); return; }

    const result = Auth.register(nameVal, emailVal, passVal);
    if (!result.ok) { showToast(result.error, 'error'); return; }

    showToast('Реєстрацію успішно завершено! Ласкаво просимо', 'success');
    setTimeout(() => window.location.href = 'login.html', 2000);
  });
}


function handleBookingClick(event) {
  event.preventDefault();
  if (Auth.isLoggedIn()) {
    window.location.href = 'rooms.html';
  } else {
    showToast('Для бронювання потрібно увійти до акаунта', 'info');
    setTimeout(() => window.location.href = 'login.html', 2000);
  }
}


function initCalculator() {
  const roomSel    = document.getElementById('calc-room');
  const daysIn     = document.getElementById('calc-days');
  const personsSel = document.getElementById('calc-persons');
  const amount     = document.getElementById('calc-amount');
  const breakdown  = document.getElementById('calc-breakdown');

  if (!roomSel || !daysIn || !amount) return;

  const serviceIds = ['svc-massage', 'svc-pool', 'svc-physio'];

  function getDayWord(n) {
    if (n % 10 === 1 && n % 100 !== 11) return 'доба';
    if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return 'доби';
    return 'діб';
  }
  function getPersonWord(n) {
    return n === 1 ? 'особа' : 'особи';
  }

  function calculate() {
    const roomPrice  = parseInt(roomSel.value);
    const days       = Math.max(1, parseInt(daysIn.value) || 1);
    const persons    = parseInt(personsSel.value);
    const multiplier = persons <= 2 ? 1 : persons === 3 ? 1.1 : persons === 4 ? 1.2 : persons === 5 ? 1.3 : 1.4;

    let servicesTotal = 0;
    let serviceNames  = [];
    serviceIds.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.checked) {
        servicesTotal += parseInt(el.value);
        serviceNames.push(el.parentElement.textContent.trim().split('—')[0].trim());
      }
    });

    const roomTotal = Math.round(roomPrice * days * multiplier);
    const total     = roomTotal + servicesTotal;

    amount.style.transform = 'scale(1.08)';
    setTimeout(() => amount.style.transform = 'scale(1)', 200);

    amount.textContent = total.toLocaleString('uk-UA') + ' грн';

    const roomName = roomSel.options[roomSel.selectedIndex].text.split('—')[0].trim();
    let text = `${roomName} × ${days} ${getDayWord(days)} × ${persons} ${getPersonWord(persons)}`;
   const extraMap = { 3: '+10%', 4: '+20%', 5: '+30%', 6: '+40%' };
   if (extraMap[persons]) text += ` (${extraMap[persons]})`;
    if (serviceNames.length) text += ` + ${serviceNames.join(', ')}`;
    breakdown.textContent = text;
  }

  roomSel.addEventListener('change', calculate);
  daysIn.addEventListener('input', calculate);
  personsSel.addEventListener('change', calculate);
  serviceIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', calculate);
  });

  calculate();
}

document.addEventListener('DOMContentLoaded', () => {
  updateNav();

  const page = window.location.pathname.split('/').pop();

  if (page === 'login.html') {
    initLoginForm();
  } else if (page === 'register.html') {
    initRegisterForm();
  } else if (page === 'rooms.html') {
    initCalculator();
  }

  if (page === 'index.html' || page === '') {
    const hour = new Date().getHours();
    let greeting = 'Доброго дня';
    if (hour >= 5 && hour < 12)  greeting = 'Доброго ранку';
    if (hour >= 18 || hour < 5)  greeting = 'Доброго вечора';
    setTimeout(() => showToast(`${greeting}! Ласкаво просимо до VitaRelax 🌿`, 'success'), 600);
  }
});