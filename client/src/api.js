const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/$/, "");

export async function apiRequest(path, options = {}) {
  const { token, ...requestOptions } = options;
  const headers = new Headers(options.headers);

  if (options.body !== undefined) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (typeof options.body !== "string") {
      requestOptions.body = JSON.stringify(options.body);
    }
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  requestOptions.headers = headers;

  let response;
  try {
    response = await fetch(API_URL + path, requestOptions);
  } catch {
    throw new Error("Cannot reach the API. Check that the backend is running.");
  }

  let data = null;
  if (response.status !== 204) {
    try {
      data = await response.json();
    } catch {
      throw new Error("The API returned an unreadable response. Please try again.");
    }
  }

  if (!response.ok) {
    let message = `Request failed (${response.status}).`;
    if (data && typeof data.message === "string" && data.message) {
      message = data.message;
    }
    throw new Error(message);
  }
  return data;
}
