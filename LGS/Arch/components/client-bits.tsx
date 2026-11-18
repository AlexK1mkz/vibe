"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { track } from "@/lib/client";

/** Отправляет событие один раз при показе блока */
export function TrackOnMount({
  name,
  payload,
  leadId,
  onceKey,
  countersOnly,
}: {
  name: string;
  payload?: Record<string, unknown>;
  leadId?: string;
  onceKey: string;
  countersOnly?: boolean;
}) {
  useEffect(() => {
    track(name, payload ?? {}, { leadId, onceKey, countersOnly });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/** Ссылка, которая отправляет событие воронки по клику */
export function TrackedLink({
  href,
  event,
  payload,
  leadId,
  className,
  children,
  prefetch,
}: {
  href: string;
  event: string;
  payload?: Record<string, unknown>;
  leadId?: string;
  className?: string;
  children: React.ReactNode;
  prefetch?: boolean;
}) {
  const external = href.startsWith("/api/") || href.startsWith("http");
  const onClick = () => track(event, payload ?? {}, { leadId });
  if (external) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} onClick={onClick} prefetch={prefetch}>
      {children}
    </Link>
  );
}

/** «Поделиться» отдаёт ссылку на лендинг, не на личный результат (ТЗ, п. 11) */
export function ShareButton({ label, text, copied }: { label: string; text: string; copied: string }) {
  const [done, setDone] = useState(false);
  const share = async () => {
    const url = `${window.location.origin}/?utm_source=share&utm_medium=result`;
    try {
      if (navigator.share) {
        await navigator.share({ title: text, text, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setDone(true);
      window.setTimeout(() => setDone(false), 2500);
    } catch {
      /* человек закрыл окно «Поделиться» */
    }
  };
  return (
    <button type="button" onClick={share} className="btn btn-ghost w-full sm:w-auto">
      <span aria-live="polite">{done ? copied : label}</span>
    </button>
  );
}
