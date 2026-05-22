import { Suspense } from "react";
import { AuthPage } from "@/components/zivan-modals";
import { ZivanShell } from "@/components/zivan-shell";

export default function SignInRoute() {
  return (
    <Suspense fallback={null}>
      <ZivanShell>
        <AuthPage mode="sign-in" />
      </ZivanShell>
    </Suspense>
  );
}
