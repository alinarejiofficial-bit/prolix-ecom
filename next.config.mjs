import path from "path";
import { fileURLToPath } from "url";

// Allow local proxy in dev mode even if upstream cert is undergoing renewal
if (process.env.NODE_ENV === "development" || !process.env.NODE_ENV) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const checkoutBase =
  process.env.NEXT_CHECKOUT_BASE_URL || "http://127.0.0.1:8000";

const nextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  async rewrites() {
    return [];
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wobcart.s3.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "mellbizz-assets.s3.eu-north-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "wobcart.com",
      },
      {
        protocol: "https",
        hostname: "**.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "**.wobcart.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
    ],
  },
  sassOptions: {
    quietDeps: true, // This will silence deprecation warnings
    silenceDeprecations: ["legacy-js-api"],
  },
};

export default nextConfig;
