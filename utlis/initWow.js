let wowInstance = null;

export function initWow() {
  if (typeof window === "undefined") return null;

  const WOW = require("@/utlis/wow");

  if (wowInstance) {
    wowInstance.stop();
  }

  wowInstance = new WOW.default({
    mobile: false,
    live: false,
  });
  wowInstance.init();

  return wowInstance;
}

/** Re-scan the DOM for new `.wow` elements (e.g. after async content loads). */
export function refreshWow() {
  if (typeof window === "undefined" || !wowInstance) return;

  wowInstance.doSync(document.body);
  if (!wowInstance.disabled()) {
    wowInstance.scrolled = true;
    wowInstance.scrollCallback();
  }
}
