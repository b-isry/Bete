"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, Icon } from "@/components/ui";
import {
  LOCALES,
  LOCALE_LABELS,
  useLanguage,
  type Locale,
} from "@/i18n/LanguageContext";
import { getAccessToken, setAccessToken } from "@/lib/auth";
import { useAuthMe } from "@/lib/hooks";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, setLocale, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const { data: meData, error: meError, mutate: mutateMe } = useAuthMe();

  useEffect(() => {
    const token = Boolean(getAccessToken());
    setHasToken(token);
    if (token) {
      void mutateMe();
    }
  }, [pathname, mutateMe]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (langRef.current && !langRef.current.contains(target)) {
        setLangOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(target)) {
        setAccountOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLangOpen(false);
        setAccountOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleSelect(next: Locale) {
    setLocale(next);
    setLangOpen(false);
  }

  async function handleLogout() {
    setAccessToken(null);
    setHasToken(false);
    setAccountOpen(false);
    await mutateMe(undefined, { revalidate: false });
    router.push("/");
  }

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const signedIn = hasToken && !meError;
  const role = meData?.user.role;
  const isAdmin = role === "ADMIN";
  const accountHref = isAdmin ? "/admin" : "/dashboard";
  const accountLabel = isAdmin ? t("nav.dashboard") : t("nav.profile");

  return (
    <header className="sticky top-0 z-50 h-[var(--header-height)] border-b border-outline-variant bg-background">
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-serif text-2xl text-on-surface">
          {t("brand.name")}
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6">
          <div className="relative" ref={langRef}>
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={langOpen}
              aria-label={t("language.label")}
              onClick={() => setLangOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 font-sans text-label-md text-on-surface hover:text-primary"
            >
              {LOCALE_LABELS[locale]}
              <Icon name="expand_more" className="text-base leading-none" />
            </button>

            {langOpen ? (
              <ul
                role="listbox"
                aria-label={t("language.label")}
                className="absolute right-0 z-50 mt-2 min-w-40 border border-outline-variant bg-background py-1 shadow-none"
              >
                {LOCALES.map((code) => (
                  <li key={code} role="option" aria-selected={code === locale}>
                    <button
                      type="button"
                      onClick={() => handleSelect(code)}
                      className={[
                        "block w-full px-3 py-2 text-left font-sans text-label-md",
                        code === locale
                          ? "bg-primary/10 text-primary"
                          : "text-on-surface hover:bg-surface-container-low",
                      ].join(" ")}
                    >
                      {LOCALE_LABELS[code]}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <Link
            href="/search"
            className="hidden font-sans text-label-md text-on-surface hover:text-primary sm:inline"
          >
            {t("nav.search")}
          </Link>

          <Link
            href="/support"
            className="hidden font-sans text-label-md text-on-surface hover:text-primary md:inline"
          >
            {t("nav.support")}
          </Link>

          {signedIn ? (
            <div className="relative" ref={accountRef}>
              <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                onClick={() => setAccountOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 font-sans text-label-md text-on-surface hover:text-primary"
              >
                {accountLabel}
                <Icon name="expand_more" className="text-base leading-none" />
              </button>

              {accountOpen ? (
                <ul
                  role="menu"
                  className="absolute right-0 z-50 mt-2 min-w-40 border border-outline-variant bg-background py-1 shadow-none"
                >
                  <li role="none">
                    <Link
                      role="menuitem"
                      href={accountHref}
                      onClick={() => setAccountOpen(false)}
                      className="block w-full px-3 py-2 text-left font-sans text-label-md text-on-surface hover:bg-surface-container-low"
                    >
                      {accountLabel}
                    </Link>
                  </li>
                  <li role="none">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void handleLogout()}
                      className="block w-full px-3 py-2 text-left font-sans text-label-md text-on-surface hover:bg-surface-container-low"
                    >
                      {t("nav.logOut")}
                    </button>
                  </li>
                </ul>
              ) : null}
            </div>
          ) : (
            <Link
              href="/sign-in"
              className="font-sans text-label-md text-on-surface hover:text-primary"
            >
              {t("nav.signIn")}
            </Link>
          )}

          <Button
            variant="primary"
            className="px-4 py-2"
            onClick={() => router.push("/listings/new")}
          >
            {t("nav.postListing")}
          </Button>
        </nav>
      </div>
    </header>
  );
}
