import type { Metadata } from "next";
import { funnel } from "@/config/funnel";
import { SiteHeader } from "@/components/site-chrome";
import { TestRunner } from "@/components/test-runner";
import { getDictionary } from "@/dictionaries";
import { test } from "@/lib/content";

const t = getDictionary();

export const metadata: Metadata = { title: t.test.title };

export default function TestPage() {
  return (
    <>
      <SiteHeader minimal />
      <main id="content" className="container-narrow pt-6">
        <TestRunner
          questions={test.questions}
          version={test.version}
          calcMs={funnel.test.calcScreenMs}
          strings={{ ...t.test, back: t.common.back, next: t.common.next, retry: t.common.retry }}
        />
      </main>
    </>
  );
}
