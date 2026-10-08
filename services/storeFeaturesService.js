import { apiRequest, API_CONFIG } from "@/utils/apiConfig";
import {
  BRAND_NAME,
  resolveBrandFavicon,
  resolveBrandLogo,
  resolveBrandName,
  sanitizePublicValue,
} from "@/utils/brand";

const DEFAULT_MODULES = {
  pos: false,
  tailoring: false,
  prebooking_deposits: false,
  product_customization: false,
  inventory: false,
  supply: false,
  contact_messages: true,
  whatsapp_commerce: false,
  wobcart_checkout: false,
  content: true,
  product_reviews: false,
  ai_image_enhance: false,
  ai_on_model: false,
  marketing: true,
  careers: true,
  finance: false,
  discounts: true,
  custom_courier: true,
  shiprocket: false,
  delhivery: false,
  staff: false,
};

const DEFAULT_CONFIG = {
  modules: DEFAULT_MODULES,
  modulesVersion: 0,
  homeCollections: true,
  branding: {
    companyName: BRAND_NAME,
    logoUrl: resolveBrandLogo(null),
    faviconUrl: resolveBrandFavicon(null),
    website: null,
  },
  contact: {
    email: null,
    phone: null,
    whatsapp: null,
    address: null,
  },
  social: {
    facebook: null,
    instagram: null,
    linkedin: null,
    twitter: null,
    whatsapp: null,
  },
  whatsappWidget: {
    enabled: false,
    phone: null,
    position: "bottom-right",
    greeting: "Hi! I have a question.",
  },
  auth: {
    googleLoginEnabled: false,
    googleClientId: null,
    appleLoginEnabled: false,
    appleClientId: null,
    otpLoginEnabled: false,
    emailPasswordLoginEnabled: true,
    emailOtpLoginEnabled: true,
  },
  checkout: {
    wobcartCheckoutEnabled: false,
    expressCheckoutEnabled: true,
    codEnabled: true,
    razorpayEnabled: false,
    razorpayKey: null,
    stripeEnabled: false,
    gstEnabled: false,
    gstTaxLabel: "GST",
  },
};

let cachedStoreConfig = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = process.env.NODE_ENV === "development" ? 5000 : 30000;
let inflightPromise = null;

function asBooleanMap(source = {}) {
  const mapped = {};
  Object.entries(source).forEach(([key, value]) => {
    mapped[key] = Boolean(value);
  });
  return mapped;
}

export const storeFeaturesService = {
  getStoreConfig: async (forceRefresh = false) => {
    const isCacheFresh = cachedStoreConfig && (Date.now() - cacheTimestamp < CACHE_TTL_MS);
    if (!forceRefresh && isCacheFresh) {
      return cachedStoreConfig;
    }

    if (!forceRefresh && inflightPromise) {
      return inflightPromise;
    }

    inflightPromise = (async () => {
      try {
        const [featuresRes, contactRes, authRes, checkoutRes] = await Promise.allSettled([
          apiRequest(API_CONFIG.ENDPOINTS.STORE_FEATURES).catch(() => null),
          apiRequest(API_CONFIG.ENDPOINTS.CONTACT_INFO).catch(() => null),
          apiRequest(API_CONFIG.ENDPOINTS.AUTH_CONFIG).catch(() => null),
          apiRequest(API_CONFIG.ENDPOINTS.WOBCART_CHECKOUT_CONFIG).catch(() => null),
        ]);

        const featuresData = featuresRes.status === "fulfilled" && featuresRes.value?.success
          ? featuresRes.value.data
          : {};

        const contactData = contactRes.status === "fulfilled" && contactRes.value?.success
          ? contactRes.value.data
          : {};

        const authData = authRes.status === "fulfilled" && authRes.value?.success
          ? authRes.value.data
          : {};

        const checkoutData = checkoutRes.status === "fulfilled" && checkoutRes.value?.success
          ? checkoutRes.value.data
          : {};

        const rawModules = asBooleanMap(featuresData.modules || {});
        const hasFullModuleMap = Object.keys(rawModules).length > 0;
        const modules = {
          ...DEFAULT_MODULES,
          ...rawModules,
        };

        [
          "content",
          "marketing",
          "careers",
          "tailoring",
          "product_reviews",
          "prebooking_deposits",
          "product_customization",
          "discounts",
          "whatsapp_commerce",
          "wobcart_checkout",
          "contact_messages",
          "pos",
        ].forEach((key) => {
          if (typeof featuresData[key] === "boolean") {
            modules[key] = featuresData[key];
          }
        });

        // Older tenant APIs only return 4 keys and no `modules` map.
        // Fail-open core storefront sections so Admin banners/catalog still show.
        if (!hasFullModuleMap) {
          modules.content = true;
          modules.marketing = Boolean(featuresData.home_collections);
          modules.product_reviews = true;
          modules.contact_messages = true;
          modules.discounts = true;
        }

        const settings = featuresData.settings || {};
        const general = contactData.general_settings || {};
        const brandingPayload = contactData.branding || {};
        const rawCompanyName = checkoutData.company_name || general.company_name || settings.company_name || BRAND_NAME;
        const companyName = resolveBrandName(rawCompanyName);
        const logoUrl = resolveBrandLogo(
          brandingPayload.company_logo || settings.company_logo || checkoutData.logo_url,
          rawCompanyName,
        );
        const faviconUrl = resolveBrandFavicon(
          brandingPayload.favicon || settings.favicon,
          rawCompanyName,
        );
        const website = general.website_display || general.website_link || checkoutData.website || null;

        const contactDetails = contactData.contact_details || {};
        const socialMedia = contactData.social_media || {};

        const rawWidget = contactData.whatsapp_widget || null;
        const whatsappWidget = {
          enabled: Boolean(modules.whatsapp_commerce && rawWidget && rawWidget.enabled && rawWidget.phone),
          phone: rawWidget?.phone || contactDetails.whatsapp || null,
          position: rawWidget?.position || "bottom-right",
          greeting: rawWidget?.greeting || "Hi! I have a question.",
        };

        const googleClientId = authData.google_client_id || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || null;
        const googleEnabled = authData.google_login_enabled !== false && Boolean(googleClientId);
        const authConfig = {
          googleLoginEnabled: googleEnabled,
          googleClientId,
          appleLoginEnabled: Boolean(authData.apple_login_enabled),
          appleClientId: authData.apple_client_id || null,
          otpLoginEnabled: Boolean(authData.otp_login_enabled),
          emailPasswordLoginEnabled: typeof authData.email_password_login_enabled === "boolean"
            ? authData.email_password_login_enabled
            : true,
          emailOtpLoginEnabled: typeof authData.email_otp_login_enabled === "boolean"
            ? authData.email_otp_login_enabled
            : true,
        };

        const checkoutConfig = {
          wobcartCheckoutEnabled: Boolean(modules.wobcart_checkout && (checkoutData.enabled ?? true)),
          expressCheckoutEnabled: Boolean(checkoutData.express_checkout_enabled ?? true),
          codEnabled: Boolean(settings.cod ?? checkoutData.cod_enabled ?? true),
          razorpayEnabled: Boolean(settings.razorpay ?? checkoutData.razorpay_key),
          razorpayKey: checkoutData.razorpay_key || null,
          stripeEnabled: Boolean(settings.stripe),
          gstEnabled: Boolean(settings.gst_enabled ?? checkoutData.gst_enabled),
          gstTaxLabel: settings.gst_tax_label || checkoutData.gst_tax_label || "GST",
        };

        const resolvedConfig = {
          modules,
          modulesVersion: Number(featuresData.modules_version || 0),
          homeCollections: typeof featuresData.home_collections === "boolean" ? featuresData.home_collections : true,
          branding: {
            companyName,
            logoUrl,
            faviconUrl,
            website,
          },
          contact: {
            email: sanitizePublicValue(contactDetails.email),
            phone: sanitizePublicValue(contactDetails.phone),
            whatsapp: sanitizePublicValue(contactDetails.whatsapp),
            address: sanitizePublicValue(contactDetails.address),
          },
          social: {
            facebook: sanitizePublicValue(socialMedia.facebook),
            instagram: sanitizePublicValue(socialMedia.instagram),
            linkedin: sanitizePublicValue(socialMedia.linkedin),
            twitter: sanitizePublicValue(socialMedia.twitter),
            whatsapp: sanitizePublicValue(socialMedia.whatsapp),
          },
          whatsappWidget,
          auth: authConfig,
          checkout: checkoutConfig,
        };

        cacheTimestamp = Date.now();
        cachedStoreConfig = resolvedConfig;
        return resolvedConfig;
      } catch (err) {
        console.error("Error loading store config:", err);
        return cachedStoreConfig || DEFAULT_CONFIG;
      } finally {
        inflightPromise = null;
      }
    })();

    return inflightPromise;
  },

  getCachedConfig: () => cachedStoreConfig || DEFAULT_CONFIG,
};
