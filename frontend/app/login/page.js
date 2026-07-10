"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/app/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Dummy auth: accept any non-empty username/password.
    if (!username.trim() || !password.trim()) {
      setError("Enter any username and password to continue.");
      return;
    }

    login(username.trim());
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50 px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-center">Drop-CI/CD</h1>
        <p className="mt-2 text-center text-sm text-zinc-600 dark:text-zinc-400">
          Sign in to continue
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-black dark:bg-white text-white dark:text-black px-5 py-2 text-sm font-medium"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          Demo login — any username and password works.
        </p>
      </div>
    </div>
  );
}
