"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { captureUtm, CONSENT_KEY, loadCounters, storageGet, storageSet, track } from "@/lib/client";

interface Props {
  ids: { meta?: string; ga4?: string; ym?: string };
  text: { text: string; accept: string; decline: string; policy: string };
}

/** UTM при первом заходе, баннер cookie, загрузка счётчиков после согласия, page_view на каждый переход */
export function AnalyticsProvider({ ids, text }: Props) {
  const pathname = usePathname();
  const [banner, setBanner] = useState(false);
  const ready = useRef(false);

  useEffect(() => {
    captureUtm();
    const consent = storageGet(CONSENT_KEY);
    if (consent === "yes") loadCounters(ids);
    else if (consent !== "no") setBanner(true);
    ready.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    track("page_view", { path: pathname });
  }, [pathname]);

  if (!banner || pathname.startsWith("/admin")) return null;

  const decide = (value: "yes" | "no") => {
    storageSet(CONSENT_KEY, value);
    setBanner(false);
    if (value === "yes") {
      loadCounters(ids);
      track("page_view", { path: pathname }, { countersOnly: true });
    }
  };

  return (
    <div
      role="region"
      aria-label="Cookie"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_20px_rgba(16,61,53,0.08)] sm:inset-x-auto sm:bottom-4 sm:left-4 sm:max-w-sm sm:rounded-2xl sm:border"
    >
      <p className="text-[13px] leading-snug text-muted">
        {text.text}{" "}
        <Link href="/privacy" className="underline">
          {text.policy}
        </Link>
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => decide("yes")}
          className="min-h-11 flex-1 rounded-xl bg-green px-3 text-sm font-bold text-white"
        >
          {text.accept}
        </button>
        <button
          type="button"
          onClick={() => decide("no")}
          className="min-h-11 flex-1 rounded-xl border border-line px-3 text-sm font-bold text-ink"
        >
          {text.decline}
        </button>
      </div>
    </div>
  );
}
