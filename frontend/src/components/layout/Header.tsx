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

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
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
    setOpen(false);
  }

  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="border-b border-outline-variant bg-background">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="font-serif text-2xl text-on-surface">
          {t("brand.name")}
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6">
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={open}
              aria-label={t("language.label")}
              onClick={() => setOpen((prev) => !prev)}
              className="inline-flex items-center gap-1.5 font-sans text-label-md text-on-surface hover:text-primary"
            >
              {LOCALE_LABELS[locale]}
              <Icon name="expand_more" className="text-base leading-none" />
            </button>

            {open ? (
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
            href="/dashboard"
            className="hidden font-sans text-label-md text-on-surface hover:text-primary sm:inline"
          >
            {t("nav.dashboard")}
          </Link>

          <Link
            href="/support"
            className="hidden font-sans text-label-md text-on-surface hover:text-primary md:inline"
          >
            {t("nav.support")}
          </Link>

          <Link
            href="/sign-in"
            className="font-sans text-label-md text-on-surface hover:text-primary"
          >
            {t("nav.signIn")}
          </Link>

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
