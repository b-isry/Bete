import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

export type ChatBubbleProps = HTMLAttributes<HTMLDivElement> & {
  /** Outgoing = current user (primary); incoming = peer */
  side?: "incoming" | "outgoing";
  meta?: ReactNode;
  children: ReactNode;
};

export function ChatBubble({
  side = "incoming",
  meta,
  children,
  className,
  ...props
}: ChatBubbleProps) {
  const outgoing = side === "outgoing";

  return (
    <div
      className={cn(
        "flex max-w-[80%] flex-col gap-1",
        outgoing ? "ml-auto items-end" : "mr-auto items-start",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "rounded-none px-4 py-3 font-body text-body-md",
          outgoing
            ? "bg-primary text-on-primary"
            : "bg-surface-container text-on-surface",
        )}
      >
        {children}
      </div>
      {meta ? (
        <span className="font-sans text-label-sm text-on-surface-variant">
          {meta}
        </span>
      ) : null}
    </div>
  );
}
