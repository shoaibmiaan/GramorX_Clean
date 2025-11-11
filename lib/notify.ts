type Payload = Record<string, any>;

export async function notify(topic: string, payload: Payload = {}) {
  // Shim: log instead of external side-effects. Replace with real bus later.
  if (process.env.NODE_ENV !== "production") {
    console.info("[notify]", topic, payload);
  }
  return { ok: true };
}

export async function enqueueEvent(queue: string, payload: Payload = {}) {
  if (process.env.NODE_ENV !== "production") {
    console.info("[enqueueEvent]", queue, payload);
  }
  return { ok: true };
}

export default notify;
