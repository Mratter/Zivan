import { Suspense } from "react";
import { CommunityRight, PostDetailPage } from "@/components/zivan-feed";
import { ZivanShell } from "@/components/zivan-shell";

export default async function PostDetailRoute({
  params,
}: {
  params: Promise<{ name: string; postId: string }>;
}) {
  const { name, postId } = await params;
  return (
    <Suspense fallback={null}>
      <ZivanShell right={<CommunityRight name={name} />}>
        <PostDetailPage communityName={name} postId={postId} />
      </ZivanShell>
    </Suspense>
  );
}
