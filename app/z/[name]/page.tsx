import { Suspense } from "react";
import { CommunityPage, CommunityRight } from "@/components/zivan-feed";
import { ZivanShell } from "@/components/zivan-shell";

export default async function CommunityRoute({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  return (
    <Suspense fallback={null}>
      <ZivanShell right={<CommunityRight name={name} />}>
        <CommunityPage name={name} />
      </ZivanShell>
    </Suspense>
  );
}
