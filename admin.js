const ADMIN_CREDENTIALS = {
  email: "admin@vitarelax.com",
  password: "admin123",
};

const MOCK_USERS = [
  {
    id: 1,
    name: "Іван Петренко",
    email: "ivan@gmail.com",
    registered: "15.05.2026",
  },
  {
    id: 2,
    name: "Олена Коваль",
    email: "olena@gmail.com",
    registered: "15.05.2026",
  },
  {
    id: 3,
    name: "Марія Сидоренко",
    email: "maria@gmail.com",
    registered: "15.05.2026",
  },
  {
    id: 4,
    name: "Андрій Бондар",
    email: "andriy@gmail.com",
    registered: "15.05.2026",
  },
];

const MOCK_BOOKINGS = [
  {
    id: 1,
    user: "Іван Петренко",
    room: "Люкс",
    dateFrom: "15.05.2026",
    dateTo: "17.05.2026",
    status: "Підтверджено",
  },
  {
    id: 2,
    user: "Олена Коваль",
    room: "Стандарт",
    dateFrom: "15.05.2026",
    dateTo: "15.05.2026",
    status: "Підтверджено",
  },
  {
    id: 3,
    user: "Марія Сидоренко",
    room: "Покращений",
    dateFrom: "20.05.2026",
    dateTo: "25.05.2026",
    status: "Очікує",
  },
  {
    id: 4,
    user: "Андрій Бондар",
    room: "Стандарт",
    dateFrom: "01.06.2026",
    dateTo: "07.06.2026",
    status: "Очікує",
  },
];

const DEFAULT_PRICES = {
  rooms: { standard: 1000, improved: 1500, lux: 2000 },
  services: { massage: 500, pool: 300, physio: 400 },
};

function getPrices() {
  const saved = localStorage.getItem("vitarelax_prices");
  return saved ? JSON.parse(saved) : DEFAULT_PRICES;
}
function savePrices(prices) {
  localStorage.setItem("vitarelax_prices", JSON.stringify(prices));
}
function checkAdminAuth() {
  const session = localStorage.getItem("vitarelax_admin_session");
  if (!session) {
    window.location.href = "login.html";
  }
}

function handleAdminLogin(email, password) {
  if (
    email === ADMIN_CREDENTIALS.email &&
    password === ADMIN_CREDENTIALS.password
  ) {
    localStorage.setItem("vitarelax_admin_session", "true");
    window.location.href = "admin.html";
    return true;
  }
  return false;
}

function handleAdminLogout() {
  localStorage.removeItem("vitarelax_admin_session");
  window.location.href = "login.html";
}

function renderUsers() {
  const tbody = document.getElementById("users-tbody");
  if (!tbody) return;
  tbody.innerHTML = MOCK_USERS.map(
    (u) => `
    <tr>
      <td>${u.id}</td>
      <td>${u.name}</td>
      <td>${u.email}</td>
      <td>${u.registered}</td>
    </tr>
  `
  ).join("");
}

function renderBookings() {
  const tbody = document.getElementById("bookings-tbody");
  if (!tbody) return;

  // Реальні бронювання з localStorage
  const realBookings = JSON.parse(localStorage.getItem("vr_bookings") || "[]");

  // Об'єднуємо mock + реальні
  const allBookings = [
    ...MOCK_BOOKINGS,
    ...realBookings.map(b => ({
      id:       b.id,
      user:     b.userName || b.userEmail,
      room:     b.room,
      dateFrom: formatAdminDate(b.dateFrom),
      dateTo:   formatAdminDate(b.dateTo),
      status:   b.status,
      isReal:   true
    }))
  ];

  tbody.innerHTML = allBookings.map(b => `
    <tr>
      <td>${b.id}</td>
      <td>${b.user}</td>
      <td>${b.room}</td>
      <td>${b.dateFrom} – ${b.dateTo}</td>
      <td>
        <span class="status-badge ${
          b.status === 'Підтверджено' ? 'status-ok' :
          b.status === 'Скасовано'    ? 'status-cancel' : 'status-wait'
        }">${b.status}</span>
        ${b.isReal && b.status === 'Очікує підтвердження'
          ? `<button onclick="confirmBooking(${b.id})"
               style="margin-left:8px; background:#4a7c59; color:white; border:none;
                      padding:4px 10px; border-radius:4px; cursor:pointer; font-size:12px;">
               Підтвердити
             </button>`
          : ''
        }
      </td>
    </tr>
  `).join("");
}

function formatAdminDate(str) {
  if (!str) return '—';
  if (str.includes('.')) return str; // вже відформатовано
  const [y, m, d] = str.split('-');
  return `${d}.${m}.${y}`;
}

function confirmBooking(id) {
  const all = JSON.parse(localStorage.getItem('vr_bookings') || '[]');
  const idx = all.findIndex(b => b.id === id);
  if (idx !== -1) {
    all[idx].status = 'Підтверджено';
    localStorage.setItem('vr_bookings', JSON.stringify(all));
    renderBookings();
    const msg = document.getElementById('save-msg');
    if (msg) { msg.textContent = 'Бронювання підтверджено!'; setTimeout(() => msg.textContent = '', 3000); }
  }
}

function renderPrices() {
  const p = getPrices();
  const container = document.getElementById("prices-form");
  if (!container) return;
  container.innerHTML = `
    <div class="prices-grid">
      <div class="price-field"><label>Стандарт (грн/доба)</label><input type="number" id="price-standard" value="${p.rooms.standard}" min="0"></div>
      <div class="price-field"><label>Покращений (грн/доба)</label><input type="number" id="price-improved" value="${p.rooms.improved}" min="0"></div>
      <div class="price-field"><label>Люкс (грн/доба)</label><input type="number" id="price-lux" value="${p.rooms.lux}" min="0"></div>
      <div class="price-field"><label>Масаж (грн)</label><input type="number" id="price-massage" value="${p.services.massage}" min="0"></div>
      <div class="price-field"><label>Басейн (грн)</label><input type="number" id="price-pool" value="${p.services.pool}" min="0"></div>
      <div class="price-field"><label>Фізіотерапія (грн)</label><input type="number" id="price-physio" value="${p.services.physio}" min="0"></div>
    </div>
    <button onclick="savePricesFromForm()" class="save-btn">Зберегти ціни</button>
    <button onclick="resetPrices()" class="reset-btn"> Скинути до початкових</button>
    <div id="save-msg" class="save-msg"></div>
  `;
}

function savePricesFromForm() {
  const prices = {
    rooms: {
      standard:
        parseInt(document.getElementById("price-standard").value) ||
        DEFAULT_PRICES.rooms.standard,
      improved:
        parseInt(document.getElementById("price-improved").value) ||
        DEFAULT_PRICES.rooms.improved,
      lux:
        parseInt(document.getElementById("price-lux").value) ||
        DEFAULT_PRICES.rooms.lux,
    },
    services: {
      massage:
        parseInt(document.getElementById("price-massage").value) ||
        DEFAULT_PRICES.services.massage,
      pool:
        parseInt(document.getElementById("price-pool").value) ||
        DEFAULT_PRICES.services.pool,
      physio:
        parseInt(document.getElementById("price-physio").value) ||
        DEFAULT_PRICES.services.physio,
    },
  };
  savePrices(prices);
  const msg = document.getElementById("save-msg");
  msg.textContent = "Ціни збережено! Зміни відображені в калькуляторі.";
  setTimeout(() => {
    msg.textContent = "";
  }, 3000);
}

function resetPrices() {
  localStorage.removeItem("vitarelax_prices");
  renderPrices();
  const msg = document.getElementById("save-msg");
  msg.textContent = "Ціни скинуто до початкових.";
  setTimeout(() => {
    msg.textContent = "";
  }, 3000);
}

document.addEventListener("DOMContentLoaded", function () {
  const page = window.location.pathname.split("/").pop();

  if (page === "admin.html") {
    checkAdminAuth();
    renderUsers();
    renderBookings();
    renderPrices();
    const btn = document.getElementById("logout-btn");
    if (btn) btn.addEventListener("click", handleAdminLogout);
  }

  if (page === "login.html") {
    const form = document.getElementById("login-form");
    if (!form) return;
    form.addEventListener(
      "submit",
      function (e) {
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;
        if (
          email === ADMIN_CREDENTIALS.email &&
          password === ADMIN_CREDENTIALS.password
        ) {
          e.preventDefault();
          e.stopImmediatePropagation();
          handleAdminLogin(email, password);
        }
      },
      true
    );
  }
});
