import { Suspense } from "react";
import { NotificationsPage } from "@/components/zivan-feed";
import { ZivanShell } from "@/components/zivan-shell";

export default function NotificationsRoute() {
  return (
    <Suspense fallback={null}>
      <ZivanShell>
        <NotificationsPage />
      </ZivanShell>
    </Suspense>
  );
}
