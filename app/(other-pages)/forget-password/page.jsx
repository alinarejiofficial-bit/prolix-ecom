import Footer1 from "@/components/footers/Footer1";
import Header1 from "@/components/headers/Header1";
import Topbar6 from "@/components/headers/Topbar6";
import ForgotPass from "@/components/otherPages/ForgotPass";
import React from "react";

export const metadata = {
  title: "Forgot Password - Prolix | Reset Your Account Password",
  description: "Reset your Prolix account password. Enter your email address to receive password reset instructions. Secure and easy password recovery process.",
  keywords: "forgot password, reset password, password recovery, account recovery, Prolix password, change password",
};

export default function ForgotPasswordPage() {
  return (
    <>
      <Topbar6 bgColor="bg-white" />
      <Header1 />
      
      <ForgotPass />
      <Footer1 />
    </>
  );
}
