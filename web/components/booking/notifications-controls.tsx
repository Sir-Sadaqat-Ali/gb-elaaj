"use client";

import * as React from "react";
import Link from "next/link";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from "@/lib/actions/notifications";

export function MarkAllReadButton({ basePath }: { basePath?: string }) {
  const [pending, start] = React.useTransition();
  return (
    <Button
      size="sm"
      variant="secondary"
      loading={pending}
      onClick={() =>
        start(async () => {
          const res = await markAllNotificationsReadAction({ path: basePath });
          if (!res.ok) toast.error(res.error);
          else toast.success("All marked read.");
        })
      }
    >
      <CheckCheck className="h-3.5 w-3.5" /> Mark all read
    </Button>
  );
}

export function NotificationItem({
  id,
  title,
  body,
  href,
  relativeTime,
  createdAtIso,
  createdAtAbsolute,
  read,
  basePath,
}: {
  id: string;
  title: string;
  body: string;
  href: string | null;
  relativeTime: string;
  createdAtIso: string;
  createdAtAbsolute: string;
  read: boolean;
  basePath?: string;
}) {
  const [, start] = React.useTransition();
  const [readNow, setReadNow] = React.useState(read);

  function markRead() {
    if (readNow) return;
    setReadNow(true);
    start(async () => {
      const res = await markNotificationReadAction({ id, path: basePath });
      if (!res.ok) {
        setReadNow(false);
        toast.error(res.error);
      }
    });
  }

  const inner = (
    <div className={cn("flex items-start gap-3 p-4", !readNow && "bg-ge-soft-bg/60")}>
      <span
        aria-hidden
        className={cn(
          "mt-1 h-2 w-2 shrink-0 rounded-full",
          readNow ? "bg-ge-border" : "bg-ge-primary"
        )}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-3">
          <span className={cn("text-[13.5px]", readNow ? "text-ge-ink" : "font-semibold text-ge-ink")}>
            {title}
          </span>
          <time
            className="shrink-0 text-[11px] text-ge-muted"
            dateTime={createdAtIso}
            title={createdAtAbsolute}
          >
            {relativeTime}
          </time>
        </div>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-ge-muted">{body}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <li>
        <Link
          href={href}
          onClick={markRead}
          className="block transition hover:bg-ge-soft-bg"
          aria-label={`Open: ${title}`}
        >
          {inner}
        </Link>
      </li>
    );
  }
  return (
    <li onClick={markRead} role="button" tabIndex={0}>
      {inner}
    </li>
  );
}
