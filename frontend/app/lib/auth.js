"use client";

// Client-side session for the GitHub OAuth flow. The access token is stored in
// localStorage for simplicity (matches this demo's setup); a production app
// would prefer an httpOnly cookie set by the backend to reduce XSS exposure.
const STORAGE_KEY = "drop_cicd_session";

export function saveSession({ token, user }) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ token, ...user }));
}

export function logout() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function getUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getToken() {
  return getUser()?.token || null;
}
