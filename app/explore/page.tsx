import { Suspense } from "react";
import { FeedPage } from "@/components/zivan-feed";
import { ZivanShell } from "@/components/zivan-shell";

export default function ExplorePage() {
  return (
    <Suspense fallback={null}>
      <ZivanShell>
        <FeedPage view="explore" />
      </ZivanShell>
    </Suspense>
  );
}
