"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  AdminShell,
  Button,
  ChatBubble,
  Chip,
  EmptyState,
  Input,
  RequireRole,
  ThreadList,
  useToast,
  type ThreadListItem,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { resolveSupportThread, sendMessage } from "@/lib/api";
import { useAuthMe, useMessageThreads, useThreadMessages } from "@/lib/hooks";

/**
 * Admin support inbox — SUPPORT threads from GET /messages/threads.
 * Mark handled via PATCH /messages/thread/:id/resolve.
 */
export default function AdminSupportPage() {
  return (
    <RequireRole role="ADMIN">
      <AdminSupportInbox />
    </RequireRole>
  );
}

function subjectFromPreview(text: string | null | undefined): string {
  if (!text) return "Support";
  const match = /^\*\*(.+?)\*\*/.exec(text);
  return match?.[1]?.trim() || text.slice(0, 80);
}

function AdminSupportInbox() {
  const { t } = useLanguage();
  const { push } = useToast();
  const { data: meData } = useAuthMe("ADMIN", { withFallback: false });
  const meId = meData?.user.id ?? "";
  const {
    data: threadsData,
    mutate: mutateThreads,
    isLoading,
  } = useMessageThreads();
  const supportThreads = (threadsData?.threads ?? [])
    .filter((th) => th.thread_type === "SUPPORT")
    .sort(
      (a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );

  const [filter, setFilter] = useState<"open" | "resolved" | "all">("open");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    if (filter === "all") return supportThreads;
    if (filter === "resolved") {
      return supportThreads.filter((th) => Boolean(th.resolved_at));
    }
    return supportThreads.filter((th) => !th.resolved_at);
  }, [supportThreads, filter]);

  const selectedId = activeId ?? filtered[0]?.id ?? null;
  const selected = supportThreads.find((th) => th.id === selectedId) ?? null;
  const { data: messagesData, mutate: mutateMessages } =
    useThreadMessages(selectedId);
  const messages = messagesData?.messages ?? [];

  const threadItems: ThreadListItem[] = useMemo(
    () =>
      filtered.map((th) => {
        const other =
          th.participants.find((p) => p.id !== meId)?.name ??
          t("admin.support.visitor");
        return {
          id: th.id,
          title: subjectFromPreview(th.last_message?.message_text),
          preview: `${other} · ${th.last_message?.message_text ?? ""}`,
          timeLabel: th.last_message?.created_at
            ? new Date(th.last_message.created_at).toLocaleDateString("en-ET")
            : "",
          unread: th.unread_count,
          selected: th.id === selectedId,
          avatarInitials: other.slice(0, 2).toUpperCase(),
        };
      }),
    [filtered, meId, selectedId, t],
  );

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !selectedId) return;
    setBusy(true);
    try {
      await sendMessage({ thread_id: selectedId, message_text: text });
      setDraft("");
      await Promise.all([mutateMessages(), mutateThreads()]);
    } catch {
      push(t("admin.support.sendError"), "error");
    } finally {
      setBusy(false);
    }
  }

  async function onResolve(resolved: boolean) {
    if (!selectedId) return;
    setBusy(true);
    try {
      await resolveSupportThread(selectedId, resolved);
      push(
        resolved
          ? t("admin.support.resolved")
          : t("admin.support.reopened"),
        "success",
      );
      await mutateThreads();
    } catch {
      push(t("admin.support.resolveError"), "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell title={t("admin.support.title")} hideSearch>
      <div className="mb-6 flex flex-wrap gap-2">
        {(
          [
            ["open", t("admin.support.open")],
            ["resolved", t("admin.support.resolvedTab")],
            ["all", t("admin.support.all")],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setFilter(id)}
            className={[
              "border border-outline-variant px-4 py-2 font-sans text-label-md uppercase tracking-widest",
              filter === id
                ? "bg-primary text-on-primary"
                : "bg-surface hover:bg-surface-container",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {!isLoading && filtered.length === 0 ? (
        <EmptyState
          icon="inbox"
          title={t("admin.support.empty")}
          description={t("admin.support.emptyHint")}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="border border-outline-variant bg-surface-container-lowest lg:col-span-4">
            <ThreadList
              items={threadItems}
              onSelect={(id) => setActiveId(id)}
            />
          </div>
          <div className="flex min-h-[28rem] flex-col border border-outline-variant bg-surface-container-lowest lg:col-span-8">
            {selected ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant p-4">
                  <div>
                    <h3 className="font-serif text-lg text-primary">
                      {subjectFromPreview(selected.last_message?.message_text)}
                    </h3>
                    <p className="font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
                      {selected.participants
                        .map((p) => p.name)
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selected.resolved_at ? (
                      <Chip tone="gold">{t("admin.support.resolvedBadge")}</Chip>
                    ) : null}
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        void onResolve(!selected.resolved_at);
                      }}
                    >
                      {selected.resolved_at
                        ? t("admin.support.reopen")
                        : t("admin.support.markResolved")}
                    </Button>
                  </div>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {messages.map((msg) => (
                    <ChatBubble
                      key={msg.id}
                      side={msg.sender.id === meId ? "outgoing" : "incoming"}
                      meta={new Date(msg.created_at).toLocaleString("en-ET")}
                    >
                      {msg.message_text ?? ""}
                    </ChatBubble>
                  ))}
                </div>
                <form
                  className="flex gap-2 border-t border-outline-variant p-4"
                  onSubmit={(e) => void onSend(e)}
                >
                  <Input
                    variant="underline"
                    className="flex-1"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder={t("admin.support.replyPlaceholder")}
                  />
                  <Button type="submit" variant="primary" disabled={busy}>
                    {t("admin.support.send")}
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8">
                <EmptyState
                  icon="chat_bubble"
                  title={t("admin.support.select")}
                  description={t("admin.support.selectHint")}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}
