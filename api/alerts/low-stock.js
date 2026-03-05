const { listItems } = require("../../lib/sheets");
const { requireAuth } = require("../../lib/auth");
const { send, methodNotAllowed } = require("../../lib/http");

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    return methodNotAllowed(req, res, ["GET"]);
  }

  const auth = requireAuth(req);
  if (!auth.ok) {
    return send(res, 401, { error: auth.error });
  }

  try {
    const items = await listItems();
    const low = items.filter((item) => Number(item.qty) <= Number(item.threshold));
    return send(res, 200, { items: low });
  } catch (error) {
    return send(res, 500, { error: error.message || "Failed to check low stock" });
  }
};
