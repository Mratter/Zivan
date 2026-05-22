import { Suspense } from "react";
import { AuthPage } from "@/components/zivan-modals";
import { ZivanShell } from "@/components/zivan-shell";

export default function SignUpRoute() {
  return (
    <Suspense fallback={null}>
      <ZivanShell>
        <AuthPage mode="sign-up" />
      </ZivanShell>
    </Suspense>
  );
}
