// Simple Server-Sent Events (SSE) notification hub
// Keeps per-user client connections and dispatches events on new notifications.

const clients = new Map(); // userId -> Set<res>

function addClient(userId, res) {
  const id = Number(userId);
  if (!id) return;
  if (!clients.has(id)) clients.set(id, new Set());
  clients.get(id).add(res);
}

function removeClient(userId, res) {
  const id = Number(userId);
  const set = clients.get(id);
  if (set) {
    set.delete(res);
    if (set.size === 0) clients.delete(id);
  }
}

function send(userId, event, data) {
  const id = Number(userId);
  const set = clients.get(id);
  if (!set || set.size === 0) return;
  const payload = typeof data === 'string' ? data : JSON.stringify(data);
  const lines = [];
  if (event) lines.push(`event: ${event}`);
  lines.push(`data: ${payload}`);
  const msg = lines.join('\n') + '\n\n';
  for (const res of set) {
    try { res.write(msg); } catch {}
  }
}

function pingAll() {
  for (const set of clients.values()) {
    for (const res of set) {
      try { res.write(`: ping\n\n`); } catch {}
    }
  }
}

// Global heartbeat every 25s to keep connections alive on proxies
setInterval(pingAll, 25000);

module.exports = { addClient, removeClient, send };
