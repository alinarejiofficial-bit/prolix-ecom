"use client";
import React, { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import AuthModal from "@/components/modals/AuthModal";
import { useContextElement } from "@/context/Context";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useContextElement();
  const next = searchParams.get("next") || "/my-account";

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(next.startsWith("/") ? next : "/my-account");
    }
  }, [isAuthenticated, next, router]);

  return (
    <AuthModal
      isOpen
      asPage
      onClose={() => router.push(next.startsWith("/") ? next : "/")}
    />
  );
}

export default function LoginPage() {
  return (
    <>
      <Topbar6 bgColor="bg-white" />
      <Header1 />
      <Suspense fallback={<div className="flat-spacing" />}>
        <LoginContent />
      </Suspense>
      <Footer1 />
    </>
  );
}
