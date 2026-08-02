"use client";

import { useMemo, useState } from "react";
import {
  AdminShell,
  Button,
  Chip,
  EmptyState,
  Icon,
  ScoreRing,
  StatCard,
  StatusPill,
  cn,
  useToast,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { verifySeller } from "@/lib/api";
import { usePendingVerifications } from "@/lib/hooks";
import type { PendingVerification } from "@/lib/mocks";

function relativeTime(iso: string, t: (key: string) => string): string {
  const delta = Date.now() - new Date(iso).getTime();
  const hours = Math.max(1, Math.round(delta / 3_600_000));
  if (hours < 24) {
    return t("notifications.time.hoursAgo").replace("{n}", String(hours));
  }
  if (hours < 48) return t("notifications.time.yesterday");
  return t("notifications.time.daysAgo").replace(
    "{n}",
    String(Math.round(hours / 24)),
  );
}

export default function VerificationsPage() {
  const { t } = useLanguage();
  const { push } = useToast();
  const { data, mutate } = usePendingVerifications();
  const items = data?.items ?? [];
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const selected: PendingVerification | undefined = useMemo(() => {
    const id = selectedId ?? items[0]?.id;
    return items.find((i) => i.id === id) ?? items[0];
  }, [items, selectedId]);

  async function onVerify(action: "APPROVE" | "REJECT") {
    if (!selected) return;
    setBusy(true);
    try {
      await verifySeller(
        selected.id,
        action,
        action === "REJECT" ? t("admin.verify.rejectReasonDefault") : undefined,
      );
      push(
        action === "APPROVE"
          ? t("admin.verify.approved")
          : t("admin.verify.rejected"),
        "success",
      );
      await mutate();
      setSelectedId(null);
    } catch {
      push(t("admin.verify.fallback"), "info");
      await mutate(
        (current) =>
          current
            ? {
                items: current.items.filter((i) => i.id !== selected.id),
              }
            : current,
        { revalidate: false },
      );
      setSelectedId(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell hideSearch title={t("admin.verify.title")}>
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-xl">
        <StatCard
          tone="secondary"
          label={t("admin.verify.pending")}
          value={String(items.length)}
        />
        <StatCard
          label={t("admin.verify.awaiting")}
          value={String(data?.pagination?.total ?? items.length)}
        />
      </section>

      {items.length === 0 ? (
        <EmptyState
          icon="verified_user"
          title={t("admin.verify.empty")}
          description={t("admin.verify.emptyHint")}
        />
      ) : (
        <div className="-mx-6 -mb-8 flex min-h-[calc(100vh-8rem)] flex-col border-t border-outline-variant md:-mx-8 lg:flex-row">
          <section className="flex w-full flex-col border-outline-variant bg-surface-container-lowest lg:w-1/3 lg:border-r">
            <div className="border-b border-outline-variant bg-surface p-6">
              <h2 className="mb-2 font-serif text-headline-sm text-primary">
                {t("admin.verify.pending")}
              </h2>
              <div className="flex gap-2">
                <Chip tone="forest">
                  {items.length} {t("admin.verify.awaiting")}
                </Chip>
              </div>
            </div>
            <div className="divide-y divide-outline-variant overflow-y-auto">
              {items.map((item) => {
                const active = item.id === selected?.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedId(item.id)}
                    className={cn(
                      "w-full p-6 text-left transition-colors",
                      active
                        ? "border-l-4 border-secondary bg-surface-container-low"
                        : "border-l-4 border-transparent hover:bg-surface-container-low",
                    )}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center border border-outline-variant bg-surface font-serif text-primary">
                          {item.name.slice(0, 1)}
                        </div>
                        <div>
                          <h3 className="font-sans text-label-md text-primary">
                            {item.name}
                          </h3>
                          <p className="font-sans text-[11px] uppercase tracking-wider text-on-surface-variant">
                            {item.username
                              ? `@${item.username}`
                              : t("admin.verify.usernamePending")}
                          </p>
                        </div>
                      </div>
                      <span className="font-sans text-[10px] text-on-surface-variant">
                        {relativeTime(item.created_at, t)}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="inline-flex items-center gap-1 font-sans text-[10px] uppercase tracking-widest text-secondary">
                        <Icon name="description" className="text-xs" />
                        {item.doc_count} {t("admin.verify.docs")}
                      </span>
                      <StatusPill kind="verification" status="PENDING" />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {selected ? (
            <section className="flex flex-1 flex-col overflow-y-auto bg-surface">
              <div className="border-b border-outline-variant px-8 py-10">
                <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
                  <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                    <div className="flex h-28 w-28 items-center justify-center border border-outline-variant bg-surface-container-lowest font-serif text-headline-md text-primary">
                      {selected.name.slice(0, 1)}
                    </div>
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <h1 className="font-serif text-display-lg-mobile text-primary">
                          {selected.name}
                        </h1>
                        <Icon name="verified" className="text-secondary" />
                      </div>
                      <p className="max-w-xl font-body text-body-lg text-on-surface-variant">
                        {selected.bio}
                      </p>
                      <div className="mt-4 flex flex-wrap gap-6">
                        <div>
                          <p className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant">
                            {t("admin.verify.location")}
                          </p>
                          <p className="font-sans text-label-md text-primary">
                            {selected.location_text}
                          </p>
                        </div>
                        <div>
                          <p className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant">
                            {t("admin.verify.accountType")}
                          </p>
                          <p className="font-sans text-label-md text-primary">
                            {selected.account_type}
                          </p>
                        </div>
                        <div>
                          <p className="font-sans text-[10px] uppercase tracking-widest text-on-surface-variant">
                            {t("admin.verify.applied")}
                          </p>
                          <p className="font-sans text-label-md text-primary">
                            {new Date(selected.created_at).toLocaleDateString(
                              "en-ET",
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ScoreRing
                    score={selected.trust_score}
                    label={t("admin.verify.trust")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-10 px-8 py-10 lg:grid-cols-12">
                <div className="lg:col-span-8">
                  <h3 className="mb-6 flex items-center gap-2 font-serif text-headline-sm text-primary">
                    <Icon name="folder_open" />
                    {t("admin.verify.documents")}
                  </h3>
                  <div className="space-y-3">
                    {[
                      t("admin.verify.docBusiness"),
                      t("admin.verify.docId"),
                      t("admin.verify.docTax"),
                    ]
                      .slice(0, selected.doc_count)
                      .map((doc) => (
                        <div
                          key={doc}
                          className="flex items-center justify-between border border-outline-variant bg-surface-container-lowest px-4 py-4"
                        >
                          <div className="flex items-center gap-3">
                            <Icon name="picture_as_pdf" className="text-error" />
                            <span className="font-sans text-label-md">
                              {doc}
                            </span>
                          </div>
                          <Chip tone="forest">{t("admin.verify.uploaded")}</Chip>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="flex flex-col gap-3 lg:col-span-4">
                  <Button
                    variant="primary"
                    className="w-full uppercase tracking-wider"
                    disabled={busy}
                    onClick={() => {
                      void onVerify("APPROVE");
                    }}
                  >
                    {t("admin.actions.approve")}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full uppercase"
                    disabled={busy}
                    onClick={() => {
                      void onVerify("REJECT");
                    }}
                  >
                    {t("admin.actions.reject")}
                  </Button>
                  <p className="mt-2 font-body text-body-md text-on-surface-variant">
                    {t("admin.verify.actionHint")}
                  </p>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      )}
    </AdminShell>
  );
}
