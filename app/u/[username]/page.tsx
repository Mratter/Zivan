import { Suspense } from "react";
import { ProfilePage, ProfileRight } from "@/components/zivan-feed";
import { ZivanShell } from "@/components/zivan-shell";

export default async function UserRoute({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return (
    <Suspense fallback={null}>
      <ZivanShell right={<ProfileRight username={username} />}>
        <ProfilePage username={username} />
      </ZivanShell>
    </Suspense>
  );
}
