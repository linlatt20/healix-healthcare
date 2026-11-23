/**
 * 모든 API 호출이 지나가는 fetch 래퍼.
 * - 웹: baseUrl을 비워 두면 같은 출처(/api, Vite 프록시)로 요청하고 쿠키를 함께 보냄
 * - 모바일: setBaseUrl()로 서버 주소를 지정하고, 로그인 후 setAuthTokenGetter()로 Bearer 토큰 첨부
 */
let baseUrl = "";
let getAuthToken: (() => string | null | undefined | Promise<string | null | undefined>) | null = null;

export function setBaseUrl(url: string | undefined | null) {
  baseUrl = (url ?? "").replace(/\/$/, "");
}

export function setAuthTokenGetter(fn: typeof getAuthToken) {
  getAuthToken = fn;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    super(
      (body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : undefined) ?? `Request failed with status ${status}`,
    );
    this.name = "ApiError";
  }
}

type Params = Record<string, string | number | boolean | undefined | null>;

export async function customFetch<T>(
  path: string,
  init: { method?: string; params?: Params; data?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(init.params ?? {})) {
    if (v !== undefined && v !== null && v !== "") search.set(k, String(v));
  }
  const qs = search.toString();
  const url = `${baseUrl}${path}${qs ? `?${qs}` : ""}`;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (init.data !== undefined) headers["Content-Type"] = "application/json";
  const token = getAuthToken ? await getAuthToken() : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(url, {
    method: init.method ?? "GET",
    headers,
    body: init.data !== undefined ? JSON.stringify(init.data) : undefined,
    credentials: "include",
    signal: init.signal,
  });

  const text = await res.text();
  const body = text ? safeJson(text) : null;
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
