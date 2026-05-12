import { supabase } from "@/lib/supabase";
import { ApiResponse } from "@/lib/api";

async function getToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}

const defaultHeaders = {
  "Content-Type": "application/json",
};

async function fetchApi<T>(input: RequestInfo, init: RequestInit = {}) {
  const headers = new Headers(init.headers || {});

  Object.entries(defaultHeaders).forEach(([key, value]) => {
    if (!headers.has(key)) {
      headers.set(key, value);
    }
  });

  const token = await getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  const body = await response.text();
  const json = body ? JSON.parse(body) : null;

  if (!response.ok) {
    const message = json?.error || json?.message || response.statusText;
    throw new Error(message);
  }

  return json as ApiResponse<T>;
}

export async function apiGet<T>(path: string) {
  return fetchApi<T>(path, { method: "GET" });
}

export async function apiPost<T>(path: string, body?: unknown) {
  return fetchApi<T>(path, { method: "POST", body: JSON.stringify(body) });
}

export async function apiPatch<T>(path: string, body?: unknown) {
  return fetchApi<T>(path, { method: "PATCH", body: JSON.stringify(body) });
}

export async function apiDelete<T>(path: string, body?: unknown) {
  return fetchApi<T>(path, { method: "DELETE", body: JSON.stringify(body) });
}
