import { Suspense } from "react";
import { FeedPage } from "@/components/zivan-feed";
import { ZivanShell } from "@/components/zivan-shell";

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <ZivanShell>
        <FeedPage view="home" />
      </ZivanShell>
    </Suspense>
  );
}
