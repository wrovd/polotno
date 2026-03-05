function send(res, code, payload) {
  res.status(code).json(payload);
}

function methodNotAllowed(req, res, allowed) {
  res.setHeader("Allow", allowed.join(", "));
  send(res, 405, { error: "Method not allowed" });
}

function parseJsonBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

module.exports = {
  send,
  methodNotAllowed,
  parseJsonBody,
};
