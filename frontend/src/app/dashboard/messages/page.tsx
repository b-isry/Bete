"use client";

import { useMemo, useState } from "react";
import {
  ChatBubble,
  DashboardShell,
  EmptyState,
  Icon,
  MockDataNotice,
  ThreadList,
  useToast,
  type ThreadListItem,
} from "@/components/ui";
import { MessageAttachment } from "@/components/messages/MessageAttachment";
import {
  MessageComposer,
  type ComposerPayload,
} from "@/components/messages/MessageComposer";
import { useLanguage } from "@/i18n/LanguageContext";
import { sendMessage } from "@/lib/api";
import { useAuthMe, useMessageThreads, useThreadMessages } from "@/lib/hooks";
import { activeMockEndpoints } from "@/lib/mock-fallback";

/**
 * P10 — Messages (`bete_messages`)
 * Wired: GET /messages/threads, GET /messages/thread/:id, POST /messages
 */
function counterpartName(
  participants: Array<{ id: string; name: string }>,
  meId: string,
  fallback: string,
): string {
  return participants.find((p) => p.id !== meId)?.name ?? fallback;
}

export default function MessagesPage() {
  const { t } = useLanguage();
  const { push } = useToast();
  const { data: meData, isMockFallback: authMock } = useAuthMe("USER");
  const { data: threadsData, mutate: mutateThreads, isMockFallback: threadsMock } =
    useMessageThreads();
  const [activeId, setActiveId] = useState<string | null>(null);

  const meId = meData?.user.id ?? "me";
  const threads = threadsData?.threads ?? [];
  const inboxThreads = threads.filter((th) => th.thread_type !== "SUPPORT");

  const selectedId = activeId ?? inboxThreads[0]?.id ?? null;
  const {
    data: messagesData,
    mutate: mutateMessages,
    isMockFallback: messagesMock,
  } = useThreadMessages(selectedId);
  const messages = messagesData?.messages ?? [];
  const mockEndpoints = activeMockEndpoints(
    ["/auth/me", authMock],
    ["/messages/threads", threadsMock],
    [
      selectedId ? `/messages/thread/${selectedId}` : "/messages/thread/:id",
      messagesMock,
    ],
  );

  const threadFallback = t("dashboard.messages.thread");

  const threadItems: ThreadListItem[] = useMemo(
    () =>
      inboxThreads.map((th) => {
        const title =
          th.property?.title ??
          counterpartName(th.participants, meId, threadFallback);
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
          avatarInitials: counterpartName(
            th.participants,
            meId,
            threadFallback,
          ).slice(0, 2),
          selected: th.id === selectedId,
        };
      }),
    [inboxThreads, meId, selectedId, threadFallback],
  );

  const activeThread = inboxThreads.find((th) => th.id === selectedId);

  async function onSend(payload: ComposerPayload) {
    if (!selectedId) return;
    try {
      await sendMessage({ thread_id: selectedId, ...payload });
      await Promise.all([mutateMessages(), mutateThreads()]);
    } catch {
      push(t("dashboard.messages.sendFailed"), "error");
      throw new Error("send failed");
    }
  }

  return (
    <DashboardShell role="USER" title={t("dashboard.messages.title")}>
      <MockDataNotice endpoints={mockEndpoints} />
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
            <header className="flex min-w-0 items-center justify-between gap-3 border-b border-outline-variant px-4 py-4">
              <div className="min-w-0">
                <h2 className="truncate font-serif text-lg text-primary">
                  {activeThread?.property?.title ??
                    counterpartName(
                      activeThread?.participants ?? [],
                      meId,
                      threadFallback,
                    )}
                </h2>
                <p className="truncate font-sans text-label-sm uppercase tracking-widest text-on-surface-variant">
                  {counterpartName(
                    activeThread?.participants ?? [],
                    meId,
                    threadFallback,
                  )}
                </p>
              </div>
              <Icon name="more_horiz" className="shrink-0 text-on-surface-variant" />
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
                  {msg.media_url ? (
                    <MessageAttachment
                      url={msg.media_url}
                      messageType={msg.message_type}
                    />
                  ) : null}
                </ChatBubble>
              ))}
            </div>

            <MessageComposer
              className="border-t border-outline-variant p-4"
              threadId={selectedId}
              placeholder={t("dashboard.messages.placeholder")}
              onSend={onSend}
            />
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
