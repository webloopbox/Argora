import { useEffect, useMemo, useRef, useState } from "react";
import { Search, User as UserIcon, X } from "lucide-react";
import type { UserSearchResultDto } from "@argora/core";
import { searchUsers } from "../../api/users.api";
import { ui } from "../../texts/ui";

// What the picker knows about one query: nothing yet (`pending`), the users it
// returned, or that it failed. Keyed by the query itself, so "is this still the
// answer to what the user has typed" is derived during render instead of kept
// in a second flag an effect would have to hold in step.
interface SearchSnapshot {
  query: string;
  pending: boolean;
  users: UserSearchResultDto[] | null;
  failed: boolean;
}

interface UserSearchPickerProps {
  selected: UserSearchResultDto | null;
  onSelect: (user: UserSearchResultDto | null) => void;
  excludeIds?: string[];
  disabled?: boolean;
  autoFocus?: boolean;
}

// Debounced autocomplete over /users/search. The picker mirrors a single
// chosen user - clearing it returns to the input field so the parent can
// switch invitees without re-mounting.
export function UserSearchPicker({
  selected,
  onSelect,
  excludeIds,
  disabled,
  autoFocus,
}: UserSearchPickerProps) {
  const [query, setQuery] = useState("");
  const [snapshot, setSnapshot] = useState<SearchSnapshot>({
    query: "",
    pending: false,
    users: [],
    failed: false,
  });
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const excludeSet = useMemo(() => new Set(excludeIds ?? []), [excludeIds]);

  const trimmed = query.trim();
  const isSearchable = !selected && trimmed.length >= 2;

  // Debounced lookup. Nothing is written to state while the user is still
  // typing, so a keystroke does not cascade a render. The request marks itself
  // pending when it actually goes out; without that, a retry of a query that
  // failed before would show the old error for as long as it took to answer.
  useEffect(() => {
    if (!isSearchable) return;

    let cancelled = false;
    const handle = setTimeout(() => {
      if (cancelled) return;
      setSnapshot({ query: trimmed, pending: true, users: null, failed: false });
      searchUsers(trimmed)
        .then((users) => {
          if (!cancelled)
            setSnapshot({ query: trimmed, pending: false, users, failed: false });
        })
        .catch(() => {
          if (!cancelled)
            setSnapshot({
              query: trimmed,
              pending: false,
              users: null,
              failed: true,
            });
        });
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [trimmed, isSearchable]);

  // Derived view of the snapshot: still waiting, failed, or a filtered hit
  // list. Exclusions are applied here so a changed `excludeIds` does not
  // re-trigger the request.
  const isStale = snapshot.query !== trimmed;
  const loading = isSearchable && (isStale || snapshot.pending);
  const error = !isStale && snapshot.failed ? ui.users.searchError : null;
  const results = useMemo(
    () => (snapshot.users ?? []).filter((u) => !excludeSet.has(u.id)),
    [snapshot.users, excludeSet],
  );

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  if (selected) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-violet-50/60 px-3 py-2.5 dark:border-violet-700/40 dark:bg-violet-900/30">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300">
            <UserIcon size={14} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-default-900 dark:text-zinc-100">
              {selected.displayName}
            </div>
            <div className="truncate text-xs text-default-500 dark:text-zinc-400">
              {selected.email}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onSelect(null);
            setQuery("");
          }}
          disabled={disabled}
          aria-label={ui.users.clearSelection}
          className="rounded-full p-1 text-default-500 transition-colors hover:bg-violet-100 hover:text-default-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-violet-900/50 dark:hover:text-zinc-100"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 rounded-2xl border border-default-200 bg-white px-3 py-2 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100 dark:border-zinc-700 dark:bg-zinc-900 dark:focus-within:ring-violet-900/50">
        <Search size={14} className="text-default-400 dark:text-zinc-500" />
        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={ui.users.searchPlaceholder}
          disabled={disabled}
          autoFocus={autoFocus}
          className="w-full bg-transparent text-sm placeholder:text-default-400 focus:outline-none disabled:opacity-50 dark:text-zinc-100 dark:placeholder:text-zinc-500"
          aria-label={ui.users.searchPlaceholder}
          autoComplete="off"
        />
      </div>

      {open && query.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-default-100 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          {loading ? (
            <div className="px-3 py-3 text-xs text-default-500 dark:text-zinc-400">
              {ui.users.searching}
            </div>
          ) : error ? (
            <div className="px-3 py-3 text-xs text-red-600 dark:text-red-400">
              {error}
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-3 text-xs text-default-500 dark:text-zinc-400">
              {ui.users.noResults}
            </div>
          ) : (
            <ul className="max-h-60 divide-y divide-default-100 overflow-y-auto dark:divide-zinc-800">
              {results.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(user);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-violet-50 focus-visible:bg-violet-50 focus-visible:outline-none dark:hover:bg-violet-900/30 dark:focus-visible:bg-violet-900/30"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-500/15 text-violet-700 dark:text-violet-300">
                      <UserIcon size={14} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-default-900 dark:text-zinc-100">
                        {user.displayName}
                      </span>
                      <span className="block truncate text-xs text-default-500 dark:text-zinc-400">
                        {user.email}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
