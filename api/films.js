const { requireAuth } = require("../lib/auth");
const { send, methodNotAllowed, parseJsonBody } = require("../lib/http");
const {
  listFilms,
  upsertFilm,
  updateFilmBaseByBarcode,
  deleteFilmByBarcodeCell,
  findFilmsByBarcode,
  appendMovement,
  getFilmDeleteStats,
} = require("../lib/sheets");

function actionFromReq(req) {
  return String(req.query?.action || "").trim().toLowerCase();
}

function normalizeFilmInput(raw = {}) {
  const hasOldBarcodes =
    Object.prototype.hasOwnProperty.call(raw, "oldBarcodes") ||
    Object.prototype.hasOwnProperty.call(raw, "old_barcodes");
  return {
    name: String(raw.name || "").trim(),
    barcode: String(raw.barcode || "").trim(),
    cell_no: String(raw.cellNo || raw.cell_no || "").trim(),
    old_barcodes: hasOldBarcodes ? String(raw.oldBarcodes ?? raw.old_barcodes ?? "").trim() : "",
    _hasOldBarcodes: hasOldBarcodes,
    updated_by: String(raw.updatedBy || raw.updated_by || "").trim(),
  };
}

function filmMovementId({ barcode, cellNo }) {
  return `FILM:${String(barcode || "").trim()}@${String(cellNo || "").trim()}`;
}

function filmSavePayload(row, updatedBy) {
  const payload = {
    name: row.name,
    barcode: row.barcode,
    cell_no: row.cell_no,
    updated_by: updatedBy,
  };
  if (row._hasOldBarcodes) payload.old_barcodes = row.old_barcodes;
  return payload;
}

module.exports = async function handler(req, res) {
  const auth = requireAuth(req);
  if (!auth.ok) return send(res, 401, { error: auth.error });

  const action = actionFromReq(req);
  const method = String(req.method || "GET").toUpperCase();

  if (method === "GET" && (!action || action === "list")) {
    try {
      const films = await listFilms({
        search: req.query?.search || "",
        barcode: req.query?.barcode || "",
        cellNo: req.query?.cell_no || req.query?.cellNo || "",
        limit: Number(req.query?.limit || 500),
        offset: Number(req.query?.offset || 0),
      });
      return send(res, 200, { films });
    } catch (error) {
      return send(res, 500, { error: error.message || "Failed to load films" });
    }
  }

  if (method === "GET" && action === "find-by-barcode") {
    try {
      const barcode = String(req.query?.barcode || "").trim();
      if (!barcode) return send(res, 400, { error: "barcode is required" });
      const films = await findFilmsByBarcode(barcode);
      return send(res, 200, { films });
    } catch (error) {
      return send(res, 500, { error: error.message || "Failed to find film" });
    }
  }

  if (method === "GET" && action === "delete-stats") {
    try {
      const stats = await getFilmDeleteStats({
        dateFrom: req.query?.date_from || "",
        dateTo: req.query?.date_to || "",
        granularity: req.query?.granularity || "day",
      });
      return send(res, 200, stats);
    } catch (error) {
      return send(res, 500, { error: error.message || "Failed to load film delete stats" });
    }
  }

  if (method === "POST" && (action === "upsert" || !action)) {
    try {
      const body = parseJsonBody(req);
      const normalized = normalizeFilmInput(body);
      const existingRows = await findFilmsByBarcode(normalized.barcode);
      const existed = existingRows.some(
        (row) =>
          String(row.barcode || "").trim() === normalized.barcode &&
          String(row.cell_no || "").trim() === normalized.cell_no
      );
      const saved = await upsertFilm(filmSavePayload(normalized, auth.user.email));
      await appendMovement({
        item_id: filmMovementId({ barcode: normalized.barcode, cellNo: normalized.cell_no }),
        delta: 0,
        reason: existed ? "film_update" : "film_create",
        user_email: auth.user.email,
        created_at: new Date().toISOString(),
      });
      return send(res, 200, { ok: true, film: saved });
    } catch (error) {
      return send(res, 400, { error: error.message || "Failed to save film" });
    }
  }

  if (method === "POST" && action === "delete") {
    try {
      const body = parseJsonBody(req);
      const barcode = String(body.barcode || "").trim();
      const cellNo = String(body.cellNo || body.cell_no || "").trim();
      if (!barcode || !cellNo) {
        return send(res, 400, { error: "barcode and cellNo are required" });
      }
      const removed = await deleteFilmByBarcodeCell(barcode, cellNo);
      if (removed) {
        await appendMovement({
          item_id: filmMovementId({ barcode, cellNo }),
          delta: 0,
          reason: "film_delete",
          user_email: auth.user.email,
          created_at: new Date().toISOString(),
        });
      }
      return send(res, 200, { ok: true, removed });
    } catch (error) {
      return send(res, 500, { error: error.message || "Failed to delete film" });
    }
  }

  if (method === "POST" && action === "bulk-base-update") {
    try {
      const body = parseJsonBody(req);
      const rows = Array.isArray(body.rows) ? body.rows : [];
      if (!rows.length) return send(res, 400, { error: "rows are required" });

      let success = 0;
      const errors = [];

      for (let i = 0; i < rows.length; i += 1) {
        const line = i + 2;
        const row = normalizeFilmInput(rows[i]);
        if (!row.name) {
          errors.push({ line, error: "Пустой артикул пленки" });
          continue;
        }
        if (!row.barcode) {
          errors.push({ line, error: "Пустой штрихкод пленки" });
          continue;
        }

        try {
          await updateFilmBaseByBarcode({
            ...filmSavePayload(row, auth.user.email),
            old_barcodes: row.old_barcodes,
          });
          await appendMovement({
            item_id: filmMovementId({ barcode: row.barcode, cellNo: "BASE" }),
            delta: 0,
            reason: "film_base_update",
            user_email: auth.user.email,
            created_at: new Date().toISOString(),
          });
          success += 1;
        } catch (error) {
          errors.push({ line, error: error.message || "Не удалось обновить строку" });
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
      return send(res, 500, { error: error.message || "Failed to update films base" });
    }
  }

  if (method === "POST" && action === "bulk-upsert") {
    try {
      const body = parseJsonBody(req);
      const rows = Array.isArray(body.rows) ? body.rows : [];
      if (!rows.length) return send(res, 400, { error: "rows are required" });

      let success = 0;
      const errors = [];

      for (let i = 0; i < rows.length; i += 1) {
        const line = i + 2;
        const row = normalizeFilmInput(rows[i]);
        if (!row.name) {
          errors.push({ line, error: "Пустое наименование товара" });
          continue;
        }
        if (!row.barcode) {
          errors.push({ line, error: "Пустой штрихкод" });
          continue;
        }

        try {
          const existingRows = await findFilmsByBarcode(row.barcode);
          const existed = existingRows.some(
            (x) =>
              String(x.barcode || "").trim() === row.barcode &&
              String(x.cell_no || "").trim() === row.cell_no
          );
          await upsertFilm(filmSavePayload(row, auth.user.email));
          await appendMovement({
            item_id: filmMovementId({ barcode: row.barcode, cellNo: row.cell_no }),
            delta: 0,
            reason: existed ? "film_update" : "film_create",
            user_email: auth.user.email,
            created_at: new Date().toISOString(),
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
      return send(res, 500, { error: error.message || "Failed to import films" });
    }
  }

  if (method !== "GET" && method !== "POST") {
    return methodNotAllowed(req, res, ["GET", "POST"]);
  }

  return send(res, 404, { error: "Unknown films action" });
};
