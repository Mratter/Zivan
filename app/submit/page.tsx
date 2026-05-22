import { Suspense } from "react";
import { CreatePostPage } from "@/components/zivan-modals";
import { ZivanShell } from "@/components/zivan-shell";

export default function SubmitRoute() {
  return (
    <Suspense fallback={null}>
      <ZivanShell>
        <CreatePostPage />
      </ZivanShell>
    </Suspense>
  );
}
