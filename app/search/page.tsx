import { Suspense } from "react";
import { SearchPage } from "@/components/zivan-feed";
import { ZivanShell } from "@/components/zivan-shell";

export default function SearchRoute() {
  return (
    <Suspense fallback={null}>
      <ZivanShell>
        <SearchPage />
      </ZivanShell>
    </Suspense>
  );
}
