"use client";

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";
import {
  Button,
  Card,
  DashboardShell,
  Icon,
  ImageDropzone,
  Input,
  Skeleton,
  useToast,
  type ImageDropzoneItem,
} from "@/components/ui";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  ApiError,
  requestOtp,
  submitVerificationRequest,
  verifyOtp,
} from "@/lib/api";
import { useAuthMe } from "@/lib/hooks";

const OTP_WINDOW_MS = 15 * 60 * 1000;
const OTP_MAX_PER_WINDOW = 3;
const BETWEEN_SEND_MS = Math.floor(OTP_WINDOW_MS / OTP_MAX_PER_WINDOW);
/** Placeholder CDN URL until ImageDropzone wires real storage (same as listings/new). */
const PLACEHOLDER_DOC_URL =
  "https://images.unsplash.com/photo-1568667256549-094345857637?w=800&q=80";

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function VerificationWizardPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { push } = useToast();
  const { data, isLoading, mutate } = useAuthMe("SELLER");
  const user = data?.user;

  const [step, setStep] = useState<1 | 2>(1);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [otpBusy, setOtpBusy] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [docBusy, setDocBusy] = useState(false);
  const [documents, setDocuments] = useState<ImageDropzoneItem[]>([]);
  const [sendTimestamps, setSendTimestamps] = useState<number[]>([]);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [guardsReady, setGuardsReady] = useState(false);

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [cooldownUntil]);

  const cooldownRemaining = Math.max(0, cooldownUntil - now);
  const resendDisabled = cooldownRemaining > 0;

  const armCooldown = useCallback((timestamps: number[]) => {
    const windowStart = Date.now() - OTP_WINDOW_MS;
    const recent = timestamps.filter((ts) => ts >= windowStart);
    if (recent.length >= OTP_MAX_PER_WINDOW) {
      const oldest = Math.min(...recent);
      setCooldownUntil(oldest + OTP_WINDOW_MS);
    } else {
      setCooldownUntil(Date.now() + BETWEEN_SEND_MS);
    }
  }, []);

  useEffect(() => {
    if (isLoading && !user) return;
    if (!user) {
      router.replace("/sign-in");
      return;
    }
    if (user.role !== "SELLER") {
      router.replace("/dashboard");
      return;
    }
    if (user.verification_status === "VERIFIED") {
      push(t("dashboard.verification.alreadyVerified"), "info");
      router.replace("/dashboard");
      return;
    }
    if (user.phone_verified_at) {
      setStep(2);
    }
    setGuardsReady(true);
  }, [isLoading, user, router, push, t]);

  const phoneDisplay = useMemo(
    () => user?.phone?.trim() || t("dashboard.verification.phoneMissing"),
    [user?.phone, t],
  );

  async function onSendCode() {
    setOtpBusy(true);
    try {
      await requestOtp();
      const next = [...sendTimestamps, Date.now()];
      setSendTimestamps(next);
      armCooldown(next);
      setCodeSent(true);
      setCode("");
      push(t("dashboard.verification.codeSent"), "success");
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setCooldownUntil(Date.now() + OTP_WINDOW_MS);
        push(t("dashboard.verification.rateLimited"), "error");
      } else {
        const message =
          err instanceof ApiError
            ? err.message
            : t("dashboard.verification.sendFailed");
        push(message, "error");
      }
    } finally {
      setOtpBusy(false);
    }
  }

  async function onVerifyCode(e: FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      push(t("dashboard.verification.codeInvalidFormat"), "error");
      return;
    }
    setVerifyBusy(true);
    try {
      await verifyOtp(trimmed);
      push(t("dashboard.verification.phoneVerified"), "success");
      await mutate();
      setStep(2);
    } catch (err) {
      if (!(err instanceof ApiError)) {
        push(t("dashboard.verification.verifyFailed"), "error");
        return;
      }
      const msg = err.message.toLowerCase();
      if (err.status === 404 || msg.includes("no active")) {
        push(t("dashboard.verification.codeExpired"), "error");
        setCodeSent(false);
        setCode("");
      } else if (msg.includes("too many attempts")) {
        push(t("dashboard.verification.tooManyAttempts"), "error");
        setCodeSent(false);
        setCode("");
      } else if (msg.includes("invalid")) {
        push(t("dashboard.verification.codeWrong"), "error");
      } else {
        push(err.message || t("dashboard.verification.verifyFailed"), "error");
      }
    } finally {
      setVerifyBusy(false);
    }
  }

  async function onSubmitDocument(e: FormEvent) {
    e.preventDefault();
    if (documents.length === 0) {
      push(t("dashboard.verification.needDocument"), "error");
      return;
    }
    const raw = documents[0].image_url;
    const id_document_url = raw.startsWith("blob:")
      ? PLACEHOLDER_DOC_URL
      : raw;

    setDocBusy(true);
    try {
      await submitVerificationRequest({ id_document_url });
      push(t("dashboard.verification.submitSuccess"), "success");
      await mutate();
      router.push("/dashboard");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : t("dashboard.verification.submitFailed");
      push(message, "error");
    } finally {
      setDocBusy(false);
    }
  }

  if (!guardsReady || (isLoading && !user)) {
    return (
      <DashboardShell role="SELLER" title={t("dashboard.verification.title")}>
        <Skeleton className="h-64 w-full" />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell role="SELLER" title={t("dashboard.verification.title")}>
      <p className="mb-2 font-sans text-label-sm uppercase tracking-[0.2em] text-secondary">
        {t("dashboard.verification.eyebrow")}
      </p>
      <p className="mb-8 max-w-2xl font-body text-body-md text-on-surface-variant">
        {t("dashboard.verification.subtitle")}
      </p>

      <div className="mb-8 flex flex-wrap gap-2">
        <span
          className={[
            "inline-flex items-center gap-2 border px-3 py-2 font-sans text-label-sm uppercase tracking-widest",
            step === 1
              ? "border-primary-container bg-primary-container text-on-primary"
              : "border-outline-variant bg-surface-container-low text-on-surface-variant",
          ].join(" ")}
        >
          <Icon name="sms" className="text-base" />
          {t("dashboard.verification.step1Label")}
        </span>
        <span
          className={[
            "inline-flex items-center gap-2 border px-3 py-2 font-sans text-label-sm uppercase tracking-widest",
            step === 2
              ? "border-primary-container bg-primary-container text-on-primary"
              : "border-outline-variant bg-surface-container-low text-on-surface-variant",
          ].join(" ")}
        >
          <Icon name="badge" className="text-base" />
          {t("dashboard.verification.step2Label")}
        </span>
      </div>

      {step === 1 ? (
        <Card className="max-w-xl space-y-6">
          <div>
            <p className="mb-4 font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
              {t("dashboard.verification.phoneLabel")}
            </p>
            <Input
              variant="underline"
              value={phoneDisplay}
              readOnly
              disabled
            />
            <p className="mt-2 font-body text-body-md text-on-surface-variant">
              {t("dashboard.verification.phoneHint")}
            </p>
          </div>

          {!codeSent ? (
            <Button
              type="button"
              variant="primary"
              className="gap-2"
              disabled={otpBusy || resendDisabled || !user?.phone}
              onClick={() => {
                void onSendCode();
              }}
            >
              <Icon name="send" />
              {t("dashboard.verification.sendCode")}
            </Button>
          ) : (
            <form className="space-y-6" onSubmit={onVerifyCode}>
              <label className="block">
                <span className="mb-4 block font-sans text-label-sm uppercase tracking-widest text-on-surface-variant opacity-60">
                  {t("dashboard.verification.codeLabel")}
                </span>
                <Input
                  variant="underline"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  pattern="\d{6}"
                  value={code}
                  onChange={(e) =>
                    setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="000000"
                  required
                />
              </label>

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={verifyBusy || code.length !== 6}
                >
                  {t("dashboard.verification.verifyCode")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={otpBusy || resendDisabled}
                  onClick={() => {
                    void onSendCode();
                  }}
                >
                  {resendDisabled
                    ? t("dashboard.verification.resendIn").replace(
                        "{time}",
                        formatCountdown(cooldownRemaining),
                      )
                    : t("dashboard.verification.resend")}
                </Button>
              </div>
            </form>
          )}

          {!codeSent && resendDisabled ? (
            <p className="font-sans text-label-sm text-on-surface-variant">
              {t("dashboard.verification.resendIn").replace(
                "{time}",
                formatCountdown(cooldownRemaining),
              )}
            </p>
          ) : null}
        </Card>
      ) : (
        <Card className="max-w-xl">
          <form className="space-y-8" onSubmit={onSubmitDocument}>
            <p className="font-body text-body-md text-on-surface-variant">
              {t("dashboard.verification.docIntro")}
            </p>
            <ImageDropzone
              value={documents}
              onChange={setDocuments}
              max={1}
              label={t("dashboard.verification.docLabel")}
              hint={t("dashboard.verification.docHint")}
            />
            <Button type="submit" variant="primary" disabled={docBusy}>
              {t("dashboard.verification.submitReview")}
            </Button>
          </form>
        </Card>
      )}
    </DashboardShell>
  );
}
