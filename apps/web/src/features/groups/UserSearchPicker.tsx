import { useEffect, useMemo, useRef, useState } from "react";
import { Search, User as UserIcon, X } from "lucide-react";
import type { UserSearchResultDto } from "@brainstorm/core";
import { searchUsers } from "../../api/users.api";
import { ui } from "../../texts/ui";

interface UserSearchPickerProps {
  selected: UserSearchResultDto | null;
  onSelect: (user: UserSearchResultDto | null) => void;
  excludeIds?: string[];
  disabled?: boolean;
  autoFocus?: boolean;
}

// Debounced autocomplete over /users/search. The picker mirrors a single
// chosen user — clearing it returns to the input field so the parent can
// switch invitees without re-mounting.
export function UserSearchPicker({
  selected,
  onSelect,
  excludeIds,
  disabled,
  autoFocus,
}: UserSearchPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResultDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const excludeSet = useMemo(() => new Set(excludeIds ?? []), [excludeIds]);

  useEffect(() => {
    if (selected) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    const handle = setTimeout(() => {
      searchUsers(trimmed)
        .then((users) => {
          if (cancelled) return;
          setResults(users.filter((u) => !excludeSet.has(u.id)));
          setLoading(false);
        })
        .catch(() => {
          if (cancelled) return;
          setError(ui.users.searchError);
          setLoading(false);
        });
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [query, selected, excludeSet]);

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
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-violet-50/60 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-500/15 text-violet-700">
            <UserIcon size={14} />
          </span>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-default-900">
              {selected.displayName}
            </div>
            <div className="truncate text-xs text-default-500">
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
          className="rounded-full p-1 text-default-500 transition-colors hover:bg-violet-100 hover:text-default-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:opacity-50"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 rounded-2xl border border-default-200 bg-white px-3 py-2 focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-100">
        <Search size={14} className="text-default-400" />
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
          className="w-full bg-transparent text-sm placeholder:text-default-400 focus:outline-none disabled:opacity-50"
          aria-label={ui.users.searchPlaceholder}
          autoComplete="off"
        />
      </div>

      {open && query.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl border border-default-100 bg-white shadow-lg">
          {loading ? (
            <div className="px-3 py-3 text-xs text-default-500">
              {ui.users.searching}
            </div>
          ) : error ? (
            <div className="px-3 py-3 text-xs text-red-600">{error}</div>
          ) : results.length === 0 ? (
            <div className="px-3 py-3 text-xs text-default-500">
              {ui.users.noResults}
            </div>
          ) : (
            <ul className="max-h-60 divide-y divide-default-100 overflow-y-auto">
              {results.map((user) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(user);
                      setOpen(false);
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-violet-50 focus-visible:bg-violet-50 focus-visible:outline-none"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-violet-500/15 text-violet-700">
                      <UserIcon size={14} />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-default-900">
                        {user.displayName}
                      </span>
                      <span className="block truncate text-xs text-default-500">
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
