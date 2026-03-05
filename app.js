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
  authTab: "login",
  moduleView: "home",
  inventoryTab: "main",
  token: localStorage.getItem("sf_token") || "",
  user: safeParse(localStorage.getItem("sf_user")) || null,
  items: [...seedItems],
  history: [],
  historyFiltered: [],
  historyFilters: {
    itemId: "",
    userEmail: "",
    reason: "",
    dateFrom: "",
    dateTo: "",
  },
  stream: null,
  scanTimer: null,
  editingItemId: "",
};

const ONBOARDING_KEY = "polotno_onboarding_seen_v1";

const refs = {
  openAuthBtn: document.getElementById("openAuthBtn"),
  authModal: document.getElementById("authModal"),
  authBackdrop: document.getElementById("authBackdrop"),
  closeAuthBtn: document.getElementById("closeAuthBtn"),
  authTabs: document.getElementById("authTabs"),
  loginTab: document.getElementById("loginTab"),
  registerTab: document.getElementById("registerTab"),
  loginForm: document.getElementById("loginForm"),
  registerForm: document.getElementById("registerForm"),
  homeView: document.getElementById("homeView"),
  inventoryView: document.getElementById("inventoryView"),
  openInventoryTile: document.getElementById("openInventoryTile"),
  homeBtn: document.getElementById("homeBtn"),
  mainTabBtn: document.getElementById("mainTabBtn"),
  toolsTabBtn: document.getElementById("toolsTabBtn"),
  historyTabBtn: document.getElementById("historyTabBtn"),
  mainTab: document.getElementById("mainTab"),
  toolsTab: document.getElementById("toolsTab"),
  historyTab: document.getElementById("historyTab"),
  historyList: document.getElementById("historyList"),
  historyItemFilter: document.getElementById("historyItemFilter"),
  historyUserFilter: document.getElementById("historyUserFilter"),
  historyReasonFilter: document.getElementById("historyReasonFilter"),
  historyDateFrom: document.getElementById("historyDateFrom"),
  historyDateTo: document.getElementById("historyDateTo"),
  historyApplyBtn: document.getElementById("historyApplyBtn"),
  historyResetBtn: document.getElementById("historyResetBtn"),
  historyExportBtn: document.getElementById("historyExportBtn"),
  toToolsBtn: document.getElementById("toToolsBtn"),
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
  startScannerBtn: document.getElementById("startScannerBtn"),
  stopScannerBtn: document.getElementById("stopScannerBtn"),
  scannerVideo: document.getElementById("scannerVideo"),
  scanStatus: document.getElementById("scanStatus"),
  editModal: document.getElementById("editModal"),
  editBackdrop: document.getElementById("editBackdrop"),
  closeEditBtn: document.getElementById("closeEditBtn"),
  editItemForm: document.getElementById("editItemForm"),
  editItemName: document.getElementById("editItemName"),
  editItemQty: document.getElementById("editItemQty"),
  editItemThreshold: document.getElementById("editItemThreshold"),
  editItemNotes: document.getElementById("editItemNotes"),
  onboarding: document.getElementById("onboarding"),
  closeOnboardingBtn: document.getElementById("closeOnboardingBtn"),
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

function getHaptic() {
  return window.Telegram?.WebApp?.HapticFeedback || null;
}

function hapticSelection() {
  const haptic = getHaptic();
  if (!haptic) return;
  try {
    haptic.selectionChanged();
  } catch {
    // haptic not available in current environment
  }
}

function hapticSuccess() {
  const haptic = getHaptic();
  if (!haptic) return;
  try {
    haptic.notificationOccurred("success");
  } catch {
    // haptic not available in current environment
  }
}

function hapticWarning() {
  const haptic = getHaptic();
  if (!haptic) return;
  try {
    haptic.notificationOccurred("warning");
  } catch {
    // haptic not available in current environment
  }
}

async function apiRequest(path, options = {}) {
  const { method = "GET", body, auth = true } = options;
  const headers = { "Content-Type": "application/json" };

  if (auth && state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || `HTTP ${response.status}`);
  }

  return response.json();
}

function openAuthModal() {
  refs.authModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeAuthModal() {
  refs.authModal.hidden = true;
  document.body.style.overflow = "";
}

function openEditModal(item) {
  state.editingItemId = item.id;
  refs.editItemName.value = item.name || "";
  refs.editItemQty.value = Number(item.qty || 0);
  refs.editItemThreshold.value = Number(item.threshold || 0);
  refs.editItemNotes.value = item.notes || "";
  refs.editModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeEditModal() {
  refs.editModal.hidden = true;
  document.body.style.overflow = "";
  state.editingItemId = "";
}

function setAuthTab(tab) {
  state.authTab = tab;
  const isLogin = tab === "login";
  refs.loginTab.classList.toggle("active", isLogin);
  refs.registerTab.classList.toggle("active", !isLogin);
  refs.loginForm.classList.toggle("active", isLogin);
  refs.registerForm.classList.toggle("active", !isLogin);
}

function setModuleView(view) {
  state.moduleView = view;
  const showHome = view === "home";

  refs.homeView.classList.toggle("active", showHome);
  refs.inventoryView.classList.toggle("active", !showHome);
  if (showHome) {
    stopScanner();
  }
  hapticSelection();
}

function setInventoryTab(tab) {
  state.inventoryTab = tab;
  const isMain = tab === "main";
  const isTools = tab === "tools";
  const isHistory = tab === "history";

  refs.mainTabBtn.classList.toggle("active", isMain);
  refs.toolsTabBtn.classList.toggle("active", isTools);
  refs.historyTabBtn.classList.toggle("active", isHistory);
  refs.mainTab.classList.toggle("active", isMain);
  refs.toolsTab.classList.toggle("active", isTools);
  refs.historyTab.classList.toggle("active", isHistory);
  if (isMain) {
    stopScanner();
  }
  if (isHistory) {
    stopScanner();
    loadHistory();
  }
  hapticSelection();
}

function updateAuthButton() {
  if (state.user?.email) {
    refs.openAuthBtn.textContent = state.user.email;
    refs.openAuthBtn.classList.remove("primary-btn");
    refs.openAuthBtn.classList.add("glass-btn");
    return;
  }

  refs.openAuthBtn.textContent = "Войти";
  refs.openAuthBtn.classList.remove("glass-btn");
  refs.openAuthBtn.classList.add("primary-btn");
}

function applyRoleAccess() {
  const canManageUsers = !state.user || state.user.role === "admin";
  refs.registerTab.classList.toggle("is-hidden", !canManageUsers);
  refs.authTabs.classList.toggle("admin-disabled", !canManageUsers);
  if (!canManageUsers && state.authTab === "register") {
    setAuthTab("login");
  }
}

function openOnboarding() {
  refs.onboarding.hidden = false;
  hapticSelection();
}

function closeOnboarding() {
  refs.onboarding.hidden = true;
  localStorage.setItem(ONBOARDING_KEY, "1");
  hapticSuccess();
}

function initTelegram() {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;
  try {
    webApp.ready();
    webApp.expand();
    const topInset =
      Number(webApp.safeAreaInset?.top || 0) || Number(webApp.contentSafeAreaInset?.top || 0) || 0;
    const manualTop = topInset > 0 ? topInset + 8 : 56;
    document.documentElement.style.setProperty("--tg-top-offset", `${manualTop}px`);
  } catch {
    // safe fallback for non-telegram browser
  }
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
    color: { dark: "#0f172a", light: "#ffffff" },
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
              ({ item, src }) =>
                `<div class="card"><img src="${src}" alt="${item.id}" /><h4>${item.name}</h4><p>${item.id}</p></div>`
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

function renderTable(list = state.items) {
  refs.itemsTableBody.innerHTML = "";

  if (!list.length) {
    refs.itemsTableBody.innerHTML =
      '<tr><td colspan="5" class="muted">Ничего не найдено. Добавьте новый расходник.</td></tr>';
    return;
  }

  for (const item of list) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td data-label="Расходник"><strong>${item.name}</strong><br /><span class="muted">${item.notes || "Без заметок"}</span></td>
      <td data-label="Остаток">${item.qty}</td>
      <td data-label="Лимит">${item.threshold}</td>
      <td data-label="QR-код">${item.id}<br />${statusBadge(item)}</td>
      <td data-label="Действия">
        <div class="actions">
          <button class="secondary-btn" data-action="print" data-id="${item.id}" type="button">Печать QR</button>
          <button class="secondary-btn" data-action="edit" data-id="${item.id}" type="button">Редактировать</button>
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
    const itemEl = document.createElement("div");
    itemEl.className = "alert-item";
    itemEl.textContent = `Личное уведомление: ${item.name} (${item.qty} шт, лимит ${item.threshold}).`;
    refs.alertsBox.appendChild(itemEl);
  }
}

function formatHistoryDate(value) {
  if (!value) return "дата неизвестна";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return value;
  return dt.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toIsoDate(dateText) {
  if (!dateText) return "";
  const dt = new Date(dateText);
  if (Number.isNaN(dt.getTime())) return "";
  return dt.toISOString();
}

function reasonLabel(reason) {
  if (reason === "create") return "Создание";
  if (reason === "update") return "Редактирование";
  if (reason === "consume") return "Списание";
  return reason || "Изменение";
}

function setHistoryFiltersFromInputs() {
  state.historyFilters.itemId = refs.historyItemFilter.value.trim().toUpperCase();
  state.historyFilters.userEmail = refs.historyUserFilter.value.trim().toLowerCase();
  state.historyFilters.reason = refs.historyReasonFilter.value.trim().toLowerCase();
  state.historyFilters.dateFrom = refs.historyDateFrom.value;
  state.historyFilters.dateTo = refs.historyDateTo.value;
}

function applyHistoryFilters(list = state.history) {
  const { itemId, userEmail, reason, dateFrom, dateTo } = state.historyFilters;
  const fromIso = toIsoDate(dateFrom);
  const toIso = toIsoDate(dateTo);
  const toDate = toIso ? new Date(toIso) : null;
  if (toDate) {
    toDate.setHours(23, 59, 59, 999);
  }

  state.historyFiltered = list.filter((row) => {
    if (itemId && !String(row.item_id || "").toUpperCase().includes(itemId)) return false;
    if (userEmail && !String(row.user_email || "").toLowerCase().includes(userEmail)) return false;
    if (reason && String(row.reason || "").toLowerCase() !== reason) return false;
    if (fromIso || toDate) {
      const dt = new Date(row.created_at || "");
      if (Number.isNaN(dt.getTime())) return false;
      if (fromIso && dt < new Date(fromIso)) return false;
      if (toDate && dt > toDate) return false;
    }
    return true;
  });
}

function historyQueryString() {
  const params = new URLSearchParams();
  params.set("limit", "120");
  if (state.historyFilters.itemId) params.set("item_id", state.historyFilters.itemId);
  if (state.historyFilters.userEmail) params.set("user_email", state.historyFilters.userEmail);
  if (state.historyFilters.reason) params.set("reason", state.historyFilters.reason);
  if (state.historyFilters.dateFrom) params.set("date_from", state.historyFilters.dateFrom);
  if (state.historyFilters.dateTo) params.set("date_to", state.historyFilters.dateTo);
  return params.toString();
}

function resetHistoryFilters() {
  refs.historyItemFilter.value = "";
  refs.historyUserFilter.value = "";
  refs.historyReasonFilter.value = "";
  refs.historyDateFrom.value = "";
  refs.historyDateTo.value = "";
  state.historyFilters = {
    itemId: "",
    userEmail: "",
    reason: "",
    dateFrom: "",
    dateTo: "",
  };
}

function renderHistory(list = state.historyFiltered) {
  refs.historyList.innerHTML = "";
  if (!list.length) {
    refs.historyList.innerHTML = '<p class="muted">История пока пустая.</p>';
    return;
  }

  for (const row of list) {
    const item = state.items.find((it) => it.id === row.item_id);
    const itemName = item?.name || row.item_id || "Без названия";
    const block = document.createElement("article");
    block.className = "history-item";
    block.innerHTML = `
      <div><strong>${itemName}</strong> <span class="history-reason">${reasonLabel(row.reason)}</span></div>
      <div class="history-meta">ID: ${row.item_id || "-"} • Изменение: ${Number(row.delta || 0)}</div>
      <div class="history-meta">Пользователь: ${row.user_email || "-"}</div>
      <div class="history-meta">${formatHistoryDate(row.created_at)}</div>
    `;
    refs.historyList.appendChild(block);
  }
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

function exportHistoryCsv() {
  const rows = state.historyFiltered.length ? state.historyFiltered : state.history;
  if (!rows.length) {
    showToast("Нет данных для экспорта");
    return;
  }

  const headers = ["item_id", "reason", "delta", "user_email", "created_at"];
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `polotno-history-${stamp}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showToast("CSV экспортирован");
  hapticSuccess();
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
  } catch {
    state.items = [...seedItems];
    showToast("API недоступен, демо-режим");
  }

  renderTable();
  renderAlerts();
}

function pushLocalHistory(entry) {
  state.history.unshift(entry);
  if (state.history.length > 200) {
    state.history.length = 200;
  }
  applyHistoryFilters(state.history);
  if (state.inventoryTab === "history") {
    renderHistory();
  }
}

async function loadHistory() {
  setHistoryFiltersFromInputs();
  if (!state.token) {
    applyHistoryFilters(state.history);
    renderHistory();
    return;
  }

  try {
    const data = await apiRequest(`/api/inventory/history?${historyQueryString()}`);
    state.history = data.movements || [];
  } catch {
    showToast("Не удалось загрузить историю");
  }

  applyHistoryFilters(state.history);
  renderHistory();
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

async function saveItem(item) {
  const hasId = Boolean(item.id);
  if (!state.token) {
    if (hasId) {
      const index = state.items.findIndex((it) => it.id === item.id);
      if (index !== -1) {
        state.items[index] = { ...state.items[index], ...item };
        pushLocalHistory({
          item_id: item.id,
          delta: 0,
          reason: "update",
          user_email: state.user?.email || "local",
          created_at: new Date().toISOString(),
        });
      }
    } else {
      const next = state.items.length + 1;
      const newId = `SUP-${String(next).padStart(3, "0")}`;
      state.items.unshift({ id: newId, ...item });
      pushLocalHistory({
        item_id: newId,
        delta: 0,
        reason: "create",
        user_email: state.user?.email || "local",
        created_at: new Date().toISOString(),
      });
    }
    renderTable();
    renderAlerts();
    return;
  }

  await apiRequest("/api/inventory/upsert", { method: "POST", body: item });
  await loadItems();
  await loadHistory();
}

async function consumeOne(id) {
  const item = state.items.find((it) => it.id === id);
  if (!item) return;

  if (!state.token) {
    if (item.qty > 0) item.qty -= 1;
    pushLocalHistory({
      item_id: id,
      delta: -1,
      reason: "consume",
      user_email: state.user?.email || "local",
      created_at: new Date().toISOString(),
    });
    renderTable();
    renderAlerts();
    return;
  }

  await apiRequest("/api/inventory/consume", {
    method: "POST",
    body: { id, amount: 1 },
  });
  await loadItems();
  await loadHistory();
}

async function checkLowStock() {
  if (!state.token) {
    const low = state.items.filter((item) => Number(item.qty) <= Number(item.threshold));
    renderAlerts(low);
    showToast(low.length ? "Есть позиции для уведомления" : "Низких остатков нет");
    return low;
  }

  const data = await apiRequest("/api/alerts/low-stock");
  const low = data.items || [];
  renderAlerts(low);
  showToast(low.length ? "Есть позиции для уведомления" : "Низких остатков нет");
  return low;
}

async function notifyLowStock() {
  if (!state.token) {
    showToast("Для уведомлений нужен вход");
    return;
  }

  const result = await apiRequest("/api/alerts/notify", { method: "POST" });
  showToast(result.sent ? `Отправлено в личку: ${result.sent}` : "Низких остатков нет");
}

async function startScanner() {
  if (!navigator.mediaDevices?.getUserMedia) {
    refs.scanStatus.textContent = "Камера недоступна в этом браузере.";
    hapticWarning();
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
        "BarcodeDetector не поддерживается. Для iOS подключим Telegram-сканер на следующем шаге.";
      hapticWarning();
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
        hapticSuccess();
      } catch {
        // frame-level errors are ignored
      }
    }, 900);
  } catch {
    refs.scanStatus.textContent = "Нет доступа к камере.";
    hapticWarning();
  }
}

function stopScanner() {
  refs.scanStatus.textContent = "Наведите камеру на QR-код расходника.";

  if (state.scanTimer) {
    clearInterval(state.scanTimer);
    state.scanTimer = null;
  }

  if (state.stream) {
    state.stream.getTracks().forEach((track) => track.stop());
    state.stream = null;
  }

  refs.scannerVideo.srcObject = null;
}

refs.openAuthBtn.addEventListener("click", () => {
  hapticSelection();
  if (state.user?.email) {
    localStorage.removeItem("sf_token");
    localStorage.removeItem("sf_user");
    state.token = "";
    state.user = null;
    updateAuthButton();
    applyRoleAccess();
    loadItems();
    loadHistory();
    showToast("Вы вышли из аккаунта");
    hapticSuccess();
    return;
  }

  openAuthModal();
});

refs.closeAuthBtn.addEventListener("click", closeAuthModal);
refs.authBackdrop.addEventListener("click", closeAuthModal);
refs.loginTab.addEventListener("click", () => setAuthTab("login"));
refs.registerTab.addEventListener("click", () => setAuthTab("register"));

refs.openInventoryTile.addEventListener("click", () => {
  setModuleView("inventory");
  setInventoryTab("main");
  setTimeout(() => refs.searchInput.focus(), 120);
});
refs.homeBtn.addEventListener("click", () => setModuleView("home"));
refs.mainTabBtn.addEventListener("click", () => setInventoryTab("main"));
refs.toolsTabBtn.addEventListener("click", () => setInventoryTab("tools"));
refs.historyTabBtn.addEventListener("click", () => setInventoryTab("history"));
refs.toToolsBtn.addEventListener("click", () => setInventoryTab("tools"));
refs.closeOnboardingBtn.addEventListener("click", closeOnboarding);

refs.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!refs.loginForm.reportValidity()) return;

  const form = new FormData(refs.loginForm);

  try {
    const data = await apiRequest("/api/auth/login", {
      method: "POST",
      auth: false,
      body: {
        email: String(form.get("email") || "").trim(),
        password: String(form.get("password") || ""),
      },
    });

    state.token = data.token;
    state.user = data.user;
    localStorage.setItem("sf_token", data.token);
    localStorage.setItem("sf_user", JSON.stringify(data.user));

    updateAuthButton();
    applyRoleAccess();
    closeAuthModal();
    await loadItems();
    await loadHistory();
    showToast("Вход успешен");
    hapticSuccess();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});

refs.registerForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!refs.registerForm.reportValidity()) return;

  const form = new FormData(refs.registerForm);

  try {
    await apiRequest("/api/auth/create-user", {
      method: "POST",
      body: {
        name: String(form.get("name") || "").trim(),
        email: String(form.get("email") || "").trim(),
        password: String(form.get("password") || ""),
        adminKey: String(form.get("adminKey") || ""),
        telegramChatId: String(form.get("telegramChatId") || "").trim(),
      },
    });

    showToast("Аккаунт создан админом");
    refs.registerForm.reset();
    setAuthTab("login");
    hapticSuccess();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});

refs.stockForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!refs.stockForm.reportValidity()) return;

  try {
    await saveItem({
      name: refs.itemName.value.trim(),
      qty: Number(refs.itemQty.value),
      threshold: Number(refs.itemThreshold.value),
      notes: refs.itemNotes.value.trim(),
    });

    refs.stockForm.reset();
    showToast("Расходник сохранен");
    hapticSuccess();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});

refs.itemsTableBody.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const action = target.getAttribute("data-action");
  const id = target.getAttribute("data-id");
  if (!action || !id) return;

  try {
    if (action === "consume") {
      await consumeOne(id);
      return;
    }

    if (action === "print") {
      const item = state.items.find((it) => it.id === id);
      if (item) await printLabels([item]);
    }

    if (action === "edit") {
      const item = state.items.find((it) => it.id === id);
      if (item) {
        openEditModal(item);
        hapticSelection();
      }
    }
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});

refs.editItemForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!refs.editItemForm.reportValidity() || !state.editingItemId) return;

  try {
    await saveItem({
      id: state.editingItemId,
      name: refs.editItemName.value.trim(),
      qty: Number(refs.editItemQty.value),
      threshold: Number(refs.editItemThreshold.value),
      notes: refs.editItemNotes.value.trim(),
    });
    closeEditModal();
    showToast("Изменения сохранены");
    hapticSuccess();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});

refs.closeEditBtn.addEventListener("click", closeEditModal);
refs.editBackdrop.addEventListener("click", closeEditModal);

refs.searchBtn.addEventListener("click", handleSearch);
refs.searchInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    handleSearch();
  }
});

refs.checkAlertsBtn.addEventListener("click", async () => {
  try {
    await checkLowStock();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});

refs.notifyAlertsBtn.addEventListener("click", async () => {
  try {
    await notifyLowStock();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});

refs.printAllBtn.addEventListener("click", async () => {
  try {
    await printLabels(state.items);
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});

refs.historyApplyBtn.addEventListener("click", async () => {
  hapticSelection();
  await loadHistory();
});

refs.historyResetBtn.addEventListener("click", async () => {
  resetHistoryFilters();
  hapticSelection();
  await loadHistory();
});

refs.historyExportBtn.addEventListener("click", exportHistoryCsv);

[refs.historyItemFilter, refs.historyUserFilter].forEach((input) => {
  input.addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      await loadHistory();
    }
  });
});

[refs.historyReasonFilter, refs.historyDateFrom, refs.historyDateTo].forEach((input) => {
  input.addEventListener("change", async () => {
    await loadHistory();
  });
});

refs.startScannerBtn.addEventListener("click", startScanner);
refs.stopScannerBtn.addEventListener("click", () => {
  stopScanner();
  hapticSelection();
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAuthModal();
    closeEditModal();
    stopScanner();
  }
});

setAuthTab("login");
setModuleView("home");
setInventoryTab("main");
updateAuthButton();
applyRoleAccess();
loadItems();
loadHistory();
initTelegram();

if (!localStorage.getItem(ONBOARDING_KEY)) {
  openOnboarding();
}
