const state = {
  authTab: "login",
  moduleView: "home",
  inventoryTab: "main",
  scanContext: "inventory",
  profileLoaded: false,
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
  mainFilters: {
    search: "",
    group: "",
    stock: "",
  },
  stream: null,
  scanTimer: null,
  scanRaf: null,
  scanBusy: false,
  zxingReader: null,
  lastScanValue: "",
  lastScanAt: 0,
  editingItemId: "",
  desktopPrint: true,
  loadingDepth: 0,
  groups: [],
  adminUsers: [],
  adminHistory: [],
  films: [],
  filmsFilters: {
    search: "",
    barcode: "",
    cell: "",
  },
  filmsGroup: "with",
  scanFilmMatches: [],
  quickFilm: {
    cellNo: "",
    scannedBarcodes: [],
    manualNames: {},
  },
  homeProfilePhotoChatId: "",
  displayPrefs: {
    all: 10,
  },
  pages: {
    items: 1,
    history: 1,
    alerts: 1,
    films: 1,
    adminUsers: 1,
    adminHistory: 1,
  },
};

const ONBOARDING_KEY = "polotno_onboarding_seen_v1";
const DISPLAY_PREFS_KEY = "polotno_display_prefs_v1";

const refs = {
  openAuthBtn: document.getElementById("openAuthBtn"),
  accountMenu: document.getElementById("accountMenu"),
  openSettingsBtn: document.getElementById("openSettingsBtn"),
  requestLogoutBtn: document.getElementById("requestLogoutBtn"),
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
  settingsView: document.getElementById("settingsView"),
  openInventoryTile: document.getElementById("openInventoryTile"),
  openFilmsTile: document.getElementById("openFilmsTile"),
  homeProfileBtn: document.getElementById("homeProfileBtn"),
  homeAuthCaption: document.getElementById("homeAuthCaption"),
  homeAuthEmail: document.getElementById("homeAuthEmail"),
  homeProcessSearch: document.getElementById("homeProcessSearch"),
  homeProcessGrid: document.getElementById("homeProcessGrid"),
  homeScanBtn: document.getElementById("homeScanBtn"),
  homeBtn: document.getElementById("homeBtn"),
  mainTabBtn: document.getElementById("mainTabBtn"),
  filmsTabBtn: document.getElementById("filmsTabBtn"),
  toolsTabBtn: document.getElementById("toolsTabBtn"),
  historyTabBtn: document.getElementById("historyTabBtn"),
  mainTab: document.getElementById("mainTab"),
  filmsTab: document.getElementById("filmsTab"),
  toolsTab: document.getElementById("toolsTab"),
  historyTab: document.getElementById("historyTab"),
  historyList: document.getElementById("historyList"),
  historyPager: document.getElementById("historyPager"),
  settingsBackBtn: document.getElementById("settingsBackBtn"),
  settingsForm: document.getElementById("settingsForm"),
  settingsFirstName: document.getElementById("settingsFirstName"),
  settingsLastName: document.getElementById("settingsLastName"),
  settingsEmail: document.getElementById("settingsEmail"),
  settingsTelegramChatId: document.getElementById("settingsTelegramChatId"),
  settingsPassword: document.getElementById("settingsPassword"),
  settingsLowStockToggle: document.getElementById("settingsLowStockToggle"),
  openRemindersSettingsBtn: document.getElementById("openRemindersSettingsBtn"),
  openDisplaySettingsBtn: document.getElementById("openDisplaySettingsBtn"),
  settingsReminderInterval: document.getElementById("settingsReminderInterval"),
  settingsReminderItems: document.getElementById("settingsReminderItems"),
  settingsNotificationsSaveBtn: document.getElementById("settingsNotificationsSaveBtn"),
  remindersSettingsModal: document.getElementById("remindersSettingsModal"),
  remindersSettingsBackdrop: document.getElementById("remindersSettingsBackdrop"),
  closeRemindersSettingsBtn: document.getElementById("closeRemindersSettingsBtn"),
  displaySettingsForm: document.getElementById("displaySettingsForm"),
  displayAllLimit: document.getElementById("displayAllLimit"),
  saveDisplaySettingsBtn: document.getElementById("saveDisplaySettingsBtn"),
  displaySettingsModal: document.getElementById("displaySettingsModal"),
  displaySettingsBackdrop: document.getElementById("displaySettingsBackdrop"),
  closeDisplaySettingsBtn: document.getElementById("closeDisplaySettingsBtn"),
  adminPanel: document.getElementById("adminPanel"),
  adminUsersList: document.getElementById("adminUsersList"),
  adminUsersPager: document.getElementById("adminUsersPager"),
  adminHistoryUser: document.getElementById("adminHistoryUser"),
  adminHistoryLoadBtn: document.getElementById("adminHistoryLoadBtn"),
  adminHistoryList: document.getElementById("adminHistoryList"),
  adminHistoryPager: document.getElementById("adminHistoryPager"),
  adminAnnounceForm: document.getElementById("adminAnnounceForm"),
  adminAnnounceRole: document.getElementById("adminAnnounceRole"),
  adminAnnounceText: document.getElementById("adminAnnounceText"),
  roleHint: document.getElementById("roleHint"),
  historyItemFilter: document.getElementById("historyItemFilter"),
  historyUserFilter: document.getElementById("historyUserFilter"),
  historyReasonFilter: document.getElementById("historyReasonFilter"),
  historyDateFrom: document.getElementById("historyDateFrom"),
  historyDateTo: document.getElementById("historyDateTo"),
  historyApplyBtn: document.getElementById("historyApplyBtn"),
  historyResetBtn: document.getElementById("historyResetBtn"),
  historyExportBtn: document.getElementById("historyExportBtn"),
  mainGroupFilter: document.getElementById("mainGroupFilter"),
  mainStockFilter: document.getElementById("mainStockFilter"),
  applyMainFiltersBtn: document.getElementById("applyMainFiltersBtn"),
  resetMainFiltersBtn: document.getElementById("resetMainFiltersBtn"),
  exportInventoryBtn: document.getElementById("exportInventoryBtn"),
  importInventoryBtn: document.getElementById("importInventoryBtn"),
  exportInventorySheetBtn: document.getElementById("exportInventorySheetBtn"),
  importInventoryFile: document.getElementById("importInventoryFile"),
  filmsSearchInput: document.getElementById("filmsSearchInput"),
  filmsSearchBtn: document.getElementById("filmsSearchBtn"),
  filmsBarcodeFilter: document.getElementById("filmsBarcodeFilter"),
  filmsCellFilter: document.getElementById("filmsCellFilter"),
  applyFilmsFiltersBtn: document.getElementById("applyFilmsFiltersBtn"),
  resetFilmsFiltersBtn: document.getElementById("resetFilmsFiltersBtn"),
  downloadFilmsTemplateBtn: document.getElementById("downloadFilmsTemplateBtn"),
  importFilmsExcelBtn: document.getElementById("importFilmsExcelBtn"),
  importFilmsFile: document.getElementById("importFilmsFile"),
  filmForm: document.getElementById("filmForm"),
  filmName: document.getElementById("filmName"),
  filmBarcode: document.getElementById("filmBarcode"),
  filmCellNo: document.getElementById("filmCellNo"),
  quickFilmIngestPanel: document.getElementById("quickFilmIngestPanel"),
  quickFilmCellForm: document.getElementById("quickFilmCellForm"),
  quickFilmCellNo: document.getElementById("quickFilmCellNo"),
  quickFilmBarcodeInput: document.getElementById("quickFilmBarcodeInput"),
  quickFilmAddBarcodeBtn: document.getElementById("quickFilmAddBarcodeBtn"),
  quickFilmClearBatchBtn: document.getElementById("quickFilmClearBatchBtn"),
  quickFilmSaveBatchBtn: document.getElementById("quickFilmSaveBatchBtn"),
  quickFilmNextCellBtn: document.getElementById("quickFilmNextCellBtn"),
  quickFilmBatchList: document.getElementById("quickFilmBatchList"),
  quickFilmMissingNames: document.getElementById("quickFilmMissingNames"),
  filmsStartScanBtn: document.getElementById("filmsStartScanBtn"),
  filmsTableBody: document.getElementById("filmsTableBody"),
  filmsPager: document.getElementById("filmsPager"),
  filmsGroupWithBtn: document.getElementById("filmsGroupWithBtn"),
  filmsGroupWithoutBtn: document.getElementById("filmsGroupWithoutBtn"),
  toToolsBtn: document.getElementById("toToolsBtn"),
  stockManagePanel: document.getElementById("stockManagePanel"),
  adjustPanel: document.getElementById("adjustPanel"),
  adjustForm: document.getElementById("adjustForm"),
  adjustItemId: document.getElementById("adjustItemId"),
  adjustDelta: document.getElementById("adjustDelta"),
  searchInput: document.getElementById("searchInput"),
  searchBtn: document.getElementById("searchBtn"),
  stockForm: document.getElementById("stockForm"),
  groupForm: document.getElementById("groupForm"),
  groupNameInput: document.getElementById("groupNameInput"),
  itemName: document.getElementById("itemName"),
  itemGroup: document.getElementById("itemGroup"),
  itemQty: document.getElementById("itemQty"),
  itemThreshold: document.getElementById("itemThreshold"),
  itemNotes: document.getElementById("itemNotes"),
  itemsTableBody: document.getElementById("itemsTableBody"),
  itemsPager: document.getElementById("itemsPager"),
  alertsBox: document.getElementById("alertsBox"),
  alertsPager: document.getElementById("alertsPager"),
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
  editItemGroup: document.getElementById("editItemGroup"),
  editItemThreshold: document.getElementById("editItemThreshold"),
  editItemNotes: document.getElementById("editItemNotes"),
  onboarding: document.getElementById("onboarding"),
  closeOnboardingBtn: document.getElementById("closeOnboardingBtn"),
  logoutModal: document.getElementById("logoutModal"),
  logoutBackdrop: document.getElementById("logoutBackdrop"),
  cancelLogoutBtn: document.getElementById("cancelLogoutBtn"),
  confirmLogoutBtn: document.getElementById("confirmLogoutBtn"),
  loadingOverlay: document.getElementById("loadingOverlay"),
  loadingText: document.getElementById("loadingText"),
  mobileScanFab: document.getElementById("mobileScanFab"),
  filmFoundModal: document.getElementById("filmFoundModal"),
  filmFoundBackdrop: document.getElementById("filmFoundBackdrop"),
  closeFilmFoundBtn: document.getElementById("closeFilmFoundBtn"),
  filmFoundSummary: document.getElementById("filmFoundSummary"),
  filmFoundCellsList: document.getElementById("filmFoundCellsList"),
  filmFoundAddBtn: document.getElementById("filmFoundAddBtn"),
  filmFoundDeleteBtn: document.getElementById("filmFoundDeleteBtn"),
  filmAddModal: document.getElementById("filmAddModal"),
  filmAddBackdrop: document.getElementById("filmAddBackdrop"),
  closeFilmAddBtn: document.getElementById("closeFilmAddBtn"),
  filmAddForm: document.getElementById("filmAddForm"),
  filmAddName: document.getElementById("filmAddName"),
  filmAddBarcode: document.getElementById("filmAddBarcode"),
  filmAddCellNo: document.getElementById("filmAddCellNo"),
  filmDeleteModal: document.getElementById("filmDeleteModal"),
  filmDeleteBackdrop: document.getElementById("filmDeleteBackdrop"),
  closeFilmDeleteBtn: document.getElementById("closeFilmDeleteBtn"),
  filmDeleteForm: document.getElementById("filmDeleteForm"),
  filmDeleteCellSelect: document.getElementById("filmDeleteCellSelect"),
};

function safeParse(text) {
  try {
    return JSON.parse(text || "");
  } catch {
    return null;
  }
}

function normalizePageSize(value, fallback = 10) {
  const raw = Number(value);
  if (![10, 20, 30].includes(raw)) return fallback;
  return raw;
}

function loadDisplayPrefs() {
  const saved = safeParse(localStorage.getItem(DISPLAY_PREFS_KEY));
  if (!saved || typeof saved !== "object") return;
  state.displayPrefs = {
    all: normalizePageSize(saved.all, 10),
  };
}

function saveDisplayPrefs() {
  localStorage.setItem(DISPLAY_PREFS_KEY, JSON.stringify(state.displayPrefs));
}

function fillDisplayPrefsForm() {
  if (!refs.displayAllLimit) return;
  refs.displayAllLimit.value = String(state.displayPrefs.all);
}

function readDisplayPrefsForm() {
  if (!refs.displayAllLimit) return;
  state.displayPrefs.all = normalizePageSize(refs.displayAllLimit.value, state.displayPrefs.all);
}

function paginateList(list, key) {
  const pageSize = state.displayPrefs.all ?? 10;
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));
  const current = Math.min(Math.max(1, Number(state.pages[key] || 1)), totalPages);
  state.pages[key] = current;
  const start = (current - 1) * pageSize;
  const end = start + pageSize;
  return { items: list.slice(start, end), page: current, totalPages, total: list.length };
}

function renderPager(el, key, meta, rerender) {
  if (!el) return;
  const { page, totalPages, total } = meta;
  if (total <= 0 || totalPages <= 1) {
    el.hidden = true;
    el.innerHTML = "";
    return;
  }

  el.hidden = false;
  const pageSize = state.displayPrefs.all;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  el.innerHTML = `
    <button class="glass-btn pager-btn" type="button" data-dir="prev" ${page <= 1 ? "disabled" : ""}>Назад</button>
    <p class="pager-meta">Страница ${page}/${totalPages} • ${from}-${to} из ${total}</p>
    <button class="glass-btn pager-btn" type="button" data-dir="next" ${page >= totalPages ? "disabled" : ""}>Вперед</button>
  `;

  el.querySelectorAll("button[data-dir]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const dir = btn.getAttribute("data-dir");
      state.pages[key] = dir === "prev" ? Math.max(1, page - 1) : Math.min(totalPages, page + 1);
      rerender();
    });
  });
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
    if (response.status === 401 && auth) {
      clearSession();
      openAuthModal();
      showToast("Сессия истекла. Войдите снова");
    }
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

function openLogoutModal() {
  refs.logoutModal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeLogoutModal() {
  refs.logoutModal.hidden = true;
  document.body.style.overflow = "";
}

function toggleAccountMenu(forceOpen = null) {
  if (!refs.accountMenu) return;
  const shouldOpen = forceOpen === null ? refs.accountMenu.hidden : Boolean(forceOpen);
  refs.accountMenu.hidden = !shouldOpen;
}

function closeAccountMenu() {
  if (!refs.accountMenu) return;
  refs.accountMenu.hidden = true;
}

function openEditModal(item) {
  state.editingItemId = item.id;
  refs.editItemName.value = item.name || "";
  refs.editItemQty.value = Number(item.qty || 0);
  refs.editItemGroup.value = String(item.group_name || "");
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

function openSimpleModal(modal) {
  if (!modal) return;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeSimpleModal(modal) {
  if (!modal) return;
  modal.hidden = true;
  document.body.style.overflow = "";
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
  const showInventory = view === "inventory";
  const showSettings = view === "settings";

  refs.homeView.classList.toggle("active", showHome);
  refs.inventoryView.classList.toggle("active", showInventory);
  refs.settingsView.classList.toggle("active", showSettings);
  if (!showInventory) {
    stopScanner();
    state.scanContext = "inventory";
  }
  closeAccountMenu();
  updateMobileScanFab();
  hapticSelection();
}

function setInventoryTab(tab) {
  state.inventoryTab = tab;
  const isMain = tab === "main";
  const isFilms = tab === "films";
  const isTools = tab === "tools";
  const isHistory = tab === "history";

  refs.mainTabBtn.classList.toggle("active", isMain);
  refs.filmsTabBtn.classList.toggle("active", isFilms);
  refs.toolsTabBtn.classList.toggle("active", isTools);
  refs.historyTabBtn.classList.toggle("active", isHistory);
  refs.mainTab.classList.toggle("active", isMain);
  refs.filmsTab.classList.toggle("active", isFilms);
  refs.toolsTab.classList.toggle("active", isTools);
  refs.historyTab.classList.toggle("active", isHistory);
  refs.mainTabBtn.classList.toggle("is-hidden", isFilms);
  refs.toolsTabBtn.classList.toggle("is-hidden", isFilms);
  if (refs.toToolsBtn) refs.toToolsBtn.classList.toggle("is-hidden", isFilms);
  state.scanContext = isFilms ? "films" : "inventory";
  if (isMain) {
    stopScanner();
  }
  if (isFilms) {
    stopScanner();
    loadFilms();
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
    if (refs.homeAuthCaption) refs.homeAuthCaption.textContent = "Вы вошли как";
    if (refs.homeAuthEmail) refs.homeAuthEmail.textContent = state.user.email;
    void updateHomeProfilePhoto().catch(() => setHomeProfileButtonPhoto(""));
    return;
  }

  refs.openAuthBtn.innerHTML = `${iconSpan("lock")}<span>Войти</span>`;
  refs.openAuthBtn.classList.remove("glass-btn");
  refs.openAuthBtn.classList.add("primary-btn");
  if (refs.homeAuthCaption) refs.homeAuthCaption.textContent = "Вы вошли как";
  if (refs.homeAuthEmail) refs.homeAuthEmail.textContent = "Гость";
  setHomeProfileButtonPhoto("");
}

function renderHomeProcessCards() {
  if (!refs.homeProcessGrid) return;
  const query = String(refs.homeProcessSearch?.value || "").trim().toLowerCase();
  refs.homeProcessGrid.querySelectorAll("[data-process-title]").forEach((node) => {
    const title = String(node.getAttribute("data-process-title") || "").toLowerCase();
    node.hidden = Boolean(query) && !title.includes(query);
  });
}

function setHomeProfileButtonPhoto(dataUrl = "") {
  if (!refs.homeProfileBtn) return;
  if (!refs.homeProfileBtn.dataset.defaultMarkup) {
    refs.homeProfileBtn.dataset.defaultMarkup = refs.homeProfileBtn.innerHTML;
  }
  if (!dataUrl) {
    refs.homeProfileBtn.innerHTML = refs.homeProfileBtn.dataset.defaultMarkup;
    refs.homeProfileBtn.classList.remove("has-photo");
    return;
  }
  refs.homeProfileBtn.innerHTML = `<img src="${dataUrl}" alt="" />`;
  refs.homeProfileBtn.classList.add("has-photo");
}

async function updateHomeProfilePhoto(force = false) {
  if (!state.token || !state.user?.email) {
    state.homeProfilePhotoChatId = "";
    setHomeProfileButtonPhoto("");
    return;
  }

  const chatId = String(state.user.telegram_chat_id || "").trim();
  if (!chatId) {
    state.homeProfilePhotoChatId = "";
    setHomeProfileButtonPhoto("");
    return;
  }

  if (!force && state.homeProfilePhotoChatId === chatId && refs.homeProfileBtn?.classList.contains("has-photo")) {
    return;
  }

  const data = await apiRequest("/api/auth/profile-photo");
  const photo = String(data?.photoDataUrl || "");
  setHomeProfileButtonPhoto(photo);
  state.homeProfilePhotoChatId = chatId;
}

function userNotifyEnabled() {
  const value = state.user?.low_stock_notifications;
  if (value === undefined || value === null || value === "") return true;
  return String(value) !== "0";
}

function applyUserFromServer(nextUser, nextToken = "") {
  if (!nextUser) return;
  const reminderRaw = Array.isArray(nextUser.reminder_item_ids)
    ? nextUser.reminder_item_ids.join(",")
    : String(nextUser.reminder_item_ids || "");
  state.user = {
    ...state.user,
    ...nextUser,
    low_stock_notifications: String(nextUser.low_stock_notifications ?? "1"),
    reminder_item_ids: reminderRaw,
    reminder_interval_minutes: String(nextUser.reminder_interval_minutes ?? "0"),
  };
  if (nextToken) {
    state.token = nextToken;
    localStorage.setItem("sf_token", nextToken);
  }
  localStorage.setItem("sf_user", JSON.stringify(state.user));
  updateAuthButton();
  applyRoleAccess();
}

function fillSettingsForm() {
  if (!state.user) return;
  const fallbackNameParts = String(state.user.name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  const fallbackFirst = fallbackNameParts[0] || "";
  const fallbackLast = fallbackNameParts.slice(1).join(" ");
  refs.settingsFirstName.value = String(state.user.first_name || fallbackFirst).trim();
  refs.settingsLastName.value = String(state.user.last_name || fallbackLast).trim();
  refs.settingsEmail.value = String(state.user.email || "").trim().toLowerCase();
  refs.settingsTelegramChatId.value = String(state.user.telegram_chat_id || "").trim();
  refs.settingsPassword.value = "";
  refs.settingsLowStockToggle.checked = userNotifyEnabled();
  refs.settingsReminderInterval.value = String(state.user.reminder_interval_minutes || "0");
  renderReminderItems();
}

function reminderSelectionFromUser() {
  return new Set(
    String(state.user?.reminder_item_ids || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
  );
}

function selectedReminderItemIds() {
  if (!refs.settingsReminderItems) return [];
  return [...refs.settingsReminderItems.querySelectorAll("input[type='checkbox'][data-item-id]:checked")]
    .map((input) => String(input.getAttribute("data-item-id") || "").trim())
    .filter(Boolean);
}

function renderReminderItems() {
  if (!refs.settingsReminderItems) return;
  refs.settingsReminderItems.innerHTML = "";
  if (!state.items.length) {
    refs.settingsReminderItems.innerHTML = '<p class="muted">Нет доступных товаров для напоминаний.</p>';
    return;
  }

  const selected = reminderSelectionFromUser();
  state.items.forEach((item) => {
    const row = document.createElement("label");
    row.className = "reminder-item";
    row.innerHTML = `<input type="checkbox" data-item-id="${item.id}" ${selected.has(String(item.id)) ? "checked" : ""} /><span>${item.name} <span class="muted">(${item.id})</span></span>`;
    refs.settingsReminderItems.appendChild(row);
  });
}

function applyMainFiltersFromInputs() {
  state.mainFilters.search = refs.searchInput.value.trim().toLowerCase();
  state.mainFilters.group = String(refs.mainGroupFilter.value || "").trim().toLowerCase();
  state.mainFilters.stock = String(refs.mainStockFilter.value || "").trim().toLowerCase();
}

function filteredItems() {
  const { search, group, stock } = state.mainFilters;
  return state.items.filter((item) => {
    if (search) {
      const matchSearch =
        item.name.toLowerCase().includes(search) ||
        String(item.id || "").toLowerCase().includes(search) ||
        String(item.notes || "").toLowerCase().includes(search);
      if (!matchSearch) return false;
    }

    if (group) {
      const itemGroup = String(item.group_name || "").trim().toLowerCase();
      if (itemGroup !== group) return false;
    }

    if (stock === "low" && Number(item.qty) > Number(item.threshold)) return false;
    if (stock === "ok" && Number(item.qty) <= Number(item.threshold)) return false;
    return true;
  });
}

function renderMainByFilters() {
  applyMainFiltersFromInputs();
  state.pages.items = 1;
  renderTable(filteredItems());
}

function resetMainFilters() {
  refs.searchInput.value = "";
  refs.mainGroupFilter.value = "";
  refs.mainStockFilter.value = "";
  state.mainFilters = { search: "", group: "", stock: "" };
  state.pages.items = 1;
  renderTable(state.items);
}

async function loadProfile() {
  if (!state.token) return;
  const data = await apiRequest("/api/auth/profile");
  applyUserFromServer(data.user);
  fillSettingsForm();
  state.profileLoaded = true;
}

async function saveNotificationsSettings(submitBtn = null) {
  if (!state.token) throw new Error("Требуется вход в систему");
  const data = await runDbAction(
    () =>
      apiRequest("/api/auth/profile", {
        method: "PATCH",
        body: {
          lowStockNotifications: refs.settingsLowStockToggle.checked,
          reminderItemIds: selectedReminderItemIds(),
          reminderIntervalMinutes: Number(refs.settingsReminderInterval.value || 0),
        },
      }),
    { button: submitBtn, message: "Сохраняем уведомления..." }
  );
  applyUserFromServer(data.user, data.token);
  fillSettingsForm();
}

async function openSettingsView() {
  if (!state.user?.email || !state.token) {
    openAuthModal();
    return;
  }
  setModuleView("settings");
  if (!state.profileLoaded) {
    await runDbAction(() => loadProfile(), { message: "Загружаем профиль..." });
  } else {
    fillSettingsForm();
  }
  fillDisplayPrefsForm();
  if (canAdmin()) {
    await runDbAction(() => loadAdminUsers(), { message: "Загружаем админку..." });
  }
}

function performLogout() {
  clearSession();
  closeAccountMenu();
  closeLogoutModal();
  setModuleView("home");
  loadItems();
  loadHistory();
  loadFilms();
  showToast("Вы вышли из аккаунта");
  hapticSuccess();
}

function clearSession() {
  localStorage.removeItem("sf_token");
  localStorage.removeItem("sf_user");
  state.token = "";
  state.user = null;
  state.homeProfilePhotoChatId = "";
  state.profileLoaded = false;
  updateAuthButton();
  applyRoleAccess();
}

function sanitizeInitialSession() {
  if (state.user?.email && !state.token) {
    clearSession();
  }
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

function initialFromName(name) {
  const text = String(name || "").trim();
  if (!text) return "?";
  return text[0].toUpperCase();
}

function initCollapsiblePanels() {
  const panels = [...document.querySelectorAll(".panel.panel-collapsible")];
  panels.forEach((panel, index) => {
    const head = panel.querySelector(".section-head");
    if (!head) return;
    if (head.querySelector(".collapse-btn")) return;

    const controls = document.createElement("div");
    controls.className = "section-controls";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "glass-btn collapse-btn";
    button.dataset.collapseIndex = String(index);
    button.textContent = "Свернуть";
    controls.appendChild(button);
    head.appendChild(controls);

    button.addEventListener("click", () => {
      const collapsed = panel.classList.toggle("is-collapsed");
      button.textContent = collapsed ? "Развернуть" : "Свернуть";
      hapticSelection();
    });
  });
}

function updateMobileScanFab() {
  if (!refs.mobileScanFab) return;
  refs.mobileScanFab.hidden = true;
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

function scannerIdleHint() {
  return state.scanContext === "films"
    ? "Наведите камеру на штрихкод пленки."
    : "Наведите камеру на QR или штрихкод.";
}

function openScanModal() {
  if (!refs.scanModal) return;
  refs.scanModal.hidden = false;
  document.body.style.overflow = "hidden";
  setScanStatus(scannerIdleHint(), { refsOverride: getActiveScannerRefs() });
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
  if (refs.adminPanel) {
    refs.adminPanel.classList.toggle("is-hidden", !canManageUsers);
  }
  if (refs.quickFilmIngestPanel) {
    refs.quickFilmIngestPanel.classList.toggle("is-hidden", !canManageUsers);
  }

  refs.stockManagePanel.classList.toggle("is-hidden", !canManageUsers);
  refs.itemName.disabled = !canManageUsers;
  refs.itemGroup.disabled = !canManageUsers;
  refs.itemQty.disabled = !canManageUsers;
  refs.itemThreshold.disabled = !canManageUsers;
  refs.itemNotes.disabled = !canManageUsers;
  refs.groupNameInput.disabled = !canManageUsers;

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
    if (refs.itemsPager) {
      refs.itemsPager.hidden = true;
      refs.itemsPager.innerHTML = "";
    }
    return;
  }

  const page = paginateList(list, "items");

  for (const item of page.items) {
    const groupLine = item.group_name
      ? `<span class="muted">Группа: ${item.group_name}</span><br />`
      : "";
    const initial = initialFromName(item.name);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td data-label="Расходник">
        <div class="item-main">
          <span class="item-avatar">${initial}</span>
          <div class="item-copy">
            <strong>${item.name}</strong><br />${groupLine}<span class="muted">${item.notes || "Без заметок"}</span>
          </div>
        </div>
      </td>
      <td data-label="Остаток">${item.qty}</td>
      <td data-label="Лимит">${item.threshold}</td>
      <td data-label="QR-код">${item.id}<br />${statusBadge(item)}</td>
      <td data-label="Действия">
        <div class="actions compact-actions">
          <button title="Печать QR" class="secondary-btn btn-with-icon action-btn ${canDesktopPrint() ? "" : "is-hidden"}" data-action="print" data-id="${item.id}" type="button">${iconSpan("print")}<span class="action-text">Печать</span></button>
          <button title="Добавить +1" class="secondary-btn btn-with-icon action-btn ${canAdmin() ? "" : "is-hidden"}" data-action="plus-one" data-id="${item.id}" type="button">${iconSpan("plus")}<span class="action-text">+1</span></button>
          <button title="Редактировать" class="secondary-btn btn-with-icon action-btn ${canAdmin() ? "" : "is-hidden"}" data-action="edit" data-id="${item.id}" type="button">${iconSpan("edit")}<span class="action-text">Ред</span></button>
          <button title="Удалить" class="glass-btn btn-with-icon action-btn danger ${canAdmin() ? "" : "is-hidden"}" data-action="delete" data-id="${item.id}" type="button">${iconSpan("trash")}<span class="action-text">Del</span></button>
          <button title="Списать -1" class="glass-btn btn-with-icon action-btn" data-action="consume" data-id="${item.id}" type="button">${iconSpan("minus")}<span class="action-text">-1</span></button>
        </div>
      </td>
    `;
    refs.itemsTableBody.appendChild(row);
  }

  renderPager(refs.itemsPager, "items", page, () => renderTable(list));
}

function applyFilmsFiltersFromInputs() {
  state.filmsFilters.search = String(refs.filmsSearchInput?.value || "").trim().toLowerCase();
  state.filmsFilters.barcode = String(refs.filmsBarcodeFilter?.value || "").trim().toLowerCase();
  state.filmsFilters.cell = String(refs.filmsCellFilter?.value || "").trim().toLowerCase();
}

function groupedFilms(source = state.films) {
  const map = new Map();
  source.forEach((film) => {
    const barcode = String(film.barcode || "").trim();
    if (!barcode) return;
    if (!map.has(barcode)) {
      map.set(barcode, {
        id: String(film.id || ""),
        name: String(film.name || "").trim(),
        barcode,
        cells: [],
        count: 0,
        unassignedCount: 0,
      });
    }
    const group = map.get(barcode);
    group.count += 1;
    const cell = String(film.cell_no || "").trim();
    if (cell) {
      if (!group.cells.includes(cell)) group.cells.push(cell);
    } else {
      group.unassignedCount += 1;
    }
  });

  return [...map.values()]
    .map((group) => ({
      ...group,
      cells: [...group.cells].sort((a, b) => a.localeCompare(b, "ru")),
    }))
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "ru"));
}

function filteredFilms() {
  const { search, barcode, cell } = state.filmsFilters;
  const grouped = groupedFilms(state.films).filter((film) => {
    const cellsText = film.cells.join(" ").toLowerCase();
    if (search) {
      const matchSearch =
        String(film.name || "").toLowerCase().includes(search) ||
        String(film.barcode || "").toLowerCase().includes(search) ||
        cellsText.includes(search);
      if (!matchSearch) return false;
    }
    if (barcode && !String(film.barcode || "").toLowerCase().includes(barcode)) return false;
    if (cell && !cellsText.includes(cell)) return false;
    return true;
  });
  if (state.filmsGroup === "without") {
    return grouped.filter((film) => film.cells.length === 0);
  }
  return grouped.filter((film) => film.cells.length > 0);
}

function renderFilmsTable(list = filteredFilms()) {
  if (!refs.filmsTableBody) return;
  if (refs.filmsGroupWithBtn && refs.filmsGroupWithoutBtn) {
    refs.filmsGroupWithBtn.classList.toggle("active", state.filmsGroup === "with");
    refs.filmsGroupWithoutBtn.classList.toggle("active", state.filmsGroup === "without");
  }
  refs.filmsTableBody.innerHTML = "";

  if (!list.length) {
    const emptyMessage = state.token
      ? state.filmsGroup === "without"
        ? "Пленок без ячеек нет."
        : "Пленки с ячейками не найдены."
      : "Для загрузки склада пленок выполните вход в систему.";
    refs.filmsTableBody.innerHTML = `<tr><td colspan="4" class="muted">${emptyMessage}</td></tr>`;
    if (refs.filmsPager) {
      refs.filmsPager.hidden = true;
      refs.filmsPager.innerHTML = "";
    }
    return;
  }

  const page = paginateList(list, "films");
  for (const film of page.items) {
    const row = document.createElement("tr");
    const avatar = initialFromName(film.name);
    row.innerHTML = `
      <td data-label="Товар">
        <div class="item-main">
          <span class="item-avatar">${avatar}</span>
          <div class="item-copy">
            <strong>${film.name}</strong><br />
            <span class="muted">Ячеек: ${film.cells.length} • Ед.: ${film.count}</span>
          </div>
        </div>
      </td>
      <td data-label="Штрихкод">${film.barcode}</td>
      <td data-label="Ячейки">${
        film.cells.length
          ? film.cells.map((c) => `<span class="badge badge-ok">${c}</span>`).join(" ")
          : '<span class="badge badge-low">Без ячейки</span>'
      }</td>
      <td data-label="Действия">
        <div class="actions compact-actions">
          <button title="Добавить такую же пленку" class="secondary-btn btn-with-icon action-btn" data-film-action="clone" data-film-barcode="${film.barcode}" type="button">${iconSpan("plus")}<span class="action-text">Добавить</span></button>
          <button title="Удалить из ячейки" class="glass-btn btn-with-icon action-btn danger ${film.cells.length ? "" : "is-hidden"}" data-film-action="delete" data-film-barcode="${film.barcode}" type="button">${iconSpan("trash")}<span class="action-text">Удалить</span></button>
        </div>
      </td>
    `;
    refs.filmsTableBody.appendChild(row);
  }

  renderPager(refs.filmsPager, "films", page, () => renderFilmsTable(list));
}

function renderAlerts(lowItems = null) {
  const low = lowItems || state.items.filter((item) => Number(item.qty) <= Number(item.threshold));
  refs.alertsBox.innerHTML = "";

  if (!low.length) {
    refs.alertsBox.innerHTML = '<p class="muted">Пока все в норме.</p>';
    if (refs.alertsPager) {
      refs.alertsPager.hidden = true;
      refs.alertsPager.innerHTML = "";
    }
    return;
  }

  const page = paginateList(low, "alerts");
  for (const item of page.items) {
    const itemEl = document.createElement("div");
    itemEl.className = "alert-item";
    itemEl.textContent = `Личное уведомление: ${item.name} (${item.qty} шт, лимит ${item.threshold}).`;
    refs.alertsBox.appendChild(itemEl);
  }

  renderPager(refs.alertsPager, "alerts", page, () => renderAlerts(low));
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
  if (reason === "film_create") return "Пленки: добавление";
  if (reason === "film_update") return "Пленки: обновление";
  if (reason === "film_delete") return "Пленки: удаление";
  return reason || "Изменение";
}

function renderAdminUsers(users = state.adminUsers) {
  refs.adminUsersList.innerHTML = "";
  if (!users.length) {
    refs.adminUsersList.innerHTML = '<p class="muted">Пользователи не найдены.</p>';
    refs.adminHistoryUser.innerHTML = '<option value="">Нет пользователей</option>';
    if (refs.adminUsersPager) {
      refs.adminUsersPager.hidden = true;
      refs.adminUsersPager.innerHTML = "";
    }
    return;
  }

  refs.adminHistoryUser.innerHTML = '<option value="">Выберите пользователя</option>';
  const page = paginateList(users, "adminUsers");
  users.forEach((user) => {
    const option = document.createElement("option");
    option.value = user.email;
    option.textContent = `${user.email} (${user.role})`;
    refs.adminHistoryUser.appendChild(option);
  });

  page.items.forEach((user) => {
    const item = document.createElement("article");
    item.className = "history-item";
    item.innerHTML = `
      <div><strong>${user.name || user.email}</strong> <span class="history-reason">${user.role}</span></div>
      <div class="history-meta">${user.email}</div>
      <div class="history-meta">Chat ID: ${user.telegram_chat_id || "не указан"}</div>
    `;
    refs.adminUsersList.appendChild(item);
  });

  renderPager(refs.adminUsersPager, "adminUsers", page, () => renderAdminUsers(users));
}

function renderAdminHistory(movements = state.adminHistory) {
  refs.adminHistoryList.innerHTML = "";
  if (!movements.length) {
    refs.adminHistoryList.innerHTML = '<p class="muted">Действия не найдены.</p>';
    if (refs.adminHistoryPager) {
      refs.adminHistoryPager.hidden = true;
      refs.adminHistoryPager.innerHTML = "";
    }
    return;
  }

  const page = paginateList(movements, "adminHistory");
  page.items.forEach((row) => {
    const block = document.createElement("article");
    block.className = "history-item";
    block.innerHTML = `
      <div><strong>${row.item_id || "Без ID"}</strong> <span class="history-reason">${reasonLabel(row.reason)}</span></div>
      <div class="history-meta">Изменение: ${Number(row.delta || 0)}</div>
      <div class="history-meta">${row.user_email || "-"}</div>
      <div class="history-meta">${formatHistoryDate(row.created_at)}</div>
    `;
    refs.adminHistoryList.appendChild(block);
  });

  renderPager(refs.adminHistoryPager, "adminHistory", page, () => renderAdminHistory(movements));
}

async function loadAdminUsers() {
  if (!canAdmin() || !state.token) return;
  const data = await apiRequest("/api/admin/users");
  state.adminUsers = data.users || [];
  state.pages.adminUsers = 1;
  renderAdminUsers(state.adminUsers);
}

async function loadAdminHistoryByUser() {
  if (!canAdmin() || !state.token) return;
  const email = String(refs.adminHistoryUser.value || "").trim().toLowerCase();
  if (!email) {
    state.adminHistory = [];
    refs.adminHistoryList.innerHTML = '<p class="muted">Выберите пользователя.</p>';
    if (refs.adminHistoryPager) {
      refs.adminHistoryPager.hidden = true;
      refs.adminHistoryPager.innerHTML = "";
    }
    return;
  }
  const adminHistoryLimit = String(Math.max(160, state.displayPrefs.all));
  const query = new URLSearchParams({ user_email: email, limit: adminHistoryLimit }).toString();
  const data = await apiRequest(`/api/admin/history?${query}`);
  state.adminHistory = data.movements || [];
  state.pages.adminHistory = 1;
  renderAdminHistory(state.adminHistory);
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
  const historyLimit = String(Math.max(120, state.displayPrefs.all));
  params.set("limit", historyLimit);
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
    if (refs.historyPager) {
      refs.historyPager.hidden = true;
      refs.historyPager.innerHTML = "";
    }
    return;
  }

  const page = paginateList(list, "history");
  for (const row of page.items) {
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

  renderPager(refs.historyPager, "history", page, () => renderHistory(list));
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (text.includes(",") || text.includes("\"") || text.includes("\n")) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

function withUtf8Bom(text) {
  const source = String(text ?? "");
  return source.startsWith("\uFEFF") ? source : `\uFEFF${source}`;
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
  const csvWithBom = withUtf8Bom(csvText);

  if ("showSaveFilePicker" in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{ description: "CSV File", accept: { "text/csv": [".csv"] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(csvWithBom);
      await writable.close();
      return true;
    } catch {
      // continue fallback chain
    }
  }

  try {
    const blob = new Blob([csvWithBom], { type: "text/csv;charset=utf-8;" });
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
    const dataUri = `data:text/csv;charset=utf-8,${encodeURIComponent(csvWithBom)}`;
    const popup = window.open(dataUri, "_blank");
    if (popup) return true;
  } catch {
    // continue fallback chain
  }

  const copied = await copyTextToClipboard(csvWithBom);
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

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];

    if (ch === "\"") {
      if (inQuotes && next === "\"") {
        value += "\"";
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }

    if (!inQuotes && ch === ",") {
      row.push(value);
      value = "";
      continue;
    }

    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && next === "\n") i += 1;
      row.push(value);
      value = "";
      if (row.some((cell) => String(cell || "").trim() !== "")) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    value += ch;
  }

  row.push(value);
  if (row.some((cell) => String(cell || "").trim() !== "")) {
    rows.push(row);
  }
  return rows;
}

function csvRowsToObjects(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map((h) => String(h || "").replace(/^\uFEFF/, "").trim().toLowerCase());
  return rows.slice(1).map((r) => {
    const out = {};
    headers.forEach((h, idx) => {
      out[h] = String(r[idx] ?? "").trim();
    });
    return out;
  });
}

function filmExcelColumns() {
  return ["Наименование товара", "Штрихкод", "Номер ячейки"];
}

function normalizeFilmImportRow(row = {}) {
  return {
    name: String(row["Наименование товара"] ?? row["наименование товара"] ?? row.name ?? "").trim(),
    barcode: String(row["Штрихкод"] ?? row["штрихкод"] ?? row.barcode ?? "").trim(),
    cellNo: String(row["Номер ячейки"] ?? row["номер ячейки"] ?? row.cell_no ?? row.cellNo ?? "").trim(),
  };
}

async function downloadFilmsTemplate() {
  const columns = filmExcelColumns();
  const sampleRows = [
    { "Наименование товара": "Матовая пленка A4", "Штрихкод": "1234567890123", "Номер ячейки": "A-12" },
    { "Наименование товара": "Глянцевая пленка A3", "Штрихкод": "1234567890999", "Номер ячейки": "B-03" },
  ];

  if (window.XLSX?.utils?.book_new) {
    const ws = window.XLSX.utils.json_to_sheet(sampleRows, { header: columns });
    ws["!cols"] = [{ wch: 32 }, { wch: 20 }, { wch: 16 }];
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Films");
    window.XLSX.writeFile(wb, "polotno-films-template.xlsx");
    showToast("Шаблон Excel скачан");
    return;
  }

  const csv = [columns.join(","), ...sampleRows.map((r) => columns.map((c) => csvEscape(r[c])).join(","))].join("\n");
  const ok = await downloadCsvWithFallback("polotno-films-template.csv", csv);
  if (ok) showToast("Шаблон CSV скачан");
}

async function parseFilmsImportFile(file) {
  if (!file) return [];
  const lower = String(file.name || "").toLowerCase();

  if ((lower.endsWith(".xlsx") || lower.endsWith(".xls")) && window.XLSX?.read) {
    const buffer = await file.arrayBuffer();
    const wb = window.XLSX.read(buffer, { type: "array" });
    const firstSheet = wb.Sheets[wb.SheetNames[0]];
    if (!firstSheet) return [];
    const rows = window.XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
    return rows.map(normalizeFilmImportRow);
  }

  const text = await file.text();
  const rows = parseCsv(text);
  const objects = csvRowsToObjects(rows);
  return objects.map(normalizeFilmImportRow);
}

async function importFilmsExcel(file) {
  if (!file) return;
  if (!state.token) throw new Error("Требуется вход в систему");

  const rows = await parseFilmsImportFile(file);
  if (!rows.length) throw new Error("Файл пустой или не содержит строк");

  const validRows = [];
  const validationErrors = [];

  rows.forEach((row, idx) => {
    const line = idx + 2;
    if (!row.name) {
      validationErrors.push(`Строка ${line}: пустое наименование товара`);
      return;
    }
    if (!row.barcode) {
      validationErrors.push(`Строка ${line}: пустой штрихкод`);
      return;
    }
    validRows.push(row);
  });

  let success = 0;
  const importErrors = [...validationErrors];

  if (validRows.length) {
    const payloadRows = validRows.map((row, idx) => ({
      name: row.name,
      barcode: row.barcode,
      cellNo: row.cellNo,
      _line: idx + 2,
    }));

    const CHUNK_SIZE = 60;
    for (let start = 0; start < payloadRows.length; start += CHUNK_SIZE) {
      const chunk = payloadRows.slice(start, start + CHUNK_SIZE);
      try {
        const data = await apiRequest("/api/films?action=bulk-upsert", {
          method: "POST",
          body: {
            rows: chunk.map((row) => ({
              name: row.name,
              barcode: row.barcode,
              cellNo: row.cellNo,
            })),
          },
        });
        success += Number(data?.report?.success || 0);
        const apiErrors = Array.isArray(data?.report?.errors) ? data.report.errors : [];
        apiErrors.forEach((err) => {
          const chunkRow = chunk[Math.max(0, Number(err.line || 2) - 2)];
          const originalLine = Number(chunkRow?._line || err.line || 0);
          importErrors.push(`Строка ${originalLine}: ${err.error}`);
        });
      } catch (error) {
        const failedFrom = chunk[0]?._line || start + 2;
        const failedTo = chunk[chunk.length - 1]?._line || failedFrom;
        importErrors.push(`Пакет строк ${failedFrom}-${failedTo}: ${error.message || "Ошибка импорта"}`);
      }
    }
  }

  await loadFilms();
  const failed = importErrors.length;
  showToast(`Импорт пленок: успешно ${success}, с ошибками ${failed}`);
  if (failed) {
    const preview = importErrors.slice(0, 6).join("\n");
    window.alert(`Отчет импорта:\nУспешно: ${success}\nОшибок: ${failed}\n\n${preview}${failed > 6 ? "\n..." : ""}`);
  }
}

async function exportInventoryCsv() {
  if (!canDesktopPrint()) {
    showToast("Экспорт доступен только на ПК");
    return;
  }
  if (!state.items.length) {
    showToast("Нет расходников для экспорта");
    return;
  }

  const headers = ["id", "name", "group_name", "qty", "threshold", "notes", "action"];
  const rows = state.items.map((item) => [
    item.id,
    item.name,
    item.group_name || "",
    String(item.qty ?? 0),
    String(item.threshold ?? 0),
    item.notes || "",
    "",
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n");
  const stamp = new Date().toISOString().slice(0, 10);
  const ok = await downloadCsvWithFallback(`polotno-inventory-${stamp}.csv`, csv);
  if (ok) {
    showToast("Экспорт расходников готов");
    return;
  }
  showToast("Экспорт ограничен в этом браузере");
}

async function exportInventorySheetCsv() {
  if (!canDesktopPrint()) {
    showToast("Экспорт доступен только на ПК");
    return;
  }
  if (!state.items.length) {
    showToast("Нет расходников для инвентаризации");
    return;
  }

  const headers = ["Наименование товара", "Количество (система)", "Количество (факт)", "Комментарий"];
  const rows = [...state.items]
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "ru"))
    .map((item) => [item.name, String(item.qty ?? 0), "", ""]);
  const csv = [headers.join(","), ...rows.map((r) => r.map(csvEscape).join(","))].join("\n");
  const stamp = new Date().toISOString().slice(0, 10);
  const ok = await downloadCsvWithFallback(`polotno-inventory-sheet-${stamp}.csv`, csv);
  if (ok) {
    showToast("Файл инвентаризации готов");
    return;
  }
  showToast("Экспорт ограничен в этом браузере");
}

async function importInventoryCsv(file) {
  if (!file) return;
  if (!canDesktopPrint()) throw new Error("Импорт доступен только на ПК");
  if (!canAdmin()) throw new Error("Только для администратора");

  const text = await file.text();
  const rows = parseCsv(text);
  if (!rows.length) throw new Error("CSV пустой");
  const objects = csvRowsToObjects(rows);
  if (!objects.length) throw new Error("Нет строк для импорта");

  let updated = 0;
  let deleted = 0;
  let skipped = 0;

  for (const row of objects) {
    const id = String(row.id || "").trim();
    const name = String(row.name || "").trim();
    const action = String(row.action || "").trim().toLowerCase();

    if (action === "delete" || action === "remove" || action === "del") {
      if (!id) {
        skipped += 1;
        continue;
      }
      await apiRequest("/api/inventory/delete", { method: "POST", body: { id } });
      deleted += 1;
      continue;
    }

    if (!name) {
      skipped += 1;
      continue;
    }

    await apiRequest("/api/inventory/upsert", {
      method: "POST",
      body: {
        id,
        name,
        groupName: String(row.group_name || ""),
        qty: Number(row.qty || 0),
        threshold: Number(row.threshold || 0),
        notes: String(row.notes || ""),
      },
    });
    updated += 1;
  }

  await loadItems();
  await loadHistory();
  showToast(`Импорт завершен: обновлено ${updated}, удалено ${deleted}, пропущено ${skipped}`);
}

async function loadItems() {
  if (!state.token) {
    state.items = [];
    state.groups = [];
    state.pages.items = 1;
    state.pages.alerts = 1;
    renderTable();
    renderAlerts();
    renderGroupOptions();
    refreshAdjustItemOptions();
    return;
  }

  try {
    const [itemsResult, groupsResult] = await Promise.allSettled([
      apiRequest("/api/inventory/list"),
      apiRequest("/api/inventory/groups"),
    ]);
    state.items = itemsResult.status === "fulfilled" ? itemsResult.value.items || [] : [];
    state.groups = groupsResult.status === "fulfilled" ? groupsResult.value.groups || [] : [];
    if (itemsResult.status !== "fulfilled") {
      showToast("Не удалось загрузить расходники");
    }
  } catch {
    state.items = [];
    state.groups = [];
    showToast("Не удалось загрузить расходники");
  }

  state.pages.items = 1;
  state.pages.alerts = 1;

  renderGroupOptions();
  renderReminderItems();
  renderMainByFilters();
  renderAlerts();
  refreshAdjustItemOptions();
}

async function loadFilms() {
  if (!state.token) {
    state.films = [];
    state.pages.films = 1;
    renderFilmsTable([]);
    return;
  }

  try {
    const PAGE_SIZE = 1000;
    const MAX_ROWS = 50000;
    let offset = 0;
    let all = [];

    while (offset < MAX_ROWS) {
      const params = new URLSearchParams();
      params.set("action", "list");
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(offset));
      const data = await apiRequest(`/api/films?${params.toString()}`);
      const chunk = data.films || [];
      if (!chunk.length) break;
      all = all.concat(chunk);
      if (chunk.length < PAGE_SIZE) break;
      offset += PAGE_SIZE;
    }

    state.films = all;
  } catch (error) {
    state.films = [];
    showToast(error.message || "Не удалось загрузить склад пленок");
  }

  state.pages.films = 1;
  renderFilmsTable(filteredFilms());
  renderQuickFilmBatch();
}

function handleFilmsSearch() {
  applyFilmsFiltersFromInputs();
  state.pages.films = 1;
  renderFilmsTable(filteredFilms());
}

function resetFilmsFilters() {
  if (refs.filmsSearchInput) refs.filmsSearchInput.value = "";
  if (refs.filmsBarcodeFilter) refs.filmsBarcodeFilter.value = "";
  if (refs.filmsCellFilter) refs.filmsCellFilter.value = "";
  state.filmsFilters = { search: "", barcode: "", cell: "" };
  state.pages.films = 1;
  renderFilmsTable(groupedFilms(state.films));
}

function knownFilmNameByBarcode(barcode) {
  const needle = String(barcode || "").trim();
  if (!needle) return "";
  const found = state.films.find((film) => String(film.barcode || "").trim() === needle);
  return String(found?.name || "").trim();
}

function quickFilmGroupedBatch() {
  const map = new Map();
  state.quickFilm.scannedBarcodes.forEach((raw) => {
    const barcode = String(raw || "").trim();
    if (!barcode) return;
    if (!map.has(barcode)) {
      map.set(barcode, { barcode, scannedCount: 0 });
    }
    map.get(barcode).scannedCount += 1;
  });
  return [...map.values()];
}

function renderQuickFilmBatch() {
  if (!refs.quickFilmBatchList || !refs.quickFilmMissingNames) return;
  const grouped = quickFilmGroupedBatch();

  refs.quickFilmBatchList.innerHTML = "";
  if (!grouped.length) {
    refs.quickFilmBatchList.innerHTML = '<p class="muted">Список пуст. Начните сканировать.</p>';
  } else {
    grouped.forEach((row) => {
      const known = knownFilmNameByBarcode(row.barcode);
      const article = document.createElement("article");
      article.className = "history-item";
      article.innerHTML = `
        <div><strong>${row.barcode}</strong></div>
        <div class="history-meta">${known || "Нужно название"} • Сканов: ${row.scannedCount}</div>
      `;
      refs.quickFilmBatchList.appendChild(article);
    });
  }

  refs.quickFilmMissingNames.innerHTML = "";
  const unknown = grouped.filter((row) => !knownFilmNameByBarcode(row.barcode));
  if (!unknown.length) {
    refs.quickFilmMissingNames.innerHTML =
      '<p class="muted">Все штрихкоды с известными названиями будут подставлены автоматически.</p>';
    return;
  }

  unknown.forEach((row) => {
    const wrap = document.createElement("label");
    wrap.className = "reminder-item";
    const value = String(state.quickFilm.manualNames[row.barcode] || "");
    wrap.innerHTML = `
      <span><strong>${row.barcode}</strong> <span class="muted">— укажите наименование</span></span>
      <input type="text" data-quick-film-name="${row.barcode}" value="${value}" placeholder="Наименование пленки" />
    `;
    refs.quickFilmMissingNames.appendChild(wrap);
  });
}

function addQuickFilmBarcode(rawBarcode) {
  const cellNo = String(refs.quickFilmCellNo?.value || "").trim();
  if (!cellNo) {
    showToast("Сначала укажите номер ячейки");
    refs.quickFilmCellNo?.focus();
    return false;
  }
  const barcode = String(rawBarcode || "").trim();
  if (!barcode) return false;
  state.quickFilm.cellNo = cellNo;
  state.quickFilm.scannedBarcodes.push(barcode);
  renderQuickFilmBatch();
  return true;
}

function resetQuickFilmBatch(keepCell = true) {
  if (!keepCell && refs.quickFilmCellNo) refs.quickFilmCellNo.value = "";
  state.quickFilm.scannedBarcodes = [];
  state.quickFilm.manualNames = {};
  state.quickFilm.cellNo = String(refs.quickFilmCellNo?.value || "").trim();
  renderQuickFilmBatch();
}

async function saveFilm(film) {
  if (!state.token) throw new Error("Требуется вход в систему");
  await apiRequest("/api/films?action=upsert", { method: "POST", body: film });
  await loadFilms();
}

async function deleteFilm(barcode, cellNo) {
  if (!state.token) throw new Error("Требуется вход в систему");
  await apiRequest("/api/films?action=delete", {
    method: "POST",
    body: { barcode, cellNo },
  });
  await loadFilms();
}

function renderScanFilmFoundModal() {
  if (!refs.filmFoundCellsList || !refs.filmFoundSummary) return;
  const films = state.scanFilmMatches || [];
  refs.filmFoundCellsList.innerHTML = "";
  if (!films.length) {
    refs.filmFoundSummary.textContent = "Совпадений не найдено.";
    refs.filmFoundCellsList.innerHTML = '<p class="muted">Штрихкод отсутствует на складе пленок.</p>';
    return;
  }

  const sample = films[0];
  const cells = [...new Set(films.map((x) => String(x.cell_no || "").trim()).filter(Boolean))];
  refs.filmFoundSummary.textContent = `${sample.name} • Штрихкод: ${sample.barcode}`;
  cells.forEach((cell) => {
    const card = document.createElement("article");
    card.className = "history-item";
    card.innerHTML = `<div><strong>Ячейка ${cell}</strong></div>`;
    refs.filmFoundCellsList.appendChild(card);
  });
}

function openFilmFoundModal(films) {
  state.scanFilmMatches = Array.isArray(films) ? films : [];
  renderScanFilmFoundModal();
  openSimpleModal(refs.filmFoundModal);
}

function closeFilmFoundModal() {
  closeSimpleModal(refs.filmFoundModal);
}

function openFilmAddModalFromScan() {
  const sample = state.scanFilmMatches?.[0];
  if (!sample) return;
  refs.filmAddName.value = String(sample.name || "");
  refs.filmAddBarcode.value = String(sample.barcode || "");
  refs.filmAddCellNo.value = "";
  openSimpleModal(refs.filmAddModal);
}

function closeFilmAddModal() {
  closeSimpleModal(refs.filmAddModal);
}

function openFilmDeleteModalFromScan() {
  if (!refs.filmDeleteCellSelect) return;
  refs.filmDeleteCellSelect.innerHTML = "";
  const cells = [...new Set((state.scanFilmMatches || []).map((x) => String(x.cell_no || "").trim()).filter(Boolean))];
  cells.forEach((cell) => {
    const option = document.createElement("option");
    option.value = cell;
    option.textContent = cell;
    refs.filmDeleteCellSelect.appendChild(option);
  });
  openSimpleModal(refs.filmDeleteModal);
}

function closeFilmDeleteModal() {
  closeSimpleModal(refs.filmDeleteModal);
}

function renderGroupOptions() {
  const fromDirectory = [...state.groups].map((g) => String(g.name || "").trim());
  const fromItems = [...state.items].map((i) => String(i.group_name || "").trim());
  const groups = [...new Set([...fromDirectory, ...fromItems])]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "ru"));

  const fill = (select, allowEmptyLabel = "Без группы") => {
    if (!select) return;
    const current = String(select.value || "");
    select.innerHTML = "";
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = allowEmptyLabel;
    select.appendChild(empty);
    groups.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      select.appendChild(option);
    });
    if ([...select.options].some((opt) => opt.value === current)) {
      select.value = current;
    }
  };

  fill(refs.itemGroup, "Без группы");
  fill(refs.editItemGroup, "Без группы");
  fill(refs.mainGroupFilter, "Все группы");
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
    state.pages.history = 1;
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
  state.pages.history = 1;
  renderHistory();
}

function handleSearch() {
  renderMainByFilters();
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
  if (result.disabled) {
    showToast("Уведомления об остатках выключены в настройках");
    return;
  }
  showToast(result.sent ? `Уведомления отправлены: ${result.sent}` : "Низких остатков нет");
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

function extractBarcodeFromScan(rawValue) {
  const text = String(rawValue || "").trim();
  if (!text) return "";
  try {
    const obj = JSON.parse(text);
    if (obj && typeof obj.barcode === "string") return obj.barcode.trim();
    if (obj && typeof obj.id === "string" && !/^SUP-\d{3,}$/i.test(obj.id.trim())) return obj.id.trim();
    if (obj && typeof obj.id === "string") return obj.id.trim();
  } catch {
    // ignore
  }
  return text;
}

async function processFilmScanValue(rawValue) {
  const barcode = extractBarcodeFromScan(rawValue);
  if (!barcode) {
    setScanStatus("Штрихкод не распознан.");
    hapticWarning();
    return false;
  }

  setScanStatus("Ищем пленку на складе...", { busy: true });
  const data = await apiRequest(`/api/films?action=find-by-barcode&barcode=${encodeURIComponent(barcode)}`);
  const films = data.films || [];
  if (!films.length) {
    return false;
  }

  setScanStatus(`Найдено ячеек: ${films.length}`);
  closeScanModal();
  openFilmFoundModal(films);
  showToast(`Найдено: ${films[0].name}`);
  hapticSuccess();
  return true;
}

async function processInventoryScanValue(rawValue) {
  const id = extractItemIdFromScan(rawValue);
  const item = state.items.find((it) => String(it.id).toUpperCase() === id);
  if (!item) {
    return false;
  }

  setScanStatus("QR найден. Обрабатываем списание...", { busy: true });
  await consumeOne(item.id);
  setScanStatus(`Списано 1 шт: ${item.name}`, { busy: false });
  showToast(`Сканировано: ${item.name} (-1)`);
  hapticSuccess();
  return true;
}

async function processScanValue(rawValue) {
  const now = Date.now();
  if (rawValue === state.lastScanValue && now - state.lastScanAt < 1600) {
    return;
  }
  state.lastScanValue = rawValue;
  state.lastScanAt = now;

  if (state.scanContext === "films") {
    const handledFilm = await processFilmScanValue(rawValue);
    if (handledFilm) return;
    const handledInventory = await processInventoryScanValue(rawValue);
    if (handledInventory) return;
    setScanStatus("Код считан, но не найден ни в пленках, ни в расходниках.");
    showToast("Код не найден в системе");
    hapticWarning();
    return;
  }

  const handledInventory = await processInventoryScanValue(rawValue);
  if (handledInventory) return;

  const handledFilm = await processFilmScanValue(rawValue);
  if (handledFilm) return;

  setScanStatus("Код считан, но товар не найден.");
  showToast("Код не найден в системе");
  hapticWarning();
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

function cameraScore(label = "") {
  const text = String(label || "").toLowerCase();
  let score = 0;
  if (/back|rear|environment|world/.test(text)) score += 40;
  if (/main|wide|standard|1x|camera 0/.test(text)) score += 18;
  if (/ultra|tele|macro|depth|tof|front|user|selfie/.test(text)) score -= 22;
  return score;
}

async function openPreferredCameraStream() {
  const fallbackStream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: { ideal: "environment" } },
    audio: false,
  });

  if (!navigator.mediaDevices?.enumerateDevices) {
    return fallbackStream;
  }

  const devices = (await navigator.mediaDevices.enumerateDevices()).filter((d) => d.kind === "videoinput");
  if (!devices.length) {
    return fallbackStream;
  }

  const currentTrack = fallbackStream.getVideoTracks()[0];
  const currentId = currentTrack?.getSettings?.().deviceId || "";
  const withScores = devices.map((d) => ({ deviceId: d.deviceId, label: d.label || "", score: cameraScore(d.label) }));
  withScores.sort((a, b) => b.score - a.score);
  const best = withScores[0];
  if (!best || !best.deviceId || best.score < 1 || best.deviceId === currentId) {
    return fallbackStream;
  }

  fallbackStream.getTracks().forEach((track) => track.stop());
  return navigator.mediaDevices.getUserMedia({
    video: { deviceId: { exact: best.deviceId } },
    audio: false,
  });
}

function zxingSupported() {
  return Boolean(window.ZXing?.BrowserMultiFormatReader);
}

function zxingFormats() {
  const ZX = window.ZXing;
  if (!ZX?.BarcodeFormat) return [];
  return [
    ZX.BarcodeFormat.QR_CODE,
    ZX.BarcodeFormat.CODE_128,
    ZX.BarcodeFormat.CODE_39,
    ZX.BarcodeFormat.CODE_93,
    ZX.BarcodeFormat.CODABAR,
    ZX.BarcodeFormat.EAN_13,
    ZX.BarcodeFormat.EAN_8,
    ZX.BarcodeFormat.UPC_A,
    ZX.BarcodeFormat.UPC_E,
    ZX.BarcodeFormat.ITF,
    ZX.BarcodeFormat.DATA_MATRIX,
    ZX.BarcodeFormat.AZTEC,
    ZX.BarcodeFormat.PDF_417,
  ].filter(Boolean);
}

async function startScannerWithZXing(active) {
  const ZX = window.ZXing;
  const hints = new Map();
  const formats = zxingFormats();
  if (formats.length && ZX?.DecodeHintType?.POSSIBLE_FORMATS) {
    hints.set(ZX.DecodeHintType.POSSIBLE_FORMATS, formats);
  }

  const reader = new ZX.BrowserMultiFormatReader(hints, 320);
  state.zxingReader = reader;
  await reader.decodeFromConstraints(
    {
      video: {
        facingMode: { ideal: "environment" },
      },
      audio: false,
    },
    active.video,
    async (result) => {
      if (!result) return;
      if (state.scanBusy) return;
      state.scanBusy = true;
      try {
        const value = typeof result.getText === "function" ? result.getText() : String(result.text || "");
        await processScanValue(value);
      } finally {
        state.scanBusy = false;
      }
    }
  );
}

async function startScanner() {
  const active = getActiveScannerRefs();
  if (!navigator.mediaDevices?.getUserMedia) {
    setScanStatus("Камера недоступна в этом браузере.", { refsOverride: active });
    hapticWarning();
    return;
  }

  try {
    setScanStatus(scannerIdleHint(), { refsOverride: active });
    if (zxingSupported()) {
      setScanStatus("Сканирование запущено (ZXing)...", { refsOverride: active });
      await startScannerWithZXing(active);
      updateMobileScanFab();
      return;
    }

    const stream = await openPreferredCameraStream();

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
    if (state.zxingReader) {
      try {
        state.zxingReader.reset();
      } catch {
        // ignore
      }
      state.zxingReader = null;
    }
    setScanStatus("Нет доступа к камере.", { refsOverride: active });
    updateMobileScanFab();
    hapticWarning();
  }
}

function stopScanner() {
  setScanStatus(scannerIdleHint());
  if (refs.modalScanStatus) {
    refs.modalScanStatus.textContent = scannerIdleHint();
    refs.modalScanStatus.classList.remove("is-busy");
  }
  stopScanLoops();

  if (state.zxingReader) {
    try {
      state.zxingReader.reset();
    } catch {
      // ignore
    }
    state.zxingReader = null;
  }

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
    toggleAccountMenu();
    return;
  }

  openAuthModal();
});
if (refs.homeProfileBtn) refs.homeProfileBtn.addEventListener("click", () => {
  hapticSelection();
  if (!state.user?.email || !state.token) {
    openAuthModal();
    return;
  }
  openSettingsView().catch((error) => {
    showToast(error.message);
    hapticWarning();
  });
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
if (refs.openFilmsTile) refs.openFilmsTile.addEventListener("click", () => {
  setModuleView("inventory");
  setInventoryTab("films");
  setTimeout(() => refs.filmsSearchInput?.focus(), 120);
});
if (refs.homeScanBtn) refs.homeScanBtn.addEventListener("click", async () => {
  openScanModal();
  await startScanner();
});
if (refs.homeProcessSearch) refs.homeProcessSearch.addEventListener("input", renderHomeProcessCards);
refs.homeBtn.addEventListener("click", () => setModuleView("home"));
refs.mainTabBtn.addEventListener("click", () => setInventoryTab("main"));
if (refs.filmsTabBtn) refs.filmsTabBtn.addEventListener("click", () => setInventoryTab("films"));
refs.toolsTabBtn.addEventListener("click", () => setInventoryTab("tools"));
refs.historyTabBtn.addEventListener("click", () => setInventoryTab("history"));
refs.toToolsBtn.addEventListener("click", () => setInventoryTab("tools"));
refs.closeOnboardingBtn.addEventListener("click", closeOnboarding);
refs.openSettingsBtn.addEventListener("click", async () => {
  closeAccountMenu();
  try {
    await openSettingsView();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});
refs.settingsBackBtn.addEventListener("click", () => setModuleView("inventory"));
if (refs.openRemindersSettingsBtn) refs.openRemindersSettingsBtn.addEventListener("click", () => {
  fillSettingsForm();
  openSimpleModal(refs.remindersSettingsModal);
});
if (refs.openDisplaySettingsBtn) refs.openDisplaySettingsBtn.addEventListener("click", () => {
  fillDisplayPrefsForm();
  openSimpleModal(refs.displaySettingsModal);
});
if (refs.closeRemindersSettingsBtn) refs.closeRemindersSettingsBtn.addEventListener("click", () => closeSimpleModal(refs.remindersSettingsModal));
if (refs.remindersSettingsBackdrop) refs.remindersSettingsBackdrop.addEventListener("click", () => closeSimpleModal(refs.remindersSettingsModal));
if (refs.closeDisplaySettingsBtn) refs.closeDisplaySettingsBtn.addEventListener("click", () => closeSimpleModal(refs.displaySettingsModal));
if (refs.displaySettingsBackdrop) refs.displaySettingsBackdrop.addEventListener("click", () => closeSimpleModal(refs.displaySettingsModal));
refs.requestLogoutBtn.addEventListener("click", () => {
  closeAccountMenu();
  openLogoutModal();
});
refs.cancelLogoutBtn.addEventListener("click", closeLogoutModal);
refs.confirmLogoutBtn.addEventListener("click", performLogout);
refs.logoutBackdrop.addEventListener("click", closeLogoutModal);

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

    applyUserFromServer(data.user, data.token);
    state.profileLoaded = false;
    closeAuthModal();
    await runDbAction(
      async () => {
        await loadItems();
        await loadHistory();
        await loadFilms();
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

if (refs.settingsForm) refs.settingsForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!refs.settingsForm.reportValidity() || !state.token) return;
  const submitBtn = event.submitter instanceof HTMLButtonElement ? event.submitter : null;

  try {
    const data = await runDbAction(
      () =>
        apiRequest("/api/auth/profile", {
          method: "PATCH",
          body: {
            firstName: refs.settingsFirstName.value.trim(),
            lastName: refs.settingsLastName.value.trim(),
            email: refs.settingsEmail.value.trim().toLowerCase(),
            telegramChatId: refs.settingsTelegramChatId.value.trim(),
            password: refs.settingsPassword.value,
            lowStockNotifications: refs.settingsLowStockToggle.checked,
            reminderItemIds: selectedReminderItemIds(),
            reminderIntervalMinutes: Number(refs.settingsReminderInterval.value || 0),
          },
        }),
      { button: submitBtn, message: "Сохраняем настройки..." }
    );
    applyUserFromServer(data.user, data.token);
    fillSettingsForm();
    showToast("Настройки сохранены");
    hapticSuccess();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});

if (refs.settingsNotificationsSaveBtn) refs.settingsNotificationsSaveBtn.addEventListener("click", async (event) => {
  const submitBtn = event.currentTarget instanceof HTMLButtonElement ? event.currentTarget : null;
  try {
    await saveNotificationsSettings(submitBtn);
    closeSimpleModal(refs.remindersSettingsModal);
    showToast("Уведомления сохранены");
    hapticSuccess();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});

if (refs.displaySettingsForm) refs.displaySettingsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  readDisplayPrefsForm();
  saveDisplayPrefs();
  state.pages.items = 1;
  state.pages.history = 1;
  state.pages.alerts = 1;
  state.pages.films = 1;
  state.pages.adminUsers = 1;
  state.pages.adminHistory = 1;
  renderTable(filteredItems());
  renderFilmsTable(filteredFilms());
  renderHistory();
  renderAlerts();
  renderAdminUsers(state.adminUsers);
  renderAdminHistory(state.adminHistory);
  closeSimpleModal(refs.displaySettingsModal);
  showToast("Настройки отображения сохранены");
  hapticSuccess();
});

if (refs.adminHistoryLoadBtn) refs.adminHistoryLoadBtn.addEventListener("click", async () => {
  try {
    await runDbAction(() => loadAdminHistoryByUser(), {
      button: refs.adminHistoryLoadBtn,
      message: "Загружаем историю пользователя...",
    });
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});

if (refs.adminAnnounceForm) refs.adminAnnounceForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!canAdmin()) {
    showToast("Только для администратора");
    hapticWarning();
    return;
  }
  const submitBtn = event.submitter instanceof HTMLButtonElement ? event.submitter : null;
  const message = refs.adminAnnounceText.value.trim();
  if (!message) {
    showToast("Введите текст анонса");
    return;
  }
  try {
    const result = await runDbAction(
      () =>
        apiRequest("/api/admin/announce", {
          method: "POST",
          body: {
            role: refs.adminAnnounceRole.value,
            message,
          },
        }),
      { button: submitBtn, message: "Отправляем анонс..." }
    );
    refs.adminAnnounceText.value = "";
    showToast(`Анонс отправлен: ${result.sent}/${result.total}`);
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
          groupName: refs.itemGroup.value,
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
          groupName: refs.editItemGroup.value,
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
refs.applyMainFiltersBtn.addEventListener("click", handleSearch);
refs.resetMainFiltersBtn.addEventListener("click", resetMainFilters);
refs.mainGroupFilter.addEventListener("change", handleSearch);
refs.mainStockFilter.addEventListener("change", handleSearch);
if (refs.exportInventoryBtn) refs.exportInventoryBtn.addEventListener("click", async () => {
  try {
    await exportInventoryCsv();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});
if (refs.exportInventorySheetBtn) refs.exportInventorySheetBtn.addEventListener("click", async () => {
  try {
    await exportInventorySheetCsv();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});
if (refs.importInventoryBtn && refs.importInventoryFile) refs.importInventoryBtn.addEventListener("click", () => {
  if (!canDesktopPrint()) {
    showToast("Импорт доступен только на ПК");
    return;
  }
  refs.importInventoryFile.value = "";
  refs.importInventoryFile.click();
});
if (refs.importInventoryFile) refs.importInventoryFile.addEventListener("change", async () => {
  const file = refs.importInventoryFile.files?.[0];
  if (!file) return;
  try {
    await runDbAction(() => importInventoryCsv(file), { message: "Импортируем расходники..." });
    hapticSuccess();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});

if (refs.filmForm) refs.filmForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!refs.filmForm.reportValidity()) return;
  const submitBtn = event.submitter instanceof HTMLButtonElement ? event.submitter : null;
  try {
    await runDbAction(
      () =>
        saveFilm({
          name: refs.filmName.value.trim(),
          barcode: refs.filmBarcode.value.trim(),
          cellNo: refs.filmCellNo.value.trim(),
        }),
      { button: submitBtn, message: "Сохраняем пленку..." }
    );
    refs.filmForm.reset();
    showToast("Пленка сохранена");
    hapticSuccess();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});

if (refs.quickFilmCellNo) refs.quickFilmCellNo.addEventListener("input", () => {
  state.quickFilm.cellNo = String(refs.quickFilmCellNo.value || "").trim();
});

if (refs.quickFilmBarcodeInput) refs.quickFilmBarcodeInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  const ok = addQuickFilmBarcode(refs.quickFilmBarcodeInput.value);
  if (ok) {
    refs.quickFilmBarcodeInput.value = "";
    hapticSelection();
  }
});

if (refs.quickFilmAddBarcodeBtn) refs.quickFilmAddBarcodeBtn.addEventListener("click", () => {
  const ok = addQuickFilmBarcode(refs.quickFilmBarcodeInput?.value || "");
  if (ok && refs.quickFilmBarcodeInput) {
    refs.quickFilmBarcodeInput.value = "";
    refs.quickFilmBarcodeInput.focus();
    hapticSelection();
  }
});

if (refs.quickFilmClearBatchBtn) refs.quickFilmClearBatchBtn.addEventListener("click", () => {
  resetQuickFilmBatch(true);
  refs.quickFilmBarcodeInput?.focus();
  showToast("Список сканов очищен");
});

if (refs.quickFilmMissingNames) refs.quickFilmMissingNames.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;
  const barcode = String(target.getAttribute("data-quick-film-name") || "").trim();
  if (!barcode) return;
  state.quickFilm.manualNames[barcode] = target.value.trim();
});

if (refs.quickFilmCellForm) refs.quickFilmCellForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!canAdmin()) {
    showToast("Только для администратора");
    hapticWarning();
    return;
  }
  const submitBtn = event.submitter instanceof HTMLButtonElement ? event.submitter : null;
  const cellNo = String(refs.quickFilmCellNo?.value || "").trim();
  if (!cellNo) {
    showToast("Укажите номер ячейки");
    refs.quickFilmCellNo?.focus();
    return;
  }

  const grouped = quickFilmGroupedBatch();
  if (!grouped.length) {
    showToast("Список штрихкодов пуст");
    refs.quickFilmBarcodeInput?.focus();
    return;
  }

  const rows = [];
  for (const entry of grouped) {
    const barcode = String(entry.barcode || "").trim();
    const knownName = knownFilmNameByBarcode(barcode);
    const manualName = String(state.quickFilm.manualNames[barcode] || "").trim();
    const name = knownName || manualName;
    if (!name) {
      showToast(`Заполните название для ${barcode}`);
      const field = refs.quickFilmMissingNames?.querySelector(`input[data-quick-film-name="${barcode}"]`);
      if (field instanceof HTMLInputElement) field.focus();
      return;
    }
    rows.push({ name, barcode, cellNo });
  }

  try {
    const reportData = await runDbAction(
      () =>
        apiRequest("/api/films?action=bulk-upsert", {
          method: "POST",
          body: { rows },
        }),
      { button: submitBtn, message: "Массово сохраняем пленки..." }
    );
    await loadFilms();
    const duplicatesIgnored = state.quickFilm.scannedBarcodes.length - rows.length;
    resetQuickFilmBatch(true);
    refs.quickFilmBarcodeInput?.focus();
    const saved = Number(reportData?.report?.success || 0);
    showToast(
      duplicatesIgnored > 0
        ? `Сохранено ${saved}. Повторы в той же ячейке: ${duplicatesIgnored} (объединены)`
        : `Сохранено ${saved}`
    );
    hapticSuccess();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});

if (refs.quickFilmNextCellBtn) refs.quickFilmNextCellBtn.addEventListener("click", () => {
  resetQuickFilmBatch(false);
  if (refs.quickFilmCellNo) {
    refs.quickFilmCellNo.value = "";
    refs.quickFilmCellNo.focus();
  }
  showToast("Готово. Укажите следующую ячейку");
  hapticSelection();
});

if (refs.filmsSearchBtn) refs.filmsSearchBtn.addEventListener("click", handleFilmsSearch);
if (refs.filmsSearchInput) refs.filmsSearchInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  handleFilmsSearch();
});
if (refs.filmsBarcodeFilter) refs.filmsBarcodeFilter.addEventListener("change", handleFilmsSearch);
if (refs.filmsCellFilter) refs.filmsCellFilter.addEventListener("change", handleFilmsSearch);
if (refs.applyFilmsFiltersBtn) refs.applyFilmsFiltersBtn.addEventListener("click", handleFilmsSearch);
if (refs.resetFilmsFiltersBtn) refs.resetFilmsFiltersBtn.addEventListener("click", resetFilmsFilters);
if (refs.filmsGroupWithBtn) refs.filmsGroupWithBtn.addEventListener("click", () => {
  state.filmsGroup = "with";
  state.pages.films = 1;
  renderFilmsTable(filteredFilms());
  hapticSelection();
});
if (refs.filmsGroupWithoutBtn) refs.filmsGroupWithoutBtn.addEventListener("click", () => {
  state.filmsGroup = "without";
  state.pages.films = 1;
  renderFilmsTable(filteredFilms());
  hapticSelection();
});
if (refs.downloadFilmsTemplateBtn) refs.downloadFilmsTemplateBtn.addEventListener("click", async () => {
  try {
    await downloadFilmsTemplate();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});
if (refs.importFilmsExcelBtn && refs.importFilmsFile) refs.importFilmsExcelBtn.addEventListener("click", () => {
  if (!canDesktopPrint()) {
    showToast("Импорт доступен только на ПК");
    return;
  }
  refs.importFilmsFile.value = "";
  refs.importFilmsFile.click();
});
if (refs.importFilmsFile) refs.importFilmsFile.addEventListener("change", async () => {
  const file = refs.importFilmsFile.files?.[0];
  if (!file) return;
  try {
    await runDbAction(() => importFilmsExcel(file), { message: "Импортируем пленки..." });
    hapticSuccess();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});
if (refs.filmsStartScanBtn) refs.filmsStartScanBtn.addEventListener("click", async () => {
  state.scanContext = "films";
  openScanModal();
  await startScanner();
});
if (refs.filmsTableBody) refs.filmsTableBody.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const button = target.closest("button[data-film-action]");
  if (!(button instanceof HTMLButtonElement)) return;
  const action = String(button.getAttribute("data-film-action") || "");
  const barcode = String(button.getAttribute("data-film-barcode") || "").trim();

  try {
    if (action === "clone") {
      const films = state.films.filter((x) => String(x.barcode) === barcode);
      if (!films.length) return;
      state.scanFilmMatches = films;
      openFilmAddModalFromScan();
      return;
    }
    if (action === "delete") {
      const films = state.films.filter((x) => String(x.barcode) === barcode);
      if (!films.length) return;
      state.scanFilmMatches = films;
      openFilmDeleteModalFromScan();
      hapticSelection();
    }
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});

refs.groupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!canAdmin()) {
    showToast("Только для администратора");
    hapticWarning();
    return;
  }
  const name = refs.groupNameInput.value.trim();
  if (!name) {
    showToast("Введите название группы");
    return;
  }
  const submitBtn = event.submitter instanceof HTMLButtonElement ? event.submitter : null;
  try {
    await runDbAction(
      () =>
        apiRequest("/api/inventory/groups", {
          method: "POST",
          body: { name },
        }),
      { button: submitBtn, message: "Создаем группу..." }
    );
    const groupsData = await apiRequest("/api/inventory/groups");
    state.groups = groupsData.groups || [];
    renderGroupOptions();
    refs.groupNameInput.value = "";
    showToast("Группа создана");
    hapticSuccess();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
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
if (refs.closeFilmFoundBtn) refs.closeFilmFoundBtn.addEventListener("click", closeFilmFoundModal);
if (refs.filmFoundBackdrop) refs.filmFoundBackdrop.addEventListener("click", closeFilmFoundModal);
if (refs.closeFilmAddBtn) refs.closeFilmAddBtn.addEventListener("click", closeFilmAddModal);
if (refs.filmAddBackdrop) refs.filmAddBackdrop.addEventListener("click", closeFilmAddModal);
if (refs.closeFilmDeleteBtn) refs.closeFilmDeleteBtn.addEventListener("click", closeFilmDeleteModal);
if (refs.filmDeleteBackdrop) refs.filmDeleteBackdrop.addEventListener("click", closeFilmDeleteModal);
if (refs.filmFoundAddBtn) refs.filmFoundAddBtn.addEventListener("click", () => {
  closeFilmFoundModal();
  openFilmAddModalFromScan();
});
if (refs.filmFoundDeleteBtn) refs.filmFoundDeleteBtn.addEventListener("click", () => {
  closeFilmFoundModal();
  openFilmDeleteModalFromScan();
});
if (refs.filmAddForm) refs.filmAddForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!refs.filmAddForm.reportValidity()) return;
  const submitBtn = event.submitter instanceof HTMLButtonElement ? event.submitter : null;
  try {
    await runDbAction(
      () =>
        saveFilm({
          name: refs.filmAddName.value.trim(),
          barcode: refs.filmAddBarcode.value.trim(),
          cellNo: refs.filmAddCellNo.value.trim(),
        }),
      { button: submitBtn, message: "Добавляем пленку в ячейку..." }
    );
    closeFilmAddModal();
    showToast("Пленка добавлена в новую ячейку");
    hapticSuccess();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});
if (refs.filmDeleteForm) refs.filmDeleteForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!refs.filmDeleteForm.reportValidity()) return;
  const submitBtn = event.submitter instanceof HTMLButtonElement ? event.submitter : null;
  const sample = state.scanFilmMatches?.[0];
  if (!sample) return;
  const cell = String(refs.filmDeleteCellSelect.value || "").trim();
  if (!cell) return;

  try {
    await runDbAction(
      () => deleteFilm(String(sample.barcode || ""), cell),
      { button: submitBtn, message: "Удаляем пленку из выбранной ячейки..." }
    );
    closeFilmDeleteModal();
    showToast(`Удалено из ячейки ${cell}`);
    hapticSuccess();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});

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

document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (refs.accountMenu.hidden) return;
  const insideButton = refs.openAuthBtn.contains(target);
  const insideHomeProfile = refs.homeProfileBtn?.contains(target);
  const insideMenu = refs.accountMenu.contains(target);
  if (!insideButton && !insideHomeProfile && !insideMenu) {
    closeAccountMenu();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAuthModal();
    closeEditModal();
    closeScanModal();
    closeLogoutModal();
    closeSimpleModal(refs.remindersSettingsModal);
    closeSimpleModal(refs.displaySettingsModal);
    closeFilmFoundModal();
    closeFilmAddModal();
    closeFilmDeleteModal();
    closeAccountMenu();
    stopScanner();
  }
});

window.addEventListener("resize", () => {
  applyPrintAccess();
  renderTable();
  renderFilmsTable(filteredFilms());
});

setAuthTab("login");
setModuleView("home");
setInventoryTab("main");
loadDisplayPrefs();
sanitizeInitialSession();
updateAuthButton();
applyRoleAccess();
applyPrintAccess();
initCollapsiblePanels();
fillDisplayPrefsForm();
renderHomeProcessCards();
renderQuickFilmBatch();
loadItems();
loadHistory();
loadFilms();
initTelegram();
updateMobileScanFab();

if (!localStorage.getItem(ONBOARDING_KEY)) {
  openOnboarding();
}
