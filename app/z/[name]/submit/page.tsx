import { Suspense } from "react";
import { CreatePostPage } from "@/components/zivan-modals";
import { CommunityRight } from "@/components/zivan-feed";
import { ZivanShell } from "@/components/zivan-shell";

export default async function CommunitySubmitRoute({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  return (
    <Suspense fallback={null}>
      <ZivanShell right={<CommunityRight name={name} />}>
        <CreatePostPage defaultCommunity={name} />
      </ZivanShell>
    </Suspense>
  );
}
