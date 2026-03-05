const seedItems = [
  {
    id: "SUP-001",
    name: "Крафт-пакет M",
    qty: 42,
    threshold: 25,
    notes: "Склад A, полка 3",
  },
  {
    id: "SUP-002",
    name: "Термолента 58мм",
    qty: 8,
    threshold: 12,
    notes: "Касса и отгрузка",
  },
];

const state = {
  activeTab: "login",
  token: localStorage.getItem("sf_token") || "",
  user: safeParse(localStorage.getItem("sf_user")) || null,
  items: [...seedItems],
  stream: null,
  scanTimer: null,
  apiAvailable: true,
};

const refs = {
  authModal: document.getElementById("authModal"),
  authBackdrop: document.getElementById("authBackdrop"),
  openAuthBtn: document.getElementById("openAuthBtn"),
  closeAuthBtn: document.getElementById("closeAuthBtn"),
  loginTab: document.getElementById("loginTab"),
  registerTab: document.getElementById("registerTab"),
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  searchInput: document.getElementById("searchInput"),
  searchBtn: document.getElementById("searchBtn"),
  stockForm: document.getElementById("stockForm"),
  itemName: document.getElementById("itemName"),
  itemQty: document.getElementById("itemQty"),
  itemThreshold: document.getElementById("itemThreshold"),
  itemNotes: document.getElementById("itemNotes"),
  itemsTableBody: document.getElementById("itemsTableBody"),
  alertsBox: document.getElementById("alertsBox"),
  checkAlertsBtn: document.getElementById("checkAlertsBtn"),
  notifyAlertsBtn: document.getElementById("notifyAlertsBtn"),
  printAllBtn: document.getElementById("printAllBtn"),
  focusCreateBtn: document.getElementById("focusCreateBtn"),
  openScannerBtn: document.getElementById("openScannerBtn"),
  closeScannerBtn: document.getElementById("closeScannerBtn"),
  scanModal: document.getElementById("scanModal"),
  scanBackdrop: document.getElementById("scanBackdrop"),
  scannerVideo: document.getElementById("scannerVideo"),
  scanStatus: document.getElementById("scanStatus"),
};

function safeParse(text) {
  try {
    return JSON.parse(text || "");
  } catch {
    return null;
  }
}

function showToast(message) {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.cssText = [
    "position:fixed",
    "left:50%",
    "bottom:16px",
    "transform:translateX(-50%)",
    "padding:10px 14px",
    "background:rgba(17,24,39,.92)",
    "color:#fff",
    "border-radius:12px",
    "z-index:100",
    "font-size:14px",
  ].join(";");
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

async function apiRequest(path, options = {}) {
  const { method = "GET", body, auth = true } = options;

  const headers = { "Content-Type": "application/json" };
  if (auth && state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  try {
    const response = await fetch(path, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      const error = payload.error || `HTTP ${response.status}`;
      throw new Error(error);
    }

    state.apiAvailable = true;
    return response.json();
  } catch (error) {
    if (String(error.message).includes("Failed to fetch")) {
      state.apiAvailable = false;
    }
    throw error;
  }
}

function openModal() {
  refs.authModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeModal() {
  refs.authModal.hidden = true;
  document.body.style.overflow = "";
}

function setTab(tab) {
  state.activeTab = tab;
  const login = tab === "login";
  refs.loginTab.classList.toggle("active", login);
  refs.registerTab.classList.toggle("active", !login);
  refs.loginForm.classList.toggle("active", login);
  refs.registerForm.classList.toggle("active", !login);
}

function itemPayload(item) {
  return JSON.stringify({ id: item.id, name: item.name });
}

function statusBadge(item) {
  const low = Number(item.qty) <= Number(item.threshold);
  return low
    ? '<span class="badge badge-low">Низкий остаток</span>'
    : '<span class="badge badge-ok">В норме</span>';
}

async function qrDataUrl(text) {
  if (!window.QRCode || !window.QRCode.toDataURL) {
    throw new Error("QR library missing");
  }
  return window.QRCode.toDataURL(text, {
    width: 220,
    margin: 1,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });
}

async function printLabels(items) {
  const cards = [];
  for (const item of items) {
    const src = await qrDataUrl(itemPayload(item));
    cards.push({ item, src });
  }

  const wnd = window.open("", "_blank", "width=900,height=700");
  if (!wnd) {
    showToast("Разрешите popup для печати этикеток");
    return;
  }

  wnd.document.write(`
    <html>
      <head>
        <title>QR Этикетки</title>
        <style>
          body { font-family: -apple-system, Segoe UI, sans-serif; margin: 18px; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
          .card { border: 1px solid #c9d4e8; border-radius: 10px; padding: 8px; text-align: center; }
          img { width: 100%; max-width: 150px; }
          h4, p { margin: 4px 0; }
        </style>
      </head>
      <body>
        <h3>Этикетки QR</h3>
        <div class="grid">
          ${cards
            .map(
              ({ item, src }) => `
              <div class="card">
                <img src="${src}" alt="${item.id}" />
                <h4>${item.name}</h4>
                <p>${item.id}</p>
              </div>`
            )
            .join("")}
        </div>
      </body>
    </html>
  `);
  wnd.document.close();
  wnd.focus();
  wnd.print();
}

async function renderTable(list = state.items) {
  refs.itemsTableBody.innerHTML = "";

  if (!list.length) {
    refs.itemsTableBody.innerHTML =
      '<tr><td colspan="5" class="muted">Ничего не найдено. Добавьте новый расходник.</td></tr>';
    return;
  }

  for (const item of list) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><strong>${item.name}</strong><br /><span class="muted">${item.notes || "Без заметок"}</span></td>
      <td>${item.qty}</td>
      <td>${item.threshold}</td>
      <td>${item.id}<br />${statusBadge(item)}</td>
      <td>
        <div class="actions">
          <button class="secondary-btn" data-action="print" data-id="${item.id}" type="button">Печать QR</button>
          <button class="glass-btn" data-action="consume" data-id="${item.id}" type="button">-1</button>
        </div>
      </td>
    `;
    refs.itemsTableBody.appendChild(row);
  }
}

function renderAlerts(lowItems = null) {
  const low = lowItems || state.items.filter((item) => Number(item.qty) <= Number(item.threshold));
  refs.alertsBox.innerHTML = "";

  if (!low.length) {
    refs.alertsBox.innerHTML = '<p class="muted">Пока все в норме.</p>';
    return;
  }

  for (const item of low) {
    const el = document.createElement("div");
    el.className = "alert-item";
    el.textContent = `Личное уведомление: ${item.name} (${item.qty} шт, лимит ${item.threshold}).`;
    refs.alertsBox.appendChild(el);
  }
}

async function loadItems() {
  if (!state.token) {
    state.items = [...seedItems];
    renderTable();
    renderAlerts();
    return;
  }

  try {
    const data = await apiRequest("/api/inventory/list");
    state.items = data.items || [];
    renderTable();
    renderAlerts();
  } catch (error) {
    showToast(`API недоступен, демо-режим: ${error.message}`);
    state.items = [...seedItems];
    renderTable();
    renderAlerts();
  }
}

function handleSearch() {
  const value = refs.searchInput.value.trim().toLowerCase();
  if (!value) {
    renderTable(state.items);
    return;
  }

  const filtered = state.items.filter((item) => {
    return (
      item.name.toLowerCase().includes(value) ||
      item.id.toLowerCase().includes(value) ||
      (item.notes || "").toLowerCase().includes(value)
    );
  });

  renderTable(filtered);
}

async function consumeOne(id) {
  const item = state.items.find((it) => it.id === id);
  if (!item) return;

  if (!state.token) {
    if (item.qty > 0) item.qty -= 1;
    renderTable();
    renderAlerts();
    return;
  }

  try {
    await apiRequest("/api/inventory/consume", {
      method: "POST",
      body: { id, amount: 1 },
    });
    await loadItems();
  } catch (error) {
    showToast(error.message);
  }
}

async function saveItem(item) {
  if (!state.token) {
    const next = state.items.length + 1;
    state.items.unshift({
      id: `SUP-${String(next).padStart(3, "0")}`,
      ...item,
    });
    renderTable();
    renderAlerts();
    return;
  }

  await apiRequest("/api/inventory/upsert", {
    method: "POST",
    body: item,
  });
  await loadItems();
}

async function printOne(id) {
  const item = state.items.find((it) => it.id === id);
  if (!item) return;
  await printLabels([item]);
}

async function checkLowStock() {
  if (!state.token) {
    const low = state.items.filter((item) => Number(item.qty) <= Number(item.threshold));
    renderAlerts(low);
    showToast(low.length ? "Есть позиции для уведомления" : "Низких остатков нет");
    return low;
  }

  try {
    const data = await apiRequest("/api/alerts/low-stock");
    const low = data.items || [];
    renderAlerts(low);
    showToast(low.length ? "Есть позиции для уведомления" : "Низких остатков нет");
    return low;
  } catch (error) {
    showToast(error.message);
    return [];
  }
}

async function notifyLowStock() {
  if (!state.token) {
    showToast("Для уведомлений нужен вход в систему");
    return;
  }

  try {
    const result = await apiRequest("/api/alerts/notify", { method: "POST" });
    if (!result.sent) {
      showToast("Низких остатков нет");
      return;
    }
    showToast(`Отправлено в личку: ${result.sent}`);
  } catch (error) {
    showToast(error.message);
  }
}

async function openScanner() {
  refs.scanModal.hidden = false;
  document.body.style.overflow = "hidden";

  if (!navigator.mediaDevices?.getUserMedia) {
    refs.scanStatus.textContent = "Камера недоступна в этом браузере.";
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });
    state.stream = stream;
    refs.scannerVideo.srcObject = stream;
    await refs.scannerVideo.play();

    if (!("BarcodeDetector" in window)) {
      refs.scanStatus.textContent =
        "BarcodeDetector не поддерживается. Для iOS можно сканировать в Telegram встроенной камерой на следующем этапе.";
      return;
    }

    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    refs.scanStatus.textContent = "Сканирование запущено...";

    state.scanTimer = window.setInterval(async () => {
      try {
        const codes = await detector.detect(refs.scannerVideo);
        if (!codes.length) return;
        const text = codes[0].rawValue || "";
        const item = state.items.find((it) => text.includes(it.id));
        if (!item) {
          refs.scanStatus.textContent = "QR считан, но расходник не найден.";
          return;
        }
        await consumeOne(item.id);
        refs.scanStatus.textContent = `Списано 1 шт: ${item.name}`;
        showToast(`Сканировано: ${item.name} (-1)`);
      } catch {
        // ignore scanning frame errors
      }
    }, 900);
  } catch {
    refs.scanStatus.textContent = "Нет доступа к камере.";
  }
}

function closeScanner() {
  refs.scanModal.hidden = true;
  document.body.style.overflow = "";
  refs.scanStatus.textContent = "Наведите камеру на QR-код расходника.";

  if (state.scanTimer) {
    window.clearInterval(state.scanTimer);
    state.scanTimer = null;
  }

  if (state.stream) {
    state.stream.getTracks().forEach((t) => t.stop());
    state.stream = null;
  }
}

function updateAuthButton() {
  if (state.user?.email) {
    refs.openAuthBtn.textContent = `${state.user.email}`;
    refs.openAuthBtn.classList.remove("primary-btn");
    refs.openAuthBtn.classList.add("glass-btn");
  } else {
    refs.openAuthBtn.textContent = "Войти";
    refs.openAuthBtn.classList.remove("glass-btn");
    refs.openAuthBtn.classList.add("primary-btn");
  }
}

refs.openAuthBtn.addEventListener("click", () => {
  if (state.user?.email) {
    localStorage.removeItem("sf_token");
    localStorage.removeItem("sf_user");
    state.token = "";
    state.user = null;
    updateAuthButton();
    loadItems();
    showToast("Вы вышли из аккаунта");
    return;
  }
  openModal();
});
refs.closeAuthBtn.addEventListener("click", closeModal);
refs.authBackdrop.addEventListener("click", closeModal);

refs.loginTab.addEventListener("click", () => setTab("login"));
refs.registerTab.addEventListener("click", () => setTab("register"));

refs.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!refs.loginForm.reportValidity()) return;

  const form = new FormData(refs.loginForm);
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");

  try {
    const data = await apiRequest("/api/auth/login", {
      method: "POST",
      auth: false,
      body: { email, password },
    });
    state.token = data.token;
    state.user = data.user;
    localStorage.setItem("sf_token", data.token);
    localStorage.setItem("sf_user", JSON.stringify(data.user));
    updateAuthButton();
    closeModal();
    await loadItems();
    showToast("Вход успешен");
  } catch (error) {
    showToast(error.message);
  }
});

refs.registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!refs.registerForm.reportValidity()) return;

  const form = new FormData(refs.registerForm);
  const name = String(form.get("name") || "").trim();
  const email = String(form.get("email") || "").trim();
  const password = String(form.get("password") || "");
  const adminKey = String(form.get("adminKey") || "");
  const telegramChatId = String(form.get("telegramChatId") || "").trim();

  try {
    await apiRequest("/api/auth/create-user", {
      method: "POST",
      auth: false,
      body: { name, email, password, adminKey, telegramChatId },
    });
    showToast("Аккаунт создан админом");
    refs.registerForm.reset();
    setTab("login");
  } catch (error) {
    showToast(error.message);
  }
});

refs.stockForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!refs.stockForm.reportValidity()) return;

  const item = {
    name: refs.itemName.value.trim(),
    qty: Number(refs.itemQty.value),
    threshold: Number(refs.itemThreshold.value),
    notes: refs.itemNotes.value.trim(),
  };

  try {
    await saveItem(item);
    refs.stockForm.reset();
    showToast(`Добавлено: ${item.name}`);
  } catch (error) {
    showToast(error.message);
  }
});

refs.itemsTableBody.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const action = target.getAttribute("data-action");
  const id = target.getAttribute("data-id");
  if (!action || !id) return;

  if (action === "consume") {
    await consumeOne(id);
    return;
  }

  if (action === "print") {
    await printOne(id);
  }
});

refs.searchBtn.addEventListener("click", handleSearch);
refs.searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleSearch();
  }
});

refs.checkAlertsBtn.addEventListener("click", checkLowStock);
refs.notifyAlertsBtn.addEventListener("click", notifyLowStock);

refs.printAllBtn.addEventListener("click", async () => {
  await printLabels(state.items);
});

refs.focusCreateBtn.addEventListener("click", () => {
  refs.itemName.focus();
  window.scrollTo({ top: refs.stockForm.offsetTop - 40, behavior: "smooth" });
});

refs.openScannerBtn.addEventListener("click", openScanner);
refs.closeScannerBtn.addEventListener("click", closeScanner);
refs.scanBackdrop.addEventListener("click", closeScanner);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeModal();
    closeScanner();
  }
});

setTab("login");
updateAuthButton();
loadItems();
