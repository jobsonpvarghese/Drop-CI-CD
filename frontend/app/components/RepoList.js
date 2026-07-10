"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken, logout } from "@/app/lib/auth";

const PER_PAGE = 100;
const MAX_PAGES = 10; // safety cap: up to 1000 repos

export default function RepoList({ onSelectRepo }) {
  const router = useRouter();
  const [repos, setRepos] = useState([]);
  const [state, setState] = useState("loading"); // loading | ready | error
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const all = [];
        for (let page = 1; page <= MAX_PAGES; page++) {
          const url =
            `https://api.github.com/user/repos?per_page=${PER_PAGE}&page=${page}` +
            `&sort=updated&affiliation=owner,collaborator,organization_member`;
          const res = await fetch(url, {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/vnd.github+json",
            },
          });

          if (res.status === 401) {
            logout();
            router.replace("/login");
            return;
          }
          if (!res.ok) throw new Error(`GitHub API error (${res.status}).`);

          const batch = await res.json();
          all.push(...batch);
          if (batch.length < PER_PAGE) break; // last page
        }

        if (cancelled) return;
        setRepos(all);
        setState("ready");
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setState("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  if (state === "loading") {
    return <p className="text-sm text-zinc-500">Loading your repositories…</p>;
  }
  if (state === "error") {
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  }
  if (repos.length === 0) {
    return <p className="text-sm text-zinc-500">No repositories found.</p>;
  }

  return (
    <div>
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-lg font-medium">Your repositories</h2>
        <span className="text-xs text-zinc-500">{repos.length} total</span>
      </div>
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800">
        {repos.map((repo) => (
          <li
            key={repo.id}
            className="flex items-center justify-between gap-4 px-4 py-3"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <a
                  href={repo.html_url}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-sm font-medium hover:underline"
                >
                  {repo.full_name}
                </a>
                {repo.private && (
                  <span className="rounded-full bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:text-zinc-400">
                    Private
                  </span>
                )}
              </div>
              {repo.description && (
                <p className="mt-0.5 truncate text-xs text-zinc-500">
                  {repo.description}
                </p>
              )}
              <div className="mt-1 flex items-center gap-3 text-[11px] text-zinc-500">
                {repo.language && <span>{repo.language}</span>}
                <span>★ {repo.stargazers_count}</span>
                <span>
                  Updated {new Date(repo.updated_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            {onSelectRepo && (
              <button
                onClick={() => onSelectRepo(repo.clone_url)}
                className="shrink-0 rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1.5 text-xs font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                Build
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
