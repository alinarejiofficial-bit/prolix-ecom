"use client";
import React from "react";
import { useContextElement } from "@/context/Context";
import AuthModal from "@/components/modals/AuthModal";

export default function AuthModalWrapper() {
  const { isAuthModalOpen, closeAuthModal } = useContextElement();

  return (
    <AuthModal 
      isOpen={isAuthModalOpen} 
      onClose={closeAuthModal} 
    />
  );
}
