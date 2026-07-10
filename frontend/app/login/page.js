"use client";

import { useState } from "react";

const CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
const SCOPE = "read:user repo";

export default function LoginPage() {
  const [error, setError] = useState("");

  function signInWithGitHub() {
    if (!CLIENT_ID) {
      setError(
        "NEXT_PUBLIC_GITHUB_CLIENT_ID is not set. Add it to frontend/.env.local."
      );
      return;
    }

    // CSRF protection: round-trip a random state and verify it in the callback.
    const state = crypto.randomUUID();
    sessionStorage.setItem("gh_oauth_state", state);

    const redirectUri = `${window.location.origin}/auth/callback`;
    const url = new URL("https://github.com/login/oauth/authorize");
    url.searchParams.set("client_id", CLIENT_ID);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", SCOPE);
    url.searchParams.set("state", state);

    window.location.href = url.toString();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50 px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Drop-CI/CD</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Sign in with GitHub to see your repositories
        </p>

        <button
          onClick={signInWithGitHub}
          className="mt-8 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-black dark:bg-white text-white dark:text-black px-5 py-2.5 text-sm font-medium hover:opacity-90"
        >
          <GitHubIcon />
          Sign in with GitHub
        </button>

        {error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
