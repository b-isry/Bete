"use client";

import { type FormEvent, useState } from "react";
import {
  Button,
  ContentShell,
  Input,
  Textarea,
  useToast,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";

export default function ContactPage() {
  const { t } = useLanguage();
  const { push } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    push(t("content.contact.sent"), "success");
    setName("");
    setEmail("");
    setMessage("");
  }

  return (
    <ContentShell title={t("content.contact.title")} eyebrow={t("content.eyebrow")}>
      <p>{t("content.contact.intro")}</p>
      <form className="space-y-6" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
            {t("auth.fields.name")}
          </span>
          <Input
            variant="underline"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
            {t("auth.fields.emailOptional")}
          </span>
          <Input
            variant="underline"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="block">
          <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
            {t("content.contact.message")}
          </span>
          <Textarea
            variant="underline"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            rows={5}
          />
        </label>
        <Button type="submit" variant="primary">
          {t("content.contact.submit")}
        </Button>
      </form>
    </ContentShell>
  );
}
