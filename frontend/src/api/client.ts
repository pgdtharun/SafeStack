// helper to call the backend api

export type ScenarioMode = "vulnerable" | "secure";

export interface ResponseEnvelope<T = any> {
  status: number;
  data: T | null;
  mode?: ScenarioMode | string;
  executed_query?: string | null;
  error?: string;
}

const API_BASE_URL =
  (typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    (import.meta as any).env.VITE_API_BASE_URL !== undefined)
    ? (import.meta as any).env.VITE_API_BASE_URL
    : "http://localhost:8000";

// send request to the selected endpoint
export async function callApi<T = any>(
  mode: ScenarioMode,
  endpoint: string,
  body?: any,
  init?: RequestInit
): Promise<ResponseEnvelope<T>> {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  let path = cleanEndpoint;
  if (path.startsWith("/api/")) {
    path = path.slice(4);
  }
  const url = path === "/reset" || path.startsWith("/reset?")
    ? `${API_BASE_URL}/api${path}`
    : `${API_BASE_URL}/api/${mode}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string>),
  };

  const method = init?.method || (body != null ? "POST" : "GET");

  try {
    const res = await fetch(url, {
      ...init,
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
    });

    const json = await res.json().catch(() => null);

    // read nested error detail if present
    let payload = json;
    if (json && typeof json === "object" && json.detail && typeof json.detail === "object") {
      payload = json.detail;
    }

    if (payload && typeof payload === "object" && "status" in payload) {
      return payload as ResponseEnvelope<T>;
    }

    return {
      status: res.status,
      data: payload,
      mode,
      executed_query: null,
      error: res.ok ? undefined : `HTTP ${res.status}: ${res.statusText}`,
    };
  } catch (err: any) {
    return {
      status: 0,
      data: null,
      mode,
      executed_query: null,
      error: err?.message || "Failed to connect to backend",
    };
  }
}

export default callApi;
