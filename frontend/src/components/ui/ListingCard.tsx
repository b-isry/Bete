"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";
import { useSWRConfig } from "swr";
import { useLanguage } from "@/i18n/LanguageContext";
import {
  addFavorite,
  ApiError,
  FAVORITES_PATH,
  removeFavorite,
  sendMessage,
  trackPropertyEvent,
} from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import { PLACEHOLDER_IMAGE } from "@/lib/mocks";
import { Button } from "./Button";
import { Card } from "./Card";
import { Icon } from "./Icon";
import { Modal, ModalBody } from "./Modal";
import { StatusPill } from "./StatusPill";
import { Textarea } from "./Textarea";
import { useToast } from "./Toast";
import { cn } from "./cn";

export type ListingCardImage = {
  id?: string;
  image_url: string;
  sort_order?: number;
};

export type ListingCardProps = {
  id: string;
  title: string;
  priceEtb: number;
  /** Pass null/undefined when area is unknown — ETB/m² line is hidden. */
  pricePerSqm?: number | null;
  areaSqm?: number | null;
  images?: ListingCardImage[];
  /** @deprecated Prefer `images` — kept for older call sites. */
  imageUrl?: string;
  imageAlt?: string;
  verified?: boolean;
  location?: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  sellerId?: string | null;
  sellerPhone?: string | null;
  initiallyFavorited?: boolean;
  className?: string;
};

const CAROUSEL_MS = 1200;

function formatEtb(amount: number): string {
  return `${amount.toLocaleString("en-ET")} ETB`;
}

function resolveImages(
  images: ListingCardImage[] | undefined,
  imageUrl: string | undefined,
): string[] {
  const fromArray = (images ?? [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((img) => img.image_url)
    .filter(Boolean);
  if (fromArray.length > 0) return fromArray;
  if (imageUrl) return [imageUrl];
  return [PLACEHOLDER_IMAGE];
}

function preload(src: string): void {
  if (typeof window === "undefined") return;
  const img = new window.Image();
  img.src = src;
}

export function ListingCard({
  id,
  title,
  priceEtb,
  pricePerSqm = null,
  areaSqm = null,
  images,
  imageUrl,
  imageAlt,
  verified = false,
  location,
  bedrooms = null,
  bathrooms = null,
  sellerId = null,
  sellerPhone = null,
  initiallyFavorited = false,
  className,
}: ListingCardProps) {
  const { t } = useLanguage();
  const router = useRouter();
  const { push } = useToast();
  const { mutate } = useSWRConfig();
  const gallery = useMemo(
    () => resolveImages(images, imageUrl),
    [images, imageUrl],
  );
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [favorited, setFavorited] = useState(initiallyFavorited);
  const [favoriteBusy, setFavoriteBusy] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [messageDraft, setMessageDraft] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setFavorited(initiallyFavorited);
  }, [initiallyFavorited]);

  useEffect(() => {
    if (!hovering || gallery.length < 2) {
      return;
    }

    preload(gallery[1 % gallery.length]);

    const timerId = window.setInterval(() => {
      setIndex((current) => {
        const upcoming = (current + 1) % gallery.length;
        preload(gallery[(upcoming + 1) % gallery.length]);
        return upcoming;
      });
    }, CAROUSEL_MS);

    return () => {
      window.clearInterval(timerId);
    };
  }, [hovering, gallery]);

  function requireAuth(): boolean {
    if (getAccessToken()) return true;
    push(t("listing.signInRequired"), "error");
    router.push("/sign-in");
    return false;
  }

  async function toggleFavorite(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (favoriteBusy || !requireAuth()) return;

    const next = !favorited;
    setFavorited(next);
    setFavoriteBusy(true);
    try {
      if (next) {
        await addFavorite(id);
      } else {
        await removeFavorite(id);
      }
      await mutate(FAVORITES_PATH);
    } catch (err) {
      setFavorited(!next);
      const message =
        err instanceof ApiError ? err.message : t("listing.favoriteError");
      push(message, "error");
    } finally {
      setFavoriteBusy(false);
    }
  }

  function openMessage(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!requireAuth()) return;
    if (!sellerId) {
      push(t("listing.messageUnavailable"), "error");
      return;
    }
    setMessageOpen(true);
  }

  async function onCall(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!sellerPhone) {
      push(t("listing.callUnavailable"), "error");
      return;
    }
    try {
      await trackPropertyEvent(id, "CALL");
    } catch {
      // Contact navigation should not block on analytics.
    }
    window.location.href = `tel:${sellerPhone}`;
  }

  async function onSendMessage(event: FormEvent) {
    event.preventDefault();
    const text = messageDraft.trim();
    if (!text || !sellerId) return;
    setSending(true);
    try {
      await sendMessage({
        thread_type: "LISTING",
        recipient_id: sellerId,
        property_id: id,
        message_text: text,
      });
      try {
        await trackPropertyEvent(id, "MESSAGE");
      } catch {
        // non-blocking
      }
      setMessageDraft("");
      setMessageOpen(false);
      push(t("listing.messageSent"), "success");
      router.push("/dashboard/messages");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : t("listing.messageFailed");
      push(message, "error");
    } finally {
      setSending(false);
    }
  }

  const showPerSqm =
    areaSqm != null &&
    Number.isFinite(areaSqm) &&
    areaSqm > 0 &&
    pricePerSqm != null &&
    Number.isFinite(pricePerSqm) &&
    pricePerSqm > 0;

  const activeSrc = gallery[index] ?? PLACEHOLDER_IMAGE;

  return (
    <>
      <Card
        padding={false}
        className={cn(
          "overflow-hidden transition-colors hover:border-primary/40",
          className,
        )}
      >
        <div
          className="relative aspect-[4/3] w-full overflow-hidden bg-surface-variant"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => {
            setHovering(false);
            setIndex(0);
          }}
        >
          <Image
            src={activeSrc}
            alt={imageAlt ?? title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-opacity duration-300"
          />

          {verified ? (
            <StatusPill
              kind="verification"
              status="VERIFIED"
              className="absolute left-3 top-3 z-10"
            />
          ) : null}

          <button
            type="button"
            aria-label={
              favorited ? t("listing.unfavorite") : t("listing.favorite")
            }
            aria-pressed={favorited}
            disabled={favoriteBusy}
            onClick={toggleFavorite}
            className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-lowest/90 text-primary transition-colors hover:bg-surface-container-lowest"
          >
            <Icon
              name="favorite"
              className="text-xl leading-none"
              style={{
                fontVariationSettings: favorited
                  ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
                  : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
              }}
            />
          </button>

          {gallery.length > 1 ? (
            <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-1.5">
              {gallery.map((src, i) => (
                <span
                  key={`${src}-${i}`}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-colors",
                    i === index
                      ? "bg-on-primary"
                      : "bg-on-primary/40",
                  )}
                />
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-4">
            <h3 className="min-w-0 flex-1 font-serif text-headline-sm leading-snug text-on-surface">
              {title}
            </h3>
            <div className="shrink-0 text-right">
              <p className="font-sans text-label-md font-bold text-on-surface">
                {formatEtb(priceEtb)}
              </p>
              {showPerSqm ? (
                <p className="mt-0.5 font-sans text-label-sm text-on-surface-variant">
                  {formatEtb(Math.round(pricePerSqm))} / m²
                </p>
              ) : null}
            </div>
          </div>

          {location ? (
            <p className="flex items-center gap-1.5 font-sans text-label-sm text-on-surface-variant">
              <Icon name="location_on" className="text-base text-secondary" />
              <span className="truncate">{location}</span>
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-4 font-sans text-label-sm text-on-surface-variant">
            {bedrooms != null ? (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="bed" className="text-base" />
                {bedrooms}
              </span>
            ) : null}
            {bathrooms != null ? (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="bathtub" className="text-base" />
                {bathrooms}
              </span>
            ) : null}
            {areaSqm != null && Number.isFinite(areaSqm) && areaSqm > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <Icon name="square_foot" className="text-base" />
                {Math.round(areaSqm)} m²
              </span>
            ) : null}
          </div>

          <div className="flex items-stretch gap-2 pt-1">
            <Button
              href={`/properties/${id}`}
              variant="primary"
              className="min-w-0 flex-1"
            >
              {t("listing.viewDetails")}
            </Button>
            <Button
              type="button"
              variant="icon"
              aria-label={t("listing.message")}
              onClick={openMessage}
              className="shrink-0"
            >
              <Icon name="chat" />
            </Button>
            <Button
              type="button"
              variant="icon"
              aria-label={t("listing.call")}
              onClick={onCall}
              className="shrink-0"
              disabled={!sellerPhone}
            >
              <Icon name="call" />
            </Button>
          </div>
        </div>
      </Card>

      <Modal
        open={messageOpen}
        onClose={() => setMessageOpen(false)}
        title={t("listing.messageTitle")}
      >
        <ModalBody>
          <form className="space-y-4" onSubmit={(e) => void onSendMessage(e)}>
            <Textarea
              variant="underline"
              value={messageDraft}
              onChange={(e) => setMessageDraft(e.target.value)}
              rows={4}
              required
              placeholder={t("listing.messagePlaceholder")}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setMessageOpen(false)}
              >
                {t("listing.messageCancel")}
              </Button>
              <Button type="submit" variant="primary" disabled={sending}>
                {t("listing.messageSend")}
              </Button>
            </div>
          </form>
        </ModalBody>
      </Modal>
    </>
  );
}
