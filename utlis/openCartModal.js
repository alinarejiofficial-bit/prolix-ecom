import { openWobcartCartDrawer } from "@/utils/wobcartCheckout";

export const openCartModal = async () => {
  try {
    await openWobcartCartDrawer();
    return;
  } catch {
    // Fall back to the legacy Bootstrap cart modal if checkout script is unavailable
  }

  const bootstrap = require("bootstrap"); // dynamically import bootstrap
  
  // Close any open modals
  const modalElements = document.querySelectorAll(".modal.show");
  modalElements.forEach((modal) => {
    const modalInstance = bootstrap.Modal.getInstance(modal);
    if (modalInstance) {
      modalInstance.hide();
    }
  });

  // Close any open offcanvas
  const offcanvasElements = document.querySelectorAll(".offcanvas.show");
  offcanvasElements.forEach((offcanvas) => {
    const offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvas);
    if (offcanvasInstance) {
      offcanvasInstance.hide();
    }
  });

  // Get or create modal instance
  const cartModalElement = document.getElementById("shoppingCart");
  if (!cartModalElement) return;

  let myModal = bootstrap.Modal.getInstance(cartModalElement);
  if (!myModal) {
    myModal = new bootstrap.Modal(cartModalElement, {
      keyboard: false,
      backdrop: true,
    });
  }

  // Prevent body scroll when modal opens
  myModal.show();
};
