import { Suspense } from "react";
import { FeedPage } from "@/components/zivan-feed";
import { ZivanShell } from "@/components/zivan-shell";

export default function NewsPage() {
  return (
    <Suspense fallback={null}>
      <ZivanShell>
        <FeedPage view="news" />
      </ZivanShell>
    </Suspense>
  );
}
