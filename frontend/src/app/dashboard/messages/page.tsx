"use client";

import { useMemo, useState } from "react";
import {
  Button,
  ChatBubble,
  DashboardShell,
  EmptyState,
  Icon,
  Input,
  ThreadList,
  type ThreadListItem,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthMe, useMessageThreads, useThreadMessages } from "@/lib/hooks";

function counterpartName(
  participants: Array<{ id: string; name: string }>,
  meId: string,
): string {
  return participants.find((p) => p.id !== meId)?.name ?? "Conversation";
}

export default function MessagesPage() {
  const { t } = useLanguage();
  const { data: meData } = useAuthMe("USER");
  const { data: threadsData } = useMessageThreads();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const meId = meData?.user.id ?? "me";
  const threads = threadsData?.threads ?? [];
  const inboxThreads = threads.filter((th) => th.thread_type !== "SUPPORT");

  const selectedId = activeId ?? inboxThreads[0]?.id ?? null;
  const { data: messagesData } = useThreadMessages(selectedId);
  const messages = messagesData?.messages ?? [];

  const threadItems: ThreadListItem[] = useMemo(
    () =>
      inboxThreads.map((th) => {
        const title =
          th.property?.title ??
          counterpartName(th.participants, meId);
        return {
          id: th.id,
          title,
          preview: th.last_message?.message_text ?? "",
          timeLabel: th.last_message?.created_at
            ? new Date(th.last_message.created_at).toLocaleString("en-ET", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "",
          unread: th.unread_count,
          avatarInitials: counterpartName(th.participants, meId).slice(0, 2),
          selected: th.id === selectedId,
        };
      }),
    [inboxThreads, meId, selectedId],
  );

  const activeThread = inboxThreads.find((th) => th.id === selectedId);

  return (
    <DashboardShell role="USER" title={t("dashboard.messages.title")}>
      <p className="mb-6 font-body text-body-md text-on-surface-variant">
        {t("dashboard.messages.subtitle")}
      </p>

      {threadItems.length === 0 ? (
        <EmptyState
          icon="forum"
          title={t("dashboard.messages.empty")}
          description={t("dashboard.messages.emptyHint")}
        />
      ) : (
        <div className="grid min-h-[70vh] grid-cols-1 border border-outline-variant bg-surface-container-lowest lg:grid-cols-[320px_1fr]">
          <div className="border-b border-outline-variant lg:border-b-0 lg:border-r">
            <ThreadList items={threadItems} onSelect={setActiveId} />
          </div>

          <div className="flex min-h-[50vh] flex-col">
            <header className="flex items-center justify-between border-b border-outline-variant px-4 py-4">
              <div>
                <h2 className="font-serif text-lg text-primary">
                  {activeThread?.property?.title ??
                    counterpartName(activeThread?.participants ?? [], meId)}
                </h2>
                <p className="font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
                  {counterpartName(activeThread?.participants ?? [], meId)}
                </p>
              </div>
              <Icon name="more_horiz" className="text-on-surface-variant" />
            </header>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  side={msg.sender.id === meId ? "outgoing" : "incoming"}
                  meta={new Date(msg.created_at).toLocaleTimeString("en-ET", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                >
                  {msg.message_text}
                </ChatBubble>
              ))}
            </div>

            <form
              className="flex gap-2 border-t border-outline-variant p-4"
              onSubmit={(e) => {
                e.preventDefault();
                setDraft("");
              }}
            >
              <Input
                variant="stroke"
                className="flex-1"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={t("dashboard.messages.placeholder")}
              />
              <Button type="submit" variant="primary" className="gap-2">
                <Icon name="send" />
                {t("dashboard.messages.send")}
              </Button>
            </form>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
