"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, logout } from "@/app/lib/auth";
import RepoList from "@/app/components/RepoList";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [repoUrl, setRepoUrl] = useState("");
  const [status, setStatus] = useState("idle"); // idle | building | success | failed
  const [logs, setLogs] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const current = getUser();
    if (!current) {
      router.replace("/login");
      return;
    }
    setUser(current);
  }, [router]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!repoUrl.trim()) return;

    setStatus("building");
    setLogs("");
    setError("");

    try {
      const res = await fetch(`${BACKEND_URL}/api/build`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl: repoUrl.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Build request failed.");
        setStatus("failed");
        return;
      }

      setLogs(data.logs || "");
      setStatus(data.success ? "success" : "failed");
    } catch (err) {
      setError(`Could not reach backend at ${BACKEND_URL}. Is it running?`);
      setStatus("failed");
    }
  }

  // Avoid flashing the dashboard before the auth check completes.
  if (!user) return null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-50">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <span className="font-semibold tracking-tight">Drop-CI/CD</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              {user.avatarUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt=""
                  className="h-6 w-6 rounded-full"
                />
              )}
              {user.name || user.login}
            </span>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Paste a public GitHub repo URL. It gets cloned and built inside an isolated
          Docker container, and the logs show up below.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 flex gap-3">
          <input
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            placeholder="https://github.com/user/repo.git"
            className="flex-1 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
          />
          <button
            type="submit"
            disabled={status === "building"}
            className="rounded-lg bg-black dark:bg-white text-white dark:text-black px-5 py-2 text-sm font-medium disabled:opacity-50"
          >
            {status === "building" ? "Building..." : "Run Build"}
          </button>
        </form>

        {status !== "idle" && (
          <div className="mt-6">
            <StatusBadge status={status} />
          </div>
        )}

        {error && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        {logs && (
          <pre className="mt-4 max-h-[480px] overflow-auto rounded-lg bg-zinc-950 text-zinc-100 text-xs p-4 whitespace-pre-wrap">
            {logs}
          </pre>
        )}

        <div className="mt-12">
          <RepoList onSelectRepo={(cloneUrl) => setRepoUrl(cloneUrl)} />
        </div>
      </main>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    building: "bg-amber-100 text-amber-800",
    success: "bg-emerald-100 text-emerald-800",
    failed: "bg-red-100 text-red-800",
  };
  const labels = {
    building: "Building",
    success: "Success",
    failed: "Failed",
  };
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${styles[status] || ""}`}>
      {labels[status] || status}
    </span>
  );
}
