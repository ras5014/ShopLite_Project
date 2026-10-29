const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export async function apiRequest(path, options = {}) {
  const { token, ...fetchOptions } = options;
  const headers = new Headers(fetchOptions.headers ?? {});

  if (fetchOptions.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const body =
    fetchOptions.body !== undefined && typeof fetchOptions.body !== "string"
      ? JSON.stringify(fetchOptions.body)
      : fetchOptions.body;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...fetchOptions, headers, body });
  } catch {
    throw new Error("Cannot reach the API. Check that the backend is running.");
  }

  const data = response.status === 204
    ? null
    : await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || `Request failed (${response.status}).`);
  }
  return data;
}
