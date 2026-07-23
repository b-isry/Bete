"use client";

import { useMemo, useState } from "react";
import {
  Button,
  Card,
  ChatBubble,
  EmptyState,
  Icon,
  Input,
  ThreadList,
  type ThreadListItem,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuthMe, useMessageThreads, useThreadMessages } from "@/lib/hooks";

const FAQ = [
  { q: "support.faq.listing.q", a: "support.faq.listing.a" },
  { q: "support.faq.verification.q", a: "support.faq.verification.a" },
  { q: "support.faq.payment.q", a: "support.faq.payment.a" },
] as const;

export default function SupportPage() {
  const { t } = useLanguage();
  const { data: meData } = useAuthMe("USER");
  const { data: threadsData } = useMessageThreads();
  const meId = meData?.user.id ?? "me";
  const supportThreads = (threadsData?.threads ?? []).filter(
    (th) => th.thread_type === "SUPPORT",
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const selectedId = activeId ?? supportThreads[0]?.id ?? null;
  const { data: messagesData } = useThreadMessages(selectedId);
  const messages = messagesData?.messages ?? [];

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <header className="mb-10">
        <p className="mb-2 font-sans text-label-sm uppercase tracking-[0.2em] text-secondary">
          {t("support.eyebrow")}
        </p>
        <h1 className="font-serif text-display-lg-mobile text-primary">
          {t("support.title")}
        </h1>
        <p className="mt-3 max-w-2xl font-body text-body-lg text-on-surface-variant">
          {t("support.subtitle")}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 font-serif text-headline-sm">
            {t("support.faqTitle")}
          </h2>
          <div className="space-y-2">
            {FAQ.map((item, i) => (
              <Card key={item.q} padding={false} className="overflow-hidden">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-4 text-left"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-serif text-lg text-primary">
                    {t(item.q)}
                  </span>
                  <Icon name={openFaq === i ? "expand_less" : "expand_more"} />
                </button>
                {openFaq === i ? (
                  <p className="border-t border-outline-variant px-4 py-4 font-body text-body-md text-on-surface-variant">
                    {t(item.a)}
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-serif text-headline-sm">
            {t("support.ticketsTitle")}
          </h2>
          {threadItems.length === 0 ? (
            <EmptyState
              icon="support_agent"
              title={t("support.empty")}
              description={t("support.emptyHint")}
            />
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
                  e.preventDefault();
                  setDraft("");
                }}
              >
                <Input
                  variant="stroke"
                  className="flex-1"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={t("support.placeholder")}
                />
                <Button type="submit" variant="primary">
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
