"use client";

import { useContextElement } from "@/context/Context";
import {
  mapCartProductsToWobcartItems,
  mapToWobcartItem,
  openWobcartCheckout,
} from "@/utils/wobcartCheckout";
import { CheckoutPageSkeleton } from "@/components/common/SectionSkeletons";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function WobcartCheckoutLauncher() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { cartProducts } = useContextElement();
  const [error, setError] = useState(null);
  const launchedRef = useRef(false);

  useEffect(() => {
    if (launchedRef.current) {
      return;
    }
    launchedRef.current = true;

    const variantId = searchParams.get("variant_id");
    const qty = parseInt(searchParams.get("qty") || "1", 10);

    const launch = async () => {
      try {
        if (variantId) {
          await openWobcartCheckout([mapToWobcartItem(variantId, qty)], {
            express: true,
          });
          return;
        }

        const items = mapCartProductsToWobcartItems(cartProducts);
        if (!items.length) {
          router.replace("/shopping-cart");
          return;
        }

        await openWobcartCheckout(items);
      } catch (launchError) {
        setError(launchError.message || "Unable to open checkout");
      }
    };

    launch();
  }, [searchParams, cartProducts, router]);

  if (error) {
    return (
      <section className="flat-spacing pt-4">
        <div className="container text-center py-5">
          <p className="text-danger mb-3">{error}</p>
          <button
            type="button"
            className="tf-btn btn-fill"
            onClick={() => router.push("/shopping-cart")}
          >
            Back to cart
          </button>
        </div>
      </section>
    );
  }

  return <CheckoutPageSkeleton />;
}
