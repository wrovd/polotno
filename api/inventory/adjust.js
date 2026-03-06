const { listItems, upsertItem, appendMovement, listUsers } = require("../../lib/sheets");
const { requireAuth, requireRole } = require("../../lib/auth");
const { send, methodNotAllowed, parseJsonBody } = require("../../lib/http");
const { lowStockTransition, notifyLowStockToUsers } = require("../../lib/low-stock");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return methodNotAllowed(req, res, ["POST"]);
  }

  const auth = requireAuth(req);
  const access = requireRole(auth, ["admin"]);
  if (!access.ok) {
    return send(res, access.code, { error: access.error });
  }

  try {
    const body = parseJsonBody(req);
    const id = String(body.id || "").trim();
    const delta = Number(body.delta || 0);

    if (!id) {
      return send(res, 400, { error: "Item id is required" });
    }

    if (!Number.isFinite(delta) || delta === 0) {
      return send(res, 400, { error: "Delta must be a non-zero number" });
    }

    const items = await listItems();
    const item = items.find((row) => row.id === id);

    if (!item) {
      return send(res, 404, { error: "Item not found" });
    }

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
};
