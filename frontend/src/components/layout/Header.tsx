"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { Button, Icon } from "@/components/ui";
import {
  LOCALES,
  LOCALE_LABELS,
  useLanguage,
  type Locale,
} from "@/i18n/LanguageContext";
import { getAccessToken, setAccessToken } from "@/lib/auth";
import { useAuthMe } from "@/lib/hooks";

const dropdownPanelClass =
  "absolute right-0 z-50 mt-1 min-w-44 border border-outline-variant bg-background shadow-none";
const dropdownRowClass =
  "block w-full px-3 py-2.5 text-left font-sans text-label-md text-on-surface hover:bg-surface-container-low";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { locale, setLocale, t } = useLanguage();
  const [langOpen, setLangOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { data: meData, error: meError, mutate: mutateMe } = useAuthMe();

  useEffect(() => {
    const token = Boolean(getAccessToken());
    setHasToken(token);
    if (token) {
      void mutateMe();
    }
  }, [pathname, mutateMe]);

  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
    setLangOpen(false);
  }, [pathname]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (langRef.current && !langRef.current.contains(target)) {
        setLangOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(target)) {
        setAccountOpen(false);
      }
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setLangOpen(false);
        setAccountOpen(false);
        setMenuOpen(false);
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
    setMenuOpen(false);
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
      <div className="mx-auto flex h-full max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6">
        {/* Left cluster — logo + primary nav */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          <Link
            href="/"
            className="shrink-0 font-serif text-xl text-on-surface sm:text-2xl"
          >
            {t("brand.name")}
          </Link>

          <nav
            aria-label={t("nav.primary")}
            className="hidden items-center gap-4 lg:flex"
          >
            <Link
              href="/search"
              className="font-sans text-label-md text-on-surface hover:text-primary"
            >
              {t("nav.search")}
            </Link>
            <Link
              href="/support"
              className="font-sans text-label-md text-on-surface hover:text-primary"
            >
              {t("nav.support")}
            </Link>
          </nav>

          {/* Mobile / tablet hamburger — Search / Support / Language (+ account) */}
          <div className="relative lg:hidden" ref={menuRef}>
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={t("nav.menu")}
              onClick={() => setMenuOpen((prev) => !prev)}
              className="inline-flex items-center justify-center text-on-surface hover:text-primary"
            >
              <Icon name="menu" className="text-xl leading-none" />
            </button>

            {menuOpen ? (
              <div
                role="menu"
                className={`${dropdownPanelClass} left-0 right-auto w-56 max-w-[calc(100vw-2rem)]`}
              >
                <Link
                  role="menuitem"
                  href="/search"
                  onClick={() => setMenuOpen(false)}
                  className={dropdownRowClass}
                >
                  {t("nav.search")}
                </Link>
                <Link
                  role="menuitem"
                  href="/support"
                  onClick={() => setMenuOpen(false)}
                  className={dropdownRowClass}
                >
                  {t("nav.support")}
                </Link>

                {!signedIn ? (
                  <Link
                    role="menuitem"
                    href="/sign-in"
                    onClick={() => setMenuOpen(false)}
                    className={dropdownRowClass}
                  >
                    {t("nav.signIn")}
                  </Link>
                ) : null}

                <div className="border-t border-outline-variant py-1">
                  <p className="px-3 pb-1 pt-2 font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
                    {t("language.label")}
                  </p>
                  {LOCALES.map((code) => (
                    <button
                      key={code}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        handleSelect(code);
                        setMenuOpen(false);
                      }}
                      className={[
                        dropdownRowClass,
                        code === locale ? "bg-primary/10 text-primary" : "",
                      ].join(" ")}
                    >
                      {LOCALE_LABELS[code]}
                    </button>
                  ))}
                </div>

                {/*
                  Phones overflow with logo+menu | Sign In/bell+Profile+CTA.
                  Account + Sign In live in the hamburger; CTA stays visible.
                */}
                {signedIn ? (
                  <div className="border-t border-outline-variant py-1">
                    <div className="flex items-center justify-between px-3 py-2.5">
                      <span className="font-sans text-label-md text-on-surface">
                        {t("notifications.label")}
                      </span>
                      <NotificationBell />
                    </div>
                    <Link
                      role="menuitem"
                      href={accountHref}
                      onClick={() => setMenuOpen(false)}
                      className={dropdownRowClass}
                    >
                      {accountLabel}
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => void handleLogout()}
                      className={dropdownRowClass}
                    >
                      {t("nav.logOut")}
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* Right cluster — utility + account + CTA */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          {/* Desktop language */}
          <div className="relative hidden lg:block" ref={langRef}>
            <button
              type="button"
              aria-haspopup="listbox"
              aria-expanded={langOpen}
              aria-label={t("language.label")}
              onClick={() => setLangOpen((prev) => !prev)}
              className="inline-flex items-center gap-1 font-sans text-label-sm text-on-surface-variant hover:text-primary"
            >
              {LOCALE_LABELS[locale]}
              <Icon name="expand_more" className="text-sm leading-none" />
            </button>

            {langOpen ? (
              <ul
                role="listbox"
                aria-label={t("language.label")}
                className={dropdownPanelClass}
              >
                {LOCALES.map((code) => (
                  <li key={code} role="option" aria-selected={code === locale}>
                    <button
                      type="button"
                      onClick={() => handleSelect(code)}
                      className={[
                        dropdownRowClass,
                        code === locale ? "bg-primary/10 text-primary" : "",
                      ].join(" ")}
                    >
                      {LOCALE_LABELS[code]}
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {/* Desktop account pair — tightest gap in the nav */}
          {signedIn ? (
            <div className="hidden items-center gap-1.5 lg:flex">
              <NotificationBell />
              <div className="relative" ref={accountRef}>
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={accountOpen}
                  onClick={() => setAccountOpen((prev) => !prev)}
                  className="inline-flex items-center gap-0.5 font-sans text-label-md text-on-surface hover:text-primary"
                >
                  {accountLabel}
                  <Icon name="expand_more" className="text-base leading-none" />
                </button>

                {accountOpen ? (
                  <ul role="menu" className={dropdownPanelClass}>
                    <li role="none">
                      <Link
                        role="menuitem"
                        href={accountHref}
                        onClick={() => setAccountOpen(false)}
                        className={dropdownRowClass}
                      >
                        {accountLabel}
                      </Link>
                    </li>
                    <li role="none">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => void handleLogout()}
                        className={dropdownRowClass}
                      >
                        {t("nav.logOut")}
                      </button>
                    </li>
                  </ul>
                ) : null}
              </div>
            </div>
          ) : (
            <Link
              href="/sign-in"
              className="hidden font-sans text-label-md text-on-surface hover:text-primary lg:inline"
            >
              {t("nav.signIn")}
            </Link>
          )}

          <Button
            variant="primary"
            aria-label={t("nav.postListing")}
            className="px-2.5 py-2 sm:ml-2 sm:px-4"
            onClick={() => router.push("/listings/new")}
          >
            <Icon name="add" className="text-lg leading-none sm:hidden" />
            <span className="hidden sm:inline">{t("nav.postListing")}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
