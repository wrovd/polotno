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
} = require("../lib/sheets");

function actionFromReq(req) {
  return String(req.query?.action || "").trim().toLowerCase();
}

function normalizeCatalogRow(raw = {}) {
  return {
    name: String(raw.name || "").trim(),
    barcode: String(raw.barcode || "").trim(),
  };
}

function normalizeTrackedItem(raw = {}) {
  return {
    barcode: String(raw.barcode || "").trim(),
    name: String(raw.name || "").trim(),
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
      });
    }
    const bucket = map.get(key);
    const barcode = String(entry.product_barcode || "").trim();
    if (!bucket.items.some((x) => x.barcode === barcode)) {
      bucket.items.push({
        barcode,
        name: String(entry.product_name || "").trim(),
      });
    }
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
      const barcode = String(req.query?.barcode || "").trim();
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

