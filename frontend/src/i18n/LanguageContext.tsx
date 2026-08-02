"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export const LOCALES = ["en", "am", "om", "ti", "so"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  am: "አማርኛ",
  om: "Afaan Oromo",
  ti: "ትግርኛ",
  so: "Soomaali",
};

const STORAGE_KEY = "bete_locale";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type Dictionary = Record<string, unknown>;

type LanguageContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  isLoading: boolean;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

function readStoredLocale(): Locale {
  if (typeof window === "undefined") {
    return "en";
  }

  const fromStorage = window.localStorage.getItem(STORAGE_KEY);
  if (fromStorage && isLocale(fromStorage)) {
    return fromStorage;
  }

  const cookieMatch = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${STORAGE_KEY}=`));
  const fromCookie = cookieMatch?.split("=")[1];
  if (fromCookie && isLocale(fromCookie)) {
    return fromCookie;
  }

  return "en";
}

function persistLocale(locale: Locale): void {
  window.localStorage.setItem(STORAGE_KEY, locale);
  document.cookie = `${STORAGE_KEY}=${locale};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`;
}

function resolveKey(dictionary: Dictionary, key: string): string | undefined {
  const parts = key.split(".");
  let current: unknown = dictionary;

  for (const part of parts) {
    if (
      current === null ||
      typeof current !== "object" ||
      !(part in (current as Record<string, unknown>))
    ) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return typeof current === "string" ? current : undefined;
}

/** Strip leading // line comments so locale files can carry review notes. */
function parseLocaleJson(raw: string): Dictionary {
  const withoutComments = raw.replace(/^\uFEFF?(?:\/\/[^\r\n]*\r?\n)+/, "");
  return JSON.parse(withoutComments) as Dictionary;
}

async function loadDictionary(locale: Locale): Promise<Dictionary> {
  const response = await fetch(`/locales/${locale}/common.json`);
  if (!response.ok) {
    throw new Error(`Failed to load locale: ${locale}`);
  }
  const raw = await response.text();
  return parseLocaleJson(raw);
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [dictionary, setDictionary] = useState<Dictionary>({});
  const [english, setEnglish] = useState<Dictionary>({});
  const [isLoading, setIsLoading] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setLocaleState(readStoredLocale());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const [next, enDict] = await Promise.all([
          loadDictionary(locale),
          locale === "en"
            ? Promise.resolve(null)
            : loadDictionary("en").catch(() => null),
        ]);
        if (!cancelled) {
          setDictionary(next);
          if (locale === "en") {
            setEnglish(next);
          } else if (enDict) {
            setEnglish(enDict);
          }
          document.documentElement.lang = locale;
          persistLocale(locale);
        }
      } catch {
        if (!cancelled && locale !== "en") {
          const fallback = await loadDictionary("en");
          if (!cancelled) {
            setDictionary(fallback);
            setEnglish(fallback);
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [locale, hydrated]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const t = useCallback(
    (key: string) =>
      resolveKey(dictionary, key) ?? resolveKey(english, key) ?? key,
    [dictionary, english],
  );

  const value = useMemo(
    () => ({ locale, setLocale, t, isLoading }),
    [locale, setLocale, t, isLoading],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
