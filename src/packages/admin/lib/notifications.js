// lib/notifications.js
const API = process.env.NEXT_PUBLIC_API;

export async function fetchNotifications(afterId) {
  const url = new URL(`${API}/notifications`);
  if (afterId != null) url.searchParams.set("after", afterId);

  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`Failed to fetch notifications: ${res.status}`);

  const json = await res.json();
  return { items: json.items, lastId: json.lastId };
}
