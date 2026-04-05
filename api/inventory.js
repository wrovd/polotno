const {
  listItems,
  upsertItem,
  appendMovement,
  listUsers,
  deleteItemById,
  listGroups,
  createGroup,
  listMovements,
  createChatThread,
  listChatThreadsForUser,
  listChatMessages,
  sendChatMessage,
  markChatThreadRead,
  listTaskBoard,
  createTask,
  updateTaskById,
  archiveTaskById,
  listTaskComments,
  addTaskComment,
} = require("../lib/sheets");
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

async function handleChat(req, res) {
  const auth = requireAuth(req);
  if (!auth.ok) return send(res, 401, { error: auth.error });
  const action = actionFromReq(req);

  try {
    if (req.method === "GET" && action === "chat-list") {
      const search = String(req.query.search || "");
      const list = await listChatThreadsForUser(auth.user.email, {
        search,
        limit: Number(req.query.limit || 120),
      });
      return send(res, 200, { threads: list });
    }

    if (req.method === "GET" && action === "chat-messages") {
      const threadId = String(req.query.thread_id || req.query.threadId || "");
      if (!threadId) return send(res, 400, { error: "thread_id is required" });
      const messages = await listChatMessages(threadId, auth.user.email, {
        limit: Number(req.query.limit || 250),
      });
      await markChatThreadRead(threadId, auth.user.email);
      return send(res, 200, { messages });
    }

    if (req.method === "POST" && action === "chat-create") {
      const body = parseJsonBody(req);
      const title = String(body.title || "").trim();
      const kind = String(body.kind || "group").trim().toLowerCase();
      const members = Array.isArray(body.memberEmails) ? body.memberEmails : [];
      if (!title) return send(res, 400, { error: "title is required" });
      const thread = await createChatThread({
        title,
        kind,
        createdBy: auth.user.email,
        memberEmails: members,
      });
      await appendMovement({
        item_id: `CHAT:${thread.id}`,
        delta: 0,
        reason: "chat_create",
        user_email: auth.user.email,
        created_at: new Date().toISOString(),
      });
      return send(res, 200, { ok: true, thread });
    }

    if (req.method === "POST" && action === "chat-send") {
      const body = parseJsonBody(req);
      const threadId = String(body.threadId || body.thread_id || "").trim();
      const text = String(body.body || body.text || "").trim();
      if (!threadId) return send(res, 400, { error: "threadId is required" });
      if (!text) return send(res, 400, { error: "Message is required" });
      const message = await sendChatMessage({
        threadId,
        authorEmail: auth.user.email,
        body: text,
      });
      await markChatThreadRead(threadId, auth.user.email);
      await appendMovement({
        item_id: `CHAT:${threadId}`,
        delta: 0,
        reason: "chat_message",
        user_email: auth.user.email,
        created_at: new Date().toISOString(),
      });
      return send(res, 200, { ok: true, message });
    }

    if (req.method === "POST" && action === "chat-read") {
      const body = parseJsonBody(req);
      const threadId = String(body.threadId || body.thread_id || "").trim();
      if (!threadId) return send(res, 400, { error: "threadId is required" });
      await markChatThreadRead(threadId, auth.user.email);
      return send(res, 200, { ok: true });
    }
  } catch (error) {
    return send(res, 500, { error: error.message || "Chat action failed" });
  }

  return send(res, 404, { error: "Unknown chat action" });
}

async function handleTasks(req, res) {
  const auth = requireAuth(req);
  if (!auth.ok) return send(res, 401, { error: auth.error });
  const action = actionFromReq(req);

  try {
    if (req.method === "GET" && action === "tasks-list") {
      const tasks = await listTaskBoard({
        search: String(req.query.search || ""),
        status: String(req.query.status || ""),
        limit: Number(req.query.limit || 500),
      });
      return send(res, 200, { tasks });
    }

    if (req.method === "GET" && action === "task-comments") {
      const taskId = String(req.query.task_id || req.query.taskId || "").trim();
      if (!taskId) return send(res, 400, { error: "task_id is required" });
      const comments = await listTaskComments(taskId, { limit: Number(req.query.limit || 300) });
      return send(res, 200, { comments });
    }

    if (req.method === "POST" && action === "tasks-create") {
      const body = parseJsonBody(req);
      const title = String(body.title || "").trim();
      if (!title) return send(res, 400, { error: "title is required" });
      const task = await createTask({
        title,
        description: body.description || "",
        status: body.status || "todo",
        priority: body.priority || "medium",
        assignee_email: body.assigneeEmail || body.assignee_email || "",
        due_date: body.dueDate || body.due_date || "",
        created_by: auth.user.email,
      });
      await appendMovement({
        item_id: `TASK:${task.id}`,
        delta: 0,
        reason: "task_create",
        user_email: auth.user.email,
        created_at: new Date().toISOString(),
      });
      return send(res, 200, { ok: true, task });
    }

    if (req.method === "POST" && action === "tasks-update") {
      const body = parseJsonBody(req);
      const taskId = String(body.id || body.taskId || body.task_id || "").trim();
      if (!taskId) return send(res, 400, { error: "Task id is required" });
      const task = await updateTaskById(taskId, {
        title: body.title,
        description: body.description,
        status: body.status,
        priority: body.priority,
        assignee_email: body.assigneeEmail ?? body.assignee_email,
        due_date: body.dueDate ?? body.due_date,
      });
      if (!task) return send(res, 404, { error: "Task not found" });
      await appendMovement({
        item_id: `TASK:${taskId}`,
        delta: 0,
        reason: "task_update",
        user_email: auth.user.email,
        created_at: new Date().toISOString(),
      });
      return send(res, 200, { ok: true, task });
    }

    if (req.method === "POST" && action === "tasks-delete") {
      const body = parseJsonBody(req);
      const taskId = String(body.id || body.taskId || body.task_id || "").trim();
      if (!taskId) return send(res, 400, { error: "Task id is required" });
      const removed = await archiveTaskById(taskId);
      if (!removed) return send(res, 404, { error: "Task not found" });
      await appendMovement({
        item_id: `TASK:${taskId}`,
        delta: 0,
        reason: "task_delete",
        user_email: auth.user.email,
        created_at: new Date().toISOString(),
      });
      return send(res, 200, { ok: true });
    }

    if (req.method === "POST" && action === "task-comment") {
      const body = parseJsonBody(req);
      const taskId = String(body.taskId || body.task_id || "").trim();
      const commentBody = String(body.body || "").trim();
      if (!taskId) return send(res, 400, { error: "taskId is required" });
      if (!commentBody) return send(res, 400, { error: "Comment is required" });
      const comment = await addTaskComment({
        taskId,
        authorEmail: auth.user.email,
        body: commentBody,
      });
      await appendMovement({
        item_id: `TASK:${taskId}`,
        delta: 0,
        reason: "task_comment",
        user_email: auth.user.email,
        created_at: new Date().toISOString(),
      });
      return send(res, 200, { ok: true, comment });
    }
  } catch (error) {
    return send(res, 500, { error: error.message || "Tasks action failed" });
  }

  return send(res, 404, { error: "Unknown tasks action" });
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
  if (action.startsWith("chat-")) return handleChat(req, res);
  if (action.startsWith("task")) return handleTasks(req, res);
  return send(res, 404, { error: "Unknown inventory action" });
};
