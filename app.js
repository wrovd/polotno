const state = {
  authTab: "login",
  moduleView: "home",
  inventoryTab: "main",
  inventoryContext: "consumables",
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
  chatThreads: [],
  chatMessages: [],
  chatActiveThreadId: "",
  chatDraftFiles: [],
  chatCreateKind: "direct",
  chatUsers: [],
  chatReplyTo: null,
  chatForwardMessage: null,
  chatLocalMessageMeta: {},
  chatMessageActionsForId: "",
  chatPollTimer: null,
  chatPollingBusy: false,
  homeNotifications: [],
  homeNotificationsUnread: 0,
  homeNotificationsPollTimer: null,
  tasks: [],
  taskViewMode: "board",
  boxCatalog: [],
  boxTrackingEntries: [],
  boxSearchResult: [],
  boxDraftItems: [],
  boxFilters: {
    search: "",
    location: "",
  },
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
  itemsLoading: false,
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
    boxTracked: 1,
  },
  stats: {
    dateFrom: "",
    dateTo: "",
    granularity: "day",
    series: [],
    users: [],
    totalDeleted: 0,
  },
  qrLogin: {
    pollTimer: null,
    pollKey: "",
    expiresAt: "",
  },
};

const ONBOARDING_KEY = "polotno_onboarding_seen_v1";
const DISPLAY_PREFS_KEY = "polotno_display_prefs_v1";

function homeNotificationsSeenKey() {
  const email = String(state.user?.email || "guest").trim().toLowerCase() || "guest";
  return `polotno_home_notifications_seen_${email}`;
}

const refs = {
  openAuthBtn: document.getElementById("openAuthBtn"),
  accountMenu: document.getElementById("accountMenu"),
  openSettingsBtn: document.getElementById("openSettingsBtn"),
  requestLogoutBtn: document.getElementById("requestLogoutBtn"),
  authModal: document.getElementById("authModal"),
  authBackdrop: document.getElementById("authBackdrop"),
  closeAuthBtn: document.getElementById("closeAuthBtn"),
  openQrDesktopLoginBtn: document.getElementById("openQrDesktopLoginBtn"),
  openQrMobileConfirmBtn: document.getElementById("openQrMobileConfirmBtn"),
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
  openProductsSearchTile: document.getElementById("openProductsSearchTile"),
  openChatHomeTile: document.getElementById("openChatHomeTile"),
  openTasksHomeTile: document.getElementById("openTasksHomeTile"),
  openHistoryHomeTile: document.getElementById("openHistoryHomeTile"),
  openStatsHomeTile: document.getElementById("openStatsHomeTile"),
  openSettingsHomeTile: document.getElementById("openSettingsHomeTile"),
  homeNavInventoryBtn: document.getElementById("homeNavInventoryBtn"),
  homeNavFilmsBtn: document.getElementById("homeNavFilmsBtn"),
  homeNavBoxesBtn: document.getElementById("homeNavBoxesBtn"),
  homeNavChatBtn: document.getElementById("homeNavChatBtn"),
  homeNavTasksBtn: document.getElementById("homeNavTasksBtn"),
  homeNavHistoryBtn: document.getElementById("homeNavHistoryBtn"),
  homeNavStatsBtn: document.getElementById("homeNavStatsBtn"),
  homeNavSettingsBtn: document.getElementById("homeNavSettingsBtn"),
  homeProfileBtn: document.getElementById("homeProfileBtn"),
  homeBellBtn: document.getElementById("homeBellBtn"),
  homeBellBadge: document.getElementById("homeBellBadge"),
  homeNotificationsPopover: document.getElementById("homeNotificationsPopover"),
  homeNotificationsList: document.getElementById("homeNotificationsList"),
  homeNotificationsBrowserBtn: document.getElementById("homeNotificationsBrowserBtn"),
  homeNotificationsBrowserBtnText: document.getElementById("homeNotificationsBrowserBtnText"),
  homeNotificationsMarkReadBtn: document.getElementById("homeNotificationsMarkReadBtn"),
  homeNotificationsCloseBtn: document.getElementById("homeNotificationsCloseBtn"),
  homeAuthCaption: document.getElementById("homeAuthCaption"),
  homeAuthEmail: document.getElementById("homeAuthEmail"),
  homeProcessSearch: document.getElementById("homeProcessSearch"),
  homeProcessGrid: document.getElementById("homeProcessGrid"),
  homeProcessCounter: document.getElementById("homeProcessCounter"),
  homeSummaryItems: document.getElementById("homeSummaryItems"),
  homeSummaryLow: document.getElementById("homeSummaryLow"),
  homeSummaryFilms: document.getElementById("homeSummaryFilms"),
  homeSummaryDeleted: document.getElementById("homeSummaryDeleted"),
  homeSummaryBoxes: document.getElementById("homeSummaryBoxes"),
  homeScanBtn: document.getElementById("homeScanBtn"),
  desktopNavHomeBtn: document.getElementById("desktopNavHomeBtn"),
  desktopNavInventoryBtn: document.getElementById("desktopNavInventoryBtn"),
  desktopNavFilmsBtn: document.getElementById("desktopNavFilmsBtn"),
  desktopNavBoxesBtn: document.getElementById("desktopNavBoxesBtn"),
  desktopNavChatBtn: document.getElementById("desktopNavChatBtn"),
  desktopNavTasksBtn: document.getElementById("desktopNavTasksBtn"),
  desktopNavHistoryBtn: document.getElementById("desktopNavHistoryBtn"),
  desktopNavStatsBtn: document.getElementById("desktopNavStatsBtn"),
  desktopNavSettingsBtn: document.getElementById("desktopNavSettingsBtn"),
  homeBtn: document.getElementById("homeBtn"),
  inventoryTabsRow: document.getElementById("inventoryTabsRow"),
  mainTabBtn: document.getElementById("mainTabBtn"),
  filmsTabBtn: document.getElementById("filmsTabBtn"),
  boxSearchTabBtn: document.getElementById("boxSearchTabBtn"),
  chatTabBtn: document.getElementById("chatTabBtn"),
  tasksTabBtn: document.getElementById("tasksTabBtn"),
  toolsTabBtn: document.getElementById("toolsTabBtn"),
  historyTabBtn: document.getElementById("historyTabBtn"),
  statsTabBtn: document.getElementById("statsTabBtn"),
  mainTab: document.getElementById("mainTab"),
  filmsTab: document.getElementById("filmsTab"),
  boxSearchTab: document.getElementById("boxSearchTab"),
  chatTab: document.getElementById("chatTab"),
  tasksTab: document.getElementById("tasksTab"),
  toolsTab: document.getElementById("toolsTab"),
  historyTab: document.getElementById("historyTab"),
  statsTab: document.getElementById("statsTab"),
  historyList: document.getElementById("historyList"),
  historyPager: document.getElementById("historyPager"),
  settingsQrConfirmBtn: document.getElementById("settingsQrConfirmBtn"),
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
  qrLoginModal: document.getElementById("qrLoginModal"),
  qrLoginBackdrop: document.getElementById("qrLoginBackdrop"),
  closeQrLoginModalBtn: document.getElementById("closeQrLoginModalBtn"),
  qrLoginImage: document.getElementById("qrLoginImage"),
  qrLoginStatus: document.getElementById("qrLoginStatus"),
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
  statsFiltersForm: document.getElementById("statsFiltersForm"),
  statsDateFrom: document.getElementById("statsDateFrom"),
  statsDateTo: document.getElementById("statsDateTo"),
  statsGranularity: document.getElementById("statsGranularity"),
  statsApplyBtn: document.getElementById("statsApplyBtn"),
  statsTotalDeleted: document.getElementById("statsTotalDeleted"),
  statsActiveUsers: document.getElementById("statsActiveUsers"),
  statsPeakLabel: document.getElementById("statsPeakLabel"),
  statsChart: document.getElementById("statsChart"),
  statsUsersList: document.getElementById("statsUsersList"),
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
  filmsHeaderBulkBtn: document.getElementById("filmsHeaderBulkBtn"),
  filmsHeaderAddBtn: document.getElementById("filmsHeaderAddBtn"),
  filmsCloseBulkPanelBtn: document.getElementById("filmsCloseBulkPanelBtn"),
  filmsCloseSinglePanelBtn: document.getElementById("filmsCloseSinglePanelBtn"),
  filmsBarcodeFilter: document.getElementById("filmsBarcodeFilter"),
  filmsCellFilter: document.getElementById("filmsCellFilter"),
  applyFilmsFiltersBtn: document.getElementById("applyFilmsFiltersBtn"),
  resetFilmsFiltersBtn: document.getElementById("resetFilmsFiltersBtn"),
  downloadFilmsTemplateBtn: document.getElementById("downloadFilmsTemplateBtn"),
  importFilmsExcelBtn: document.getElementById("importFilmsExcelBtn"),
  importFilmsFile: document.getElementById("importFilmsFile"),
  filmForm: document.getElementById("filmForm"),
  filmSinglePanel: document.getElementById("filmSinglePanel"),
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
  filmsCardsList: document.getElementById("filmsCardsList"),
  filmsTableBody: document.getElementById("filmsTableBody"),
  filmsPager: document.getElementById("filmsPager"),
  filmsGroupWithBtn: document.getElementById("filmsGroupWithBtn"),
  filmsGroupWithoutBtn: document.getElementById("filmsGroupWithoutBtn"),
  boxSearchInput: document.getElementById("boxSearchInput"),
  boxSearchBtn: document.getElementById("boxSearchBtn"),
  boxCreateToggleBtn: document.getElementById("boxCreateToggleBtn"),
  boxCreatePanel: document.getElementById("boxCreatePanel"),
  boxCreateCloseBtn: document.getElementById("boxCreateCloseBtn"),
  boxLocationFilter: document.getElementById("boxLocationFilter"),
  boxApplyFiltersBtn: document.getElementById("boxApplyFiltersBtn"),
  boxResetFiltersBtn: document.getElementById("boxResetFiltersBtn"),
  downloadBoxCatalogTemplateBtn: document.getElementById("downloadBoxCatalogTemplateBtn"),
  importBoxCatalogBtn: document.getElementById("importBoxCatalogBtn"),
  importBoxCatalogFile: document.getElementById("importBoxCatalogFile"),
  boxScanBarcodeBtn: document.getElementById("boxScanBarcodeBtn"),
  boxScanResultList: document.getElementById("boxScanResultList"),
  boxCreateForm: document.getElementById("boxCreateForm"),
  boxCodeInput: document.getElementById("boxCodeInput"),
  boxLocationInput: document.getElementById("boxLocationInput"),
  boxItemBarcodeInput: document.getElementById("boxItemBarcodeInput"),
  boxItemNameInput: document.getElementById("boxItemNameInput"),
  boxItemQtyInput: document.getElementById("boxItemQtyInput"),
  boxCatalogSearchInput: document.getElementById("boxCatalogSearchInput"),
  boxCatalogOptions: document.getElementById("boxCatalogOptions"),
  boxGenerateCodeBtn: document.getElementById("boxGenerateCodeBtn"),
  boxPrintCodeBtn: document.getElementById("boxPrintCodeBtn"),
  boxAddItemBtn: document.getElementById("boxAddItemBtn"),
  boxItemsTextarea: document.getElementById("boxItemsTextarea"),
  boxDraftItemsList: document.getElementById("boxDraftItemsList"),
  boxClearDraftBtn: document.getElementById("boxClearDraftBtn"),
  boxCreateSubmitBtn: document.getElementById("boxCreateSubmitBtn"),
  boxTrackedList: document.getElementById("boxTrackedList"),
  boxTrackedPager: document.getElementById("boxTrackedPager"),
  boxFoundModal: document.getElementById("boxFoundModal"),
  boxFoundBackdrop: document.getElementById("boxFoundBackdrop"),
  closeBoxFoundBtn: document.getElementById("closeBoxFoundBtn"),
  boxFoundSummary: document.getElementById("boxFoundSummary"),
  boxFoundList: document.getElementById("boxFoundList"),
  chatSearchInput: document.getElementById("chatSearchInput"),
  chatCreateBtn: document.getElementById("chatCreateBtn"),
  chatListCreateBtn: document.getElementById("chatListCreateBtn"),
  chatListSearchBtn: document.getElementById("chatListSearchBtn"),
  chatCreateGroupBtn: document.getElementById("chatCreateGroupBtn"),
  chatChannelsBtn: document.getElementById("chatChannelsBtn"),
  chatMenuPopover: document.getElementById("chatMenuPopover"),
  chatMenuNewDirectBtn: document.getElementById("chatMenuNewDirectBtn"),
  chatMenuNewGroupBtn: document.getElementById("chatMenuNewGroupBtn"),
  chatMenuNewChannelBtn: document.getElementById("chatMenuNewChannelBtn"),
  chatDrawer: document.getElementById("chatDrawer"),
  chatToggleListBtn: document.getElementById("chatToggleListBtn"),
  chatCloseListBtn: document.getElementById("chatCloseListBtn"),
  chatBackBtn: document.getElementById("chatBackBtn"),
  chatTopSearchBtn: document.getElementById("chatTopSearchBtn"),
  chatTopMenuBtn: document.getElementById("chatTopMenuBtn"),
  chatThreadAvatarLetter: document.getElementById("chatThreadAvatarLetter"),
  chatList: document.getElementById("chatList"),
  chatMessages: document.getElementById("chatMessages"),
  chatMessageActionsPopover: document.getElementById("chatMessageActionsPopover"),
  chatThreadTitle: document.getElementById("chatThreadTitle"),
  chatThreadMeta: document.getElementById("chatThreadMeta"),
  chatMessageForm: document.getElementById("chatMessageForm"),
  chatMessageInput: document.getElementById("chatMessageInput"),
  chatFileInput: document.getElementById("chatFileInput"),
  chatAttachBtn: document.getElementById("chatAttachBtn"),
  chatDropZone: document.getElementById("chatDropZone"),
  chatFilePreviewList: document.getElementById("chatFilePreviewList"),
  chatReplyPreview: document.getElementById("chatReplyPreview"),
  chatSendBtn: document.getElementById("chatSendBtn"),
  chatCreateModal: document.getElementById("chatCreateModal"),
  chatCreateBackdrop: document.getElementById("chatCreateBackdrop"),
  closeChatCreateBtn: document.getElementById("closeChatCreateBtn"),
  chatCreateForm: document.getElementById("chatCreateForm"),
  chatCreateModalTitle: document.getElementById("chatCreateModalTitle"),
  chatCreateKind: document.getElementById("chatCreateKind"),
  chatCreateTitleInput: document.getElementById("chatCreateTitleInput"),
  chatCreateMemberSelect: document.getElementById("chatCreateMemberSelect"),
  chatCreateMembersSelect: document.getElementById("chatCreateMembersSelect"),
  chatCreateMemberSingleWrap: document.getElementById("chatCreateMemberSingleWrap"),
  chatCreateMembersWrap: document.getElementById("chatCreateMembersWrap"),
  chatCreateSubmitBtn: document.getElementById("chatCreateSubmitBtn"),
  chatForwardModal: document.getElementById("chatForwardModal"),
  chatForwardBackdrop: document.getElementById("chatForwardBackdrop"),
  closeChatForwardBtn: document.getElementById("closeChatForwardBtn"),
  chatForwardList: document.getElementById("chatForwardList"),
  chatReadStatusModal: document.getElementById("chatReadStatusModal"),
  chatReadStatusBackdrop: document.getElementById("chatReadStatusBackdrop"),
  closeChatReadStatusBtn: document.getElementById("closeChatReadStatusBtn"),
  chatReadStatusSummary: document.getElementById("chatReadStatusSummary"),
  chatReadStatusList: document.getElementById("chatReadStatusList"),
  tasksSearchInput: document.getElementById("tasksSearchInput"),
  taskCreateBtn: document.getElementById("taskCreateBtn"),
  tasksBoardBtn: document.getElementById("tasksBoardBtn"),
  tasksListBtn: document.getElementById("tasksListBtn"),
  tasksFilterBtn: document.getElementById("tasksFilterBtn"),
  tasksTotalCount: document.getElementById("tasksTotalCount"),
  tasksTodoCount: document.getElementById("tasksTodoCount"),
  tasksInProgressCount: document.getElementById("tasksInProgressCount"),
  tasksReviewCount: document.getElementById("tasksReviewCount"),
  tasksDoneCount: document.getElementById("tasksDoneCount"),
  tasksBoard: document.getElementById("tasksBoard"),
  tasksListContainer: document.getElementById("tasksListContainer"),
  tasksTodoList: document.getElementById("tasksTodoList"),
  tasksInProgressList: document.getElementById("tasksInProgressList"),
  tasksReviewList: document.getElementById("tasksReviewList"),
  tasksDoneList: document.getElementById("tasksDoneList"),
  taskEditModal: document.getElementById("taskEditModal"),
  taskEditBackdrop: document.getElementById("taskEditBackdrop"),
  closeTaskEditBtn: document.getElementById("closeTaskEditBtn"),
  cancelTaskEditBtn: document.getElementById("cancelTaskEditBtn"),
  taskEditForm: document.getElementById("taskEditForm"),
  taskModalTitle: document.getElementById("taskModalTitle"),
  taskEditId: document.getElementById("taskEditId"),
  taskEditTitle: document.getElementById("taskEditTitle"),
  taskEditDescription: document.getElementById("taskEditDescription"),
  taskEditPriority: document.getElementById("taskEditPriority"),
  taskEditStatus: document.getElementById("taskEditStatus"),
  taskEditAssignee: document.getElementById("taskEditAssignee"),
  taskEditDueDate: document.getElementById("taskEditDueDate"),
  taskDetailModal: document.getElementById("taskDetailModal"),
  taskDetailBackdrop: document.getElementById("taskDetailBackdrop"),
  closeTaskDetailBtn: document.getElementById("closeTaskDetailBtn"),
  taskDetailTitle: document.getElementById("taskDetailTitle"),
  taskDetailMeta: document.getElementById("taskDetailMeta"),
  taskDetailDescription: document.getElementById("taskDetailDescription"),
  taskCommentsList: document.getElementById("taskCommentsList"),
  taskDetailEditBtn: document.getElementById("taskDetailEditBtn"),
  taskDetailDeleteBtn: document.getElementById("taskDetailDeleteBtn"),
  toToolsBtn: document.getElementById("toToolsBtn"),
  stockManagePanel: document.getElementById("stockManagePanel"),
  adjustPanel: document.getElementById("adjustPanel"),
  adjustForm: document.getElementById("adjustForm"),
  adjustItemId: document.getElementById("adjustItemId"),
  adjustDelta: document.getElementById("adjustDelta"),
  searchInput: document.getElementById("searchInput"),
  iosSearchInput: document.getElementById("iosSearchInput"),
  iosFiltersChipBtn: document.getElementById("iosFiltersChipBtn"),
  iosExportChipBtn: document.getElementById("iosExportChipBtn"),
  iosImportChipBtn: document.getElementById("iosImportChipBtn"),
  iosInventorySheetChipBtn: document.getElementById("iosInventorySheetChipBtn"),
  iosFilterParams: document.getElementById("iosFilterParams"),
  mainFiltersPanelTop: document.getElementById("mainFiltersPanelTop"),
  mainGroupFilterTop: document.getElementById("mainGroupFilterTop"),
  mainStockFilterTop: document.getElementById("mainStockFilterTop"),
  applyMainFiltersTopBtn: document.getElementById("applyMainFiltersTopBtn"),
  resetMainFiltersTopBtn: document.getElementById("resetMainFiltersTopBtn"),
  stockManagePanelTop: document.getElementById("stockManagePanelTop"),
  closeMainAddPanelTopBtn: document.getElementById("closeMainAddPanelTopBtn"),
  stockFormTop: document.getElementById("stockFormTop"),
  itemNameTop: document.getElementById("itemNameTop"),
  itemGroupTop: document.getElementById("itemGroupTop"),
  itemQtyTop: document.getElementById("itemQtyTop"),
  itemThresholdTop: document.getElementById("itemThresholdTop"),
  itemNotesTop: document.getElementById("itemNotesTop"),
  iosItemsPager: document.getElementById("iosItemsPager"),
  mainBackBtn: document.getElementById("mainBackBtn"),
  mainHeaderAddBtn: document.getElementById("mainHeaderAddBtn"),
  mainScanBtn: document.getElementById("mainScanBtn"),
  consumablesList: document.getElementById("consumablesList"),
  legacyMainLayout: document.getElementById("legacyMainLayout"),
  mainBottomAddBtn: document.getElementById("mainBottomAddBtn"),
  mainBottomMainBtn: document.getElementById("mainBottomMainBtn"),
  mainBottomToolsBtn: document.getElementById("mainBottomToolsBtn"),
  mainBottomHistoryBtn: document.getElementById("mainBottomHistoryBtn"),
  mainBottomSettingsBtn: document.getElementById("mainBottomSettingsBtn"),
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
  closeQrLoginModal();
  document.body.style.overflow = "";
}

function clearQrLoginPolling() {
  if (state.qrLogin.pollTimer) {
    clearInterval(state.qrLogin.pollTimer);
    state.qrLogin.pollTimer = null;
  }
  state.qrLogin.pollKey = "";
  state.qrLogin.expiresAt = "";
}

function closeQrLoginModal() {
  if (!refs.qrLoginModal) return;
  refs.qrLoginModal.hidden = true;
  if (refs.qrLoginImage) refs.qrLoginImage.removeAttribute("src");
  if (refs.qrLoginStatus) refs.qrLoginStatus.textContent = "Готовим QR-код...";
  clearQrLoginPolling();
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

function updateDesktopSidebarActive() {
  const map = {
    home: refs.desktopNavHomeBtn,
    inventory: refs.desktopNavInventoryBtn,
    films: refs.desktopNavFilmsBtn,
    boxes: refs.desktopNavBoxesBtn,
    chat: refs.desktopNavChatBtn,
    tasks: refs.desktopNavTasksBtn,
    history: refs.desktopNavHistoryBtn,
    stats: refs.desktopNavStatsBtn,
    settings: refs.desktopNavSettingsBtn,
  };
  Object.values(map).forEach((btn) => btn?.classList.remove("is-active"));

  if (state.moduleView === "home") {
    map.home?.classList.add("is-active");
    return;
  }
  if (state.moduleView === "settings") {
    map.settings?.classList.add("is-active");
    return;
  }
  if (state.moduleView !== "inventory") return;

  if (state.inventoryTab === "films") map.films?.classList.add("is-active");
  else if (state.inventoryTab === "box-search") map.boxes?.classList.add("is-active");
  else if (state.inventoryTab === "chat") map.chat?.classList.add("is-active");
  else if (state.inventoryTab === "tasks") map.tasks?.classList.add("is-active");
  else if (state.inventoryTab === "history") map.history?.classList.add("is-active");
  else if (state.inventoryTab === "stats") map.stats?.classList.add("is-active");
  else map.inventory?.classList.add("is-active");
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
  if (refs.mainBottomSettingsBtn) {
    refs.mainBottomSettingsBtn.classList.toggle("is-active", showSettings);
  }
  if (!showInventory) {
    stopScanner();
    state.scanContext = "inventory";
    stopChatPolling();
  }
  closeAccountMenu();
  closeHomeNotificationsPopover();
  updateMobileScanFab();
  updateDesktopSidebarActive();
  hapticSelection();
}

function setInventoryTab(tab) {
  state.inventoryTab = tab;
  const isMain = tab === "main";
  const isFilms = tab === "films";
  const isBoxSearch = tab === "box-search";
  const isChat = tab === "chat";
  const isTasks = tab === "tasks";
  const isTools = tab === "tools";
  const isHistory = tab === "history";
  const isStats = tab === "stats";
  if (isMain || isTools) state.inventoryContext = "consumables";
  if (isFilms || isStats) state.inventoryContext = "films";
  if (isBoxSearch) state.inventoryContext = "boxes";
  if (isChat) state.inventoryContext = "chat";
  if (isTasks) state.inventoryContext = "tasks";
  const isFilmsContext = state.inventoryContext === "films";
  const isBoxesContext = state.inventoryContext === "boxes";
  const isChatContext = state.inventoryContext === "chat";
  const isTasksContext = state.inventoryContext === "tasks";

  refs.mainTabBtn.classList.toggle("active", isMain);
  refs.filmsTabBtn.classList.toggle("active", isFilms);
  if (refs.boxSearchTabBtn) refs.boxSearchTabBtn.classList.toggle("active", isBoxSearch);
  if (refs.chatTabBtn) refs.chatTabBtn.classList.toggle("active", isChat);
  if (refs.tasksTabBtn) refs.tasksTabBtn.classList.toggle("active", isTasks);
  refs.toolsTabBtn.classList.toggle("active", isTools);
  refs.historyTabBtn.classList.toggle("active", isHistory);
  refs.statsTabBtn.classList.toggle("active", isStats);
  refs.mainTab.classList.toggle("active", isMain);
  refs.filmsTab.classList.toggle("active", isFilms);
  if (refs.boxSearchTab) refs.boxSearchTab.classList.toggle("active", isBoxSearch);
  if (refs.chatTab) refs.chatTab.classList.toggle("active", isChat);
  if (refs.tasksTab) refs.tasksTab.classList.toggle("active", isTasks);
  refs.toolsTab.classList.toggle("active", isTools);
  refs.historyTab.classList.toggle("active", isHistory);
  refs.statsTab.classList.toggle("active", isStats);
  const hideConsumablesTabs = isFilmsContext || isBoxesContext || isChatContext || isTasksContext;
  refs.mainTabBtn.classList.toggle("is-hidden", hideConsumablesTabs);
  refs.toolsTabBtn.classList.toggle("is-hidden", hideConsumablesTabs);
  refs.filmsTabBtn.classList.toggle("is-hidden", !isFilmsContext);
  refs.statsTabBtn.classList.toggle("is-hidden", !isFilmsContext);
  if (refs.boxSearchTabBtn) refs.boxSearchTabBtn.classList.toggle("is-hidden", !isBoxesContext);
  if (refs.chatTabBtn) refs.chatTabBtn.classList.toggle("is-hidden", !isChatContext);
  if (refs.tasksTabBtn) refs.tasksTabBtn.classList.toggle("is-hidden", !isTasksContext);
  if (refs.toToolsBtn) refs.toToolsBtn.classList.toggle("is-hidden", hideConsumablesTabs);
  if (refs.inventoryTabsRow) {
    refs.inventoryTabsRow.classList.toggle("context-tabs-consumables", !isFilmsContext && !isBoxesContext && !isChatContext && !isTasksContext);
    refs.inventoryTabsRow.classList.toggle("context-tabs-films", isFilmsContext);
    refs.inventoryTabsRow.classList.toggle("context-tabs-boxes", isBoxesContext);
    refs.inventoryTabsRow.classList.toggle("context-tabs-chat", isChatContext);
    refs.inventoryTabsRow.classList.toggle("context-tabs-tasks", isTasksContext);
  }
  if (!isChat) {
    setChatMenuOpen(false);
    setChatDrawerOpen(false);
    stopChatPolling();
  }
  if (refs.inventoryView) refs.inventoryView.classList.toggle("is-main-ios-mode", isMain);
  if (refs.inventoryView) refs.inventoryView.classList.toggle("is-films-mode", isFilms);
  if (refs.inventoryView) refs.inventoryView.classList.toggle("is-boxes-mode", isBoxSearch);
  if (refs.inventoryView) refs.inventoryView.classList.toggle("is-chat-mode", isChat);
  if (refs.mainBottomMainBtn) refs.mainBottomMainBtn.classList.toggle("is-active", isMain);
  if (refs.mainBottomToolsBtn) refs.mainBottomToolsBtn.classList.toggle("is-active", isTools);
  if (refs.mainBottomHistoryBtn) refs.mainBottomHistoryBtn.classList.toggle("is-active", isHistory);
  if (refs.mainBottomSettingsBtn) refs.mainBottomSettingsBtn.classList.toggle("is-active", state.moduleView === "settings");
  state.scanContext = isFilms ? "films" : isBoxSearch ? "box-search" : "inventory";
  if (isMain) {
    stopScanner();
  }
  if (isFilms) {
    stopScanner();
    loadFilms();
  }
  if (isBoxSearch) {
    stopScanner();
    loadBoxSearchData();
  }
  if (isChat || isTasks) {
    stopScanner();
  }
  if (isChat) {
    state.chatActiveThreadId = "";
    state.chatMessages = [];
    syncChatHeader(null);
    renderChatMessages();
    loadChatData().catch((error) => {
      showToast(error.message || "Не удалось загрузить чаты");
    });
    loadChatUsers().catch(() => {});
    startChatPolling();
    refreshChatRealtime().catch(() => {});
    syncChatLayoutMode();
  }
  if (isTasks) {
    loadTasks().catch((error) => {
      showToast(error.message || "Не удалось загрузить задачи");
    });
  }
  if (isHistory) {
    stopScanner();
    loadHistory();
  }
  if (isStats) {
    stopScanner();
    loadFilmDeleteStats();
  }
  updateMobileScanFab();
  updateDesktopSidebarActive();
  syncChatLayoutMode();
  hapticSelection();
}

function updateAuthButton() {
  const canConfirmQr = Boolean(state.user?.email && state.token);
  if (refs.settingsQrConfirmBtn) {
    refs.settingsQrConfirmBtn.classList.toggle("is-hidden", !canConfirmQr);
  }

  if (state.user?.email) {
    const role = String(state.user.role || "staff").toLowerCase();
    refs.openAuthBtn.innerHTML = `${iconSpan("user")}<span>${state.user.email} • ${role}</span>`;
    refs.openAuthBtn.classList.remove("primary-btn");
    refs.openAuthBtn.classList.add("glass-btn");
    if (refs.homeAuthCaption) refs.homeAuthCaption.textContent = "Добро пожаловать";
    if (refs.homeAuthEmail) refs.homeAuthEmail.textContent = state.user.name || state.user.email;
    void updateHomeProfilePhoto().catch(() => setHomeProfileButtonPhoto(""));
    return;
  }

  refs.openAuthBtn.innerHTML = `${iconSpan("lock")}<span>Войти</span>`;
  refs.openAuthBtn.classList.remove("glass-btn");
  refs.openAuthBtn.classList.add("primary-btn");
  if (refs.homeAuthCaption) refs.homeAuthCaption.textContent = "Добро пожаловать";
  if (refs.homeAuthEmail) refs.homeAuthEmail.textContent = "Гость";
  state.homeNotifications = [];
  state.homeNotificationsUnread = 0;
  renderHomeNotificationsBadge();
  renderHomeNotificationsPopover();
  closeHomeNotificationsPopover();
  setHomeProfileButtonPhoto("");
}

function renderHomeProcessCards() {
  if (!refs.homeProcessGrid) return;
  const query = String(refs.homeProcessSearch?.value || "").trim().toLowerCase();
  let visible = 0;
  refs.homeProcessGrid.querySelectorAll("[data-process-title]").forEach((node) => {
    const title = String(node.getAttribute("data-process-title") || "").toLowerCase();
    const isHidden = Boolean(query) && !title.includes(query);
    node.hidden = isHidden;
    if (!isHidden) visible += 1;
  });
  if (refs.homeProcessCounter) {
    refs.homeProcessCounter.textContent = String(visible);
  }
}

function renderHomeSummary() {
  const itemsCount = Array.isArray(state.items) ? state.items.length : 0;
  const lowCount = Array.isArray(state.items)
    ? state.items.filter((item) => Number(item.qty || 0) <= Number(item.threshold || 0)).length
    : 0;
  const filmsCount = Array.isArray(state.films)
    ? state.films.filter((film) => String(film.cell_no || "").trim() !== "").length
    : 0;
  const deletedCount = Array.isArray(state.history)
    ? state.history.filter((row) => String(row.reason || "") === "film_delete").length
    : 0;
  const boxesCount = Array.isArray(state.boxTrackingEntries)
    ? new Set(
        state.boxTrackingEntries
          .map((entry) => String(entry.box_code || "").trim())
          .filter(Boolean)
      ).size
    : 0;

  if (refs.homeSummaryItems) refs.homeSummaryItems.textContent = String(itemsCount);
  if (refs.homeSummaryLow) refs.homeSummaryLow.textContent = `${lowCount} ниже лимита`;
  if (refs.homeSummaryFilms) refs.homeSummaryFilms.textContent = String(filmsCount);
  if (refs.homeSummaryDeleted) refs.homeSummaryDeleted.textContent = `${deletedCount} удалено`;
  if (refs.homeSummaryBoxes) refs.homeSummaryBoxes.textContent = String(boxesCount);
}

function notificationTimeAgo(value) {
  if (!value) return "";
  const ts = new Date(value).getTime();
  if (!Number.isFinite(ts) || ts <= 0) return "";
  const diffMs = Date.now() - ts;
  if (diffMs < 60 * 1000) return "только что";
  const min = Math.floor(diffMs / (60 * 1000));
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ч`;
  const d = Math.floor(h / 24);
  return `${d} д`;
}

function getHomeNotificationsSeenAt() {
  const raw = localStorage.getItem(homeNotificationsSeenKey()) || "";
  const parsed = new Date(raw).getTime();
  if (!Number.isFinite(parsed) || parsed <= 0) return new Date(0).toISOString();
  return new Date(parsed).toISOString();
}

function setHomeNotificationsSeenNow() {
  const nowIso = new Date().toISOString();
  localStorage.setItem(homeNotificationsSeenKey(), nowIso);
}

function closeHomeNotificationsPopover() {
  if (!refs.homeNotificationsPopover) return;
  refs.homeNotificationsPopover.hidden = true;
}

function getBrowserNotificationsPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return String(Notification.permission || "default");
}

function syncHomeNotificationsBrowserButton() {
  if (!refs.homeNotificationsBrowserBtn) return;
  const permission = getBrowserNotificationsPermission();
  refs.homeNotificationsBrowserBtn.classList.remove("is-enabled", "is-blocked");
  if (permission === "granted") {
    refs.homeNotificationsBrowserBtn.classList.add("is-enabled");
  } else if (permission === "denied") {
    refs.homeNotificationsBrowserBtn.classList.add("is-blocked");
  }
  if (refs.homeNotificationsBrowserBtnText) {
    refs.homeNotificationsBrowserBtnText.textContent = permission === "granted"
      ? "Вкл"
      : permission === "denied"
        ? "Blocked"
        : permission === "unsupported"
          ? "Нет API"
          : "Включить";
  }
}

async function requestBrowserNotificationsPermission() {
  const permission = getBrowserNotificationsPermission();
  if (permission === "unsupported") {
    showToast("В этом браузере нет поддержки уведомлений.");
    hapticWarning();
    return;
  }
  if (permission === "granted") {
    showToast("Уведомления браузера уже включены.");
    hapticSuccess();
    syncHomeNotificationsBrowserButton();
    return;
  }
  if (permission === "denied") {
    showToast("Уведомления заблокированы. Разрешите их в настройках браузера.");
    hapticWarning();
    syncHomeNotificationsBrowserButton();
    return;
  }
  try {
    const result = await Notification.requestPermission();
    if (result === "granted") {
      showToast("Уведомления браузера включены.");
      hapticSuccess();
    } else if (result === "denied") {
      showToast("Разрешение отклонено.");
      hapticWarning();
    } else {
      showToast("Разрешение не выбрано.");
    }
  } catch (error) {
    showToast(error instanceof Error ? error.message : "Не удалось запросить разрешение.");
    hapticWarning();
  } finally {
    syncHomeNotificationsBrowserButton();
  }
}

function renderHomeNotificationsPopover() {
  if (!refs.homeNotificationsList) return;
  syncHomeNotificationsBrowserButton();
  const list = Array.isArray(state.homeNotifications) ? state.homeNotifications : [];
  if (!list.length) {
    refs.homeNotificationsList.innerHTML = '<p class="muted">Уведомлений пока нет.</p>';
    return;
  }
  refs.homeNotificationsList.innerHTML = list
    .map((item) => `
      <button type="button" class="home-notification-item${item.unread ? " is-unread" : ""}" data-home-notif-id="${escapeText(item.id)}">
        <span class="home-notification-icon ${item.type === "task" ? "is-task" : "is-chat"}">
          ${iconSpan(item.type === "task" ? "layout-list" : "message")}
        </span>
        <span class="home-notification-copy">
          <span class="home-notification-title-row">
            <strong>${escapeText(item.title || "Уведомление")}</strong>
            <small>${escapeText(notificationTimeAgo(item.time))}</small>
          </span>
          <span class="home-notification-subtitle">${escapeText(item.subtitle || "")}</span>
        </span>
        ${item.unread ? '<span class="home-notification-dot" aria-hidden="true"></span>' : ""}
      </button>
    `)
    .join("");
}

function renderHomeNotificationsBadge() {
  if (!refs.homeBellBadge || !refs.homeBellBtn) return;
  const count = Number(state.homeNotificationsUnread || 0);
  refs.homeBellBadge.textContent = String(Math.min(99, count));
  refs.homeBellBadge.classList.toggle("is-hidden", count <= 0);
  refs.homeBellBtn.classList.toggle("has-unread", count > 0);
}

function openHomeNotificationsPopover() {
  if (!refs.homeNotificationsPopover) return;
  refs.homeNotificationsPopover.hidden = false;
  syncHomeNotificationsBrowserButton();
}

function toggleHomeNotificationsPopover(forceOpen = null) {
  if (!refs.homeNotificationsPopover) return;
  const shouldOpen = forceOpen === null ? refs.homeNotificationsPopover.hidden : Boolean(forceOpen);
  if (shouldOpen) {
    openHomeNotificationsPopover();
  } else {
    closeHomeNotificationsPopover();
  }
}

function stopHomeNotificationsPolling() {
  if (state.homeNotificationsPollTimer) {
    clearInterval(state.homeNotificationsPollTimer);
    state.homeNotificationsPollTimer = null;
  }
}

function startHomeNotificationsPolling() {
  stopHomeNotificationsPolling();
  if (!state.token || !state.user?.email) return;
  state.homeNotificationsPollTimer = setInterval(() => {
    refreshHomeNotifications(false).catch(() => {});
  }, 30000);
}

async function refreshHomeNotifications(force = false) {
  if (!state.token || !state.user?.email) {
    state.homeNotifications = [];
    state.homeNotificationsUnread = 0;
    renderHomeNotificationsBadge();
    renderHomeNotificationsPopover();
    closeHomeNotificationsPopover();
    return;
  }
  if (!force && state.moduleView !== "home" && state.moduleView !== "inventory") return;
  const seenAtTs = new Date(getHomeNotificationsSeenAt()).getTime();
  const [chatData, tasksData] = await Promise.all([
    apiRequest("/api/inventory/chat-list?limit=20").catch(() => ({ threads: [] })),
    apiRequest("/api/inventory/tasks-list?limit=50").catch(() => ({ tasks: [] })),
  ]);
  const threads = Array.isArray(chatData?.threads) ? chatData.threads : [];
  const tasks = Array.isArray(tasksData?.tasks) ? tasksData.tasks : [];
  const me = String(state.user?.email || "").trim().toLowerCase();

  const chatItems = threads
    .filter((t) => Number(t.unread_count || 0) > 0)
    .map((t) => ({
      id: `chat:${String(t.id || "")}`,
      type: "chat",
      title: String(t.title || "Чат"),
      subtitle: String(t.last_message_preview || "Новое сообщение"),
      time: t.last_message_at || t.updated_at || new Date().toISOString(),
      unread: true,
      threadId: String(t.id || ""),
    }));

  const taskItems = tasks
    .filter((task) => {
      const status = String(task.status || "").toLowerCase();
      if (status === "done") return false;
      const assignee = String(task.assignee_email || "").toLowerCase();
      return !assignee || assignee === me;
    })
    .map((task) => {
      const time = task.updated_at || task.created_at || new Date().toISOString();
      const ts = new Date(time).getTime();
      const unread = Number.isFinite(ts) && ts > seenAtTs;
      return {
        id: `task:${String(task.id || "")}`,
        type: "task",
        title: String(task.title || "Новая задача"),
        subtitle: task.description ? String(task.description) : `Статус: ${statusLabel(task.status || "todo")}`,
        time,
        unread,
        taskId: String(task.id || ""),
      };
    });

  const merged = [...chatItems, ...taskItems]
    .sort((a, b) => new Date(b.time || 0).getTime() - new Date(a.time || 0).getTime())
    .slice(0, 12);

  state.homeNotifications = merged;
  state.homeNotificationsUnread = merged.filter((x) => x.unread).length;
  renderHomeNotificationsBadge();
  renderHomeNotificationsPopover();
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
  if (!localStorage.getItem(homeNotificationsSeenKey())) {
    setHomeNotificationsSeenNow();
  }
  startHomeNotificationsPolling();
  updateAuthButton();
  applyRoleAccess();
  void refreshHomeNotifications(true).catch(() => {});
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
  const searchValue = String(refs.iosSearchInput?.value || refs.searchInput?.value || "").trim().toLowerCase();
  const groupValue = String(refs.mainGroupFilterTop?.value || refs.mainGroupFilter?.value || "").trim().toLowerCase();
  const stockValue = String(refs.mainStockFilterTop?.value || refs.mainStockFilter?.value || "").trim().toLowerCase();
  state.mainFilters.search = searchValue;
  state.mainFilters.group = groupValue;
  state.mainFilters.stock = stockValue;
}

function filteredItems() {
  const { search, group, stock } = state.mainFilters;
  return state.items.filter((item) => {
    if (search) {
      const matchSearch =
        item.name.toLowerCase().includes(search) ||
        String(item.group_name || "").toLowerCase().includes(search) ||
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

function currentInventoryFilterTags() {
  const tags = [];
  const group = String(state.mainFilters.group || "").trim();
  const stock = String(state.mainFilters.stock || "").trim();
  if (group) tags.push({ key: "group", label: `Группа: ${group}` });
  if (stock === "low") tags.push({ key: "stock", label: "Низкий остаток" });
  if (stock === "ok") tags.push({ key: "stock", label: "В норме" });
  return tags;
}

function renderIosFilterChips() {
  const tags = currentInventoryFilterTags();
  if (refs.iosFiltersChipBtn) {
    refs.iosFiltersChipBtn.classList.toggle("inventory-chip-primary", tags.length > 0);
    const label = refs.iosFiltersChipBtn.querySelector("span:last-child");
    if (label) label.textContent = tags.length ? `Фильтры (${tags.length})` : "Фильтры";
  }
  if (!refs.iosFilterParams) return;
  refs.iosFilterParams.innerHTML = "";
  tags.forEach((tag) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "inventory-chip";
    chip.dataset.filterKey = tag.key;
    chip.textContent = tag.label;
    refs.iosFilterParams.appendChild(chip);
  });
}

function renderMainByFilters() {
  applyMainFiltersFromInputs();
  state.pages.items = 1;
  renderIosFilterChips();
  renderTable(filteredItems());
}

function resetMainFilters() {
  refs.searchInput.value = "";
  if (refs.iosSearchInput) refs.iosSearchInput.value = "";
  refs.mainGroupFilter.value = "";
  refs.mainStockFilter.value = "";
  if (refs.mainGroupFilterTop) refs.mainGroupFilterTop.value = "";
  if (refs.mainStockFilterTop) refs.mainStockFilterTop.value = "";
  state.mainFilters = { search: "", group: "", stock: "" };
  state.pages.items = 1;
  renderIosFilterChips();
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
  loadBoxSearchData();
  loadChatData();
  loadTasks();
  showToast("Вы вышли из аккаунта");
  hapticSuccess();
}

function clearSession() {
  localStorage.removeItem("sf_token");
  localStorage.removeItem("sf_user");
  state.token = "";
  state.user = null;
  stopChatPolling();
  stopHomeNotificationsPolling();
  clearQrLoginPolling();
  state.homeProfilePhotoChatId = "";
  state.homeNotifications = [];
  state.homeNotificationsUnread = 0;
  state.profileLoaded = false;
  updateAuthButton();
  renderHomeNotificationsBadge();
  renderHomeNotificationsPopover();
  closeHomeNotificationsPopover();
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
  if (state.scanContext === "auth-qr-confirm") {
    return "Наведите камеру на QR-код входа с ПК.";
  }
  if (state.scanContext === "box-search") {
    return "Наведите камеру на штрихкод товара для поиска коробки.";
  }
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
  if (state.scanContext === "auth-qr-confirm") state.scanContext = "inventory";
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
  document.querySelectorAll(".admin-only").forEach((node) => {
    node.classList.toggle("is-hidden", !canManageUsers);
  });
  refs.registerTab.classList.toggle("is-hidden", !canManageUsers);
  refs.authTabs.classList.toggle("admin-disabled", !canManageUsers);
  refs.adjustPanel.classList.toggle("is-hidden", !canManageUsers);
  if (refs.adminPanel) {
    refs.adminPanel.classList.toggle("is-hidden", !canManageUsers);
  }
  if (refs.quickFilmIngestPanel) {
    if (!canManageUsers) refs.quickFilmIngestPanel.classList.add("is-hidden");
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
  const hasItems = list.length > 0;
  const page = hasItems ? paginateList(list, "items") : null;
  const itemsForView = page ? page.items : [];

  if (refs.consumablesList) {
    refs.consumablesList.innerHTML = "";
    if (state.itemsLoading) {
      refs.consumablesList.innerHTML = `
        <article class="consumable-skeleton"></article>
        <article class="consumable-skeleton"></article>
        <article class="consumable-skeleton"></article>
        <article class="consumable-skeleton"></article>
      `;
    } else if (!list.length) {
      refs.consumablesList.innerHTML = `
        <article class="consumable-empty">
          <span class="btn-icon" aria-hidden="true"><svg><use href="#i-grid"></use></svg></span>
          <p>Нет расходников</p>
        </article>
      `;
      if (refs.iosItemsPager) {
        refs.iosItemsPager.hidden = true;
        refs.iosItemsPager.innerHTML = "";
      }
    } else {
      for (const item of itemsForView) {
        const qty = Number(item.qty || 0);
        const threshold = Number(item.threshold || 0);
        const low = qty <= threshold;
        const zero = qty <= 0;
        const badgeText = zero ? "Нет" : low ? "Мало" : "";
        const card = document.createElement("article");
        card.className = "consumable-card";
        card.innerHTML = `
          <div class="consumable-main-row">
            <div class="consumable-info">
              <div class="consumable-name-row">
                <p class="consumable-name">${item.name}</p>
                ${badgeText ? `<span class="consumable-badge ${zero ? "is-low" : "is-warn"}">${badgeText}</span>` : ""}
              </div>
              <p class="consumable-meta">${item.id} • ${item.group_name || "Без категории"}${threshold ? ` • Лимит: ${threshold}` : ""}</p>
            </div>
            <div class="consumable-stepper">
              <button class="consumable-step-btn" data-action="consume" data-id="${item.id}" type="button">−</button>
              <span class="consumable-qty ${low ? "is-low" : ""}">${qty}</span>
              <button class="consumable-step-btn is-plus ${canAdmin() ? "" : "is-hidden"}" data-action="plus-one" data-id="${item.id}" type="button">+</button>
            </div>
          </div>
          <div class="consumable-actions-row">
            <button class="consumable-mini-btn ${canAdmin() ? "" : "is-hidden"}" data-action="edit" data-id="${item.id}" type="button">${iconSpan("edit")}<span>Изменить</span></button>
            <button class="consumable-mini-btn ${canDesktopPrint() ? "" : "is-hidden"}" data-action="print" data-id="${item.id}" type="button">${iconSpan("print")}<span>QR</span></button>
            <button class="consumable-mini-btn is-danger ${canAdmin() ? "" : "is-hidden"}" data-action="delete" data-id="${item.id}" type="button">${iconSpan("trash")}<span>Удалить</span></button>
          </div>
        `;
        refs.consumablesList.appendChild(card);
      }
      renderPager(refs.iosItemsPager, "items", page, () => renderTable(list));
    }
  }

  refs.itemsTableBody.innerHTML = "";

  if (!hasItems) {
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
  if (!refs.filmsCardsList && !refs.filmsTableBody) return;
  if (refs.filmsGroupWithBtn && refs.filmsGroupWithoutBtn) {
    refs.filmsGroupWithBtn.classList.toggle("active", state.filmsGroup === "with");
    refs.filmsGroupWithoutBtn.classList.toggle("active", state.filmsGroup === "without");
  }
  if (refs.filmsCardsList) refs.filmsCardsList.innerHTML = "";
  if (refs.filmsTableBody) refs.filmsTableBody.innerHTML = "";

  if (!list.length) {
    const emptyMessage = state.token
      ? state.filmsGroup === "without"
        ? "Пленок без ячеек нет."
        : "Пленки с ячейками не найдены."
      : "Для загрузки склада пленок выполните вход в систему.";
    if (refs.filmsCardsList) refs.filmsCardsList.innerHTML = `<p class="muted">${emptyMessage}</p>`;
    if (refs.filmsTableBody) refs.filmsTableBody.innerHTML = `<tr><td colspan="4" class="muted">${emptyMessage}</td></tr>`;
    if (refs.filmsPager) {
      refs.filmsPager.hidden = true;
      refs.filmsPager.innerHTML = "";
    }
    return;
  }

  const page = paginateList(list, "films");
  for (const film of page.items) {
    if (refs.filmsCardsList) {
      const card = document.createElement("article");
      card.className = "film-card";
      card.innerHTML = `
        <div class="film-card-avatar">${initialFromName(film.name)}</div>
        <div class="film-card-main">
          <p class="film-card-name">${film.name}</p>
          <p class="film-card-meta">${film.barcode} • Ячеек: ${film.cells.length} • Ед.: ${film.count}</p>
          <div class="film-card-cells">${
            film.cells.length
              ? film.cells.map((c) => `<span class="film-cell-chip">${c}</span>`).join("")
              : '<span class="muted">Без ячейки</span>'
          }</div>
        </div>
        <div class="film-card-actions">
          <button title="Добавить такую же пленку" class="film-action-btn" data-film-action="clone" data-film-barcode="${film.barcode}" type="button">${iconSpan("plus")}<span>Добавить</span></button>
          <button title="Удалить из ячейки" class="film-action-btn is-danger ${film.cells.length ? "" : "is-hidden"}" data-film-action="delete" data-film-barcode="${film.barcode}" type="button">${iconSpan("trash")}<span>Удалить</span></button>
        </div>
      `;
      refs.filmsCardsList.appendChild(card);
    }
    if (refs.filmsTableBody) {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${film.name}</td>`;
      refs.filmsTableBody.appendChild(row);
    }
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

function escapeText(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderChatTextWithLinks(value) {
  const raw = String(value ?? "");
  if (!raw) return "";
  const escaped = escapeText(raw);
  const withLinks = escaped.replace(/((?:https?:\/\/|www\.)[^\s<]+)/gi, (match) => {
    let clean = String(match || "");
    let suffix = "";
    while (/[),.!?:;]+$/.test(clean)) {
      suffix = clean.slice(-1) + suffix;
      clean = clean.slice(0, -1);
    }
    if (!clean) return match;
    const href = clean.toLowerCase().startsWith("www.") ? `https://${clean}` : clean;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${clean}</a>${suffix}`;
  });
  return withLinks.replace(/\n/g, "<br>");
}

function formatShortDate(value) {
  if (!value) return "";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value);
  return dt.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

function chatThreadById(threadId) {
  return state.chatThreads.find((row) => String(row.id) === String(threadId)) || null;
}

function syncChatLayoutMode() {
  if (!refs.chatTab) return;
  const hasActive = Boolean(String(state.chatActiveThreadId || "").trim());
  refs.chatTab.classList.toggle("chat-mode-list", !hasActive);
  refs.chatTab.classList.toggle("chat-mode-room", hasActive);
}

function setChatDrawerOpen(open) {
  if (!refs.chatDrawer) return;
  refs.chatDrawer.classList.toggle("is-hidden", !open);
}

function syncChatHeader(thread) {
  const title = String(thread?.title || "Выберите чат");
  const meta =
    thread?.kind === "direct"
      ? "Личный чат"
      : thread?.kind === "group"
        ? "Групповой чат"
        : "Откройте чат, чтобы начать переписку";
  if (refs.chatThreadTitle) refs.chatThreadTitle.textContent = title;
  if (refs.chatThreadMeta) refs.chatThreadMeta.textContent = meta;
  if (refs.chatThreadAvatarLetter) refs.chatThreadAvatarLetter.textContent = (title.trim().charAt(0) || "C").toUpperCase();
}

function filteredChatThreads() {
  const search = String(refs.chatSearchInput?.value || "").trim().toLowerCase();
  if (!search) return state.chatThreads;
  return state.chatThreads.filter((thread) => {
    return (
      String(thread.title || "").toLowerCase().includes(search) ||
      String(thread.last_message_preview || "").toLowerCase().includes(search)
    );
  });
}

function formatFileSize(bytes) {
  const size = Number(bytes || 0);
  if (!Number.isFinite(size) || size <= 0) return "0 Б";
  if (size < 1024) return `${size} Б`;
  const kb = size / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} КБ`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} МБ`;
}

function renderChatFilePreviews() {
  if (!refs.chatFilePreviewList) return;
  refs.chatFilePreviewList.innerHTML = "";
  const files = Array.isArray(state.chatDraftFiles) ? state.chatDraftFiles : [];
  if (!files.length) {
    refs.chatFilePreviewList.classList.remove("has-files");
    return;
  }
  files.forEach((file, index) => {
    const card = document.createElement("article");
    card.className = "chat-file-chip";
    card.innerHTML = `
      <div>
        <strong>${escapeText(file.name || "Файл")}</strong>
        <span>${escapeText(formatFileSize(file.size || 0))}</span>
      </div>
      <button type="button" aria-label="Удалить файл" data-chat-file-remove="${index}">×</button>
    `;
    refs.chatFilePreviewList.appendChild(card);
  });
  refs.chatFilePreviewList.classList.add("has-files");
}

function addChatDraftFiles(fileList) {
  if (!fileList) return;
  const incoming = Array.from(fileList).filter((file) => file && typeof file.name === "string");
  if (!incoming.length) return;
  const existing = new Set(state.chatDraftFiles.map((file) => `${file.name}_${file.size}_${file.lastModified}`));
  incoming.forEach((file) => {
    const key = `${file.name}_${file.size}_${file.lastModified}`;
    if (!existing.has(key)) {
      state.chatDraftFiles.push(file);
      existing.add(key);
    }
  });
  renderChatFilePreviews();
}

function resetChatDraftFiles() {
  state.chatDraftFiles = [];
  if (refs.chatFileInput) refs.chatFileInput.value = "";
  if (refs.chatDropZone) refs.chatDropZone.classList.remove("is-active");
  renderChatFilePreviews();
}

function setChatMenuOpen(open) {
  if (!refs.chatMenuPopover) return;
  refs.chatMenuPopover.hidden = !open;
}

function setChatCreateKind(kind = "direct") {
  const normalized = kind === "group" || kind === "channel" ? kind : "direct";
  state.chatCreateKind = normalized;
  if (refs.chatCreateKind) refs.chatCreateKind.value = normalized;
  if (refs.chatCreateModalTitle) {
    refs.chatCreateModalTitle.textContent =
      normalized === "group"
        ? "Новая группа"
        : normalized === "channel"
          ? "Новый канал"
          : "Новый чат";
  }
  if (refs.chatCreateTitleInput) {
    refs.chatCreateTitleInput.placeholder =
      normalized === "group"
        ? "Например, Упаковка"
        : normalized === "channel"
          ? "Например, Анонсы склада"
          : "Например, Личный чат";
  }
  const isDirect = normalized === "direct";
  if (refs.chatCreateMemberSingleWrap) refs.chatCreateMemberSingleWrap.hidden = !isDirect;
  if (refs.chatCreateMembersWrap) refs.chatCreateMembersWrap.hidden = isDirect;
}

function renderChatUsersOptions() {
  const users = Array.isArray(state.chatUsers) ? state.chatUsers : [];
  if (refs.chatCreateMemberSelect) {
    const current = String(refs.chatCreateMemberSelect.value || "");
    refs.chatCreateMemberSelect.innerHTML = '<option value="">Выберите сотрудника</option>';
    users.forEach((user) => {
      const option = document.createElement("option");
      option.value = String(user.email || "");
      option.textContent = String(user.name || user.email || "");
      refs.chatCreateMemberSelect.appendChild(option);
    });
    refs.chatCreateMemberSelect.value = users.some((u) => String(u.email) === current) ? current : "";
  }
  if (refs.chatCreateMembersSelect) {
    const selected = new Set(Array.from(refs.chatCreateMembersSelect.selectedOptions).map((x) => String(x.value || "")));
    refs.chatCreateMembersSelect.innerHTML = "";
    users.forEach((user) => {
      const option = document.createElement("option");
      option.value = String(user.email || "");
      option.textContent = String(user.name || user.email || "");
      if (selected.has(option.value)) option.selected = true;
      refs.chatCreateMembersSelect.appendChild(option);
    });
  }
}

async function loadChatUsers(force = false) {
  if (!state.token) {
    state.chatUsers = [];
    renderChatUsersOptions();
    return;
  }
  if (!force && state.chatUsers.length) return;
  const data = await apiRequest("/api/inventory/chat-users");
  const rows = Array.isArray(data.users) ? data.users : [];
  const me = String(state.user?.email || "").toLowerCase();
  state.chatUsers = rows
    .map((row) => ({
      email: String(row.email || "").trim().toLowerCase(),
      name: String(row.name || row.email || "").trim(),
      role: String(row.role || "staff").trim().toLowerCase(),
    }))
    .filter((row) => row.email && row.email !== me);
  renderChatUsersOptions();
}

function openChatCreateModal(kind = "direct") {
  setChatMenuOpen(false);
  setChatCreateKind(kind);
  if (refs.chatCreateForm) refs.chatCreateForm.reset();
  renderChatUsersOptions();
  void loadChatUsers().catch(() => {});
  openSimpleModal(refs.chatCreateModal);
  setTimeout(() => refs.chatCreateTitleInput?.focus(), 40);
}

function closeChatCreateModal() {
  closeSimpleModal(refs.chatCreateModal);
}

function closeChatForwardModal() {
  closeSimpleModal(refs.chatForwardModal);
}

function closeChatReadStatusModal() {
  closeSimpleModal(refs.chatReadStatusModal);
}

function chatMessageKey(message) {
  return String(message?.id || message?.local_id || "");
}

function parseChatMessageBody(rawBody = "") {
  const raw = String(rawBody || "");
  const lines = raw.split("\n");
  const first = String(lines[0] || "").trim();
  if (first.startsWith("↪ Ответ на:")) {
    return {
      reply: first.replace(/^↪ Ответ на:\s*/i, "").trim(),
      forwarded: "",
      text: lines.slice(1).join("\n").trim(),
    };
  }
  if (first.startsWith("↗ Переслано от:")) {
    return {
      reply: "",
      forwarded: first.replace(/^↗ Переслано от:\s*/i, "").trim(),
      text: lines.slice(1).join("\n").trim(),
    };
  }
  return { reply: "", forwarded: "", text: raw };
}

function renderChatReplyPreview() {
  if (!refs.chatReplyPreview) return;
  const data = state.chatReplyTo;
  if (!data) {
    refs.chatReplyPreview.hidden = true;
    refs.chatReplyPreview.innerHTML = "";
    return;
  }
  refs.chatReplyPreview.hidden = false;
  refs.chatReplyPreview.innerHTML = `
    <div class="chat-reply-preview-body">
      <strong>Ответ: ${escapeText(data.author || "Сообщение")}</strong>
      <p>${escapeText(String(data.text || "").slice(0, 120))}</p>
    </div>
    <button type="button" class="chat-reply-preview-close" id="chatReplyCancelBtn" aria-label="Отменить ответ">×</button>
  `;
  const cancelBtn = document.getElementById("chatReplyCancelBtn");
  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      state.chatReplyTo = null;
      renderChatReplyPreview();
    });
  }
}

function buildMessageStatus(message, mine) {
  if (!mine) return "";
  const key = chatMessageKey(message);
  const localMeta = state.chatLocalMessageMeta[key] || {};
  const delivery = String(localMeta.delivery || "sent");
  if (delivery === "sending") return "⏳";
  if (delivery === "failed") return "!";
  const readCount = Number(localMeta.readCount || 0);
  return readCount > 0 ? "✓✓" : "✓";
}

async function openChatReadStatus(message) {
  if (!state.token || !message) return;
  const threadId = String(state.chatActiveThreadId || "").trim();
  const messageId = String(message.id || "").trim();
  if (!threadId || !messageId) return;
  const data = await apiRequest(
    `/api/inventory/chat-message-readers?thread_id=${encodeURIComponent(threadId)}&message_id=${encodeURIComponent(messageId)}`
  );
  const readers = Array.isArray(data.readers) ? data.readers : [];
  state.chatLocalMessageMeta[messageId] = {
    ...(state.chatLocalMessageMeta[messageId] || {}),
    delivery: "sent",
    readCount: readers.length,
  };
  renderChatMessages();
  if (refs.chatReadStatusSummary) {
    refs.chatReadStatusSummary.textContent = readers.length
      ? `Просмотрено: ${readers.length}`
      : "Пока никто не просмотрел.";
  }
  if (refs.chatReadStatusList) {
    if (!readers.length) {
      refs.chatReadStatusList.innerHTML = '<p class="muted">Нет просмотров.</p>';
    } else {
      refs.chatReadStatusList.innerHTML = readers
        .map((row) => {
          const who = String(row.name || row.email || "Пользователь");
          const at = row.read_at ? formatHistoryDate(row.read_at) : "—";
          return `<article class="history-item"><strong>${escapeText(who)}</strong><div class="history-meta">${escapeText(at)}</div></article>`;
        })
        .join("");
    }
  }
  openSimpleModal(refs.chatReadStatusModal);
}

function openChatForwardModal(message) {
  state.chatForwardMessage = message || null;
  if (!refs.chatForwardList) return;
  const list = state.chatThreads.filter((thread) => String(thread.id) !== String(state.chatActiveThreadId));
  refs.chatForwardList.innerHTML = list.length
    ? list
        .map(
          (thread) => `<button class="chat-forward-item" type="button" data-chat-forward-to="${thread.id}">
      <strong>${escapeText(thread.title || "Без названия")}</strong>
      <span>${escapeText(thread.kind || "chat")}</span>
    </button>`
        )
        .join("")
    : '<p class="muted">Нет доступных чатов для пересылки.</p>';
  openSimpleModal(refs.chatForwardModal);
}

function closeChatMessageActionsPopover() {
  if (!refs.chatMessageActionsPopover) return;
  refs.chatMessageActionsPopover.hidden = true;
  refs.chatMessageActionsPopover.style.left = "";
  refs.chatMessageActionsPopover.style.top = "";
  refs.chatMessageActionsPopover.removeAttribute("data-chat-message-id");
  state.chatMessageActionsForId = "";
}

function openChatMessageActionsPopover(messageId, anchorEl) {
  if (!refs.chatMessageActionsPopover || !refs.chatMessages || !anchorEl) return;
  const message = state.chatMessages.find((row) => chatMessageKey(row) === String(messageId));
  if (!message) return;
  const mine = String(message.author_email || "").toLowerCase() === String(state.user?.email || "").toLowerCase();
  const deleteBtn = refs.chatMessageActionsPopover.querySelector('button[data-chat-pop-action="delete"]');
  if (deleteBtn instanceof HTMLButtonElement) {
    deleteBtn.hidden = !mine;
  }
  refs.chatMessageActionsPopover.hidden = false;
  refs.chatMessageActionsPopover.setAttribute("data-chat-message-id", String(messageId));
  state.chatMessageActionsForId = String(messageId);

  const container = refs.chatMessages;
  const cRect = container.getBoundingClientRect();
  const aRect = anchorEl.getBoundingClientRect();
  const popRect = refs.chatMessageActionsPopover.getBoundingClientRect();
  const scrollLeft = container.scrollLeft || 0;
  const scrollTop = container.scrollTop || 0;
  const gap = 8;

  let left = mine
    ? aRect.right - cRect.left + scrollLeft - popRect.width
    : aRect.left - cRect.left + scrollLeft;
  const minLeft = scrollLeft + 8;
  const maxLeft = scrollLeft + container.clientWidth - popRect.width - 8;
  left = Math.max(minLeft, Math.min(left, maxLeft));

  let top = aRect.top - cRect.top + scrollTop - popRect.height - gap;
  if (top < scrollTop + 6) {
    top = aRect.bottom - cRect.top + scrollTop + gap;
  }

  refs.chatMessageActionsPopover.style.left = `${Math.round(left)}px`;
  refs.chatMessageActionsPopover.style.top = `${Math.round(top)}px`;
}

async function performChatMessageAction(action, message, messageId) {
  if (!message) return;
  const mine = String(message.author_email || "").toLowerCase() === String(state.user?.email || "").toLowerCase();
  const parsed = parseChatMessageBody(message.body || "");
  if (action === "reply") {
    state.chatReplyTo = {
      id: messageId,
      author: mine ? "Вы" : String(message.author_email || "Пользователь"),
      text: parsed.text || "",
    };
    renderChatReplyPreview();
    refs.chatMessageInput?.focus();
    return;
  }
  if (action === "forward") {
    openChatForwardModal(message);
    return;
  }
  if (action === "delete") {
    if (!mine) return;
    if (!window.confirm("Удалить сообщение?")) return;
    if (String(messageId).startsWith("local_")) {
      state.chatMessages = state.chatMessages.filter((row) => chatMessageKey(row) !== messageId);
      delete state.chatLocalMessageMeta[messageId];
      renderChatMessages();
      return;
    }
    await apiRequest("/api/inventory/chat-delete-message", {
      method: "POST",
      body: {
        threadId: state.chatActiveThreadId,
        messageId: message.id,
      },
    });
    state.chatMessages = state.chatMessages.filter((row) => chatMessageKey(row) !== messageId);
    delete state.chatLocalMessageMeta[messageId];
    renderChatMessages();
    showToast("Сообщение удалено");
    hapticSuccess();
  }
}

function renderChatThreads(list = filteredChatThreads()) {
  if (!refs.chatList) return;
  refs.chatList.innerHTML = "";
  if (!list.length) {
    refs.chatList.innerHTML = '<p class="muted">Чатов пока нет.</p>';
    return;
  }

  list.forEach((thread) => {
    const card = document.createElement("article");
    const active = String(state.chatActiveThreadId) === String(thread.id);
    card.className = `chat-thread-item${active ? " is-active" : ""}`;
    card.setAttribute("data-chat-open", String(thread.id));
    const unread = Number(thread.unread_count || 0);
    const preview = String(thread.last_message_preview || "").trim();
    const isOnline = Boolean(thread.is_online);
    const firstLetter = (String(thread.title || "Ч").trim().charAt(0) || "Ч").toUpperCase();
    card.innerHTML = `
      <div class="chat-thread-title">
        <div class="chat-thread-avatar">${escapeText(firstLetter)}</div>
        <div class="chat-thread-main">
          <strong>${escapeText(thread.title || "Без названия")}</strong>
          <div class="chat-thread-meta">${escapeText(preview || "Нет сообщений")}</div>
        </div>
        <div class="chat-thread-right">
          <div class="chat-thread-time">${thread.last_message_at ? formatHistoryDate(thread.last_message_at) : ""}</div>
          ${unread > 0 ? `<span class="chat-unread-badge">${unread}</span>` : (isOnline ? '<span class="chat-online-dot" aria-label="Онлайн"></span>' : "")}
        </div>
      </div>
    `;
    refs.chatList.appendChild(card);
  });
}

function mergeChatMessagesWithLocal(serverMessages = []) {
  const server = Array.isArray(serverMessages) ? serverMessages : [];
  const localPending = (state.chatMessages || []).filter((row) => {
    const key = chatMessageKey(row);
    if (!String(key).startsWith("local_")) return false;
    const delivery = String(state.chatLocalMessageMeta[key]?.delivery || "");
    return delivery === "sending" || delivery === "failed";
  });
  const merged = [...server];
  localPending.forEach((row) => {
    const key = chatMessageKey(row);
    const exists = merged.some((x) => chatMessageKey(x) === key);
    if (!exists) merged.push(row);
  });
  merged.sort((a, b) => {
    const ta = new Date(a.created_at || 0).getTime() || 0;
    const tb = new Date(b.created_at || 0).getTime() || 0;
    return ta - tb;
  });
  return merged;
}

function chatMessagesSignature(list = []) {
  return (Array.isArray(list) ? list : [])
    .map((row) => `${chatMessageKey(row)}|${String(row?.created_at || "")}|${String(row?.body || "")}`)
    .join("||");
}

function findChatMessageElementById(messageId) {
  if (!refs.chatMessages || !messageId) return null;
  return Array.from(refs.chatMessages.querySelectorAll(".chat-message[data-chat-message-id]")).find(
    (el) => String(el.getAttribute("data-chat-message-id") || "") === String(messageId)
  ) || null;
}

async function refreshChatRealtime() {
  if (!state.token) return;
  if (state.moduleView !== "inventory" || state.inventoryTab !== "chat") return;
  if (state.chatPollingBusy) return;
  state.chatPollingBusy = true;
  try {
    const search = String(refs.chatSearchInput?.value || "").trim();
    const listData = await apiRequest(`/api/inventory/chat-list?search=${encodeURIComponent(search)}`);
    state.chatThreads = Array.isArray(listData.threads) ? listData.threads : [];
    renderChatThreads();

    const activeId = String(state.chatActiveThreadId || "").trim();
    if (!activeId) return;
    const msgData = await apiRequest(`/api/inventory/chat-messages?thread_id=${encodeURIComponent(activeId)}&limit=250`);
    const serverMessages = Array.isArray(msgData.messages) ? msgData.messages : [];
    const merged = mergeChatMessagesWithLocal(serverMessages);
    const prevSig = chatMessagesSignature(state.chatMessages);
    const nextSig = chatMessagesSignature(merged);
    if (prevSig !== nextSig) {
      state.chatMessages = merged;
      const thread = chatThreadById(activeId);
      syncChatHeader(thread);
      renderChatMessages({ keepPosition: true, keepPopover: true });
      state.chatThreads = state.chatThreads.map((row) =>
        String(row.id) === activeId ? { ...row, unread_count: 0 } : row
      );
      renderChatThreads();
    }
  } catch {
    // silent polling errors: avoid noisy toasts while user types
  } finally {
    state.chatPollingBusy = false;
  }
}

function stopChatPolling() {
  if (state.chatPollTimer) {
    clearInterval(state.chatPollTimer);
    state.chatPollTimer = null;
  }
  state.chatPollingBusy = false;
}

function startChatPolling() {
  stopChatPolling();
  if (!state.token) return;
  if (state.moduleView !== "inventory" || state.inventoryTab !== "chat") return;
  state.chatPollTimer = setInterval(() => {
    refreshChatRealtime();
  }, 2200);
}

function renderChatMessages(options = {}) {
  const { forceScrollBottom = false, keepPosition = false, keepPopover = false } = options;
  if (!refs.chatMessages) return;
  const container = refs.chatMessages;
  const prevScrollTop = container.scrollTop || 0;
  const prevScrollHeight = container.scrollHeight || 0;
  const wasNearBottom = prevScrollTop + container.clientHeight >= prevScrollHeight - 36;
  const popover = refs.chatMessageActionsPopover;
  const openedPopoverMessageId = keepPopover ? String(state.chatMessageActionsForId || "") : "";
  if (popover && popover.parentElement === refs.chatMessages) {
    popover.remove();
  }
  refs.chatMessages.innerHTML = "";
  if (popover) {
    refs.chatMessages.appendChild(popover);
  }
  closeChatMessageActionsPopover();
  if (!state.chatActiveThreadId) {
    refs.chatMessages.innerHTML = '<p class="muted">Откройте чат, чтобы увидеть сообщения.</p>';
    if (popover) refs.chatMessages.appendChild(popover);
    return;
  }
  if (!state.chatMessages.length) {
    refs.chatMessages.innerHTML = '<p class="muted">Сообщений пока нет.</p>';
    if (popover) refs.chatMessages.appendChild(popover);
    return;
  }

  state.chatMessages.forEach((message) => {
    const mine = String(message.author_email || "").toLowerCase() === String(state.user?.email || "").toLowerCase();
    const parsed = parseChatMessageBody(message.body || "");
    const statusIcon = buildMessageStatus(message, mine);
    const key = chatMessageKey(message);
    const row = document.createElement("article");
    row.className = `chat-message${mine ? " is-mine" : ""}`;
    row.setAttribute("data-chat-message-id", key);
    row.innerHTML = `
      <div class="chat-message-author">${escapeText(mine ? "Вы" : message.author_email || "Пользователь")}</div>
      ${parsed.forwarded ? `<div class="chat-message-forwarded">↗ ${escapeText(parsed.forwarded)}</div>` : ""}
      ${parsed.reply ? `<div class="chat-message-reply">${escapeText(parsed.reply)}</div>` : ""}
      <div class="chat-message-body">${renderChatTextWithLinks(parsed.text || "")}</div>
      <div class="chat-message-foot">
        <div class="chat-message-time">${formatHistoryDate(message.created_at)}</div>
        ${mine ? `<button type="button" class="chat-status-btn" data-chat-status-id="${key}" title="Статус">${escapeText(statusIcon)}</button>` : ""}
      </div>
    `;
    refs.chatMessages.appendChild(row);
  });
  if (popover) refs.chatMessages.appendChild(popover);
  if (forceScrollBottom || (!keepPosition && wasNearBottom)) {
    refs.chatMessages.scrollTop = refs.chatMessages.scrollHeight;
  } else if (keepPosition) {
    refs.chatMessages.scrollTop = Math.max(0, prevScrollTop);
  }

  if (keepPopover && openedPopoverMessageId) {
    const anchor = findChatMessageElementById(openedPopoverMessageId);
    if (anchor) {
      openChatMessageActionsPopover(openedPopoverMessageId, anchor);
    } else {
      closeChatMessageActionsPopover();
    }
  }
}

async function openChatThread(threadId) {
  if (!state.token) return;
  const id = String(threadId || "").trim();
  if (!id) return;
  const data = await apiRequest(`/api/inventory/chat-messages?thread_id=${encodeURIComponent(id)}`);
  state.chatActiveThreadId = id;
  state.chatMessages = Array.isArray(data.messages) ? data.messages : [];
  state.chatReplyTo = null;
  renderChatReplyPreview();
  const thread = chatThreadById(id);
  syncChatHeader(thread);
  renderChatMessages({ forceScrollBottom: true });
  syncChatLayoutMode();
  state.chatThreads = state.chatThreads.map((row) =>
    String(row.id) === id
      ? { ...row, unread_count: 0 }
      : row
  );
  renderChatThreads();
  if (window.matchMedia("(max-width: 959px)").matches) setChatDrawerOpen(false);
}

async function loadChatData() {
  if (!state.token) {
    state.chatThreads = [];
    state.chatMessages = [];
    state.chatActiveThreadId = "";
    state.chatReplyTo = null;
    renderChatReplyPreview();
    renderChatThreads([]);
    renderChatMessages();
    return;
  }
  const search = String(refs.chatSearchInput?.value || "").trim();
  const data = await apiRequest(`/api/inventory/chat-list?search=${encodeURIComponent(search)}`);
  state.chatThreads = Array.isArray(data.threads) ? data.threads : [];
  renderChatThreads();
  const activeId = String(state.chatActiveThreadId || "").trim();
  const activeStillExists = activeId && state.chatThreads.some((row) => String(row.id) === activeId);
  if (activeStillExists) {
    await openChatThread(state.chatActiveThreadId);
    return;
  }
  state.chatMessages = [];
  state.chatActiveThreadId = "";
  state.chatReplyTo = null;
  renderChatReplyPreview();
  syncChatHeader(null);
  renderChatMessages();
  syncChatLayoutMode();
}

async function createChat(kind = "direct") {
  if (!state.token) throw new Error("Требуется вход в систему");
  const payload = typeof kind === "object" && kind !== null ? kind : { kind };
  const chatKind = payload.kind === "group" || payload.kind === "channel" ? payload.kind : "direct";
  const title = String(payload.title || "").trim();
  if (!title) throw new Error("Укажите название чата");
  const threadPayload = {
    title,
    kind: chatKind,
    memberEmails: [],
  };
  const singleTarget = String(payload.memberEmail || "").trim().toLowerCase();
  const manyTargets = Array.isArray(payload.memberEmails)
    ? payload.memberEmails.map((x) => String(x || "").trim().toLowerCase()).filter(Boolean)
    : [];
  if (chatKind === "direct" && singleTarget) {
    threadPayload.memberEmails = [singleTarget];
  } else if (chatKind !== "direct" && manyTargets.length) {
    threadPayload.memberEmails = manyTargets;
  }
  const result = await apiRequest("/api/inventory/chat-create", {
    method: "POST",
    body: threadPayload,
  });
  return result.thread || null;
}

async function sendActiveChatMessage() {
  if (!state.token) throw new Error("Требуется вход в систему");
  const threadId = String(state.chatActiveThreadId || "").trim();
  if (!threadId) throw new Error("Выберите чат");
  const text = String(refs.chatMessageInput?.value || "").trim();
  const fileLines = state.chatDraftFiles.map((file) => `📎 ${file.name}`);
  if (!text && !fileLines.length) return;
  let body = [text, ...fileLines].filter(Boolean).join("\n");
  if (state.chatReplyTo) {
    const replyMeta = `↪ Ответ на: ${state.chatReplyTo.author}: ${String(state.chatReplyTo.text || "").slice(0, 80)}`;
    body = `${replyMeta}\n${body}`.trim();
  }
  const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const optimistic = {
    id: localId,
    local_id: localId,
    author_email: String(state.user?.email || ""),
    body,
    created_at: new Date().toISOString(),
  };
  state.chatMessages.push(optimistic);
  state.chatLocalMessageMeta[localId] = { delivery: "sending", readCount: 0 };
  renderChatMessages({ forceScrollBottom: true });
  if (refs.chatMessageInput) refs.chatMessageInput.value = "";
  state.chatReplyTo = null;
  renderChatReplyPreview();
  resetChatDraftFiles();
  try {
    const sent = await apiRequest("/api/inventory/chat-send", {
      method: "POST",
      body: { threadId, body },
    });
    const message = sent?.message || null;
    if (message?.id) {
      state.chatMessages = state.chatMessages.map((row) =>
        chatMessageKey(row) === localId ? message : row
      );
      delete state.chatLocalMessageMeta[localId];
      state.chatLocalMessageMeta[String(message.id)] = { delivery: "sent", readCount: 0 };
    } else {
      state.chatLocalMessageMeta[localId] = { delivery: "failed", readCount: 0 };
    }
    renderChatMessages({ forceScrollBottom: true });
    await loadChatData();
  } catch (error) {
    state.chatLocalMessageMeta[localId] = { delivery: "failed", readCount: 0 };
    renderChatMessages({ forceScrollBottom: true });
    throw error;
  }
}

function priorityLabel(priority) {
  if (priority === "urgent") return "Срочно";
  if (priority === "high") return "Высокий";
  if (priority === "low") return "Низкий";
  return "Средний";
}

function statusLabel(status) {
  if (status === "in_progress") return "В работе";
  if (status === "review") return "Проверка";
  if (status === "done") return "Готово";
  return "К выполнению";
}

function statusNext(status) {
  if (status === "todo") return "in_progress";
  if (status === "in_progress") return "review";
  if (status === "review") return "done";
  return "done";
}

function statusPrev(status) {
  if (status === "done") return "review";
  if (status === "review") return "in_progress";
  if (status === "in_progress") return "todo";
  return "todo";
}

function filteredTasks() {
  const search = String(refs.tasksSearchInput?.value || "").trim().toLowerCase();
  if (!search) return state.tasks;
  return state.tasks.filter((task) => {
    return (
      String(task.title || "").toLowerCase().includes(search) ||
      String(task.description || "").toLowerCase().includes(search) ||
      String(task.assignee_email || "").toLowerCase().includes(search)
    );
  });
}

function taskPriorityClass(priority) {
  if (priority === "urgent") return "urgent";
  if (priority === "high") return "high";
  if (priority === "low") return "low";
  return "medium";
}

function taskPriorityUiLabel(priority) {
  if (priority === "urgent") return "Срочный";
  if (priority === "high") return "Высокий";
  if (priority === "low") return "Низкий";
  return "Средний";
}

function taskCode(task) {
  const id = String(task?.id || "").replace(/[^\d]/g, "");
  const tail = id ? id.slice(-3).padStart(3, "0") : "000";
  return `T-${tail}`;
}

function extractTaskTags(task) {
  const title = String(task?.title || "").toLowerCase();
  const tags = [];
  if (title.includes("инвентар")) tags.push("Инвентаризация");
  if (title.includes("упаков")) tags.push("Упаковка");
  if (title.includes("отгруз")) tags.push("Отгрузка");
  if (title.includes("расход")) tags.push("Расходники");
  if (title.includes("пленк")) tags.push("Склад");
  if (title.includes("сроч") || task?.priority === "urgent" || task?.priority === "high") tags.push("Срочно");
  return tags.slice(0, 2);
}

function isOverdue(dateString) {
  if (!dateString) return false;
  const value = new Date(dateString);
  if (Number.isNaN(value.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  value.setHours(0, 0, 0, 0);
  return value.getTime() < today.getTime();
}

function taskCardHtml(task, compact = false) {
  const tags = extractTaskTags(task);
  const overdue = isOverdue(task.due_date);
  const assignee = String(task.assignee_email || "").trim();
  const assigneeInitial = initialFromName(assignee || "A");
  const dueText = task.due_date ? formatShortDate(task.due_date) : "";
  const priority = taskPriorityClass(task.priority);
  const priorityText = taskPriorityUiLabel(task.priority);
  return `
    <article class="task-card-figma${compact ? " compact" : ""}" data-task-id="${task.id}" draggable="true">
      <div class="task-card-top">
        <span class="task-priority ${priority}">${iconSpan("flag")}${escapeText(priorityText)}</span>
        <span class="task-code">${escapeText(taskCode(task))}</span>
      </div>
      <h5 class="task-card-title">${escapeText(task.title || "Без названия")}</h5>
      ${task.description ? `<div class="task-card-desc">${escapeText(task.description)}</div>` : ""}
      <div class="task-tag-row">${tags.map((tag) => `<span class="task-tag">${escapeText(tag)}</span>`).join("")}</div>
      <div class="task-card-footer">
        <div class="task-assignee">
          <span class="task-avatar">${escapeText(assigneeInitial)}</span>
          ${dueText ? `<span class="task-due${overdue ? " overdue" : ""}">${iconSpan("history")}${escapeText(dueText)}</span>` : ""}
        </div>
        <div class="task-mini-actions">
          <button type="button" aria-label="Открыть" data-task-action="open" data-task-id="${task.id}">${iconSpan("message")}</button>
          <button type="button" aria-label="Изменить" data-task-action="edit" data-task-id="${task.id}">${iconSpan("edit")}</button>
          <button type="button" aria-label="Вперёд" data-task-action="next" data-task-id="${task.id}">${iconSpan("plus")}</button>
          <button type="button" aria-label="Удалить" data-task-action="delete" data-task-id="${task.id}">${iconSpan("trash")}</button>
        </div>
      </div>
    </article>
  `;
}

function renderTaskColumn(container, tasks = []) {
  if (!container) return;
  container.innerHTML = "";
  if (!tasks.length) {
    container.innerHTML = '<p class="muted">Пусто.</p>';
    return;
  }
  tasks.forEach((task) => {
    container.insertAdjacentHTML("beforeend", taskCardHtml(task, true));
  });
}

function renderTasksBoard(list = filteredTasks()) {
  const todo = list.filter((task) => task.status === "todo");
  const inProgress = list.filter((task) => task.status === "in_progress");
  const review = list.filter((task) => task.status === "review");
  const done = list.filter((task) => task.status === "done");
  if (refs.tasksTodoCount) refs.tasksTodoCount.textContent = String(todo.length);
  if (refs.tasksInProgressCount) refs.tasksInProgressCount.textContent = String(inProgress.length);
  if (refs.tasksReviewCount) refs.tasksReviewCount.textContent = String(review.length);
  if (refs.tasksDoneCount) refs.tasksDoneCount.textContent = String(done.length);
  renderTaskColumn(refs.tasksTodoList, todo);
  renderTaskColumn(refs.tasksInProgressList, inProgress);
  renderTaskColumn(refs.tasksReviewList, review);
  renderTaskColumn(refs.tasksDoneList, done);
}

function renderTasksList(list = filteredTasks()) {
  if (!refs.tasksListContainer) return;
  refs.tasksListContainer.innerHTML = "";
  if (!list.length) {
    refs.tasksListContainer.innerHTML = '<p class="muted">Задачи не найдены.</p>';
    return;
  }
  list.forEach((task) => {
    refs.tasksListContainer.insertAdjacentHTML(
      "beforeend",
      `<div class="history-meta">${statusLabel(task.status)}</div>${taskCardHtml(task, false)}`
    );
  });
}

function renderTasks() {
  const list = filteredTasks();
  if (refs.tasksTotalCount) refs.tasksTotalCount.textContent = `${list.length} задач`;
  renderTasksBoard(list);
  renderTasksList(list);
  if (refs.tasksBoard) refs.tasksBoard.classList.toggle("is-hidden", state.taskViewMode !== "board");
  if (refs.tasksListContainer) refs.tasksListContainer.classList.toggle("is-hidden", state.taskViewMode === "board");
  if (refs.tasksBoardBtn) refs.tasksBoardBtn.classList.toggle("is-active", state.taskViewMode === "board");
  if (refs.tasksListBtn) refs.tasksListBtn.classList.toggle("is-active", state.taskViewMode === "list");
}

async function loadTasks() {
  if (!state.token) {
    state.tasks = [];
    renderTasks();
    return;
  }
  const search = String(refs.tasksSearchInput?.value || "").trim();
  const data = await apiRequest(`/api/inventory/tasks-list?search=${encodeURIComponent(search)}`);
  state.tasks = Array.isArray(data.tasks) ? data.tasks : [];
  renderTasks();
}

function populateTaskForm(task = null, status = "todo") {
  if (!refs.taskModalTitle) return;
  refs.taskModalTitle.textContent = task ? "Редактировать задачу" : "Новая задача";
  if (refs.taskEditId) refs.taskEditId.value = task ? String(task.id || "") : "";
  if (refs.taskEditTitle) refs.taskEditTitle.value = String(task?.title || "");
  if (refs.taskEditDescription) refs.taskEditDescription.value = String(task?.description || "");
  if (refs.taskEditPriority) refs.taskEditPriority.value = String(task?.priority || "medium");
  if (refs.taskEditStatus) refs.taskEditStatus.value = String(task?.status || status || "todo");
  if (refs.taskEditAssignee) refs.taskEditAssignee.value = String(task?.assignee_email || "");
  if (refs.taskEditDueDate) refs.taskEditDueDate.value = String(task?.due_date || "");
}

function openTaskEditor(task = null, status = "todo") {
  populateTaskForm(task, status);
  openSimpleModal(refs.taskEditModal);
  setTimeout(() => refs.taskEditTitle?.focus(), 50);
}

function closeTaskEditor() {
  closeSimpleModal(refs.taskEditModal);
}

async function saveTaskFromForm() {
  if (!refs.taskEditForm?.reportValidity()) return;
  const id = String(refs.taskEditId?.value || "").trim();
  const payload = {
    title: String(refs.taskEditTitle?.value || "").trim(),
    description: String(refs.taskEditDescription?.value || "").trim(),
    priority: String(refs.taskEditPriority?.value || "medium"),
    status: String(refs.taskEditStatus?.value || "todo"),
    assigneeEmail: String(refs.taskEditAssignee?.value || "").trim().toLowerCase(),
    dueDate: String(refs.taskEditDueDate?.value || "").trim(),
  };
  if (!payload.title) return;
  if (id) {
    await apiRequest("/api/inventory/tasks-update", {
      method: "POST",
      body: { id, ...payload },
    });
  } else {
    await apiRequest("/api/inventory/tasks-create", {
      method: "POST",
      body: payload,
    });
  }
  closeTaskEditor();
  await loadTasks();
  await loadHistory();
}

async function editTaskFromPrompt(taskId) {
  const task = state.tasks.find((x) => String(x.id) === String(taskId));
  if (!task) return;
  openTaskEditor(task, task.status || "todo");
}

async function updateTaskStatus(taskId, nextStatus) {
  const task = state.tasks.find((x) => String(x.id) === String(taskId));
  if (!task) return;
  await apiRequest("/api/inventory/tasks-update", {
    method: "POST",
    body: {
      id: task.id,
      status: nextStatus,
    },
  });
  await loadTasks();
  await loadHistory();
}

async function deleteTaskById(taskId) {
  await apiRequest("/api/inventory/tasks-delete", {
    method: "POST",
    body: { id: taskId },
  });
  await loadTasks();
  await loadHistory();
}

async function addTaskCommentFromPrompt(taskId) {
  const body = window.prompt("Комментарий к задаче", "");
  if (!body || !String(body).trim()) return;
  await apiRequest("/api/inventory/task-comment", {
    method: "POST",
    body: { taskId, body: String(body).trim() },
  });
  await loadTasks();
  await loadHistory();
}

async function openTaskDetails(taskId) {
  const task = state.tasks.find((x) => String(x.id) === String(taskId));
  if (!task) return;
  if (refs.taskDetailTitle) refs.taskDetailTitle.textContent = String(task.title || "Задача");
  if (refs.taskDetailMeta) {
    refs.taskDetailMeta.textContent = `${statusLabel(task.status)} • ${priorityLabel(task.priority)} • ${task.assignee_email || "без исполнителя"}`;
  }
  if (refs.taskDetailDescription) refs.taskDetailDescription.textContent = String(task.description || "Описание отсутствует.");
  if (refs.taskCommentsList) refs.taskCommentsList.innerHTML = '<p class="muted">Загрузка комментариев...</p>';
  refs.taskDetailEditBtn?.setAttribute("data-task-id", String(task.id));
  refs.taskDetailDeleteBtn?.setAttribute("data-task-id", String(task.id));
  openSimpleModal(refs.taskDetailModal);
  try {
    const data = await apiRequest(`/api/inventory/task-comments?task_id=${encodeURIComponent(String(task.id))}`);
    const list = Array.isArray(data.comments) ? data.comments : [];
    if (!refs.taskCommentsList) return;
    if (!list.length) {
      refs.taskCommentsList.innerHTML = '<p class="muted">Комментариев пока нет.</p>';
      return;
    }
    refs.taskCommentsList.innerHTML = list
      .map((row) => `<article class="history-item"><strong>${escapeText(row.author_email || "Пользователь")}</strong><div class="history-meta">${escapeText(row.body || "")}</div><div class="history-meta">${formatHistoryDate(row.created_at)}</div></article>`)
      .join("");
  } catch (error) {
    if (refs.taskCommentsList) refs.taskCommentsList.innerHTML = `<p class="muted">${escapeText(error.message || "Ошибка загрузки комментариев")}</p>`;
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
  if (reason === "film_create") return "Пленки: добавление";
  if (reason === "film_update") return "Пленки: обновление";
  if (reason === "film_delete") return "Пленки: удаление";
  if (reason === "box_create") return "Коробки: добавление";
  if (reason === "box_delete") return "Коробки: удаление";
  if (reason === "chat_create") return "Чат: создание";
  if (reason === "chat_message") return "Чат: сообщение";
  if (reason === "task_create") return "Задача: создание";
  if (reason === "task_update") return "Задача: обновление";
  if (reason === "task_delete") return "Задача: удаление";
  if (reason === "task_comment") return "Задача: комментарий";
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

function shortBucketLabel(bucket, granularity) {
  if (!bucket) return "-";
  if (granularity === "month") {
    const [y, m] = String(bucket).split("-");
    return `${m}.${String(y).slice(-2)}`;
  }
  const [y, m, d] = String(bucket).split("-");
  return `${d}.${m}`;
}

function renderFilmDeleteStats() {
  const stats = state.stats || {};
  const series = Array.isArray(stats.series) ? stats.series : [];
  const users = Array.isArray(stats.users) ? stats.users : [];
  const totalDeleted = Number(stats.totalDeleted || 0);
  const peak = series.reduce((best, row) => (Number(row.total || 0) > Number(best.total || 0) ? row : best), {
    bucket: "",
    total: 0,
  });

  if (refs.statsTotalDeleted) refs.statsTotalDeleted.textContent = String(totalDeleted);
  if (refs.statsActiveUsers) refs.statsActiveUsers.textContent = String(users.length);
  if (refs.statsPeakLabel) {
    refs.statsPeakLabel.textContent = peak.total
      ? `${shortBucketLabel(peak.bucket, stats.granularity)} • ${peak.total}`
      : "-";
  }

  if (refs.statsChart) {
    refs.statsChart.innerHTML = "";
    if (!series.length) {
      refs.statsChart.innerHTML = '<p class="muted">Нет данных по удалению пленок за выбранный период.</p>';
    } else {
      const seriesForChart = series.length > 120 ? series.slice(-120) : series;
      const maxValue = Math.max(1, ...seriesForChart.map((row) => Number(row.total || 0)));
      if (series.length > 120) {
        const note = document.createElement("p");
        note.className = "muted";
        note.textContent = "Показаны последние 120 периодов для удобства графика.";
        refs.statsChart.appendChild(note);
      }
      seriesForChart.forEach((row) => {
        const total = Number(row.total || 0);
        const bar = document.createElement("article");
        bar.className = "stats-bar";
        const h = Math.max(6, Math.round((total / maxValue) * 180));
        bar.innerHTML = `
          <div class="stats-bar-value">${total}</div>
          <div class="stats-bar-col" style="height:${h}px"></div>
          <div class="stats-bar-label">${shortBucketLabel(row.bucket, stats.granularity)}</div>
        `;
        refs.statsChart.appendChild(bar);
      });
    }
  }

  if (refs.statsUsersList) {
    refs.statsUsersList.innerHTML = "";
    if (!users.length) {
      refs.statsUsersList.innerHTML = '<p class="muted">За выбранный период удалений пленок не было.</p>';
    } else {
      users.forEach((row, idx) => {
        const card = document.createElement("article");
        card.className = "history-item";
        card.innerHTML = `
          <div><strong>#${idx + 1} ${row.user_email || "Неизвестный пользователь"}</strong></div>
          <div class="history-meta">Удалил пленок: ${Number(row.total || 0)}</div>
        `;
        refs.statsUsersList.appendChild(card);
      });
    }
  }
}

async function loadFilmDeleteStats() {
  if (!state.token) {
    state.stats = {
      dateFrom: "",
      dateTo: "",
      granularity: "day",
      series: [],
      users: [],
      totalDeleted: 0,
    };
    renderFilmDeleteStats();
    return;
  }

  const params = new URLSearchParams();
  params.set("action", "delete-stats");
  if (state.stats.dateFrom) params.set("date_from", state.stats.dateFrom);
  if (state.stats.dateTo) params.set("date_to", state.stats.dateTo);
  params.set("granularity", state.stats.granularity || "day");

  const data = await apiRequest(`/api/films?${params.toString()}`);
  state.stats = {
    ...state.stats,
    granularity: String(data.granularity || state.stats.granularity || "day"),
    totalDeleted: Number(data.totalDeleted || 0),
    series: Array.isArray(data.series) ? data.series : [],
    users: Array.isArray(data.users) ? data.users : [],
  };
  if (refs.statsDateFrom) refs.statsDateFrom.value = state.stats.dateFrom || "";
  if (refs.statsDateTo) refs.statsDateTo.value = state.stats.dateTo || "";
  if (refs.statsGranularity) refs.statsGranularity.value = state.stats.granularity || "day";
  renderFilmDeleteStats();
}

function initStatsFilters() {
  const now = new Date();
  const from = new Date(now);
  from.setDate(now.getDate() - 29);
  const toDate = now.toISOString().slice(0, 10);
  const fromDate = from.toISOString().slice(0, 10);
  state.stats.dateFrom = fromDate;
  state.stats.dateTo = toDate;
  state.stats.granularity = "day";
  if (refs.statsDateFrom) refs.statsDateFrom.value = fromDate;
  if (refs.statsDateTo) refs.statsDateTo.value = toDate;
  if (refs.statsGranularity) refs.statsGranularity.value = "day";
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
    state.itemsLoading = false;
    state.pages.items = 1;
    state.pages.alerts = 1;
    renderTable();
    renderAlerts();
    renderGroupOptions();
    refreshAdjustItemOptions();
    renderHomeSummary();
    return;
  }

  state.itemsLoading = true;
  renderTable(filteredItems());
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
  state.itemsLoading = false;

  state.pages.items = 1;
  state.pages.alerts = 1;

  renderGroupOptions();
  renderReminderItems();
  renderMainByFilters();
  renderAlerts();
  refreshAdjustItemOptions();
  renderHomeSummary();
}

async function loadFilms() {
  if (!state.token) {
    state.films = [];
    state.pages.films = 1;
    renderFilmsTable([]);
    renderHomeSummary();
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
  renderHomeSummary();
}

function boxCatalogColumns() {
  return ["Наименование товара", "Штрихкод"];
}

function normalizeBoxCatalogImportRow(row = {}) {
  return {
    name: String(row["Наименование товара"] ?? row["наименование товара"] ?? row.name ?? "").trim(),
    barcode: String(row["Штрихкод"] ?? row["штрихкод"] ?? row.barcode ?? "").trim(),
  };
}

async function downloadBoxCatalogTemplate() {
  const columns = boxCatalogColumns();
  const sampleRows = [
    { "Наименование товара": "Чехол iPhone 14 Black", "Штрихкод": "2200000000011" },
    { "Наименование товара": "Чехол iPhone 15 Pro Clear", "Штрихкод": "2200000000012" },
  ];

  if (window.XLSX?.utils?.book_new) {
    const ws = window.XLSX.utils.json_to_sheet(sampleRows, { header: columns });
    ws["!cols"] = [{ wch: 38 }, { wch: 22 }];
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "Catalog");
    window.XLSX.writeFile(wb, "polotno-box-products-template.xlsx");
    showToast("Шаблон импорта скачан");
    return;
  }

  const csv = [columns.join(","), ...sampleRows.map((r) => columns.map((c) => csvEscape(r[c])).join(","))].join("\n");
  const ok = await downloadCsvWithFallback("polotno-box-products-template.csv", csv);
  if (ok) showToast("Шаблон CSV скачан");
}

async function parseBoxCatalogImportFile(file) {
  if (!file) return [];
  const lower = String(file.name || "").toLowerCase();
  if ((lower.endsWith(".xlsx") || lower.endsWith(".xls")) && window.XLSX?.read) {
    const buffer = await file.arrayBuffer();
    const wb = window.XLSX.read(buffer, { type: "array" });
    const firstSheet = wb.Sheets[wb.SheetNames[0]];
    if (!firstSheet) return [];
    const rows = window.XLSX.utils.sheet_to_json(firstSheet, { defval: "" });
    return rows.map(normalizeBoxCatalogImportRow);
  }
  const text = await file.text();
  const rows = parseCsv(text);
  const objects = csvRowsToObjects(rows);
  return objects.map(normalizeBoxCatalogImportRow);
}

async function importBoxCatalog(file) {
  if (!file) return;
  if (!canDesktopPrint()) throw new Error("Импорт доступен только на ПК");
  if (!canAdmin()) throw new Error("Только для администратора");
  if (!state.token) throw new Error("Требуется вход в систему");

  const rows = await parseBoxCatalogImportFile(file);
  if (!rows.length) throw new Error("Файл пустой или не содержит строк");
  const payloadRows = rows.map((row) => ({ name: row.name, barcode: row.barcode }));
  const CHUNK_SIZE = 120;
  let success = 0;
  const importErrors = [];

  for (let start = 0; start < payloadRows.length; start += CHUNK_SIZE) {
    const chunk = payloadRows.slice(start, start + CHUNK_SIZE);
    try {
      const data = await apiRequest("/api/box-search?action=catalog-bulk-upsert", {
        method: "POST",
        body: { rows: chunk },
      });
      success += Number(data?.report?.success || 0);
      const errors = Array.isArray(data?.report?.errors) ? data.report.errors : [];
      errors.forEach((err) => importErrors.push(`Строка ${Number(err.line || 0)}: ${err.error}`));
    } catch (error) {
      importErrors.push(`Пакет ${start + 1}-${start + chunk.length}: ${error.message || "Ошибка импорта"}`);
    }
  }

  await loadBoxSearchData();
  showToast(`Импорт каталога: успешно ${success}, ошибок ${importErrors.length}`);
  if (importErrors.length) {
    window.alert(`Отчет импорта:\nУспешно: ${success}\nОшибок: ${importErrors.length}\n\n${importErrors.slice(0, 8).join("\n")}${importErrors.length > 8 ? "\n..." : ""}`);
  }
}

function applyBoxFiltersFromInputs() {
  state.boxFilters.search = String(refs.boxSearchInput?.value || "").trim().toLowerCase();
  state.boxFilters.location = String(refs.boxLocationFilter?.value || "").trim().toLowerCase();
}

function filteredBoxEntries() {
  const { search, location } = state.boxFilters;
  return state.boxTrackingEntries.filter((row) => {
    if (search) {
      const matched =
        String(row.box_code || "").toLowerCase().includes(search) ||
        String(row.location || "").toLowerCase().includes(search) ||
        String(row.product_barcode || "").toLowerCase().includes(search) ||
        String(row.product_name || "").toLowerCase().includes(search);
      if (!matched) return false;
    }
    if (location && !String(row.location || "").toLowerCase().includes(location)) return false;
    return true;
  });
}

function groupedBoxEntries(entries = []) {
  const map = new Map();
  entries.forEach((row) => {
    const boxCode = String(row.box_code || "").trim();
    if (!boxCode) return;
    if (!map.has(boxCode)) {
      map.set(boxCode, {
        box_code: boxCode,
        location: String(row.location || "").trim(),
        items: [],
        total_qty: 0,
      });
    }
    const bucket = map.get(boxCode);
    const barcode = String(row.product_barcode || "").trim();
    if (!bucket.items.some((x) => x.barcode === barcode)) {
      bucket.items.push({
        barcode,
        name: String(row.product_name || "").trim(),
        qty: Math.max(1, Number(row.qty || 1)),
      });
    }
    bucket.total_qty += Math.max(1, Number(row.qty || 1));
  });
  return [...map.values()];
}

function findCatalogNameByBarcode(barcode) {
  const needle = String(barcode || "").trim();
  if (!needle) return "";
  const found = state.boxCatalog.find((row) => String(row.barcode || "").trim() === needle);
  return String(found?.name || "").trim();
}

function renderBoxDraftItems() {
  if (!refs.boxDraftItemsList) return;
  refs.boxDraftItemsList.innerHTML = "";
  if (!state.boxDraftItems.length) {
    refs.boxDraftItemsList.innerHTML = '<p class="muted">Список товаров для коробки пуст.</p>';
    return;
  }
  state.boxDraftItems.forEach((item, idx) => {
    const card = document.createElement("article");
    card.className = "box-draft-item";
    card.innerHTML = `
      <div><strong>${item.barcode}</strong></div>
      <div class="history-meta">${item.name || "Название будет подтянуто из каталога"} • Кол-во: ${Math.max(1, Number(item.qty || 1))}</div>
      <div class="hero-actions">
        <button class="glass-btn btn-with-icon" type="button" data-box-draft-remove="${idx}">
          ${iconSpan("trash")}<span>Удалить</span>
        </button>
      </div>
    `;
    refs.boxDraftItemsList.appendChild(card);
  });
}

function addBoxDraftItem(rawBarcode, rawName = "", rawQty = 1) {
  const barcode = String(rawBarcode || "").trim();
  if (!barcode) return false;
  const exists = state.boxDraftItems.some((x) => x.barcode === barcode);
  if (exists) return false;
  const fallbackName = findCatalogNameByBarcode(barcode);
  const name = String(rawName || "").trim() || fallbackName;
  const qtyRaw = Number(rawQty || 1);
  const qty = Number.isFinite(qtyRaw) ? Math.max(1, Math.round(qtyRaw)) : 1;
  state.boxDraftItems.push({ barcode, name, qty });
  renderBoxDraftItems();
  return true;
}

function addBoxDraftItemsFromTextarea() {
  const text = String(refs.boxItemsTextarea?.value || "").trim();
  if (!text) return 0;
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  let added = 0;
  lines.forEach((line) => {
    const [barcodeRaw, nameRaw, qtyRaw] = line.split(/[;,\t|]/);
    const ok = addBoxDraftItem(barcodeRaw, nameRaw || "", qtyRaw || 1);
    if (ok) added += 1;
  });
  return added;
}

function renderBoxCatalogSuggestions() {
  if (!refs.boxCatalogOptions) return;
  refs.boxCatalogOptions.innerHTML = "";
  state.boxCatalog.slice(0, 1200).forEach((row) => {
    const option = document.createElement("option");
    option.value = String(row.name || "");
    option.label = String(row.barcode || "");
    option.dataset.barcode = String(row.barcode || "");
    option.dataset.name = String(row.name || "");
    refs.boxCatalogOptions.appendChild(option);
  });
}

function applyCatalogSelectionFromSearch() {
  const typed = String(refs.boxCatalogSearchInput?.value || "").trim().toLowerCase();
  if (!typed) return false;
  const found = state.boxCatalog.find((row) => String(row.name || "").trim().toLowerCase() === typed)
    || state.boxCatalog.find((row) => String(row.name || "").toLowerCase().includes(typed));
  if (!found) return false;
  if (refs.boxItemNameInput) refs.boxItemNameInput.value = String(found.name || "");
  if (refs.boxItemBarcodeInput) refs.boxItemBarcodeInput.value = String(found.barcode || "");
  if (refs.boxItemQtyInput && !String(refs.boxItemQtyInput.value || "").trim()) refs.boxItemQtyInput.value = "1";
  return true;
}

function renderBoxTrackedList() {
  if (!refs.boxTrackedList) return;
  const groups = groupedBoxEntries(filteredBoxEntries());
  refs.boxTrackedList.innerHTML = "";
  if (!groups.length) {
    refs.boxTrackedList.innerHTML = '<p class="muted">Нет коробок в отслеживании.</p>';
    if (refs.boxTrackedPager) {
      refs.boxTrackedPager.hidden = true;
      refs.boxTrackedPager.innerHTML = "";
    }
    return;
  }

  const page = paginateList(groups, "boxTracked");
  page.items.forEach((box) => {
    const card = document.createElement("article");
    card.className = "box-tracked-card";
    card.innerHTML = `
      <div class="box-tracked-top">
        <div>
          <p class="box-tracked-title">${box.box_code || "BOX"}</p>
          <div class="box-tracked-meta">${iconSpan("map-pin")}<span>${box.location || "Место не указано"}</span></div>
          <div class="box-tracked-meta"><span>${box.items.length} товаров</span></div>
        </div>
        <button class="box-delete-btn" type="button" data-box-remove="${box.box_code}">
          ${iconSpan("trash")}<span>Удалить</span>
        </button>
      </div>
    `;
    refs.boxTrackedList.appendChild(card);
  });
  renderPager(refs.boxTrackedPager, "boxTracked", page, () => renderBoxTrackedList());
}

function renderBoxScanResult(boxes = []) {
  if (!refs.boxScanResultList) return;
  refs.boxScanResultList.innerHTML = "";
  if (!boxes.length) {
    refs.boxScanResultList.innerHTML = '<p class="muted">Совпадений не найдено.</p>';
    return;
  }
  const first = boxes[0];
  const card = document.createElement("article");
  card.className = "box-found-card";
  card.innerHTML = `
    <div class="box-found-title">${iconSpan("check")}<span>Найдено!</span></div>
    <p class="box-tracked-title">${first.box_code || "BOX"}</p>
    <div class="box-found-meta">${iconSpan("package")}<span>Товаров: ${first.items.length} • Ед.: ${Math.max(0, Number(first.total_qty || 0))}</span></div>
    <div class="box-found-meta">${iconSpan("map-pin")}<span>${first.location || "Место не указано"}</span></div>
  `;
  refs.boxScanResultList.appendChild(card);
}

function renderBoxFoundModal(boxes = [], barcode = "") {
  if (!refs.boxFoundList || !refs.boxFoundSummary) return;
  refs.boxFoundList.innerHTML = "";
  if (!boxes.length) {
    refs.boxFoundSummary.textContent = `Штрихкод ${barcode} не найден в коробках.`;
    refs.boxFoundList.innerHTML = '<p class="muted">Совпадений нет.</p>';
    return;
  }
  refs.boxFoundSummary.textContent = `Штрихкод ${barcode}. Найдено коробок: ${boxes.length}.`;
  boxes.forEach((box) => {
    const card = document.createElement("article");
    card.className = "history-item";
    card.innerHTML = `
      <div><strong>Коробка ${box.box_code}</strong> <span class="history-reason">${box.location || "Место не указано"}</span></div>
      <div class="history-meta">Товаров: ${box.items.length} • Ед.: ${Math.max(0, Number(box.total_qty || 0))}</div>
      <div class="hero-actions">
        <button class="secondary-btn btn-with-icon desktop-only" type="button" data-box-print="${box.box_code}">
          ${iconSpan("print")}<span>Печать этикетки</span>
        </button>
        <button class="glass-btn btn-with-icon danger" type="button" data-box-remove="${box.box_code}">
          ${iconSpan("trash")}<span>Удалить из отслеживания</span>
        </button>
      </div>
    `;
    refs.boxFoundList.appendChild(card);
  });
}

function openBoxFoundModal(boxes = [], barcode = "") {
  renderBoxFoundModal(boxes, barcode);
  openSimpleModal(refs.boxFoundModal);
}

function closeBoxFoundModal() {
  closeSimpleModal(refs.boxFoundModal);
}

async function removeBoxFromTracking(boxCode) {
  if (!boxCode) return;
  await apiRequest("/api/box-search?action=remove-box", {
    method: "POST",
    body: { boxCode },
  });
  await loadBoxSearchData();
  showToast(`Коробка ${boxCode} удалена из отслеживания`);
}

function boxLabelPayload(box) {
  const items = (box.items || []).slice(0, 10).map((x) => ({
    barcode: String(x.barcode || ""),
    qty: Math.max(1, Number(x.qty || 1)),
  }));
  return JSON.stringify({
    box_code: String(box.box_code || ""),
    location: String(box.location || ""),
    items,
  });
}

async function printBoxLabel(box) {
  if (!canDesktopPrint()) {
    showToast("Печать этикеток доступна только на ПК");
    return;
  }
  if (!box?.box_code) return;
  const wnd = window.open("", "_blank", "width=900,height=700");
  if (!wnd) {
    showToast("Разрешите popup для печати этикетки");
    return;
  }
  const qrSrc = await qrImageSrc(boxLabelPayload(box), 210);
  const itemsText = (box.items || [])
    .slice(0, 3)
    .map((x) => `${String(x.name || x.barcode)} x${Math.max(1, Number(x.qty || 1))}`)
    .join(" • ");
  const more = (box.items || []).length > 3 ? ` +${(box.items || []).length - 3}` : "";
  const html = `
    <html>
      <head>
        <title>Этикетка коробки</title>
        <style>
          @page { size: 58mm 40mm; margin: 0; }
          * { box-sizing: border-box; }
          html, body { width: 58mm; height: 40mm; margin: 0; padding: 0; }
          body { font-family: -apple-system, Segoe UI, sans-serif; color: #0f172a; background: #fff; }
          .label {
            width: 58mm; height: 40mm; border: 0.2mm solid #d5dceb; padding: 2mm;
            display: grid; grid-template-columns: 21mm 1fr; gap: 2mm; align-items: center;
          }
          img { width: 20mm; height: 20mm; object-fit: contain; }
          .title { font-size: 4mm; font-weight: 800; line-height: 1.05; }
          .code { margin-top: 1mm; font-size: 3.1mm; color: #2f3b55; font-weight: 700; }
          .loc { margin-top: 1mm; font-size: 2.7mm; color: #415270; line-height: 1.15; }
          .meta { margin-top: 1mm; font-size: 2.4mm; color: #6b7890; line-height: 1.2; }
          .hint { margin-top: 1mm; font-size: 2.3mm; color: #8994a8; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head>
      <body>
        <section class="label">
          <img src="${qrSrc}" alt="${String(box.box_code)}" />
          <div>
            <div class="title">Коробка</div>
            <div class="code">${String(box.box_code || "")}</div>
            <div class="loc">${String(box.location || "")}</div>
            <div class="meta">Позиций: ${Math.max(0, Number(box.items?.length || 0))} • Ед.: ${Math.max(0, Number(box.total_qty || 0))}</div>
            <div class="hint">${itemsText}${more}</div>
          </div>
        </section>
      </body>
    </html>
  `;
  wnd.document.open();
  wnd.document.write(html);
  wnd.document.close();
  wnd.focus();
  wnd.print();
}

async function generateUniqueBoxCode() {
  const data = await apiRequest("/api/box-search?action=suggest-box-code");
  const code = String(data?.boxCode || "").trim();
  if (!code) throw new Error("Не удалось сгенерировать код");
  if (refs.boxCodeInput) refs.boxCodeInput.value = code;
  return code;
}

async function findBoxByBarcode(barcode) {
  const needle = String(barcode || "").trim();
  if (!needle) return [];
  const data = await apiRequest(`/api/box-search?action=find-by-barcode&barcode=${encodeURIComponent(needle)}`);
  return Array.isArray(data.boxes) ? data.boxes : [];
}

async function loadBoxSearchData() {
  if (!state.token) {
    state.boxCatalog = [];
    state.boxTrackingEntries = [];
    state.boxSearchResult = [];
    state.pages.boxTracked = 1;
    renderBoxTrackedList();
    renderBoxScanResult();
    renderBoxDraftItems();
    renderHomeSummary();
    return;
  }

  const [catalogResult, boxesResult] = await Promise.allSettled([
    apiRequest("/api/box-search?action=catalog&limit=5000"),
    apiRequest("/api/box-search?action=boxes&limit=5000"),
  ]);
  state.boxCatalog = catalogResult.status === "fulfilled" ? catalogResult.value.items || [] : [];
  state.boxTrackingEntries = boxesResult.status === "fulfilled" ? boxesResult.value.entries || [] : [];
  state.pages.boxTracked = 1;
  renderBoxCatalogSuggestions();
  renderBoxTrackedList();
  renderBoxScanResult(state.boxSearchResult);
  renderBoxDraftItems();
  renderHomeSummary();
}

async function createTrackedBox() {
  if (!state.token) throw new Error("Требуется вход в систему");
  if (!canAdmin()) throw new Error("Только для администратора");

  const boxCode = String(refs.boxCodeInput?.value || "").trim();
  const location = String(refs.boxLocationInput?.value || "").trim();
  if (!boxCode) throw new Error("Укажите номер коробки");
  if (!location) throw new Error("Укажите место нахождения");

  addBoxDraftItemsFromTextarea();
  const items = state.boxDraftItems.map((x) => ({
    barcode: x.barcode,
    name: x.name || "",
    qty: Math.max(1, Number(x.qty || 1)),
  }));
  if (!items.length) throw new Error("Добавьте хотя бы один товар в коробку");

  const reportData = await apiRequest("/api/box-search?action=create-box", {
    method: "POST",
    body: {
      boxCode,
      location,
      items,
    },
  });

  const success = Number(reportData?.report?.success || 0);
  const failed = Number(reportData?.report?.failed || 0);
  if (!success) {
    const err = reportData?.report?.errors?.[0] || "Не удалось сохранить коробку";
    throw new Error(err);
  }

  refs.boxCreateForm?.reset();
  state.boxDraftItems = [];
  renderBoxDraftItems();
  await loadBoxSearchData();
  await loadHistory();
  showToast(`Коробка сохранена: товаров ${success}${failed ? `, ошибок ${failed}` : ""}`);
}

async function searchBoxesByInput() {
  applyBoxFiltersFromInputs();
  state.pages.boxTracked = 1;
  renderBoxTrackedList();
  const barcode = String(refs.boxSearchInput?.value || "").trim();
  if (!barcode) {
    state.boxSearchResult = [];
    renderBoxScanResult([]);
    return;
  }
  const maybeBarcode = /\d{6,}/.test(barcode) ? barcode : "";
  if (!maybeBarcode) return;
  try {
    const boxes = await findBoxByBarcode(maybeBarcode);
    state.boxSearchResult = boxes;
    renderBoxScanResult(boxes);
  } catch {
    // no-op for manual filters mode
  }
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
  fill(refs.itemGroupTop, "Без группы");
  fill(refs.editItemGroup, "Без группы");
  fill(refs.mainGroupFilter, "Все группы");
  fill(refs.mainGroupFilterTop, "Все группы");
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
    renderHomeSummary();
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
  renderHomeSummary();
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

function extractQrLoginCode(rawValue) {
  const text = String(rawValue || "").trim();
  if (!text) return "";
  try {
    const payload = JSON.parse(text);
    if (payload && String(payload.type || "") === "polotno_qr_login" && typeof payload.code === "string") {
      return payload.code.trim();
    }
  } catch {
    // keep parsing as plain text
  }

  const queryMatch = text.match(/[?&]code=([A-Za-z0-9_-]+)/i);
  if (queryMatch) return String(queryMatch[1] || "").trim();

  const tokenMatch = text.match(/\b[A-Za-z0-9_-]{20,}\b/);
  if (tokenMatch) return String(tokenMatch[0] || "").trim();

  return "";
}

async function processAuthQrConfirmScanValue(rawValue) {
  if (!state.token || !state.user?.email) {
    setScanStatus("Сначала войдите в аккаунт на телефоне.");
    hapticWarning();
    return false;
  }

  const code = extractQrLoginCode(rawValue);
  if (!code) {
    setScanStatus("Это не QR-код входа Polotno.");
    hapticWarning();
    return false;
  }

  setScanStatus("Подтверждаем вход на ПК...", { busy: true });
  await apiRequest("/api/auth?action=qr-confirm", {
    method: "POST",
    body: { code },
  });
  closeScanModal();
  showToast("Вход подтвержден. Вернитесь на ПК");
  hapticSuccess();
  return true;
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
  const filmsAll = data.films || [];
  const films = filmsAll.filter((row) => String(row.cell_no || "").trim() !== "");
  if (!films.length) {
    if (filmsAll.length) {
      setScanStatus("Пленка есть в базе, но без ячейки.");
      showToast("Пленка найдена в базе, но ячейка не назначена");
      hapticWarning();
      return false;
    }
    return false;
  }

  setScanStatus(`Найдено ячеек: ${films.length}`);
  closeScanModal();
  openFilmFoundModal(films);
  showToast(`Найдено: ${films[0].name}`);
  hapticSuccess();
  return true;
}

async function processBoxSearchScanValue(rawValue) {
  const barcode = extractBarcodeFromScan(rawValue);
  if (!barcode) {
    setScanStatus("Штрихкод не распознан.");
    hapticWarning();
    return false;
  }

  setScanStatus("Ищем товар в коробках...", { busy: true });
  const boxes = await findBoxByBarcode(barcode);
  if (!boxes.length) {
    return false;
  }

  state.boxSearchResult = boxes;
  renderBoxScanResult(boxes);
  setScanStatus(`Найдено коробок: ${boxes.length}`);
  closeScanModal();
  openBoxFoundModal(boxes, barcode);
  showToast(`Найдено коробок: ${boxes.length}`);
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

  if (state.scanContext === "auth-qr-confirm") {
    await processAuthQrConfirmScanValue(rawValue);
    return;
  }

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

  if (state.scanContext === "box-search") {
    const handledBox = await processBoxSearchScanValue(rawValue);
    if (handledBox) return;
    setScanStatus("Товар не найден в коробках.");
    showToast("Товар не найден в коробках");
    hapticWarning();
    return;
  }

  const handledInventory = await processInventoryScanValue(rawValue);
  if (handledInventory) return;

  const handledFilm = await processFilmScanValue(rawValue);
  if (handledFilm) return;

  const handledBox = await processBoxSearchScanValue(rawValue);
  if (handledBox) return;

  setScanStatus("Код считан, но товар не найден.");
  showToast("Код не найден в системе");
  hapticWarning();
}

async function pollQrLoginStatus() {
  if (!state.qrLogin.pollKey) return;
  const data = await apiRequest(`/api/auth?action=qr-status&pollKey=${encodeURIComponent(state.qrLogin.pollKey)}`, {
    auth: false,
  });
  const status = String(data.status || "pending");

  if (status === "pending") {
    if (refs.qrLoginStatus) refs.qrLoginStatus.textContent = "Ожидаем подтверждение на телефоне...";
    return;
  }

  if (status === "confirmed" && data.token && data.user) {
    clearQrLoginPolling();
    applyUserFromServer(data.user, data.token);
    state.profileLoaded = false;
    closeQrLoginModal();
    closeAuthModal();
    await runDbAction(
      async () => {
        await loadItems();
        await loadHistory();
        await loadFilms();
        await loadBoxSearchData();
        await loadChatData();
        await loadTasks();
      },
      { message: "Загружаем данные аккаунта..." }
    );
    showToast("Вход по QR выполнен");
    hapticSuccess();
    return;
  }

  clearQrLoginPolling();
  if (!refs.qrLoginStatus) return;
  if (status === "expired") {
    refs.qrLoginStatus.textContent = "QR-код истек. Нажмите «Войти по QR (ПК)» снова.";
    return;
  }
  if (status === "consumed") {
    refs.qrLoginStatus.textContent = "Этот QR уже использован. Сгенерируйте новый.";
    return;
  }
  refs.qrLoginStatus.textContent = "Сессия входа неактивна. Создайте новый QR.";
}

async function startQrDesktopLogin(button = null) {
  if (!refs.qrLoginModal || !refs.qrLoginImage || !refs.qrLoginStatus) return;
  closeScanModal();
  clearQrLoginPolling();
  refs.qrLoginModal.hidden = false;
  document.body.style.overflow = "hidden";
  refs.qrLoginStatus.textContent = "Готовим QR-код...";
  refs.qrLoginImage.removeAttribute("src");

  const data = await runDbAction(
    () =>
      apiRequest("/api/auth?action=qr-start", {
        method: "POST",
        auth: false,
      }),
    { button, message: "Создаем QR-сессию..." }
  );

  const pollKey = String(data.pollKey || "").trim();
  const qrPayload = String(data.qrPayload || "").trim();
  if (!pollKey || !qrPayload) throw new Error("Не удалось получить QR-код входа");

  refs.qrLoginImage.src = await qrImageSrc(qrPayload, 260);
  refs.qrLoginStatus.textContent = "Отсканируйте QR в Polotno на телефоне и подтвердите вход.";
  state.qrLogin.pollKey = pollKey;
  state.qrLogin.expiresAt = String(data.expiresAt || "");
  state.qrLogin.pollTimer = setInterval(() => {
    pollQrLoginStatus().catch((error) => {
      if (refs.qrLoginStatus) refs.qrLoginStatus.textContent = `Ошибка проверки QR: ${error.message}`;
    });
  }, 2000);
}

async function startQrMobileConfirm() {
  if (!state.token || !state.user?.email) {
    setAuthTab("login");
    showToast("Сначала войдите в аккаунт на телефоне");
    hapticWarning();
    return;
  }
  closeAuthModal();
  state.scanContext = "auth-qr-confirm";
  openScanModal();
  await startScanner();
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
if (refs.openQrDesktopLoginBtn) refs.openQrDesktopLoginBtn.addEventListener("click", async (event) => {
  const button = event.currentTarget instanceof HTMLButtonElement ? event.currentTarget : null;
  try {
    await startQrDesktopLogin(button);
  } catch (error) {
    closeQrLoginModal();
    showToast(error.message);
    hapticWarning();
  }
});
if (refs.openQrMobileConfirmBtn) refs.openQrMobileConfirmBtn.addEventListener("click", async () => {
  try {
    await startQrMobileConfirm();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});
if (refs.closeQrLoginModalBtn) refs.closeQrLoginModalBtn.addEventListener("click", closeQrLoginModal);
if (refs.qrLoginBackdrop) refs.qrLoginBackdrop.addEventListener("click", closeQrLoginModal);
refs.loginTab.addEventListener("click", () => setAuthTab("login"));
refs.registerTab.addEventListener("click", () => setAuthTab("register"));

refs.openInventoryTile.addEventListener("click", () => {
  setModuleView("inventory");
  setInventoryTab("main");
  setTimeout(() => refs.searchInput.focus(), 120);
});
if (refs.homeNavInventoryBtn) refs.homeNavInventoryBtn.addEventListener("click", () => {
  setModuleView("inventory");
  setInventoryTab("main");
  setTimeout(() => refs.searchInput.focus(), 120);
});
if (refs.openFilmsTile) refs.openFilmsTile.addEventListener("click", () => {
  setModuleView("inventory");
  setInventoryTab("films");
  setTimeout(() => refs.filmsSearchInput?.focus(), 120);
});
if (refs.homeNavFilmsBtn) refs.homeNavFilmsBtn.addEventListener("click", () => {
  setModuleView("inventory");
  setInventoryTab("films");
  setTimeout(() => refs.filmsSearchInput?.focus(), 120);
});
if (refs.openProductsSearchTile) refs.openProductsSearchTile.addEventListener("click", () => {
  setModuleView("inventory");
  setInventoryTab("box-search");
  setTimeout(() => refs.boxSearchInput?.focus(), 120);
});
if (refs.homeNavBoxesBtn) refs.homeNavBoxesBtn.addEventListener("click", () => {
  setModuleView("inventory");
  setInventoryTab("box-search");
  setTimeout(() => refs.boxSearchInput?.focus(), 120);
});
if (refs.openChatHomeTile) refs.openChatHomeTile.addEventListener("click", () => {
  setModuleView("inventory");
  setInventoryTab("chat");
  setTimeout(() => refs.chatSearchInput?.focus(), 120);
});
if (refs.homeNavChatBtn) refs.homeNavChatBtn.addEventListener("click", () => {
  setModuleView("inventory");
  setInventoryTab("chat");
  setTimeout(() => refs.chatSearchInput?.focus(), 120);
});
if (refs.openTasksHomeTile) refs.openTasksHomeTile.addEventListener("click", () => {
  setModuleView("inventory");
  setInventoryTab("tasks");
  setTimeout(() => refs.tasksSearchInput?.focus(), 120);
});
if (refs.homeNavTasksBtn) refs.homeNavTasksBtn.addEventListener("click", () => {
  setModuleView("inventory");
  setInventoryTab("tasks");
  setTimeout(() => refs.tasksSearchInput?.focus(), 120);
});
if (refs.openHistoryHomeTile) refs.openHistoryHomeTile.addEventListener("click", () => {
  setModuleView("inventory");
  setInventoryTab("history");
});
if (refs.homeNavHistoryBtn) refs.homeNavHistoryBtn.addEventListener("click", () => {
  setModuleView("inventory");
  setInventoryTab("history");
});
if (refs.openStatsHomeTile) refs.openStatsHomeTile.addEventListener("click", () => {
  setModuleView("inventory");
  setInventoryTab("stats");
});
if (refs.homeNavStatsBtn) refs.homeNavStatsBtn.addEventListener("click", () => {
  setModuleView("inventory");
  setInventoryTab("stats");
});
if (refs.openSettingsHomeTile) refs.openSettingsHomeTile.addEventListener("click", () => {
  openSettingsView().catch((error) => {
    showToast(error.message);
    hapticWarning();
  });
});
if (refs.homeBellBtn) refs.homeBellBtn.addEventListener("click", async () => {
  hapticSelection();
  if (!state.user?.email || !state.token) {
    openAuthModal();
    return;
  }
  await refreshHomeNotifications(true).catch(() => {});
  toggleHomeNotificationsPopover();
});
if (refs.homeNotificationsCloseBtn) refs.homeNotificationsCloseBtn.addEventListener("click", () => {
  closeHomeNotificationsPopover();
});
if (refs.homeNotificationsMarkReadBtn) refs.homeNotificationsMarkReadBtn.addEventListener("click", () => {
  setHomeNotificationsSeenNow();
  state.homeNotifications = state.homeNotifications.map((item) => ({ ...item, unread: false }));
  state.homeNotificationsUnread = 0;
  renderHomeNotificationsBadge();
  renderHomeNotificationsPopover();
  hapticSuccess();
});
if (refs.homeNotificationsBrowserBtn) refs.homeNotificationsBrowserBtn.addEventListener("click", async () => {
  await requestBrowserNotificationsPermission();
});
if (refs.homeNotificationsList) refs.homeNotificationsList.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const btn = target.closest("button[data-home-notif-id]");
  if (!(btn instanceof HTMLButtonElement)) return;
  const id = String(btn.getAttribute("data-home-notif-id") || "").trim();
  if (!id) return;
  const item = state.homeNotifications.find((x) => String(x.id) === id);
  if (!item) return;
  setHomeNotificationsSeenNow();
  state.homeNotifications = state.homeNotifications.map((x) => (x.id === id ? { ...x, unread: false } : x));
  state.homeNotificationsUnread = state.homeNotifications.filter((x) => x.unread).length;
  renderHomeNotificationsBadge();
  renderHomeNotificationsPopover();
  closeHomeNotificationsPopover();

  if (item.type === "chat" && item.threadId) {
    setModuleView("inventory");
    setInventoryTab("chat");
    try {
      await openChatThread(item.threadId);
    } catch {
      // ignore
    }
    return;
  }

  if (item.type === "task") {
    setModuleView("inventory");
    setInventoryTab("tasks");
    if (item.taskId) {
      try {
        await loadTasks();
        await openTaskDetails(item.taskId);
      } catch {
        // ignore
      }
    }
  }
});
if (refs.homeNavSettingsBtn) refs.homeNavSettingsBtn.addEventListener("click", () => {
  openSettingsView().catch((error) => {
    showToast(error.message);
    hapticWarning();
  });
});
if (refs.desktopNavHomeBtn) refs.desktopNavHomeBtn.addEventListener("click", () => {
  setModuleView("home");
});
if (refs.desktopNavInventoryBtn) refs.desktopNavInventoryBtn.addEventListener("click", () => {
  setModuleView("inventory");
  setInventoryTab("main");
});
if (refs.desktopNavFilmsBtn) refs.desktopNavFilmsBtn.addEventListener("click", () => {
  setModuleView("inventory");
  setInventoryTab("films");
});
if (refs.desktopNavBoxesBtn) refs.desktopNavBoxesBtn.addEventListener("click", () => {
  setModuleView("inventory");
  setInventoryTab("box-search");
});
if (refs.desktopNavChatBtn) refs.desktopNavChatBtn.addEventListener("click", () => {
  setModuleView("inventory");
  setInventoryTab("chat");
});
if (refs.desktopNavTasksBtn) refs.desktopNavTasksBtn.addEventListener("click", () => {
  setModuleView("inventory");
  setInventoryTab("tasks");
});
if (refs.desktopNavHistoryBtn) refs.desktopNavHistoryBtn.addEventListener("click", () => {
  setModuleView("inventory");
  setInventoryTab("history");
});
if (refs.desktopNavStatsBtn) refs.desktopNavStatsBtn.addEventListener("click", () => {
  setModuleView("inventory");
  setInventoryTab("stats");
});
if (refs.desktopNavSettingsBtn) refs.desktopNavSettingsBtn.addEventListener("click", () => {
  openSettingsView().catch((error) => {
    showToast(error.message);
    hapticWarning();
  });
});
if (refs.homeScanBtn) refs.homeScanBtn.addEventListener("click", async () => {
  openScanModal();
  await startScanner();
});
if (refs.homeProcessSearch) refs.homeProcessSearch.addEventListener("input", renderHomeProcessCards);
refs.homeBtn.addEventListener("click", () => setModuleView("home"));
refs.mainTabBtn.addEventListener("click", () => setInventoryTab("main"));
if (refs.filmsTabBtn) refs.filmsTabBtn.addEventListener("click", () => setInventoryTab("films"));
if (refs.boxSearchTabBtn) refs.boxSearchTabBtn.addEventListener("click", () => setInventoryTab("box-search"));
if (refs.chatTabBtn) refs.chatTabBtn.addEventListener("click", () => setInventoryTab("chat"));
if (refs.tasksTabBtn) refs.tasksTabBtn.addEventListener("click", () => setInventoryTab("tasks"));
refs.toolsTabBtn.addEventListener("click", () => setInventoryTab("tools"));
refs.historyTabBtn.addEventListener("click", () => setInventoryTab("history"));
if (refs.statsTabBtn) refs.statsTabBtn.addEventListener("click", () => setInventoryTab("stats"));
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
if (refs.settingsQrConfirmBtn) refs.settingsQrConfirmBtn.addEventListener("click", async () => {
  try {
    await startQrMobileConfirm();
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

if (refs.stockFormTop) refs.stockFormTop.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!refs.stockFormTop.reportValidity()) return;
  const submitBtn = event.submitter instanceof HTMLButtonElement ? event.submitter : null;

  try {
    await runDbAction(
      () =>
        saveItem({
          name: refs.itemNameTop.value.trim(),
          groupName: refs.itemGroupTop.value,
          qty: Number(refs.itemQtyTop.value),
          threshold: Number(refs.itemThresholdTop.value),
          notes: refs.itemNotesTop.value.trim(),
        }),
      { button: submitBtn, message: "Сохраняем расходник..." }
    );

    refs.stockFormTop.reset();
    refs.stockManagePanelTop?.classList.add("is-hidden");
    showToast("Расходник сохранен");
    hapticSuccess();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});

async function handleItemActionClick(action, id, button) {
  if (!action || !id) return;

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
}

refs.itemsTableBody.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const button = target.closest("button[data-action][data-id]");
  if (!(button instanceof HTMLButtonElement)) return;

  const action = button.getAttribute("data-action");
  const id = button.getAttribute("data-id");
  if (!action || !id) return;

  try {
    await handleItemActionClick(action, id, button);
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});

if (refs.consumablesList) refs.consumablesList.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const button = target.closest("button[data-action][data-id]");
  if (!(button instanceof HTMLButtonElement)) return;
  const action = button.getAttribute("data-action");
  const id = button.getAttribute("data-id");
  if (!action || !id) return;
  try {
    await handleItemActionClick(action, id, button);
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
if (refs.iosSearchInput) refs.iosSearchInput.addEventListener("input", () => {
  refs.searchInput.value = refs.iosSearchInput.value;
  handleSearch();
});
if (refs.mainHeaderAddBtn) refs.mainHeaderAddBtn.addEventListener("click", () => {
  if (refs.stockManagePanelTop) {
    refs.stockManagePanelTop.classList.toggle("is-hidden");
    if (!refs.stockManagePanelTop.classList.contains("is-hidden")) {
      refs.stockManagePanelTop.scrollIntoView({ behavior: "smooth", block: "start" });
      refs.itemNameTop?.focus();
    }
  }
  hapticSelection();
});
if (refs.iosFiltersChipBtn) refs.iosFiltersChipBtn.addEventListener("click", () => {
  if (refs.mainFiltersPanelTop) {
    refs.mainFiltersPanelTop.classList.toggle("is-hidden");
    if (!refs.mainFiltersPanelTop.classList.contains("is-hidden")) {
      refs.mainGroupFilterTop?.focus();
    }
  }
  hapticSelection();
});
if (refs.iosExportChipBtn) refs.iosExportChipBtn.addEventListener("click", () => refs.exportInventoryBtn?.click());
if (refs.iosImportChipBtn) refs.iosImportChipBtn.addEventListener("click", () => refs.importInventoryBtn?.click());
if (refs.iosInventorySheetChipBtn) refs.iosInventorySheetChipBtn.addEventListener("click", () => refs.exportInventorySheetBtn?.click());
if (refs.iosFilterParams) refs.iosFilterParams.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const chip = target.closest("button[data-filter-key]");
  if (!(chip instanceof HTMLButtonElement)) return;
  const key = String(chip.getAttribute("data-filter-key") || "");
  if (key === "group") refs.mainGroupFilter.value = "";
  if (key === "stock") refs.mainStockFilter.value = "";
  handleSearch();
});
if (refs.mainBackBtn) refs.mainBackBtn.addEventListener("click", () => {
  setModuleView("home");
});
if (refs.mainScanBtn) refs.mainScanBtn.addEventListener("click", async () => {
  state.scanContext = "inventory";
  openScanModal();
  await startScanner();
});
if (refs.mainBottomAddBtn) refs.mainBottomAddBtn.addEventListener("click", () => {
  if (refs.legacyMainLayout) refs.legacyMainLayout.classList.remove("is-hidden");
  refs.itemName?.focus();
  hapticSelection();
});
if (refs.mainBottomMainBtn) refs.mainBottomMainBtn.addEventListener("click", () => {
  setInventoryTab("main");
});
if (refs.mainBottomToolsBtn) refs.mainBottomToolsBtn.addEventListener("click", () => {
  setInventoryTab("tools");
});
if (refs.mainBottomHistoryBtn) refs.mainBottomHistoryBtn.addEventListener("click", () => {
  setInventoryTab("history");
});
if (refs.mainBottomSettingsBtn) refs.mainBottomSettingsBtn.addEventListener("click", async () => {
  try {
    await openSettingsView();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});
refs.applyMainFiltersBtn.addEventListener("click", handleSearch);
refs.resetMainFiltersBtn.addEventListener("click", resetMainFilters);
refs.mainGroupFilter.addEventListener("change", handleSearch);
refs.mainStockFilter.addEventListener("change", handleSearch);
if (refs.applyMainFiltersTopBtn) refs.applyMainFiltersTopBtn.addEventListener("click", handleSearch);
if (refs.resetMainFiltersTopBtn) refs.resetMainFiltersTopBtn.addEventListener("click", resetMainFilters);
if (refs.mainGroupFilterTop) refs.mainGroupFilterTop.addEventListener("change", handleSearch);
if (refs.mainStockFilterTop) refs.mainStockFilterTop.addEventListener("change", handleSearch);
if (refs.closeMainAddPanelTopBtn) refs.closeMainAddPanelTopBtn.addEventListener("click", () => {
  refs.stockManagePanelTop?.classList.add("is-hidden");
});
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
    refs.filmSinglePanel?.classList.add("is-hidden");
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
if (refs.filmsHeaderAddBtn) refs.filmsHeaderAddBtn.addEventListener("click", () => {
  if (!canAdmin()) {
    showToast("Только для администратора");
    hapticWarning();
    return;
  }
  if (refs.quickFilmIngestPanel) refs.quickFilmIngestPanel.classList.add("is-hidden");
  if (refs.filmSinglePanel) refs.filmSinglePanel.classList.toggle("is-hidden");
  if (refs.filmSinglePanel && !refs.filmSinglePanel.classList.contains("is-hidden")) {
    refs.filmSinglePanel.scrollIntoView({ behavior: "smooth", block: "start" });
    refs.filmName?.focus();
  }
  hapticSelection();
});
if (refs.filmsHeaderBulkBtn) refs.filmsHeaderBulkBtn.addEventListener("click", () => {
  if (!canAdmin()) {
    showToast("Только для администратора");
    hapticWarning();
    return;
  }
  if (refs.quickFilmIngestPanel) {
    if (refs.filmSinglePanel) refs.filmSinglePanel.classList.add("is-hidden");
    refs.quickFilmIngestPanel.classList.toggle("is-hidden");
    if (!refs.quickFilmIngestPanel.classList.contains("is-hidden")) {
      refs.quickFilmIngestPanel.scrollIntoView({ behavior: "smooth", block: "start" });
      refs.quickFilmCellNo?.focus();
    }
  }
  hapticSelection();
});
if (refs.filmsCloseSinglePanelBtn) refs.filmsCloseSinglePanelBtn.addEventListener("click", () => {
  refs.filmSinglePanel?.classList.add("is-hidden");
  hapticSelection();
});
if (refs.filmsCloseBulkPanelBtn) refs.filmsCloseBulkPanelBtn.addEventListener("click", () => {
  refs.quickFilmIngestPanel?.classList.add("is-hidden");
  hapticSelection();
});
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
if (refs.filmsCardsList) refs.filmsCardsList.addEventListener("click", async (event) => {
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
if (refs.chatSearchInput) refs.chatSearchInput.addEventListener("input", () => {
  renderChatThreads();
});
if (refs.chatToggleListBtn) refs.chatToggleListBtn.addEventListener("click", () => {
  const hidden = refs.chatDrawer?.classList.contains("is-hidden");
  setChatDrawerOpen(Boolean(hidden));
  if (hidden) refs.chatSearchInput?.focus();
  hapticSelection();
});
if (refs.chatCloseListBtn) refs.chatCloseListBtn.addEventListener("click", () => {
  setChatDrawerOpen(false);
  hapticSelection();
});
if (refs.chatBackBtn) refs.chatBackBtn.addEventListener("click", () => {
  state.chatActiveThreadId = "";
  state.chatMessages = [];
  syncChatHeader(null);
  renderChatMessages();
  syncChatLayoutMode();
  setChatDrawerOpen(false);
  hapticSelection();
});
if (refs.chatTopSearchBtn) refs.chatTopSearchBtn.addEventListener("click", () => {
  state.chatActiveThreadId = "";
  syncChatLayoutMode();
  refs.chatSearchInput?.focus();
  hapticSelection();
});
if (refs.chatTopMenuBtn) refs.chatTopMenuBtn.addEventListener("click", async () => {
  const isHidden = Boolean(refs.chatMenuPopover?.hidden);
  setChatMenuOpen(isHidden);
  hapticSelection();
});
if (refs.chatList) refs.chatList.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const chatItem = target.closest("[data-chat-open]");
  if (!(chatItem instanceof HTMLElement)) return;
  const threadId = String(chatItem.getAttribute("data-chat-open") || "").trim();
  if (!threadId) return;
  try {
    await runDbAction(() => openChatThread(threadId), { message: "Открываем чат..." });
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});
if (refs.chatMessages) refs.chatMessages.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const statusBtn = target.closest("button[data-chat-status-id]");
  if (statusBtn instanceof HTMLButtonElement) {
    const messageId = String(statusBtn.getAttribute("data-chat-status-id") || "").trim();
    const message = state.chatMessages.find((row) => chatMessageKey(row) === messageId);
    if (!message) return;
    try {
      await openChatReadStatus(message);
    } catch (error) {
      showToast(error.message || "Не удалось загрузить статусы");
    }
    return;
  }

  const popActionBtn = target.closest("button[data-chat-pop-action]");
  if (popActionBtn instanceof HTMLButtonElement) {
    const action = String(popActionBtn.getAttribute("data-chat-pop-action") || "").trim();
    const messageId = String(refs.chatMessageActionsPopover?.getAttribute("data-chat-message-id") || "").trim();
    const message = state.chatMessages.find((row) => chatMessageKey(row) === messageId);
    closeChatMessageActionsPopover();
    if (!action || !messageId || !message) return;
    try {
      await performChatMessageAction(action, message, messageId);
    } catch (error) {
      showToast(error.message || "Не удалось выполнить действие");
      hapticWarning();
    }
    return;
  }

  const messageEl = target.closest(".chat-message[data-chat-message-id]");
  if (messageEl instanceof HTMLElement) {
    const messageId = String(messageEl.getAttribute("data-chat-message-id") || "").trim();
    if (!messageId) return;
    const openedSame = !refs.chatMessageActionsPopover?.hidden && state.chatMessageActionsForId === messageId;
    if (openedSame) {
      closeChatMessageActionsPopover();
    } else {
      openChatMessageActionsPopover(messageId, messageEl);
      hapticSelection();
    }
    return;
  }

  closeChatMessageActionsPopover();
});
if (refs.chatMessages) refs.chatMessages.addEventListener("scroll", () => {
  closeChatMessageActionsPopover();
});
if (refs.chatMessageForm) refs.chatMessageForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    if (refs.chatSendBtn) refs.chatSendBtn.disabled = true;
    await sendActiveChatMessage();
    hapticSuccess();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  } finally {
    if (refs.chatSendBtn) refs.chatSendBtn.disabled = false;
  }
});
if (refs.chatCreateBtn) refs.chatCreateBtn.addEventListener("click", async () => {
  openChatCreateModal("direct");
  hapticSelection();
});
if (refs.chatListCreateBtn) refs.chatListCreateBtn.addEventListener("click", () => {
  openChatCreateModal("direct");
  hapticSelection();
});
if (refs.chatListSearchBtn) refs.chatListSearchBtn.addEventListener("click", () => {
  refs.chatSearchInput?.focus();
  refs.chatSearchInput?.scrollIntoView({ block: "nearest" });
  hapticSelection();
});
if (refs.chatCreateGroupBtn) refs.chatCreateGroupBtn.addEventListener("click", async () => {
  openChatCreateModal("group");
  hapticSelection();
});
if (refs.chatChannelsBtn) refs.chatChannelsBtn.addEventListener("click", async () => {
  openChatCreateModal("channel");
  hapticSelection();
});
if (refs.chatMenuNewDirectBtn) refs.chatMenuNewDirectBtn.addEventListener("click", () => {
  openChatCreateModal("direct");
  hapticSelection();
});
if (refs.chatMenuNewGroupBtn) refs.chatMenuNewGroupBtn.addEventListener("click", () => {
  openChatCreateModal("group");
  hapticSelection();
});
if (refs.chatMenuNewChannelBtn) refs.chatMenuNewChannelBtn.addEventListener("click", () => {
  openChatCreateModal("channel");
  hapticSelection();
});
if (refs.chatAttachBtn) refs.chatAttachBtn.addEventListener("click", () => {
  refs.chatFileInput?.click();
  hapticSelection();
});
if (refs.chatFileInput) refs.chatFileInput.addEventListener("change", () => {
  addChatDraftFiles(refs.chatFileInput.files);
});
if (refs.chatFilePreviewList) refs.chatFilePreviewList.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const button = target.closest("button[data-chat-file-remove]");
  if (!(button instanceof HTMLButtonElement)) return;
  const idx = Number(button.getAttribute("data-chat-file-remove"));
  if (!Number.isFinite(idx) || idx < 0) return;
  state.chatDraftFiles.splice(idx, 1);
  renderChatFilePreviews();
});
if (refs.chatDropZone) {
  const dragTargets = [refs.chatDropZone, refs.chatMessages].filter(Boolean);
  dragTargets.forEach((node) => {
    node.addEventListener("dragover", (event) => {
      event.preventDefault();
      refs.chatDropZone.classList.add("is-active");
    });
    node.addEventListener("dragleave", (event) => {
      event.preventDefault();
      const related = event.relatedTarget;
      if (!(related instanceof Node) || !refs.chatDropZone.contains(related)) {
        refs.chatDropZone.classList.remove("is-active");
      }
    });
    node.addEventListener("drop", (event) => {
      event.preventDefault();
      refs.chatDropZone.classList.remove("is-active");
      addChatDraftFiles(event.dataTransfer?.files);
      hapticSelection();
    });
  });
}
if (refs.closeChatCreateBtn) refs.closeChatCreateBtn.addEventListener("click", closeChatCreateModal);
if (refs.chatCreateBackdrop) refs.chatCreateBackdrop.addEventListener("click", closeChatCreateModal);
if (refs.chatCreateForm) refs.chatCreateForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!refs.chatCreateForm.reportValidity()) return;
  const kind = String(refs.chatCreateKind?.value || state.chatCreateKind || "direct");
  const title = String(refs.chatCreateTitleInput?.value || "").trim();
  const memberEmail = String(refs.chatCreateMemberSelect?.value || "").trim();
  const memberEmails =
    refs.chatCreateMembersSelect
      ? Array.from(refs.chatCreateMembersSelect.selectedOptions).map((x) => String(x.value || "").trim()).filter(Boolean)
      : [];
  if (kind === "direct" && !memberEmail) {
    showToast("Выберите сотрудника");
    refs.chatCreateMemberSelect?.focus();
    return;
  }
  try {
    const thread = await runDbAction(() => createChat({ kind, title, memberEmail, memberEmails }), {
      button: refs.chatCreateSubmitBtn,
      message: "Создаем чат...",
    });
    if (thread?.id) {
      await loadChatData();
      await openChatThread(thread.id);
      closeChatCreateModal();
      showToast("Чат создан");
      hapticSuccess();
    }
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});
if (refs.closeChatForwardBtn) refs.closeChatForwardBtn.addEventListener("click", closeChatForwardModal);
if (refs.chatForwardBackdrop) refs.chatForwardBackdrop.addEventListener("click", closeChatForwardModal);
if (refs.chatForwardList) refs.chatForwardList.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const btn = target.closest("button[data-chat-forward-to]");
  if (!(btn instanceof HTMLButtonElement)) return;
  const toThreadId = String(btn.getAttribute("data-chat-forward-to") || "").trim();
  if (!toThreadId || !state.chatForwardMessage) return;
  const parsed = parseChatMessageBody(state.chatForwardMessage.body || "");
  const forwardHeader = `↗ Переслано от: ${state.chatForwardMessage.author_email || "Пользователь"}`;
  const forwardBody = `${forwardHeader}\n${parsed.text || state.chatForwardMessage.body || ""}`.trim();
  try {
    await apiRequest("/api/inventory/chat-send", {
      method: "POST",
      body: { threadId: toThreadId, body: forwardBody },
    });
    closeChatForwardModal();
    showToast("Сообщение переслано");
    hapticSuccess();
  } catch (error) {
    showToast(error.message || "Не удалось переслать сообщение");
    hapticWarning();
  }
});
if (refs.closeChatReadStatusBtn) refs.closeChatReadStatusBtn.addEventListener("click", closeChatReadStatusModal);
if (refs.chatReadStatusBackdrop) refs.chatReadStatusBackdrop.addEventListener("click", closeChatReadStatusModal);
document.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Node)) return;
  if (refs.chatTopMenuBtn && refs.chatMenuPopover && !refs.chatMenuPopover.hidden) {
    const inMenuToggle = refs.chatTopMenuBtn.contains(target);
    const inMenu = refs.chatMenuPopover.contains(target);
    if (!inMenuToggle && !inMenu) {
      setChatMenuOpen(false);
    }
  }
  if (refs.chatMessageActionsPopover && !refs.chatMessageActionsPopover.hidden) {
    const inPopover = refs.chatMessageActionsPopover.contains(target);
    const inMessage = target instanceof Element && Boolean(target.closest(".chat-message[data-chat-message-id]"));
    if (!inPopover && !inMessage) {
      closeChatMessageActionsPopover();
    }
  }
});
if (refs.taskCreateBtn) refs.taskCreateBtn.addEventListener("click", async () => {
  try {
    await runDbAction(() => {
      openTaskEditor(null, "todo");
    }, {
      button: refs.taskCreateBtn,
      message: "Открываем форму задачи...",
    });
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});
if (refs.tasksSearchInput) refs.tasksSearchInput.addEventListener("input", () => {
  renderTasks();
});
if (refs.tasksBoardBtn) refs.tasksBoardBtn.addEventListener("click", () => {
  state.taskViewMode = "board";
  renderTasks();
  hapticSelection();
});
if (refs.tasksListBtn) refs.tasksListBtn.addEventListener("click", () => {
  state.taskViewMode = "list";
  renderTasks();
  hapticSelection();
});
if (refs.tasksFilterBtn) refs.tasksFilterBtn.addEventListener("click", () => {
  showToast("Фильтры задач будут в следующем шаге");
  hapticSelection();
});
if (refs.taskEditForm) refs.taskEditForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitBtn = event.submitter instanceof HTMLButtonElement ? event.submitter : null;
  try {
    await runDbAction(() => saveTaskFromForm(), {
      button: submitBtn,
      message: "Сохраняем задачу...",
    });
    showToast("Задача сохранена");
    hapticSuccess();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});
if (refs.cancelTaskEditBtn) refs.cancelTaskEditBtn.addEventListener("click", () => closeTaskEditor());
if (refs.closeTaskEditBtn) refs.closeTaskEditBtn.addEventListener("click", () => closeTaskEditor());
if (refs.taskEditBackdrop) refs.taskEditBackdrop.addEventListener("click", () => closeTaskEditor());
if (refs.closeTaskDetailBtn) refs.closeTaskDetailBtn.addEventListener("click", () => closeSimpleModal(refs.taskDetailModal));
if (refs.taskDetailBackdrop) refs.taskDetailBackdrop.addEventListener("click", () => closeSimpleModal(refs.taskDetailModal));
if (refs.taskDetailEditBtn) refs.taskDetailEditBtn.addEventListener("click", async () => {
  const taskId = String(refs.taskDetailEditBtn.getAttribute("data-task-id") || "").trim();
  if (!taskId) return;
  closeSimpleModal(refs.taskDetailModal);
  await editTaskFromPrompt(taskId);
});
if (refs.taskDetailDeleteBtn) refs.taskDetailDeleteBtn.addEventListener("click", async () => {
  const taskId = String(refs.taskDetailDeleteBtn.getAttribute("data-task-id") || "").trim();
  if (!taskId) return;
  const ok = window.confirm("Удалить задачу?");
  if (!ok) return;
  try {
    await runDbAction(() => deleteTaskById(taskId), { button: refs.taskDetailDeleteBtn, message: "Удаляем задачу..." });
    closeSimpleModal(refs.taskDetailModal);
    showToast("Задача удалена");
    hapticSuccess();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});
document.querySelectorAll("button[data-task-add-status]").forEach((node) => {
  node.addEventListener("click", () => {
    const status = String(node.getAttribute("data-task-add-status") || "todo");
    openTaskEditor(null, status);
    hapticSelection();
  });
});

async function onTaskAction(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const btn = target.closest("button[data-task-action][data-task-id]");
  if (!(btn instanceof HTMLButtonElement)) return;
  const action = String(btn.getAttribute("data-task-action") || "").trim();
  const taskId = String(btn.getAttribute("data-task-id") || "").trim();
  if (!action || !taskId) return;

  if (action === "edit") {
    await runDbAction(() => editTaskFromPrompt(taskId), { button: btn, message: "Открываем задачу..." });
    return;
  }
  if (action === "open") {
    await runDbAction(() => openTaskDetails(taskId), { button: btn, message: "Открываем детали..." });
    return;
  }
  if (action === "comment") {
    await runDbAction(() => addTaskCommentFromPrompt(taskId), { button: btn, message: "Добавляем комментарий..." });
    return;
  }
  if (action === "delete") {
    const ok = window.confirm("Удалить задачу?");
    if (!ok) return;
    await runDbAction(() => deleteTaskById(taskId), { button: btn, message: "Удаляем задачу..." });
    return;
  }

  const task = state.tasks.find((row) => String(row.id) === taskId);
  if (!task) return;
  if (action === "next") {
    await runDbAction(() => updateTaskStatus(taskId, statusNext(task.status)), {
      button: btn,
      message: "Перемещаем задачу...",
    });
    return;
  }
  if (action === "prev") {
    await runDbAction(() => updateTaskStatus(taskId, statusPrev(task.status)), {
      button: btn,
      message: "Перемещаем задачу...",
    });
  }
}

if (refs.tasksBoard) refs.tasksBoard.addEventListener("click", (event) => {
  onTaskAction(event).catch((error) => {
    showToast(error.message);
    hapticWarning();
  });
});
if (refs.tasksListContainer) refs.tasksListContainer.addEventListener("click", (event) => {
  onTaskAction(event).catch((error) => {
    showToast(error.message);
    hapticWarning();
  });
});
if (refs.tasksBoard) {
  refs.tasksBoard.addEventListener("dragstart", (event) => {
    const target = event.target instanceof HTMLElement ? event.target.closest("[data-task-id]") : null;
    if (!(target instanceof HTMLElement) || !event.dataTransfer) return;
    const taskId = String(target.getAttribute("data-task-id") || "");
    event.dataTransfer.setData("text/task-id", taskId);
    target.classList.add("is-dragging");
  });
  refs.tasksBoard.addEventListener("dragend", (event) => {
    const target = event.target instanceof HTMLElement ? event.target.closest("[data-task-id]") : null;
    if (target instanceof HTMLElement) target.classList.remove("is-dragging");
    refs.tasksBoard.querySelectorAll(".tasks-column-drop").forEach((el) => el.classList.remove("is-drop-target"));
  });
  refs.tasksBoard.addEventListener("dragover", (event) => {
    const drop = event.target instanceof HTMLElement ? event.target.closest(".tasks-column-drop") : null;
    if (!(drop instanceof HTMLElement)) return;
    event.preventDefault();
    refs.tasksBoard.querySelectorAll(".tasks-column-drop").forEach((el) => el.classList.remove("is-drop-target"));
    drop.classList.add("is-drop-target");
  });
  refs.tasksBoard.addEventListener("drop", (event) => {
    const drop = event.target instanceof HTMLElement ? event.target.closest(".tasks-column-drop") : null;
    if (!(drop instanceof HTMLElement) || !event.dataTransfer) return;
    event.preventDefault();
    refs.tasksBoard.querySelectorAll(".tasks-column-drop").forEach((el) => el.classList.remove("is-drop-target"));
    const taskId = String(event.dataTransfer.getData("text/task-id") || "").trim();
    const status = String(drop.getAttribute("data-task-status") || "").trim();
    if (!taskId || !status) return;
    runDbAction(() => updateTaskStatus(taskId, status), { message: "Перемещаем задачу..." })
      .then(() => {
        showToast("Задача перемещена");
        hapticSuccess();
      })
      .catch((error) => {
        showToast(error.message);
        hapticWarning();
      });
  });
}

if (refs.boxSearchBtn) refs.boxSearchBtn.addEventListener("click", () => {
  searchBoxesByInput().catch((error) => {
    showToast(error.message);
    hapticWarning();
  });
});
if (refs.boxCreateToggleBtn) refs.boxCreateToggleBtn.addEventListener("click", () => {
  refs.boxCreatePanel?.classList.toggle("is-hidden");
  if (refs.boxCreatePanel && !refs.boxCreatePanel.classList.contains("is-hidden")) {
    refs.boxCreatePanel.scrollIntoView({ behavior: "smooth", block: "start" });
    refs.boxCodeInput?.focus();
  }
  hapticSelection();
});
if (refs.boxCreateCloseBtn) refs.boxCreateCloseBtn.addEventListener("click", () => {
  refs.boxCreatePanel?.classList.add("is-hidden");
  hapticSelection();
});
if (refs.boxSearchInput) refs.boxSearchInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  searchBoxesByInput().catch((error) => {
    showToast(error.message);
    hapticWarning();
  });
});
if (refs.boxApplyFiltersBtn) refs.boxApplyFiltersBtn.addEventListener("click", () => {
  applyBoxFiltersFromInputs();
  state.pages.boxTracked = 1;
  renderBoxTrackedList();
});
if (refs.boxResetFiltersBtn) refs.boxResetFiltersBtn.addEventListener("click", () => {
  if (refs.boxSearchInput) refs.boxSearchInput.value = "";
  if (refs.boxLocationFilter) refs.boxLocationFilter.value = "";
  state.boxFilters = { search: "", location: "" };
  state.boxSearchResult = [];
  state.pages.boxTracked = 1;
  renderBoxTrackedList();
  renderBoxScanResult([]);
});
if (refs.downloadBoxCatalogTemplateBtn) refs.downloadBoxCatalogTemplateBtn.addEventListener("click", async () => {
  try {
    await downloadBoxCatalogTemplate();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});
if (refs.importBoxCatalogBtn && refs.importBoxCatalogFile) refs.importBoxCatalogBtn.addEventListener("click", () => {
  if (!canDesktopPrint()) {
    showToast("Импорт доступен только на ПК");
    return;
  }
  refs.importBoxCatalogFile.value = "";
  refs.importBoxCatalogFile.click();
});
if (refs.importBoxCatalogFile) refs.importBoxCatalogFile.addEventListener("change", async () => {
  const file = refs.importBoxCatalogFile.files?.[0];
  if (!file) return;
  try {
    await runDbAction(() => importBoxCatalog(file), { message: "Импортируем каталог товаров..." });
    hapticSuccess();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});
if (refs.boxGenerateCodeBtn) refs.boxGenerateCodeBtn.addEventListener("click", async () => {
  try {
    await runDbAction(() => generateUniqueBoxCode(), {
      button: refs.boxGenerateCodeBtn,
      message: "Генерируем код коробки...",
    });
    showToast("Код коробки сгенерирован");
    hapticSuccess();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});
if (refs.boxPrintCodeBtn) refs.boxPrintCodeBtn.addEventListener("click", async () => {
  const boxCode = String(refs.boxCodeInput?.value || "").trim();
  const location = String(refs.boxLocationInput?.value || "").trim();
  if (!boxCode) {
    showToast("Сначала укажите код коробки");
    refs.boxCodeInput?.focus();
    return;
  }
  const tempBox = {
    box_code: boxCode,
    location: location || "Место не указано",
    items: state.boxDraftItems.length ? state.boxDraftItems : [],
    total_qty: state.boxDraftItems.reduce((acc, x) => acc + Math.max(1, Number(x.qty || 1)), 0),
  };
  try {
    await printBoxLabel(tempBox);
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});
if (refs.boxCatalogSearchInput) refs.boxCatalogSearchInput.addEventListener("input", () => {
  applyCatalogSelectionFromSearch();
});
if (refs.boxAddItemBtn) refs.boxAddItemBtn.addEventListener("click", () => {
  applyCatalogSelectionFromSearch();
  const barcode = String(refs.boxItemBarcodeInput?.value || "").trim();
  const name = String(refs.boxItemNameInput?.value || "").trim();
  const qty = Number(refs.boxItemQtyInput?.value || 1);
  const ok = addBoxDraftItem(barcode, name, qty);
  if (!ok) {
    showToast("Штрихкод пустой или уже добавлен");
    return;
  }
  if (refs.boxItemBarcodeInput) refs.boxItemBarcodeInput.value = "";
  if (refs.boxItemNameInput) refs.boxItemNameInput.value = "";
  if (refs.boxItemQtyInput) refs.boxItemQtyInput.value = "1";
  if (refs.boxCatalogSearchInput) refs.boxCatalogSearchInput.value = "";
  refs.boxItemBarcodeInput?.focus();
  hapticSelection();
});
if (refs.boxItemBarcodeInput) refs.boxItemBarcodeInput.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  event.preventDefault();
  refs.boxAddItemBtn?.click();
});
if (refs.boxClearDraftBtn) refs.boxClearDraftBtn.addEventListener("click", () => {
  state.boxDraftItems = [];
  if (refs.boxItemsTextarea) refs.boxItemsTextarea.value = "";
  renderBoxDraftItems();
  showToast("Черновик коробки очищен");
});
if (refs.boxCreateForm) refs.boxCreateForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!refs.boxCreateForm.reportValidity()) return;
  const submitBtn = event.submitter instanceof HTMLButtonElement ? event.submitter : null;
  try {
    await runDbAction(() => createTrackedBox(), {
      button: submitBtn,
      message: "Сохраняем коробку...",
    });
    refs.boxCreatePanel?.classList.add("is-hidden");
    hapticSuccess();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});
if (refs.boxScanBarcodeBtn) refs.boxScanBarcodeBtn.addEventListener("click", async () => {
  state.scanContext = "box-search";
  openScanModal();
  await startScanner();
});
if (refs.boxTrackedList) refs.boxTrackedList.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const printBtn = target.closest("button[data-box-print]");
  if (printBtn instanceof HTMLButtonElement) {
    const boxCode = String(printBtn.getAttribute("data-box-print") || "").trim();
    const box = groupedBoxEntries(filteredBoxEntries()).find((x) => x.box_code === boxCode);
    if (box) {
      await printBoxLabel(box);
    }
    return;
  }
  const btn = target.closest("button[data-box-remove]");
  if (!(btn instanceof HTMLButtonElement)) return;
  const boxCode = String(btn.getAttribute("data-box-remove") || "").trim();
  if (!boxCode) return;
  const ok = window.confirm(`Удалить коробку ${boxCode} из отслеживания?`);
  if (!ok) return;
  try {
    await runDbAction(() => removeBoxFromTracking(boxCode), {
      button: btn,
      message: "Удаляем коробку из отслеживания...",
    });
    hapticSuccess();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});
if (refs.boxDraftItemsList) refs.boxDraftItemsList.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const btn = target.closest("button[data-box-draft-remove]");
  if (!(btn instanceof HTMLButtonElement)) return;
  const idx = Number(btn.getAttribute("data-box-draft-remove") || -1);
  if (!Number.isInteger(idx) || idx < 0 || idx >= state.boxDraftItems.length) return;
  state.boxDraftItems.splice(idx, 1);
  renderBoxDraftItems();
});
if (refs.boxScanResultList) refs.boxScanResultList.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const printBtn = target.closest("button[data-box-print]");
  if (printBtn instanceof HTMLButtonElement) {
    const boxCode = String(printBtn.getAttribute("data-box-print") || "").trim();
    const box = (state.boxSearchResult || []).find((x) => String(x.box_code || "") === boxCode);
    if (box) {
      await printBoxLabel(box);
    }
    return;
  }
  const btn = target.closest("button[data-box-remove]");
  if (!(btn instanceof HTMLButtonElement)) return;
  const boxCode = String(btn.getAttribute("data-box-remove") || "").trim();
  if (!boxCode) return;
  const ok = window.confirm(`Удалить коробку ${boxCode} из отслеживания?`);
  if (!ok) return;
  try {
    await runDbAction(() => removeBoxFromTracking(boxCode), {
      button: btn,
      message: "Удаляем коробку из отслеживания...",
    });
    hapticSuccess();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
});
if (refs.closeBoxFoundBtn) refs.closeBoxFoundBtn.addEventListener("click", closeBoxFoundModal);
if (refs.boxFoundBackdrop) refs.boxFoundBackdrop.addEventListener("click", closeBoxFoundModal);
if (refs.boxFoundList) refs.boxFoundList.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const printBtn = target.closest("button[data-box-print]");
  if (printBtn instanceof HTMLButtonElement) {
    const boxCode = String(printBtn.getAttribute("data-box-print") || "").trim();
    const box = (state.boxSearchResult || []).find((x) => String(x.box_code || "") === boxCode);
    if (box) {
      await printBoxLabel(box);
    }
    return;
  }
  const btn = target.closest("button[data-box-remove]");
  if (!(btn instanceof HTMLButtonElement)) return;
  const boxCode = String(btn.getAttribute("data-box-remove") || "").trim();
  if (!boxCode) return;
  const ok = window.confirm(`Удалить коробку ${boxCode} из отслеживания?`);
  if (!ok) return;
  try {
    await runDbAction(() => removeBoxFromTracking(boxCode), {
      button: btn,
      message: "Удаляем коробку из отслеживания...",
    });
    closeBoxFoundModal();
    hapticSuccess();
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

if (refs.statsFiltersForm) refs.statsFiltersForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  state.stats.dateFrom = String(refs.statsDateFrom?.value || "");
  state.stats.dateTo = String(refs.statsDateTo?.value || "");
  state.stats.granularity = String(refs.statsGranularity?.value || "day");
  try {
    await runDbAction(() => loadFilmDeleteStats(), {
      button: event.submitter instanceof HTMLButtonElement ? event.submitter : refs.statsApplyBtn,
      message: "Строим статистику...",
    });
    hapticSuccess();
  } catch (error) {
    showToast(error.message);
    hapticWarning();
  }
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
  if (!refs.accountMenu.hidden) {
    const insideButton = refs.openAuthBtn.contains(target);
    const insideHomeProfile = refs.homeProfileBtn?.contains(target);
    const insideMenu = refs.accountMenu.contains(target);
    if (!insideButton && !insideHomeProfile && !insideMenu) {
      closeAccountMenu();
    }
  }
  if (refs.homeNotificationsPopover && !refs.homeNotificationsPopover.hidden) {
    const inBell = refs.homeBellBtn?.contains(target);
    const inPopup = refs.homeNotificationsPopover.contains(target);
    if (!inBell && !inPopup) {
      closeHomeNotificationsPopover();
    }
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
    closeQrLoginModal();
    closeFilmFoundModal();
    closeBoxFoundModal();
    closeFilmAddModal();
    closeFilmDeleteModal();
    closeChatCreateModal();
    closeChatForwardModal();
    closeChatReadStatusModal();
    closeChatMessageActionsPopover();
    closeHomeNotificationsPopover();
    setChatMenuOpen(false);
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
renderHomeSummary();
initStatsFilters();
renderQuickFilmBatch();
renderChatFilePreviews();
renderChatReplyPreview();
loadItems();
loadHistory();
loadFilms();
loadBoxSearchData();
loadChatData();
loadTasks();
initTelegram();
updateMobileScanFab();
startHomeNotificationsPolling();
refreshHomeNotifications(true).catch(() => {});

if (!localStorage.getItem(ONBOARDING_KEY)) {
  openOnboarding();
}
