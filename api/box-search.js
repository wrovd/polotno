const { requireAuth } = require("../lib/auth");
const { send, methodNotAllowed, parseJsonBody } = require("../lib/http");
const {
  appendMovement,
  listBoxProductsCatalog,
  findBoxCatalogByBarcode,
  upsertBoxCatalogItem,
  upsertBoxTrackingEntry,
  listBoxTrackingEntries,
  findBoxTrackingByBarcode,
  removeBoxTrackingByBoxCode,
  boxCodeExists,
  listCaseLocations,
  findCaseLocationByBarcode,
  upsertCaseLocation,
  deleteCaseLocationByBarcode,
} = require("../lib/sheets");

function actionFromReq(req) {
  return String(req.query?.action || "").trim().toLowerCase();
}

function normalizeBarcodeQuery(value) {
  const text = String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim();
  if (!text) return "";
  const compact = text.replace(/\s+/g, "");
  const matches = compact.match(/\d{6,}/g);
  return matches?.length ? matches.sort((a, b) => b.length - a.length)[0] : compact;
}

function normalizeCatalogRow(raw = {}) {
  return {
    name: String(raw.name || "").trim(),
    barcode: normalizeBarcodeQuery(raw.barcode),
  };
}

function normalizeTrackedItem(raw = {}) {
  const qtyRaw = Number(raw.qty ?? 1);
  const qty = Number.isFinite(qtyRaw) ? Math.max(1, Math.round(qtyRaw)) : 1;
  return {
    barcode: normalizeBarcodeQuery(raw.barcode),
    name: String(raw.name || "").trim(),
    qty,
  };
}

function normalizeTrackedBox(raw = {}) {
  const itemsRaw = Array.isArray(raw.items) ? raw.items : [];
  return {
    boxCode: String(raw.boxCode || raw.box_code || "").trim(),
    location: String(raw.location || "").trim(),
    items: itemsRaw.map(normalizeTrackedItem).filter((x) => x.barcode),
  };
}

function normalizeCaseLocationInput(raw = {}) {
  return {
    barcode: normalizeBarcodeQuery(raw.barcode),
    name: String(raw.name || "").trim(),
    rack: String(raw.rack || raw.stand || raw.shelfRack || "").trim(),
    shelf: String(raw.shelf || raw.polka || "").trim(),
  };
}

function groupedBoxes(entries = []) {
  const map = new Map();
  entries.forEach((entry) => {
    const boxCode = String(entry.box_code || "").trim();
    const key = boxCode;
    if (!map.has(key)) {
      map.set(key, {
        box_code: boxCode,
        location: String(entry.location || "").trim(),
        items: [],
        total_qty: 0,
      });
    }
    const bucket = map.get(key);
    const barcode = String(entry.product_barcode || "").trim();
    const qty = Number(entry.qty || 1) > 0 ? Math.round(Number(entry.qty || 1)) : 1;
    if (!bucket.items.some((x) => x.barcode === barcode)) {
      bucket.items.push({
        barcode,
        name: String(entry.product_name || "").trim(),
        qty,
      });
    }
    bucket.total_qty += qty;
  });
  return [...map.values()];
}

module.exports = async function handler(req, res) {
  const auth = requireAuth(req);
  if (!auth.ok) return send(res, 401, { error: auth.error });

  const action = actionFromReq(req);
  const method = String(req.method || "GET").toUpperCase();

  if (method === "GET" && (!action || action === "catalog")) {
    try {
      const items = await listBoxProductsCatalog({
        search: req.query?.search || "",
        limit: Number(req.query?.limit || 1000),
        offset: Number(req.query?.offset || 0),
      });
      return send(res, 200, { items });
    } catch (error) {
      return send(res, 500, { error: error.message || "Failed to load catalog" });
    }
  }

  if (method === "GET" && action === "boxes") {
    try {
      const entries = await listBoxTrackingEntries({
        search: req.query?.search || "",
        barcode: req.query?.barcode || "",
        location: req.query?.location || "",
        limit: Number(req.query?.limit || 2000),
        offset: Number(req.query?.offset || 0),
      });
      return send(res, 200, {
        entries,
        boxes: groupedBoxes(entries),
      });
    } catch (error) {
      return send(res, 500, { error: error.message || "Failed to load tracked boxes" });
    }
  }

  if (method === "GET" && action === "find-by-barcode") {
    try {
      const barcode = normalizeBarcodeQuery(req.query?.barcode);
      if (!barcode) return send(res, 400, { error: "barcode is required" });
      const entries = await findBoxTrackingByBarcode(barcode);
      return send(res, 200, {
        entries,
        boxes: groupedBoxes(entries),
      });
    } catch (error) {
      return send(res, 500, { error: error.message || "Failed to find box by barcode" });
    }
  }

  if (method === "GET" && action === "suggest-box-code") {
    try {
      const attempts = 60;
      for (let i = 0; i < attempts; i += 1) {
        const candidate = `BOX-${String(Math.floor(100000 + Math.random() * 900000))}`;
        const used = await boxCodeExists(candidate);
        if (!used) return send(res, 200, { boxCode: candidate });
      }
      return send(res, 500, { error: "Не удалось подобрать уникальный код коробки. Повторите попытку." });
    } catch (error) {
      return send(res, 500, { error: error.message || "Failed to generate box code" });
    }
  }

  if (method === "GET" && action === "cases") {
    try {
      const items = await listCaseLocations({
        search: req.query?.search || "",
        barcode: req.query?.barcode || "",
        rack: req.query?.rack || "",
        limit: Number(req.query?.limit || 1000),
        offset: Number(req.query?.offset || 0),
      });
      return send(res, 200, { items });
    } catch (error) {
      return send(res, 500, { error: error.message || "Failed to load case locations" });
    }
  }

  if (method === "GET" && action === "find-case") {
    try {
      const barcode = normalizeBarcodeQuery(req.query?.barcode);
      if (!barcode) return send(res, 400, { error: "barcode is required" });
      const item = await findCaseLocationByBarcode(barcode);
      return send(res, 200, { item });
    } catch (error) {
      return send(res, 500, { error: error.message || "Failed to find case" });
    }
  }

  if (method === "POST" && action === "catalog-bulk-upsert") {
    try {
      const body = parseJsonBody(req);
      const rows = Array.isArray(body.rows) ? body.rows : [];
      if (!rows.length) return send(res, 400, { error: "rows are required" });

      let success = 0;
      const errors = [];
      for (let i = 0; i < rows.length; i += 1) {
        const line = i + 2;
        const row = normalizeCatalogRow(rows[i]);
        if (!row.name) {
          errors.push({ line, error: "Пустое наименование товара" });
          continue;
        }
        if (!row.barcode) {
          errors.push({ line, error: "Пустой штрихкод" });
          continue;
        }

        try {
          await upsertBoxCatalogItem({
            ...row,
            updated_by: auth.user.email,
          });
          success += 1;
        } catch (error) {
          errors.push({ line, error: error.message || "Не удалось сохранить строку" });
        }
      }

      return send(res, 200, {
        ok: true,
        report: {
          total: rows.length,
          success,
          failed: errors.length,
          errors,
        },
      });
    } catch (error) {
      return send(res, 500, { error: error.message || "Failed to import catalog" });
    }
  }

  if (method === "POST" && action === "create-box") {
    try {
      const body = parseJsonBody(req);
      const box = normalizeTrackedBox(body);
      if (!box.boxCode) return send(res, 400, { error: "Нужно указать номер коробки" });
      if (!box.location) return send(res, 400, { error: "Нужно указать место нахождения" });
      if (!box.items.length) return send(res, 400, { error: "Добавьте хотя бы один товар в коробку" });

      let saved = 0;
      const errors = [];
      for (const item of box.items) {
        try {
          let name = item.name;
          if (!name) {
            const known = await findBoxCatalogByBarcode(item.barcode);
            name = String(known?.name || "").trim();
          }
          if (!name) {
            errors.push(`Штрихкод ${item.barcode}: не найдено название, заполните вручную`);
            continue;
          }

          await upsertBoxTrackingEntry({
            box_code: box.boxCode,
            location: box.location,
            product_barcode: item.barcode,
            product_name: name,
            qty: item.qty,
            updated_by: auth.user.email,
          });
          saved += 1;
        } catch (error) {
          errors.push(`Штрихкод ${item.barcode}: ${error.message || "Ошибка сохранения"}`);
        }
      }

      if (saved > 0) {
        await appendMovement({
          item_id: `BOX:${box.boxCode}`,
          delta: saved,
          reason: "box_create",
          user_email: auth.user.email,
          created_at: new Date().toISOString(),
        });
      }

      return send(res, 200, {
        ok: true,
        report: {
          total: box.items.length,
          success: saved,
          failed: errors.length,
          errors,
        },
      });
    } catch (error) {
      return send(res, 400, { error: error.message || "Failed to create tracked box" });
    }
  }

  if (method === "POST" && action === "case-upsert") {
    try {
      const body = parseJsonBody(req);
      const item = normalizeCaseLocationInput(body);
      if (!item.name && item.barcode) {
        const known = await findBoxCatalogByBarcode(item.barcode);
        item.name = String(known?.name || "").trim();
      }
      if (!item.name) return send(res, 400, { error: "Нужно указать наименование чехла" });
      if (!item.barcode) return send(res, 400, { error: "Нужно указать штрихкод" });
      if (!item.rack) return send(res, 400, { error: "Нужно указать стеллаж" });
      if (!item.shelf) return send(res, 400, { error: "Нужно указать полку" });
      const saved = await upsertCaseLocation({
        ...item,
        updated_by: auth.user.email,
      });
      await appendMovement({
        item_id: `CASE:${item.barcode}`,
        delta: 1,
        reason: "case_location_upsert",
        user_email: auth.user.email,
        created_at: new Date().toISOString(),
      });
      return send(res, 200, { ok: true, item: saved });
    } catch (error) {
      return send(res, 400, { error: error.message || "Failed to save case location" });
    }
  }

  if (method === "POST" && action === "case-delete") {
    try {
      const body = parseJsonBody(req);
      const barcode = String(body.barcode || "").trim();
      if (!barcode) return send(res, 400, { error: "barcode is required" });
      const removed = await deleteCaseLocationByBarcode(barcode);
      if (removed.removed > 0) {
        await appendMovement({
          item_id: `CASE:${barcode}`,
          delta: -removed.removed,
          reason: "case_location_delete",
          user_email: auth.user.email,
          created_at: new Date().toISOString(),
        });
      }
      return send(res, 200, { ok: true, removed: removed.removed });
    } catch (error) {
      return send(res, 500, { error: error.message || "Failed to delete case location" });
    }
  }

  if (method === "POST" && action === "remove-box") {
    try {
      const body = parseJsonBody(req);
      const boxCode = String(body.boxCode || body.box_code || "").trim();
      if (!boxCode) return send(res, 400, { error: "boxCode is required" });

      const removed = await removeBoxTrackingByBoxCode(boxCode);
      if (removed.removed > 0) {
        await appendMovement({
          item_id: `BOX:${boxCode}`,
          delta: -removed.removed,
          reason: "box_delete",
          user_email: auth.user.email,
          created_at: new Date().toISOString(),
        });
      }
      return send(res, 200, { ok: true, removed: removed.removed });
    } catch (error) {
      return send(res, 500, { error: error.message || "Failed to remove box" });
    }
  }

  if (method !== "GET" && method !== "POST") {
    return methodNotAllowed(req, res, ["GET", "POST"]);
  }
  return send(res, 404, { error: "Unknown box-search action" });
};
