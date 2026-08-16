"use client";

import { useMemo, useState, type FormEvent } from "react";
import {
  Accordion,
  AccordionItem,
  Button,
  ChatBubble,
  EmptyState,
  Icon,
  Input,
  MockDataNotice,
  ThreadList,
  useToast,
  type ThreadListItem,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { sendMessage } from "@/lib/api";
import { useAuthMe, useMessageThreads, useThreadMessages } from "@/lib/hooks";
import { activeMockEndpoints } from "@/lib/mock-fallback";

const FAQ = [
  { id: "listing", q: "support.faq.listing.q", a: "support.faq.listing.a" },
  {
    id: "verification",
    q: "support.faq.verification.q",
    a: "support.faq.verification.a",
  },
  { id: "payment", q: "support.faq.payment.q", a: "support.faq.payment.a" },
] as const;

/**
 * P11 — Support Center (`bete_support_center`)
 * Wired: GET /messages/threads (SUPPORT), GET /messages/thread/:id,
 *        POST /messages with thread_type SUPPORT.
 */
export default function SupportPage() {
  const { t } = useLanguage();
  const { push } = useToast();
  const { data: meData, isMockFallback: authMock } = useAuthMe("USER");
  const {
    data: threadsData,
    mutate: mutateThreads,
    isMockFallback: threadsMock,
  } = useMessageThreads();
  const meId = meData?.user.id ?? "me";
  const supportThreads = (threadsData?.threads ?? []).filter(
    (th) => th.thread_type === "SUPPORT",
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const selectedId = activeId ?? supportThreads[0]?.id ?? null;
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

  const threadItems: ThreadListItem[] = useMemo(
    () =>
      supportThreads.map((th) => ({
        id: th.id,
        title: t("support.ticket"),
        preview: th.last_message?.message_text ?? "",
        timeLabel: th.last_message?.created_at
          ? new Date(th.last_message.created_at).toLocaleDateString("en-ET")
          : "",
        unread: th.unread_count,
        selected: th.id === selectedId,
        avatarInitials: "BS",
      })),
    [supportThreads, selectedId, t],
  );

  async function onSend(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setSending(true);
    try {
      const result = await sendMessage(
        selectedId
          ? { thread_id: selectedId, message_text: text }
          : { thread_type: "SUPPORT", message_text: text },
      );
      setDraft("");
      if (!selectedId && result.thread_id) {
        setActiveId(result.thread_id);
      }
      await Promise.all([mutateThreads(), mutateMessages()]);
    } catch {
      push(t("support.sendFailed"), "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <MockDataNotice endpoints={mockEndpoints} />
      <header className="mb-10">
        <p className="mb-2 font-sans text-label-sm uppercase tracking-[0.2em] text-secondary">
          {t("support.eyebrow")}
        </p>
        <h1 className="break-words font-serif text-headline-sm text-primary sm:text-headline-md md:text-display-lg-mobile">
          {t("support.title")}
        </h1>
        <p className="mt-3 max-w-2xl font-body text-body-md text-on-surface-variant sm:text-body-lg">
          {t("support.subtitle")}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 font-serif text-headline-sm">
            {t("support.faqTitle")}
          </h2>
          <Accordion defaultValue="listing">
            {FAQ.map((item) => (
              <AccordionItem key={item.id} value={item.id} title={t(item.q)}>
                {t(item.a)}
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-serif text-headline-sm">
              {t("support.ticketsTitle")}
            </h2>
            {threadItems.length === 0 ? (
              <Button
                variant="outline"
                className="gap-2"
                disabled={sending}
                onClick={() => {
                  setDraft(t("support.placeholder"));
                }}
              >
                <Icon name="add" />
                {t("support.startThread")}
              </Button>
            ) : null}
          </div>

          {threadItems.length === 0 ? (
            <div className="space-y-4">
              <EmptyState
                icon="support_agent"
                title={t("support.empty")}
                description={t("support.emptyHint")}
              />
              <form
                className="flex gap-2 border border-outline-variant bg-surface-container-lowest p-4"
                onSubmit={(e) => {
                  void onSend(e);
                }}
              >
                <Input
                  variant="stroke"
                  className="flex-1"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t("support.placeholder")}
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={sending || !draft.trim()}
                >
                  {t("support.send")}
                </Button>
              </form>
            </div>
          ) : (
            <div className="border border-outline-variant bg-surface-container-lowest">
              <ThreadList items={threadItems} onSelect={setActiveId} />
              <div className="space-y-3 border-t border-outline-variant p-4">
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
                  void onSend(e);
                }}
              >
                <Input
                  variant="stroke"
                  className="flex-1"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t("support.placeholder")}
                />
                <Button
                  type="submit"
                  variant="primary"
                  disabled={sending || !draft.trim()}
                >
                  {t("support.send")}
                </Button>
              </form>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
