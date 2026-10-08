export const ACCOUNT_NAV_ITEMS = [
  {
    href: "/my-account",
    label: "Account Details",
    icon: "user",
    isActive: (pathname) => pathname === "/my-account",
  },
  {
    href: "/my-account-orders",
    label: "Your Orders",
    icon: "orders",
    isActive: (pathname) =>
      pathname === "/my-account-orders" ||
      pathname.startsWith("/my-account-orders-details"),
  },
  {
    href: "/my-account-address",
    label: "My Address",
    icon: "address",
    isActive: (pathname) => pathname === "/my-account-address",
  },
  {
    href: "/my-account-security",
    label: "Security",
    icon: "security",
    isActive: (pathname) => pathname === "/my-account-security",
  },
];
