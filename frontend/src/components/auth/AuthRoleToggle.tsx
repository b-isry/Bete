"use client";

import { cn } from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";

export type AuthRoleChoice = "USER" | "SELLER";

export type AuthRoleToggleProps = {
  value: AuthRoleChoice;
  onChange: (role: AuthRoleChoice) => void;
  /** When false, hides the "I am a" label above the control. Defaults to true. */
  showLabel?: boolean;
};

export function AuthRoleToggle({
  value,
  onChange,
  showLabel = true,
}: AuthRoleToggleProps) {
  const { t } = useLanguage();

  return (
    <div>
      {showLabel ? (
        <span className="mb-3 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
          {t("auth.fields.role")}
        </span>
      ) : null}
      <div
        role="tablist"
        aria-label={t("auth.fields.role")}
        className="flex border border-outline-variant bg-surface-container"
      >
        {(
          [
            ["USER", t("auth.roles.buyer")],
            ["SELLER", t("auth.roles.seller")],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={value === id}
            onClick={() => onChange(id)}
            className={cn(
              "flex-1 border-r border-outline-variant px-4 py-2 font-sans text-label-md last:border-r-0",
              value === id
                ? "bg-primary-container text-on-primary"
                : "hover:bg-surface-container-high",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
