// lib/notify.ts
export type Contact = { userId: string; email?: string | null; phone?: string | null };

export async function getNotificationContact(userId: string): Promise<Contact | null> {
  return { userId, email: null, phone: null };
}

export async function getNotificationContactByUser(userId: string) {
  return getNotificationContact(userId);
}

export async function queueNotificationEvent(_evt: any) {
  // no-op in dev
  return { queued: true };
}

export async function dispatchPending() {
  // no-op in dev
  return { dispatched: 0 };
}

// optional convenience (some files import a default)
const Notify = { getNotificationContact, getNotificationContactByUser, queueNotificationEvent, dispatchPending };
export default Notify;
