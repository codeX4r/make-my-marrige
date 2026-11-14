"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RegisterRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams ? searchParams.toString() : "");
    params.set("tab", "register");
    router.replace(`/auth?${params.toString()}`);
  }, [router, searchParams]);

  return null;
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterRedirectContent />
    </Suspense>
  );
}
