/** Player identity. Anonymous = device uuid in localStorage + cookie; signed in = signed session cookie. */
export const PLAYER_COOKIE = "player_session";
export const DEVICE_COOKIE = "device_id";
const DEVICE_KEY = "maamar-musgar:device-v1";

export const isUuid = (s: unknown): s is string =>
  typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

/** Client only. Mirrors the id into a cookie so the sign-in callback can merge this device's history. */
export function getDeviceId(): string {
  let id = "";
  try {
    id = localStorage.getItem(DEVICE_KEY) ?? "";
    if (!isUuid(id)) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    document.cookie = `${DEVICE_COOKIE}=${id}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    /* storage disabled: fall back to a per-load id */
    id = id || crypto.randomUUID();
  }
  return id;
}
