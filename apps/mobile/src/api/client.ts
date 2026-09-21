import { getApiBaseUrl } from "./config";
import { getToken } from "./tokenStore";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getToken();
  const baseUrl = getApiBaseUrl();

  let res: Response;
  try {
    res = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    // A thrown fetch (vs. a non-2xx response, handled below) means the
    // request never reached a server at all — most often the phone and the
    // dev machine aren't on the same Wi-Fi network, or the Next.js server
    // isn't running. The raw error here is an opaque native exception, so
    // surface something a person can actually act on instead.
    throw new Error(`Can't reach the server at ${baseUrl}. Make sure your phone and computer are on the same Wi-Fi network and the app server is running.`);
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return body as T;
}
