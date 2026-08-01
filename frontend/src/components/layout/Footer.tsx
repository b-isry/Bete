"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";

type FooterLink = {
  href: string;
  labelKey: string;
};

type ContactIcon = {
  href: string;
  icon: string;
  labelKey: string;
};

const DISCOVER_LINKS: FooterLink[] = [
  { href: "/search", labelKey: "footer.links.search" },
  { href: "/about", labelKey: "footer.links.about" },
  { href: "/help", labelKey: "footer.links.help" },
];

const AGENCY_LINKS: FooterLink[] = [
  { href: "/sign-in", labelKey: "footer.links.signIn" },
  { href: "/listings/new", labelKey: "footer.links.postListing" },
];

const LEGAL_LINKS: FooterLink[] = [
  { href: "/terms", labelKey: "footer.links.terms" },
  { href: "/privacy", labelKey: "footer.links.privacy" },
  { href: "/safety", labelKey: "footer.links.safety" },
];

/**
 * Optional site-wide handles. Only render icons when a URL is configured —
 * never link to empty placeholders.
 */
function siteContactIcons(): ContactIcon[] {
  const icons: ContactIcon[] = [];

  const telegram = process.env.NEXT_PUBLIC_TELEGRAM_URL?.trim();
  if (telegram) {
    icons.push({
      href: telegram,
      icon: "send",
      labelKey: "footer.contact.telegram",
    });
  }

  const facebook = process.env.NEXT_PUBLIC_FACEBOOK_URL?.trim();
  if (facebook) {
    icons.push({
      href: facebook,
      icon: "public",
      labelKey: "footer.contact.facebook",
    });
  }

  // Contact page is a real route — safe to include.
  icons.push({
    href: "/contact",
    icon: "mail",
    labelKey: "footer.contact.email",
  });

  return icons;
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  const { t } = useLanguage();

  return (
    <div>
      <h3 className="mb-4 font-sans text-label-sm font-bold uppercase tracking-widest text-secondary">
        {title}
      </h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="font-sans text-label-md text-on-surface-variant transition-colors hover:text-primary"
            >
              {t(link.labelKey)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  const pathname = usePathname();
  const { t } = useLanguage();

  if (pathname.startsWith("/admin")) {
    return null;
  }

  const year = new Date().getFullYear();
  const contactIcons = siteContactIcons();

  return (
    <footer className="border-t border-outline-variant bg-surface-container-low">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-12">
          <div className="max-w-xs">
            <Link
              href="/"
              className="font-serif text-headline-sm text-primary"
            >
              {t("brand.name")}
            </Link>
            <p className="mt-3 font-body text-body-md text-on-surface-variant">
              {t("footer.tagline")}
            </p>
            {contactIcons.length > 0 ? (
              <ul className="mt-6 flex items-center gap-3">
                {contactIcons.map((item) => {
                  const external = item.href.startsWith("http");
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        {...(external
                          ? { target: "_blank", rel: "noopener noreferrer" }
                          : {})}
                        aria-label={t(item.labelKey)}
                        className="inline-flex h-10 w-10 items-center justify-center border border-outline-variant bg-surface text-primary transition-colors hover:border-primary hover:bg-surface-container-high"
                      >
                        <Icon name={item.icon} className="text-lg leading-none" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </div>

          <FooterColumn title={t("footer.columns.discover")} links={DISCOVER_LINKS} />
          <FooterColumn title={t("footer.columns.agency")} links={AGENCY_LINKS} />
          <FooterColumn title={t("footer.columns.legal")} links={LEGAL_LINKS} />
        </div>

        <div className="mt-12 border-t border-outline-variant pt-6">
          <p className="font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
            {t("footer.copyright").replace("{year}", String(year))}
          </p>
        </div>
      </div>
    </footer>
  );
}
