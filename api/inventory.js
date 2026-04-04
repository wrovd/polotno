const { listItems, upsertItem, appendMovement, listUsers, deleteItemById, listGroups, createGroup, listMovements } = require("../lib/sheets");
const { requireAuth, requireRole } = require("../lib/auth");
const { send, methodNotAllowed, parseJsonBody } = require("../lib/http");
const { lowStockTransition, notifyLowStockToUsers } = require("../lib/low-stock");

function actionFromReq(req) {
  return String(req.query?.action || "").trim().toLowerCase();
}

function nextId(items) {
  let max = 0;
  for (const item of items) {
    const n = Number(String(item.id || "").replace("SUP-", ""));
    if (n > max) max = n;
  }
  return `SUP-${String(max + 1).padStart(3, "0")}`;
}

async function handleList(req, res) {
  if (req.method !== "GET") return methodNotAllowed(req, res, ["GET"]);
  const auth = requireAuth(req);
  if (!auth.ok) return send(res, 401, { error: auth.error });
  try {
    const items = await listItems();
    return send(res, 200, { items });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to load inventory" });
  }
}

async function handleGroups(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return methodNotAllowed(req, res, ["GET", "POST"]);
  }
  const auth = requireAuth(req);
  if (!auth.ok) return send(res, 401, { error: auth.error });

  try {
    if (req.method === "GET") {
      const groups = await listGroups();
      return send(res, 200, { groups });
    }

    const access = requireRole(auth, ["admin"]);
    if (!access.ok) return send(res, access.code, { error: access.error });

    const body = parseJsonBody(req);
    const name = String(body.name || "").trim();
    if (!name) return send(res, 400, { error: "Group name is required" });

    const group = await createGroup({
      name,
      created_at: new Date().toISOString(),
      created_by: auth.user.email,
    });
    return send(res, 200, { ok: true, group });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to process groups" });
  }
}

async function handleHistory(req, res) {
  if (req.method !== "GET") return methodNotAllowed(req, res, ["GET"]);
  const auth = requireAuth(req);
  if (!auth.ok) return send(res, 401, { error: auth.error });

  try {
    const limitRaw = Number(req.query.limit || 100);
    const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(limitRaw, 300)) : 100;
    const userEmail = String(req.query.user_email || "").trim().toLowerCase();
    const itemId = String(req.query.item_id || "").trim().toUpperCase();
    const reason = String(req.query.reason || "").trim().toLowerCase();
    const dateFrom = String(req.query.date_from || "").trim();
    const dateTo = String(req.query.date_to || "").trim();

    let movements = await listMovements(limit * 3);
    if (userEmail) movements = movements.filter((row) => String(row.user_email || "").toLowerCase().includes(userEmail));
    if (itemId) movements = movements.filter((row) => String(row.item_id || "").toUpperCase().includes(itemId));
    if (reason) movements = movements.filter((row) => String(row.reason || "").toLowerCase() === reason);
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      if (!Number.isNaN(fromDate.getTime())) {
        movements = movements.filter((row) => {
          const dt = new Date(row.created_at || "");
          return !Number.isNaN(dt.getTime()) && dt >= fromDate;
        });
      }
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      if (!Number.isNaN(toDate.getTime())) {
        toDate.setHours(23, 59, 59, 999);
        movements = movements.filter((row) => {
          const dt = new Date(row.created_at || "");
          return !Number.isNaN(dt.getTime()) && dt <= toDate;
        });
      }
    }
    return send(res, 200, { movements: movements.slice(0, limit) });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to load history" });
  }
}

async function handleUpsert(req, res) {
  if (req.method !== "POST") return methodNotAllowed(req, res, ["POST"]);
  const auth = requireAuth(req);
  const access = requireRole(auth, ["admin"]);
  if (!access.ok) return send(res, access.code, { error: access.error });

  try {
    const body = parseJsonBody(req);
    const items = await listItems();
    const incomingId = String(body.id || "").trim();
    const id = incomingId || nextId(items);
    const name = String(body.name || "").trim();
    const groupName = String(body.groupName || "").trim();
    const qty = Number(body.qty || 0);
    const threshold = Number(body.threshold || 0);
    const notes = String(body.notes || "").trim();

    if (!name) return send(res, 400, { error: "Item name is required" });

    const existing = items.find((row) => row.id === id);
    const existed = Boolean(existing);
    const lowState = lowStockTransition(existing?.low_notified || "0", qty, threshold);

    await upsertItem({
      id,
      name,
      group_name: groupName,
      qty,
      threshold,
      notes,
      updated_at: new Date().toISOString(),
      updated_by: auth.user.email,
      low_notified: lowState.nextFlag,
    });

    await appendMovement({
      item_id: id,
      delta: 0,
      reason: existed ? "update" : "create",
      user_email: auth.user.email,
      created_at: new Date().toISOString(),
    });

    let notified = false;
    if (lowState.notify) {
      try {
        const users = await listUsers();
        const sent = await notifyLowStockToUsers({
          users,
          itemName: name,
          itemId: id,
          qty,
          threshold,
        });
        notified = sent > 0;
      } catch {
        notified = false;
      }
    }

    return send(res, 200, { ok: true, id, notified });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to save item" });
  }
}

async function handleDelete(req, res) {
  if (req.method !== "POST") return methodNotAllowed(req, res, ["POST"]);
  const auth = requireAuth(req);
  const access = requireRole(auth, ["admin"]);
  if (!access.ok) return send(res, access.code, { error: access.error });

  try {
    const body = parseJsonBody(req);
    const id = String(body.id || "").trim();
    if (!id) return send(res, 400, { error: "Item id is required" });

    const items = await listItems();
    const existing = items.find((row) => row.id === id);
    if (!existing) return send(res, 404, { error: "Item not found" });

    const ok = await deleteItemById(id);
    if (!ok) return send(res, 404, { error: "Item not found" });

    await appendMovement({
      item_id: id,
      delta: -Number(existing.qty || 0),
      reason: "delete",
      user_email: auth.user.email,
      created_at: new Date().toISOString(),
    });

    return send(res, 200, { ok: true });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to delete item" });
  }
}

async function handleConsume(req, res) {
  if (req.method !== "POST") return methodNotAllowed(req, res, ["POST"]);
  const auth = requireAuth(req);
  const access = requireRole(auth, ["admin", "staff"]);
  if (!access.ok) return send(res, access.code, { error: access.error });

  try {
    const body = parseJsonBody(req);
    const id = String(body.id || "").trim();
    const amount = Math.max(1, Number(body.amount || 1));
    if (!id) return send(res, 400, { error: "Item id is required" });

    const items = await listItems();
    const item = items.find((row) => row.id === id);
    if (!item) return send(res, 404, { error: "Item not found" });

    const newQty = Math.max(0, Number(item.qty) - amount);
    const lowState = lowStockTransition(item.low_notified, newQty, item.threshold);
    await upsertItem({
      id: item.id,
      name: item.name,
      group_name: item.group_name || "",
      qty: newQty,
      threshold: Number(item.threshold || 0),
      notes: item.notes || "",
      updated_at: new Date().toISOString(),
      updated_by: auth.user.email,
      low_notified: lowState.nextFlag,
    });

    await appendMovement({
      item_id: item.id,
      delta: -amount,
      reason: "consume",
      user_email: auth.user.email,
      created_at: new Date().toISOString(),
    });

    let notified = false;
    if (lowState.notify) {
      try {
        const users = await listUsers();
        const sent = await notifyLowStockToUsers({
          users,
          itemName: item.name,
          itemId: item.id,
          qty: newQty,
          threshold: item.threshold,
        });
        notified = sent > 0;
      } catch {
        notified = false;
      }
    }
    return send(res, 200, { ok: true, notified, item: { ...item, qty: newQty, low_notified: lowState.nextFlag } });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to consume item" });
  }
}

async function handleAdjust(req, res) {
  if (req.method !== "POST") return methodNotAllowed(req, res, ["POST"]);
  const auth = requireAuth(req);
  const access = requireRole(auth, ["admin"]);
  if (!access.ok) return send(res, access.code, { error: access.error });

  try {
    const body = parseJsonBody(req);
    const id = String(body.id || "").trim();
    const delta = Number(body.delta || 0);
    if (!id) return send(res, 400, { error: "Item id is required" });
    if (!Number.isFinite(delta) || delta === 0) return send(res, 400, { error: "Delta must be a non-zero number" });

    const items = await listItems();
    const item = items.find((row) => row.id === id);
    if (!item) return send(res, 404, { error: "Item not found" });

    const newQty = Math.max(0, Number(item.qty) + delta);
    const lowState = lowStockTransition(item.low_notified, newQty, item.threshold);
    await upsertItem({
      id: item.id,
      name: item.name,
      group_name: item.group_name || "",
      qty: newQty,
      threshold: Number(item.threshold || 0),
      notes: item.notes || "",
      updated_at: new Date().toISOString(),
      updated_by: auth.user.email,
      low_notified: lowState.nextFlag,
    });
    await appendMovement({
      item_id: item.id,
      delta,
      reason: "adjust",
      user_email: auth.user.email,
      created_at: new Date().toISOString(),
    });

    let notified = false;
    if (lowState.notify) {
      try {
        const users = await listUsers();
        const sent = await notifyLowStockToUsers({
          users,
          itemName: item.name,
          itemId: item.id,
          qty: newQty,
          threshold: item.threshold,
        });
        notified = sent > 0;
      } catch {
        notified = false;
      }
    }

    return send(res, 200, { ok: true, notified, item: { ...item, qty: newQty, low_notified: lowState.nextFlag } });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to adjust item" });
  }
}

module.exports = async function handler(req, res) {
  const action = actionFromReq(req);
  if (!action || action === "list") return handleList(req, res);
  if (action === "groups") return handleGroups(req, res);
  if (action === "history") return handleHistory(req, res);
  if (action === "upsert") return handleUpsert(req, res);
  if (action === "delete") return handleDelete(req, res);
  if (action === "consume") return handleConsume(req, res);
  if (action === "adjust") return handleAdjust(req, res);
  return send(res, 404, { error: "Unknown inventory action" });
};

