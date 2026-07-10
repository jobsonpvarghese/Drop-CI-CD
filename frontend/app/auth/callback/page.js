"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { saveSession } from "@/app/lib/auth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    // Read straight from the URL to avoid needing a useSearchParams Suspense boundary.
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const state = params.get("state");
    const expectedState = sessionStorage.getItem("gh_oauth_state");
    sessionStorage.removeItem("gh_oauth_state");

    if (params.get("error")) {
      setError(params.get("error_description") || params.get("error"));
      return;
    }
    if (!code) {
      setError("No authorization code returned from GitHub.");
      return;
    }
    if (!state || state !== expectedState) {
      setError("Invalid OAuth state. Please try signing in again.");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/github/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Sign-in failed.");
        if (cancelled) return;
        saveSession({ token: data.token, user: data.user });
        router.replace("/dashboard");
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50 px-6">
      <div className="text-center">
        {error ? (
          <>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            <button
              onClick={() => router.replace("/login")}
              className="mt-4 rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium"
            >
              Back to sign in
            </button>
          </>
        ) : (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Signing you in…
          </p>
        )}
      </div>
    </div>
  );
}
