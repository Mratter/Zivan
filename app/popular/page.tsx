import { Suspense } from "react";
import { FeedPage } from "@/components/zivan-feed";
import { ZivanShell } from "@/components/zivan-shell";

export default function PopularPage() {
  return (
    <Suspense fallback={null}>
      <ZivanShell>
        <FeedPage view="popular" />
      </ZivanShell>
    </Suspense>
  );
}
