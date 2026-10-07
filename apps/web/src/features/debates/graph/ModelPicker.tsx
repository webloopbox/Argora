import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import type { LlmProviderDto } from "@argora/core";
import { ui } from "../../../texts/ui";

export interface ModelPickerProps {
  providers: LlmProviderDto[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
  placement?: "top" | "bottom";
}

export function ModelPicker({
  providers,
  value,
  onChange,
  disabled = false,
  placement = "bottom",
}: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selected = providers.find((p) => p.id === value);

  return (
    <div ref={ref} className="relative flex-1">
      <button
        type="button"
        onClick={() => !disabled && providers.length > 0 && setOpen((v) => !v)}
        disabled={disabled || providers.length === 0}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-default-200 bg-default-50 px-2.5 py-1.5 text-xs text-default-900 transition-colors hover:bg-default-100 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        <span className="truncate">
          {providers.length === 0
            ? ui.debates.argumentForm.aiNoProviders
            : (selected?.name ?? "-")}
        </span>
        <ChevronDown
          size={12}
          className={`shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence>
        {open && providers.length > 0 ? (
          <motion.ul
            initial={{ opacity: 0, y: placement === "top" ? 4 : -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: placement === "top" ? 4 : -4, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className={`absolute left-0 right-0 z-50 max-h-60 overflow-y-auto rounded-xl border border-default-200 bg-white shadow-xl shadow-black/10 dark:border-zinc-700 dark:bg-zinc-800 ${
              placement === "top"
                ? "bottom-full mb-1 origin-bottom"
                : "top-full mt-1 origin-top"
            }`}
          >
            {providers.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(p.id);
                    setOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-left text-xs transition-colors hover:bg-default-50 dark:hover:bg-zinc-700 ${
                    value === p.id
                      ? "font-semibold text-violet-700 dark:text-violet-400"
                      : "text-default-800 dark:text-zinc-200"
                  }`}
                >
                  {p.name}
                </button>
              </li>
            ))}
          </motion.ul>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
