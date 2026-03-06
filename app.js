const state = {
  authTab: "login",
  moduleView: "home",
  inventoryTab: "main",
  token: localStorage.getItem("sf_token") || "",
  user: safeParse(localStorage.getItem("sf_user")) || null,
  items: [],
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
  scanRaf: null,
  scanBusy: false,
  lastScanValue: "",
  lastScanAt: 0,
  editingItemId: "",
  desktopPrint: true,
  loadingDepth: 0,
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
  roleHint: document.getElementById("roleHint"),
  historyItemFilter: document.getElementById("historyItemFilter"),
  historyUserFilter: document.getElementById("historyUserFilter"),
  historyReasonFilter: document.getElementById("historyReasonFilter"),
  historyDateFrom: document.getElementById("historyDateFrom"),
  historyDateTo: document.getElementById("historyDateTo"),
  historyApplyBtn: document.getElementById("historyApplyBtn"),
  historyResetBtn: document.getElementById("historyResetBtn"),
  historyExportBtn: document.getElementById("historyExportBtn"),
  toToolsBtn: document.getElementById("toToolsBtn"),
  stockManagePanel: document.getElementById("stockManagePanel"),
  adjustPanel: document.getElementById("adjustPanel"),
  adjustForm: document.getElementById("adjustForm"),
  adjustItemId: document.getElementById("adjustItemId"),
  adjustDelta: document.getElementById("adjustDelta"),
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
  scannerCanvas: document.getElementById("scannerCanvas"),
  scanStatus: document.getElementById("scanStatus"),
  scanModal: document.getElementById("scanModal"),
  scanModalBackdrop: document.getElementById("scanModalBackdrop"),
  closeScanModalBtn: document.getElementById("closeScanModalBtn"),
  modalScannerVideo: document.getElementById("modalScannerVideo"),
  modalScannerCanvas: document.getElementById("modalScannerCanvas"),
  modalScanStatus: document.getElementById("modalScanStatus"),
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
  loadingOverlay: document.getElementById("loadingOverlay"),
  loadingText: document.getElementById("loadingText"),
  mobileScanFab: document.getElementById("mobileScanFab"),
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

function setLoadingOverlay(visible, message = "Загрузка...") {
  if (!refs.loadingOverlay || !refs.loadingText) return;
  refs.loadingOverlay.hidden = !visible;
  refs.loadingText.textContent = message;
}

function setButtonLoading(button, isLoading) {
  if (!(button instanceof HTMLButtonElement)) return;
  button.classList.toggle("is-loading", isLoading);
  button.disabled = isLoading;
}

async function runDbAction(task, options = {}) {
  const { button = null, message = "Сохраняем данные..." } = options;
  state.loadingDepth += 1;
  setLoadingOverlay(true, message);
  setButtonLoading(button, true);

  try {
    return await task();
  } finally {
    setButtonLoading(button, false);
    state.loadingDepth = Math.max(0, state.loadingDepth - 1);
    if (state.loadingDepth === 0) {
      setLoadingOverlay(false, message);
    }
  }
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
  updateMobileScanFab();
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
  updateMobileScanFab();
  hapticSelection();
}

function updateAuthButton() {
  if (state.user?.email) {
    const role = String(state.user.role || "staff").toLowerCase();
    refs.openAuthBtn.innerHTML = `${iconSpan("user")}<span>${state.user.email} • ${role}</span>`;
    refs.openAuthBtn.classList.remove("primary-btn");
    refs.openAuthBtn.classList.add("glass-btn");
    return;
  }

  refs.openAuthBtn.innerHTML = `${iconSpan("lock")}<span>Войти</span>`;
  refs.openAuthBtn.classList.remove("glass-btn");
  refs.openAuthBtn.classList.add("primary-btn");
}

function canAdmin() {
  if (!state.user) return true;
  return String(state.user.role || "staff").toLowerCase() === "admin";
}

function detectDesktopPrint() {
  const ua = navigator.userAgent || "";
  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
  const viewport = Math.min(window.innerWidth || 0, window.screen?.width || Infinity);
  const touch = Number(navigator.maxTouchPoints || 0) > 1;
  return !(isMobileUA || viewport < 980 || (touch && viewport < 1200));
}

function canDesktopPrint() {
  return state.desktopPrint;
}

function iconSpan(name) {
  return `<span class="btn-icon" aria-hidden="true"><svg><use href="#i-${name}"></use></svg></span>`;
}

function updateMobileScanFab() {
  if (!refs.mobileScanFab) return;
  if ((refs.scanModal && !refs.scanModal.hidden) || (refs.onboarding && !refs.onboarding.hidden)) {
    refs.mobileScanFab.hidden = true;
    return;
  }
  refs.mobileScanFab.hidden = false;
  const scanning = Boolean(state.stream);
  refs.mobileScanFab.classList.toggle("is-active", scanning);
  refs.mobileScanFab.setAttribute("aria-label", scanning ? "Остановить сканер" : "Сканировать QR");
  refs.mobileScanFab.title = scanning ? "Остановить сканер" : "Сканировать QR";
  refs.mobileScanFab.innerHTML = scanning ? iconSpan("stop") : iconSpan("camera");
}

function getActiveScannerRefs() {
  const useModal = Boolean(refs.scanModal && !refs.scanModal.hidden);
  if (useModal) {
    return {
      video: refs.modalScannerVideo,
      canvas: refs.modalScannerCanvas,
      status: refs.modalScanStatus,
    };
  }
  return {
    video: refs.scannerVideo,
    canvas: refs.scannerCanvas,
    status: refs.scanStatus,
  };
}

function setScanStatus(text, options = {}) {
  const { busy = false, refsOverride = null } = options;
  const target = refsOverride || getActiveScannerRefs();
  if (!target.status) return;
  target.status.textContent = text;
  target.status.classList.toggle("is-busy", busy);
}

function openScanModal() {
  if (!refs.scanModal) return;
  refs.scanModal.hidden = false;
  document.body.style.overflow = "hidden";
  updateMobileScanFab();
}

function closeScanModal() {
  if (!refs.scanModal) return;
  stopScanner();
  refs.scanModal.hidden = true;
  document.body.style.overflow = "";
  updateMobileScanFab();
}

function applyPrintAccess() {
  state.desktopPrint = detectDesktopPrint();

  refs.printAllBtn.disabled = !state.desktopPrint;
  refs.printAllBtn.classList.toggle("is-hidden", !state.desktopPrint);
  refs.printAllBtn.title = state.desktopPrint ? "" : "Печать доступна только на ПК";
}

function applyRoleAccess() {
  const canManageUsers = canAdmin();
  refs.registerTab.classList.toggle("is-hidden", !canManageUsers);
  refs.authTabs.classList.toggle("admin-disabled", !canManageUsers);
  refs.adjustPanel.classList.toggle("is-hidden", !canManageUsers);

  refs.stockManagePanel.classList.toggle("is-hidden", !canManageUsers);
  refs.itemName.disabled = !canManageUsers;
  refs.itemQty.disabled = !canManageUsers;
  refs.itemThreshold.disabled = !canManageUsers;
  refs.itemNotes.disabled = !canManageUsers;

  if (!canManageUsers && state.authTab === "register") {
    setAuthTab("login");
  }

  if (!state.user) {
    refs.roleHint.classList.add("is-hidden");
    refs.roleHint.textContent = "";
    return;
  }

  if (canManageUsers) {
    refs.roleHint.classList.add("is-hidden");
    refs.roleHint.textContent = "";
    return;
  }

  refs.roleHint.classList.remove("is-hidden");
  refs.roleHint.textContent =
    "Роль: staff. Доступны просмотр, история и списание (-1). Функции администратора (создание, редактирование, удаление, корректировка) скрыты.";
}

function openOnboarding() {
  refs.onboarding.hidden = false;
  updateMobileScanFab();
  hapticSelection();
}

function closeOnboarding() {
  refs.onboarding.hidden = true;
  updateMobileScanFab();
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

function qrFallbackUrl(text, size = 220) {
  const encoded = encodeURIComponent(text);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=0&data=${encoded}`;
}

async function qrImageSrc(text, size = 220) {
  if (window.QRCode?.toDataURL) {
    try {
      return await window.QRCode.toDataURL(text, {
        width: size,
        margin: 1,
        color: { dark: "#0f172a", light: "#ffffff" },
      });
    } catch {
      // fallback to remote generator
    }
  }
  return qrFallbackUrl(text, size);
}

async function printLabels(items) {
  if (!canDesktopPrint()) {
    showToast("Печать этикеток доступна только на ПК");
    hapticWarning();
    return;
  }

  const wnd = window.open("", "_blank", "width=900,height=700");
  if (!wnd) {
    showToast("Разрешите popup для печати этикеток");
    return;
  }

  const cards = [];
  for (const item of items) {
    const src = await qrImageSrc(itemPayload(item), 210);
    cards.push({ item, src });
  }

  const html = `
    <html>
      <head>
        <title>QR Этикетки</title>
        <style>
          @page { size: 58mm 40mm; margin: 0; }
          * { box-sizing: border-box; }
          html, body { width: 58mm; height: 40mm; margin: 0; padding: 0; }
          body { font-family: -apple-system, Segoe UI, sans-serif; color: #111827; background: #fff; }
          .sheet { display: block; }
          .label {
            width: 58mm;
            height: 40mm;
            border: 0.2mm solid #d5dceb;
            border-radius: 0;
            padding: 2.2mm;
            display: grid;
            grid-template-columns: 22mm 1fr;
            align-items: center;
            gap: 2mm;
            break-inside: avoid;
            page-break-inside: avoid;
            page-break-after: always;
          }
          .label:last-child { page-break-after: auto; }
          .label img {
            width: 21mm;
            height: 21mm;
            object-fit: contain;
            display: block;
          }
          .meta { min-width: 0; }
          .name {
            font-size: 3.6mm;
            font-weight: 700;
            line-height: 1.12;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
          .id {
            margin-top: 1.4mm;
            font-size: 2.7mm;
            color: #4f5f7f;
            word-break: break-word;
          }
          .helper {
            margin-top: 1mm;
            font-size: 2.4mm;
            color: #7a8395;
          }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="sheet">
          ${cards
            .map(
              ({ item, src }) =>
                `<section class="label"><img src="${src}" alt="${item.id}" /><div class="meta"><div class="name">${item.name}</div><div class="id">${item.id}</div><div class="helper">58x40 мм</div></div></section>`
            )
            .join("")}
        </div>
      </body>
    </html>
  `;

  wnd.document.open();
  wnd.document.write(html);
  wnd.document.close();
  wnd.focus();
  setTimeout(() => {
    wnd.print();
    wnd.onafterprint = () => wnd.close();
  }, 260);
}

function renderTable(list = state.items) {
  applyPrintAccess();
  refs.itemsTableBody.innerHTML = "";

  if (!list.length) {
    const emptyMessage = state.token
      ? "Ничего не найдено. Добавьте новый расходник."
      : "Для загрузки каталога выполните вход в систему.";
    refs.itemsTableBody.innerHTML = `<tr><td colspan="5" class="muted">${emptyMessage}</td></tr>`;
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
          <button class="secondary-btn btn-with-icon ${canDesktopPrint() ? "" : "is-hidden"}" data-action="print" data-id="${item.id}" type="button">${iconSpan("print")}<span>Печать QR</span></button>
          <button class="secondary-btn btn-with-icon ${canAdmin() ? "" : "is-hidden"}" data-action="plus-one" data-id="${item.id}" type="button">${iconSpan("plus")}<span>+1</span></button>
          <button class="secondary-btn btn-with-icon ${canAdmin() ? "" : "is-hidden"}" data-action="edit" data-id="${item.id}" type="button">${iconSpan("edit")}<span>Редактировать</span></button>
          <button class="glass-btn btn-with-icon ${canAdmin() ? "" : "is-hidden"}" data-action="delete" data-id="${item.id}" type="button">${iconSpan("trash")}<span>Удалить</span></button>
          <button class="glass-btn btn-with-icon" data-action="consume" data-id="${item.id}" type="button">${iconSpan("minus")}<span>-1</span></button>
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
  if (reason === "adjust") return "Корректировка";
  if (reason === "delete") return "Удаление";
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

async function copyTextToClipboard(text) {
  if (!navigator.clipboard?.writeText) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

async function downloadCsvWithFallback(fileName, csvText) {
  if ("showSaveFilePicker" in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{ description: "CSV File", accept: { "text/csv": [".csv"] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(csvText);
      await writable.close();
      return true;
    } catch {
      // continue fallback chain
    }
  }

  try {
    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    return true;
  } catch {
    // continue fallback chain
  }

  try {
    const dataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csvText)}`;
    const popup = window.open(dataUri, "_blank");
    if (popup) return true;
  } catch {
    // continue fallback chain
  }

  const copied = await copyTextToClipboard(csvText);
  return copied;
}

async function exportHistoryCsv() {
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

  const stamp = new Date().toISOString().slice(0, 10);
  const fileName = `polotno-history-${stamp}.csv`;
  const ok = await downloadCsvWithFallback(fileName, csv);

  if (ok) {
    showToast("Экспорт готов");
    hapticSuccess();
    return;
  }

  showToast("Экспорт ограничен в этом браузере");
  hapticWarning();
}

async function loadItems() {
  if (!state.token) {
    state.items = [];
    renderTable();
    renderAlerts();
    refreshAdjustItemOptions();
    return;
  }

  try {
    const data = await apiRequest("/api/inventory/list");
    state.items = data.items || [];
  } catch {
    state.items = [];
    showToast("Не удалось загрузить расходники");
  }

  renderTable();
  renderAlerts();
  refreshAdjustItemOptions();
}

function refreshAdjustItemOptions() {
  if (!refs.adjustItemId) return;
  refs.adjustItemId.innerHTML = "";
  if (!state.items.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Нет расходников";
    refs.adjustItemId.appendChild(option);
    return;
  }

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Выберите расходник";
  refs.adjustItemId.appendChild(placeholder);

  for (const item of state.items) {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = `${item.id} — ${item.name}`;
    refs.adjustItemId.appendChild(option);
  }
}

async function loadHistory() {
  setHistoryFiltersFromInputs();
  if (!state.token) {
    state.history = [];
    state.historyFiltered = [];
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
  if (!state.token) {
    throw new Error("Требуется вход в систему");
  }

  await apiRequest("/api/inventory/upsert", { method: "POST", body: item });
  await loadItems();
  await loadHistory();
}

async function consumeOne(id) {
  const item = state.items.find((it) => it.id === id);
  if (!item) return;

  if (!state.token) {
    throw new Error("Требуется вход в систему");
  }

  await apiRequest("/api/inventory/consume", {
    method: "POST",
    body: { id, amount: 1 },
  });
  await loadItems();
  await loadHistory();
}

async function adjustItem(id, delta) {
  if (!Number.isFinite(delta) || delta === 0) return;

  if (!state.token) {
    throw new Error("Требуется вход в систему");
  }

  await apiRequest("/api/inventory/adjust", {
    method: "POST",
    body: { id, delta },
  });
  await loadItems();
  await loadHistory();
}

async function deleteItem(id) {
  if (!id) return;

  if (!state.token) {
    throw new Error("Требуется вход в систему");
  }

  await apiRequest("/api/inventory/delete", {
    method: "POST",
    body: { id },
  });
  await loadItems();
  await loadHistory();
}

async function checkLowStock() {
  if (!state.token) {
    throw new Error("Требуется вход в систему");
  }

  const data = await apiRequest("/api/alerts/low-stock");
  const low = data.items || [];
  renderAlerts(low);
  showToast(low.length ? "Есть позиции для уведомления" : "Низких остатков нет");
  return low;
}

async function notifyLowStock() {
  if (!state.token) {
    throw new Error("Требуется вход в систему");
  }

  const result = await apiRequest("/api/alerts/notify", { method: "POST" });
  showToast(result.sent ? `Отправлено в личку: ${result.sent}` : "Низких остатков нет");
}

function extractItemIdFromScan(rawValue) {
  const text = String(rawValue || "").trim();
  if (!text) return "";

  try {
    const obj = JSON.parse(text);
    if (obj && typeof obj.id === "string") {
      return obj.id.trim();
    }
  } catch {
    // not json, keep parsing as text
  }

  const match = text.match(/SUP-\d{3,}/i);
  return match ? match[0].toUpperCase() : text.toUpperCase();
}

async function processScanValue(rawValue) {
  const now = Date.now();
  if (rawValue === state.lastScanValue && now - state.lastScanAt < 1600) {
    return;
  }
  state.lastScanValue = rawValue;
  state.lastScanAt = now;

  const id = extractItemIdFromScan(rawValue);
  const item = state.items.find((it) => String(it.id).toUpperCase() === id);
  if (!item) {
    setScanStatus("QR считан, но расходник не найден.");
    hapticWarning();
    return;
  }

  setScanStatus("QR найден. Обрабатываем списание...", { busy: true });
  await consumeOne(item.id);
  setScanStatus(`Списано 1 шт: ${item.name}`, { busy: false });
  showToast(`Сканировано: ${item.name} (-1)`);
  hapticSuccess();
}

function stopScanLoops() {
  if (state.scanTimer) {
    clearInterval(state.scanTimer);
    state.scanTimer = null;
  }
  if (state.scanRaf) {
    cancelAnimationFrame(state.scanRaf);
    state.scanRaf = null;
  }
  state.scanBusy = false;
}

async function startScanner() {
  const active = getActiveScannerRefs();
  if (!navigator.mediaDevices?.getUserMedia) {
    setScanStatus("Камера недоступна в этом браузере.", { refsOverride: active });
    hapticWarning();
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });

    state.stream = stream;
    if (!active.video) {
      throw new Error("Видео-элемент сканера не найден");
    }
    active.video.srcObject = stream;
    await active.video.play();
    stopScanLoops();

    if ("BarcodeDetector" in window) {
      const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      setScanStatus("Сканирование запущено...", { refsOverride: active });

      state.scanTimer = window.setInterval(async () => {
        if (state.scanBusy) return;
        state.scanBusy = true;
        try {
          const codes = await detector.detect(active.video);
          if (codes.length) {
            const value = String(codes[0].rawValue || "");
            await processScanValue(value);
          }
        } catch {
          // frame-level errors are ignored
        } finally {
          state.scanBusy = false;
        }
      }, 380);
      updateMobileScanFab();
      return;
    }

    if (typeof window.jsQR !== "function") {
      setScanStatus("Сканер недоступен: отсутствует библиотека jsQR.", { refsOverride: active });
      stopScanner();
      hapticWarning();
      return;
    }

    setScanStatus("Сканирование запущено (jsQR)...", { refsOverride: active });
    const canvas = active.canvas;
    if (!canvas) {
      setScanStatus("Сканер недоступен: не найден canvas-элемент.", { refsOverride: active });
      stopScanner();
      hapticWarning();
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      setScanStatus("Сканер недоступен: не удалось инициализировать canvas.", { refsOverride: active });
      stopScanner();
      hapticWarning();
      return;
    }

    const scanFrame = async () => {
      if (!state.stream) return;

      const vw = active.video.videoWidth;
      const vh = active.video.videoHeight;
      if (vw && vh) {
        canvas.width = vw;
        canvas.height = vh;
        ctx.drawImage(active.video, 0, 0, vw, vh);
        const imageData = ctx.getImageData(0, 0, vw, vh);
        const code = window.jsQR(imageData.data, vw, vh, { inversionAttempts: "dontInvert" });
        if (code?.data) {
          await processScanValue(code.data);
        }
      }

      state.scanRaf = requestAnimationFrame(scanFrame);
    };

    state.scanRaf = requestAnimationFrame(scanFrame);
    updateMobileScanFab();
  } catch {
    setScanStatus("Нет доступа к камере.", { refsOverride: active });
    updateMobileScanFab();
    hapticWarning();
  }
}

function stopScanner() {
  setScanStatus("Наведите камеру на QR-код расходника.");
  if (refs.modalScanStatus) {
    refs.modalScanStatus.textContent = "Наведите камеру на QR-код расходника.";
    refs.modalScanStatus.classList.remove("is-busy");
  }
  stopScanLoops();

  if (state.stream) {
    state.stream.getTracks().forEach((track) => track.stop());
    state.stream = null;
  }

  if (refs.scannerVideo) refs.scannerVideo.srcObject = null;
  if (refs.modalScannerVideo) refs.modalScannerVideo.srcObject = null;
  updateMobileScanFab();
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
  const submitBtn = event.submitter instanceof HTMLButtonElement ? event.submitter : null;

  try {
    const data = await runDbAction(
      () =>
        apiRequest("/api/auth/login", {
          method: "POST",
          auth: false,
          body: {
            email: String(form.get("email") || "").trim(),
            password: String(form.get("password") || ""),
          },
        }),
      { button: submitBtn, message: "Проверяем вход..." }
    );

    state.token = data.token;
    state.user = data.user;
    localStorage.setItem("sf_token", data.token);
    localStorage.setItem("sf_user", JSON.stringify(data.user));

    updateAuthButton();
    applyRoleAccess();
    closeAuthModal();
    await runDbAction(
      async () => {
        await loadItems();
        await loadHistory();
      },
      { message: "Загружаем данные аккаунта..." }
    );
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
  const submitBtn = event.submitter instanceof HTMLButtonElement ? event.submitter : null;

  try {
    await runDbAction(
      () =>
        apiRequest("/api/auth/create-user", {
          method: "POST",
          body: {
            name: String(form.get("name") || "").trim(),
            email: String(form.get("email") || "").trim(),
            password: String(form.get("password") || ""),
            adminKey: String(form.get("adminKey") || ""),
            telegramChatId: String(form.get("telegramChatId") || "").trim(),
            role: String(form.get("role") || "staff"),
          },
        }),
      { button: submitBtn, message: "Создаём аккаунт..." }
    );

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
  const submitBtn = event.submitter instanceof HTMLButtonElement ? event.submitter : null;

  try {
    await runDbAction(
      () =>
        saveItem({
          name: refs.itemName.value.trim(),
          qty: Number(refs.itemQty.value),
          threshold: Number(refs.itemThreshold.value),
          notes: refs.itemNotes.value.trim(),
        }),
      { button: submitBtn, message: "Сохраняем расходник..." }
    );

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
  const button = target.closest("button[data-action][data-id]");
  if (!(button instanceof HTMLButtonElement)) return;

  const action = button.getAttribute("data-action");
  const id = button.getAttribute("data-id");
  if (!action || !id) return;

  try {
    if (action === "consume") {
      await runDbAction(() => consumeOne(id), { button, message: "Списываем расходник..." });
      return;
    }

    if (action === "plus-one") {
      await runDbAction(() => adjustItem(id, 1), { button, message: "Обновляем количество..." });
      showToast("Добавлено +1");
      hapticSuccess();
      return;
    }

    if (action === "print") {
      const item = state.items.find((it) => it.id === id);
      if (item) await printLabels([item]);
    }

    if (action === "edit") {
      if (!canAdmin()) {
        showToast("Только для администратора");
        hapticWarning();
        return;
      }
      const item = state.items.find((it) => it.id === id);
      if (item) {
        openEditModal(item);
        hapticSelection();
      }
    }

    if (action === "delete") {
      if (!canAdmin()) {
        showToast("Только для администратора");
        hapticWarning();
        return;
      }
      const ok = window.confirm(`Удалить расходник ${id}?`);
      if (!ok) return;
      await runDbAction(() => deleteItem(id), { button, message: "Удаляем расходник..." });
      showToast("Расходник удален");
      hapticSuccess();
    }
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});

refs.editItemForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!refs.editItemForm.reportValidity() || !state.editingItemId) return;
  const submitBtn = event.submitter instanceof HTMLButtonElement ? event.submitter : null;

  try {
    await runDbAction(
      () =>
        saveItem({
          id: state.editingItemId,
          name: refs.editItemName.value.trim(),
          qty: Number(refs.editItemQty.value),
          threshold: Number(refs.editItemThreshold.value),
          notes: refs.editItemNotes.value.trim(),
        }),
      { button: submitBtn, message: "Сохраняем изменения..." }
    );
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
    await runDbAction(() => checkLowStock(), {
      button: refs.checkAlertsBtn,
      message: "Проверяем лимиты...",
    });
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});

refs.notifyAlertsBtn.addEventListener("click", async () => {
  try {
    await runDbAction(() => notifyLowStock(), {
      button: refs.notifyAlertsBtn,
      message: "Отправляем уведомления...",
    });
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

refs.adjustForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!canAdmin()) {
    showToast("Только для администратора");
    hapticWarning();
    return;
  }

  const id = String(refs.adjustItemId.value || "").trim();
  const delta = Number(refs.adjustDelta.value || 0);
  if (!id || !Number.isFinite(delta) || delta === 0) {
    showToast("Заполните расходник и изменение (+/-)");
    hapticWarning();
    return;
  }

  try {
    const submitBtn = event.submitter instanceof HTMLButtonElement ? event.submitter : null;
    await runDbAction(() => adjustItem(id, delta), {
      button: submitBtn,
      message: "Применяем корректировку...",
    });
    refs.adjustDelta.value = "";
    showToast("Корректировка применена");
    hapticSuccess();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});

refs.historyApplyBtn.addEventListener("click", async () => {
  hapticSelection();
  await runDbAction(() => loadHistory(), {
    button: refs.historyApplyBtn,
    message: "Загружаем историю...",
  });
});

refs.historyResetBtn.addEventListener("click", async () => {
  resetHistoryFilters();
  hapticSelection();
  await runDbAction(() => loadHistory(), {
    button: refs.historyResetBtn,
    message: "Сбрасываем и загружаем историю...",
  });
});

refs.historyExportBtn.addEventListener("click", exportHistoryCsv);

[refs.historyItemFilter, refs.historyUserFilter].forEach((input) => {
  input.addEventListener("keydown", async (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      await runDbAction(() => loadHistory(), {
        message: "Загружаем историю...",
      });
    }
  });
});

[refs.historyReasonFilter, refs.historyDateFrom, refs.historyDateTo].forEach((input) => {
  input.addEventListener("change", async () => {
    await runDbAction(() => loadHistory(), {
      message: "Обновляем историю...",
    });
  });
});

refs.startScannerBtn.addEventListener("click", startScanner);
refs.stopScannerBtn.addEventListener("click", () => {
  stopScanner();
  hapticSelection();
});

if (refs.closeScanModalBtn) refs.closeScanModalBtn.addEventListener("click", closeScanModal);
if (refs.scanModalBackdrop) refs.scanModalBackdrop.addEventListener("click", closeScanModal);

if (refs.mobileScanFab) {
  refs.mobileScanFab.addEventListener("click", async () => {
    if (state.stream) {
      closeScanModal();
      hapticSelection();
      return;
    }

    openScanModal();
    await startScanner();
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAuthModal();
    closeEditModal();
    closeScanModal();
    stopScanner();
  }
});

window.addEventListener("resize", () => {
  applyPrintAccess();
  renderTable();
});

setAuthTab("login");
setModuleView("home");
setInventoryTab("main");
updateAuthButton();
applyRoleAccess();
applyPrintAccess();
loadItems();
loadHistory();
initTelegram();
updateMobileScanFab();

if (!localStorage.getItem(ONBOARDING_KEY)) {
  openOnboarding();
}
