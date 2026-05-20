import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, Sparkles, X } from "lucide-react";
import { Button } from "@heroui/react";
import ReactMarkdown from "react-markdown";
import type { LlmProviderDto } from "@brainstorm/core";
import { listProviders, synthesize } from "../../../api/ai.api";
import { ui } from "../../../texts/ui";

interface SynthesisPanelProps {
  debateId: string;
  selectedArgumentIds: string[];
  isOpen: boolean;
  onClose: () => void;
}

export function SynthesisPanel({
  debateId,
  selectedArgumentIds,
  isOpen,
  onClose,
}: SynthesisPanelProps) {
  const [providers, setProviders] = useState<LlmProviderDto[]>([]);
  const [modelId, setModelId] = useState<string>("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setResult(null);
    setError(null);
    listProviders()
      .then((list) => {
        setProviders(list);
        if (list.length > 0 && !modelId) setModelId(list[0]!.id);
      })
      .catch(() => {});
  }, [isOpen]);

  async function handleSynthesize() {
    if (!modelId || selectedArgumentIds.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await synthesize({ debateId, argumentIds: selectedArgumentIds, modelId });
      setResult(res.text);
    } catch {
      setError(ui.debates.ai.synthesisError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
            onClick={onClose}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen ? (
          <motion.aside
            key="synthesis-panel"
            role="dialog"
            aria-label={ui.debates.ai.synthesisTitle}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 34 }}
            className="fixed right-4 top-20 z-50 flex h-[calc(100dvh-6rem)] w-[420px] flex-col overflow-hidden rounded-3xl border border-default-100 bg-white/95 shadow-2xl shadow-violet-500/10 backdrop-blur"
          >
            <header className="flex items-start justify-between gap-3 border-b border-default-100 px-5 py-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-medium text-violet-700">
                  <Sparkles size={12} />
                  <span>{ui.debates.ai.synthesisTitle}</span>
                </div>
                <p className="mt-0.5 text-xs text-default-500">
                  {selectedArgumentIds.length} argumentów zaznaczonych
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-1.5 text-default-500 transition-colors hover:bg-default-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                <X size={16} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {selectedArgumentIds.length === 0 ? (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-default-200 px-4 py-10 text-center">
                  <Bot size={28} className="text-default-300" />
                  <p className="text-sm text-default-500">
                    {ui.debates.ai.synthesisEmpty}
                  </p>
                </div>
              ) : result ? (
                <div
                  className={
                    "rounded-2xl border border-violet-100 bg-violet-50/50 px-4 py-4 text-sm leading-relaxed text-default-800 " +
                    "[&_p]:my-2 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0 " +
                    "[&_strong]:font-semibold [&_strong]:text-default-900 " +
                    "[&_em]:italic " +
                    "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 " +
                    "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 " +
                    "[&_li]:my-1 " +
                    "[&_code]:rounded [&_code]:bg-violet-100 [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-xs"
                  }
                >
                  <ReactMarkdown>{result}</ReactMarkdown>
                </div>
              ) : error ? (
                <div
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
                >
                  {error}
                </div>
              ) : null}
            </div>

            {selectedArgumentIds.length > 0 && !result ? (
              <footer className="border-t border-default-100 px-5 py-4">
                <div className="mb-3 flex flex-col gap-1">
                  <label
                    htmlFor="synthesis-model"
                    className="text-xs font-medium text-default-700"
                  >
                    {ui.debates.ai.synthesisModelLabel}
                  </label>
                  <select
                    id="synthesis-model"
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    disabled={loading || providers.length === 0}
                    className="w-full rounded-xl border border-default-200 bg-white px-3 py-2 text-sm text-default-900 focus:outline-none focus:ring-2 focus:ring-violet-400 disabled:opacity-50"
                  >
                    {providers.length === 0 ? (
                      <option value="">{ui.debates.argumentForm.aiNoProviders}</option>
                    ) : (
                      providers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <Button
                  variant="primary"
                  size="md"
                  onPress={() => void handleSynthesize()}
                  isDisabled={loading || providers.length === 0}
                  className="w-full gap-2"
                >
                  <Sparkles size={14} />
                  {loading
                    ? ui.debates.ai.synthesisSending
                    : ui.debates.ai.synthesisStart}
                </Button>
              </footer>
            ) : result ? (
              <footer className="border-t border-default-100 px-5 py-4">
                <Button
                  variant="outline"
                  size="md"
                  onPress={() => setResult(null)}
                  className="w-full"
                >
                  Syntezuj ponownie
                </Button>
              </footer>
            ) : null}
          </motion.aside>
        ) : null}
      </AnimatePresence>
    </>
  );
}
