const { listItems, upsertItem, appendMovement } = require("../../lib/sheets");
const { requireAuth } = require("../../lib/auth");
const { send, methodNotAllowed, parseJsonBody } = require("../../lib/http");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return methodNotAllowed(req, res, ["POST"]);
  }

  const auth = requireAuth(req);
  if (!auth.ok) {
    return send(res, 401, { error: auth.error });
  }

  try {
    const body = parseJsonBody(req);
    const id = String(body.id || "").trim();
    const amount = Math.max(1, Number(body.amount || 1));

    if (!id) {
      return send(res, 400, { error: "Item id is required" });
    }

    const items = await listItems();
    const item = items.find((row) => row.id === id);

    if (!item) {
      return send(res, 404, { error: "Item not found" });
    }

    const newQty = Math.max(0, Number(item.qty) - amount);

    await upsertItem({
      id: item.id,
      name: item.name,
      qty: newQty,
      threshold: Number(item.threshold || 0),
      notes: item.notes || "",
      updated_at: new Date().toISOString(),
      updated_by: auth.user.email,
    });

    await appendMovement({
      item_id: item.id,
      delta: -amount,
      reason: "consume",
      user_email: auth.user.email,
      created_at: new Date().toISOString(),
    });

    return send(res, 200, { ok: true, item: { ...item, qty: newQty } });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to consume item" });
  }
};
