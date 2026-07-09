import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { getGlobalLanguage, setGlobalLanguage } from "../texts/ui";
import type { Lang } from "../texts/ui";
import { LanguageContext } from "./language-context";

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => getGlobalLanguage());

  const setLang = useCallback((next: Lang) => {
    setGlobalLanguage(next);
    setLangState(next);
  }, []);

  const toggle = useCallback(() => {
    setLang(lang === "pl" ? "en" : "pl");
  }, [lang, setLang]);

  const value = useMemo(
    () => ({ lang, setLang, toggle }),
    [lang, setLang, toggle],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}
