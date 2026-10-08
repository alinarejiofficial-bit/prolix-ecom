import { apiRequest, API_CONFIG } from '@/utils/apiConfig';

let cachedBannerSliders = null;
let bannerSlidersTimestamp = 0;
let inflightBannerSlidersPromise = null;

let cachedOfferSection = null;
let offerTimestamp = 0;
let cachedPromoCards = null;
let promoCardsTimestamp = 0;
const CACHE_TTL_MS = 60000;
let inflightOfferPromise = null;
let inflightPromoPromise = null;

const BANNER_STORAGE_KEY = 'wc_hero_banners_v1';

function readStoredBanners() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(BANNER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (e) {
    // Ignore storage parse errors
  }
  return null;
}

function writeStoredBanners(data) {
  if (typeof window === 'undefined' || !Array.isArray(data)) return;
  try {
    window.localStorage.setItem(BANNER_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // Ignore storage write errors (quota, etc.)
  }
}

// Banner Service
export const bannerService = {
  // Synchronous getter for instant initial render
  getCachedBannerSliders: () => {
    if (cachedBannerSliders && cachedBannerSliders.length > 0) {
      return cachedBannerSliders;
    }
    const stored = readStoredBanners();
    if (stored) {
      cachedBannerSliders = stored;
      return stored;
    }
    return null;
  },

  // Get Banner Sliders
  getBannerSliders: async (forceRefresh = false) => {
    const isCacheFresh = cachedBannerSliders && (Date.now() - bannerSlidersTimestamp < CACHE_TTL_MS);
    if (!forceRefresh && isCacheFresh) {
      return { success: true, data: cachedBannerSliders };
    }

    if (!forceRefresh && inflightBannerSlidersPromise) {
      return inflightBannerSlidersPromise;
    }

    const promise = (async () => {
      try {
        const res = await apiRequest(API_CONFIG.ENDPOINTS.BANNER_SLIDERS, {
          method: 'GET',
        });
        if (res?.success && Array.isArray(res?.data)) {
          cachedBannerSliders = res.data;
          bannerSlidersTimestamp = Date.now();
          writeStoredBanners(res.data);
        }
        return res;
      } finally {
        inflightBannerSlidersPromise = null;
      }
    })();

    inflightBannerSlidersPromise = promise;
    return promise;
  },

  // Synchronous getter for instant render
  getCachedPromoCards: () => cachedPromoCards,

  // Get Home Promo Cards
  getHomePromoCards: async (forceRefresh = false) => {
    const isCacheFresh = cachedPromoCards && (Date.now() - promoCardsTimestamp < CACHE_TTL_MS);
    if (!forceRefresh && isCacheFresh) {
      return { success: true, data: cachedPromoCards };
    }

    if (!forceRefresh && inflightPromoPromise) {
      return inflightPromoPromise;
    }

    const promise = (async () => {
      try {
        const res = await apiRequest(API_CONFIG.ENDPOINTS.HOME_PROMO_CARDS, {
          method: 'GET',
        });
        if (res?.success && Array.isArray(res?.data)) {
          cachedPromoCards = res.data;
          promoCardsTimestamp = Date.now();
        }
        return res;
      } finally {
        inflightPromoPromise = null;
      }
    })();

    inflightPromoPromise = promise;
    return promise;
  },

  // Get Home Announcements
  getHomeAnnouncements: async () => {
    return await apiRequest(API_CONFIG.ENDPOINTS.HOME_ANNOUNCEMENTS, {
      method: 'GET',
    });
  },

  // Synchronous getter for instant render
  getCachedOfferSection: () => cachedOfferSection,

  // Get Home Offer Section
  getHomeOfferSection: async (forceRefresh = false) => {
    const isCacheFresh = cachedOfferSection && (Date.now() - offerTimestamp < CACHE_TTL_MS);
    if (!forceRefresh && isCacheFresh) {
      return { success: true, data: cachedOfferSection };
    }

    if (!forceRefresh && inflightOfferPromise) {
      return inflightOfferPromise;
    }

    const promise = (async () => {
      try {
        const res = await apiRequest(API_CONFIG.ENDPOINTS.HOME_OFFER_SECTION, {
          method: 'GET',
        });
        if (res?.success && res?.data) {
          cachedOfferSection = res.data;
          offerTimestamp = Date.now();
        }
        return res;
      } finally {
        inflightOfferPromise = null;
      }
    })();

    inflightOfferPromise = promise;
    return promise;
  },
};
