(function () {
  "use strict";

  var script = document.currentScript;

  function getScriptEl() {
    if (script) return script;
    return document.getElementById("wobcart-checkout-script");
  }

  function configUrlFromScript() {
    var el = getScriptEl();
    if (el && el.getAttribute("data-api")) return el.getAttribute("data-api");
    if (el && el.src) return el.src.replace(/wobcart-checkout\.js.*$/, "api/v1/customer/wobcart-checkout/config");
    return "api/v1/customer/wobcart-checkout/config";
  }

  var configUrl = configUrlFromScript();
  var apiRoot = (getScriptEl() && getScriptEl().getAttribute("data-api-root")) || "";
  var couponsUrl = apiRoot ? apiRoot.replace(/\/$/, "") + "/api/v1/customer/coupons" : "";

  var state = {
    config: null,
    items: [],
    token: null,
    logId: null,
    phone: null,
    email: null,
    summary: null,
    user: null,
    savedAddresses: [],
    selectedAddressUuid: null,
    showNewAddress: false,
    statesList: [],
    countriesList: [],
    address: {},
    couponCode: "",
    availableCoupons: [],
    loadingCoupons: false,
    paymentMethod: "razorpay",
    mode: "full",
    expressProfile: null,
    summaryTimer: null,
    summaryRequestId: 0,
    guestMode: false,
    guestHasAccount: false,
    saveGuestAddress: false,
    identifyResult: null,
    authMethod: "otp",
    contactStep: "idle",
    paymentFlow: "idle",
    verifyInBackground: false,
  };

  function canShowCheckoutDetails() {
    return !!state.token || state.guestMode;
  }

  function hostKey() {
    return window.location.hostname || "default";
  }

  function cartStorageKey() {
    return "wobcart_cart_" + hostKey();
  }

  function tokenStorageKey() {
    return "wobcart_checkout_token_" + hostKey();
  }

  function contactStorageKey() {
    return "wobcart_contact_" + hostKey();
  }

  function pendingVerifyStorageKey() {
    return "wobcart_pending_payment_verify_" + hostKey();
  }

  function savePendingVerify(pending) {
    try {
      sessionStorage.setItem(pendingVerifyStorageKey(), JSON.stringify(pending));
    } catch (e) {}
  }

  function clearPendingVerify() {
    try {
      sessionStorage.removeItem(pendingVerifyStorageKey());
    } catch (e) {}
  }

  function loadPendingVerify() {
    try {
      var raw = sessionStorage.getItem(pendingVerifyStorageKey());
      if (!raw) return null;
      var pending = JSON.parse(raw);
      if (!pending || !pending.ts || Date.now() - pending.ts > 30 * 60 * 1000) {
        clearPendingVerify();
        return null;
      }
      return pending;
    } catch (e) {
      return null;
    }
  }

  function showCheckoutToast(message, type) {
    type = type || "success";
    var colors = { success: "#111827", error: "#dc2626", info: "#2563eb" };
    var toast = document.createElement("div");
    toast.className = "wc-payment-toast";
    toast.textContent = message;
    toast.style.cssText =
      "position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:100001;" +
      "padding:14px 20px;border-radius:10px;background:" +
      (colors[type] || colors.success) +
      ";color:#fff;font-size:14px;font-weight:500;box-shadow:0 10px 25px rgba(0,0,0,.2);max-width:90vw;text-align:center";
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.remove();
    }, 5000);
  }

  function dispatchOrderPlaced(orderUuid) {
    try {
      window.dispatchEvent(
        new CustomEvent("wobcart:order-placed", { detail: { order_uuid: orderUuid || null } })
      );
    } catch (e) {}
  }

  function closeModalOnly() {
    var el = document.getElementById("wobcart-checkout-overlay");
    if (el) el.remove();
  }

  function closeModal() {
    if (state.paymentFlow === "verifying") {
      state.verifyInBackground = true;
      closeModalOnly();
      showCheckoutToast("Confirming your payment in the background…", "info");
      return;
    }
    closeModalOnly();
  }

  function completeOrderSuccess(orderUuid, background) {
    state.paymentFlow = "success";
    clearPendingVerify();
    WobcartCart.clear();
    saveToken(null);
    state.verifyInBackground = false;
    dispatchOrderPlaced(orderUuid);
    if (background) {
      showCheckoutToast(
        orderUuid ? "Payment confirmed! Order " + orderUuid : "Payment confirmed!",
        "success"
      );
      closeModalOnly();
      return;
    }
    stepSuccess(orderUuid);
  }

  function showPaymentVerifyFailed(err, background) {
    state.paymentFlow = "failed";
    clearPendingVerify();
    var msg = (err && err.message) || "Unable to verify payment";
    if (background) {
      showCheckoutToast(msg, "error");
      closeModalOnly();
      return;
    }
    renderShell(
      "Payment verification failed",
      errHtml(msg) +
        '<button class="wc-btn wc-btn-secondary" id="wc-retry-checkout">Try again</button>' +
        '<button class="wc-btn" id="wc-done" style="margin-top:10px">Close</button>',
      true
    );
    document.getElementById("wc-retry-checkout").onclick = function () {
      state.paymentFlow = "idle";
      renderFullCheckout();
    };
    document.getElementById("wc-done").onclick = closeModal;
  }

  function verifyRazorpayPayment(pending, options) {
    options = options || {};
    var background = options.background || state.verifyInBackground;
    state.paymentFlow = "verifying";
    if (!background) showPaymentVerifying();

    return request(pending.verifyPath, {
      method: "POST",
      authToken: pending.isGuestPayment ? null : pending.authToken,
      body: pending.verifyBody,
    })
      .then(function (data) {
        var orderUuid = (data && data.order_uuid) || (pending.result && pending.result.order_uuid);
        if (!orderUuid) throw new Error("Payment verified but order reference missing");
        completeOrderSuccess(orderUuid, background);
      })
      .catch(function (e) {
        showPaymentVerifyFailed(e, background);
      })
      .finally(function () {
        var btn = document.getElementById("wc-place-order") || document.getElementById("wc-express-pay");
        if (btn) btn.disabled = false;
      });
  }

  function cancelPendingRazorpayPayment(result, checkoutToken, isGuestPayment) {
    var cancelPath = isGuestPayment ? "/guest/razorpay/cancel" : "/razorpay/cancel";
    var cancelBody = { transaction_uuid: result.transaction_uuid };
    if (isGuestPayment && checkoutToken) {
      cancelBody.checkout_token = checkoutToken;
    }
    return request(cancelPath, {
      method: "POST",
      authToken: isGuestPayment ? null : checkoutToken,
      body: cancelBody,
    }).catch(function () {});
  }

  function resumePendingVerification() {
    var pending = loadPendingVerify();
    if (!pending) return;
    state.verifyInBackground = true;
    showCheckoutToast("Resuming payment confirmation…", "info");
    verifyRazorpayPayment(pending, { background: true });
  }

  function apiBase() {
    return configUrl.replace(/\/config\/?$/, "");
  }

  function getCouponsApiUrl() {
    if (couponsUrl) return couponsUrl;
    var el = getScriptEl();
    var root = (el && el.getAttribute("data-api-root")) || "";
    if (root) return root.replace(/\/$/, "") + "/api/v1/customer/coupons";
    return apiBase().replace(/\/wobcart-checkout\/?$/, "") + "/coupons";
  }

  function fetchAvailableCoupons() {
    state.loadingCoupons = true;
    var url = getCouponsApiUrl() + "?per_page=15";
    return fetch(url, {
      headers: { Accept: "application/json" },
    })
      .then(function (r) {
        if (!r.ok) return null;
        return r.json();
      })
      .then(function (json) {
        if (!json) return [];
        var list = (json.data && Array.isArray(json.data)) ? json.data : (Array.isArray(json) ? json : []);
        state.availableCoupons = list;
        return list;
      })
      .catch(function () {
        state.availableCoupons = [];
        return [];
      })
      .finally(function () {
        state.loadingCoupons = false;
        updateAvailableCouponsUi();
      });
  }

  function updateAvailableCouponsUi() {
    var appliedBox = document.getElementById("wc-applied-coupon-box");
    var listContainer = document.getElementById("wc-available-coupons-box");
    var summary = state.summary;
    var appliedDiscount = (summary && summary.discount_breakdown && Number(summary.discount_breakdown.coupon)) || 0;
    var activeCode = (state.couponCode || "").trim().toUpperCase();

    if (appliedBox) {
      if (activeCode && appliedDiscount > 0) {
        appliedBox.innerHTML =
          '<div class="wc-applied-coupon-banner">' +
            '<div class="wc-applied-coupon-info">' +
              '<div class="wc-applied-coupon-title">✓ Coupon applied: <strong>' + esc(activeCode) + '</strong></div>' +
              '<div class="wc-applied-coupon-saving">You save ' + money(appliedDiscount) + ' with this coupon</div>' +
            '</div>' +
            '<button type="button" class="wc-remove-coupon-btn" id="wc-remove-coupon">Remove</button>' +
          '</div>';

        var removeBtn = document.getElementById("wc-remove-coupon");
        if (removeBtn) {
          removeBtn.onclick = function (e) {
            e.preventDefault();
            e.stopPropagation();
            setCouponError("");
            state.couponCode = "";
            var input = document.getElementById("wc-coupon");
            if (input) input.value = "";
            scheduleLiveSummary();
          };
        }
      } else {
        appliedBox.innerHTML = "";
      }
    }

    if (listContainer) {
      if (state.loadingCoupons) {
        listContainer.innerHTML = '<div class="wc-coupons-loading">Loading available offers…</div>';
        return;
      }

      var coupons = state.availableCoupons || [];
      if (!coupons.length) {
        listContainer.innerHTML = "";
        return;
      }

      var html = '<div class="wc-available-coupons-wrap">' +
        '<div class="wc-available-coupons-header">' +
          '<span>Available Offers (' + coupons.length + ')</span>' +
        '</div>' +
        '<div class="wc-available-coupons-list">';

      coupons.forEach(function (c) {
        var code = (c.code || "").toUpperCase();
        var isApplied = activeCode === code;
        var discountVal = Number(c.value) || 0;
        var discountTag = c.type === "percentage" ? (discountVal + "% OFF") : (money(discountVal) + " OFF");
        var minOrder = Number(c.min_order_amount) || 0;
        var termsText = c.description || (minOrder > 0 ? "On orders above " + money(minOrder) : "Applicable on all orders");

        html +=
          '<div class="wc-coupon-card' + (isApplied ? ' wc-coupon-card--active' : '') + '" data-coupon-code="' + esc(code) + '">' +
            '<div class="wc-coupon-card-left">' +
              '<div class="wc-coupon-card-badge-row">' +
                '<span class="wc-coupon-code-pill">' + esc(code) + '</span>' +
                '<span class="wc-coupon-discount-tag">' + esc(discountTag) + '</span>' +
              '</div>' +
              '<div class="wc-coupon-card-desc">' + esc(termsText) + '</div>' +
            '</div>' +
            '<button type="button" class="wc-coupon-apply-action">' + (isApplied ? '✓ Applied' : 'Apply') + '</button>' +
          '</div>';
      });

      html += '</div></div>';
      listContainer.innerHTML = html;

      listContainer.querySelectorAll(".wc-coupon-card[data-coupon-code]").forEach(function (card) {
        card.onclick = function () {
          var code = card.getAttribute("data-coupon-code");
          if (!code) return;
          setCouponError("");
          if (activeCode === code) {
            state.couponCode = "";
            var input = document.getElementById("wc-coupon");
            if (input) input.value = "";
          } else {
            state.couponCode = code;
            var input = document.getElementById("wc-coupon");
            if (input) input.value = code;
          }
          scheduleLiveSummary();
        };
      });
    }
  }

  function assetBase() {
    var el = getScriptEl();
    if (el && el.src) {
      return el.src.replace(/wobcart-checkout\.js.*$/, "");
    }
    return "https://www.wobcart.com/assets/images/logo/";
  }

  function wobcartLogoUrl() {
    var el = getScriptEl();
    var customLogo = el && el.getAttribute("data-powered-by-logo");
    if (customLogo) return customLogo;
    return "https://wobcart.s3.ap-south-1.amazonaws.com/wobcart-logo.png";
  }

  function poweredByHtml() {
    return (
      '<a class="wc-powered" href="https://www.wobcart.com" target="_blank" rel="noopener noreferrer" aria-label="Powered by Wobcart">' +
      '<span class="wc-powered-label">Powered by</span>' +
      '<img class="wc-powered-logo" src="' +
      wobcartLogoUrl() +
      '" alt="Wobcart" />' +
      "</a>"
    );
  }

  function loadCart() {
    try {
      var raw = localStorage.getItem(cartStorageKey());
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(items) {
    try {
      localStorage.setItem(cartStorageKey(), JSON.stringify(items || []));
      window.dispatchEvent(
        new CustomEvent("wobcart:cart-updated", { detail: { items: items || [] } })
      );
    } catch (e) {}
    updateCartBadges();
  }

  function authStorageKey() {
    var el = getScriptEl();
    return (el && el.getAttribute("data-auth-storage-key")) || "access_token";
  }

  function loadStorefrontToken() {
    try {
      return localStorage.getItem(authStorageKey()) || "";
    } catch (e) {
      return "";
    }
  }

  function loadToken() {
    try {
      return sessionStorage.getItem(tokenStorageKey());
    } catch (e) {
      return null;
    }
  }

  function resolveAuthToken() {
    var sessionToken = loadToken();
    if (sessionToken) return sessionToken;
    var el = getScriptEl();
    var inlineToken = el && el.getAttribute("data-auth-token");
    if (inlineToken) return inlineToken;
    return loadStorefrontToken() || null;
  }

  function bootstrapAuthToken() {
    var token = resolveAuthToken();
    if (token) saveToken(token);
    else {
      state.token = null;
      saveToken(null);
    }
    return state.token;
  }

  function saveToken(token) {
    state.token = token;
    try {
      if (token) sessionStorage.setItem(tokenStorageKey(), token);
      else sessionStorage.removeItem(tokenStorageKey());
    } catch (e) {}
  }

  function saveContact(contact) {
    try {
      if (contact) localStorage.setItem(contactStorageKey(), contact);
    } catch (e) {}
  }

  function loadContact() {
    try {
      return localStorage.getItem(contactStorageKey()) || "";
    } catch (e) {
      return "";
    }
  }

  function request(path, options) {
    options = options || {};
    var headers = Object.assign(
      { "Content-Type": "application/json", Accept: "application/json" },
      options.headers || {}
    );
    var authToken = options.authToken !== undefined ? options.authToken : state.token;
    if (authToken) headers.Authorization = "Bearer " + authToken;

    return fetch(apiBase() + path, {
      method: options.method || "GET",
      headers: headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    })
      .catch(function (err) {
        throw new Error((err && err.message) || "Network error");
      })
      .then(function (res) {
        return res.json().then(function (json) {
          if (!res.ok) {
            var msg = (json && (json.message || json.error)) || "Request failed";
            throw new Error(msg);
          }
          return json.data !== undefined ? json.data : json;
        });
      });
  }

  function resolveGatewayKey(result) {
    return (
      (result && result.gateway_key) ||
      (state.config && state.config.razorpay_key) ||
      null
    );
  }

  function shouldOpenRazorpay(result) {
    // Open Razorpay when backend returns gateway_order_id —
    // this also happens for COD+advance (deposit collected online).
    return Boolean(result && result.gateway_order_id && resolveGatewayKey(result));
  }

  function getCodMeta(summary) {
    if (!summary) return {};
    if (summary.cod && typeof summary.cod === "object") {
      return Object.assign({
        advance_enabled: Boolean(summary.cod.advance_enabled || summary.cod_advance_enabled),
        advance_payable_now: Number(summary.cod.advance_payable_now ?? summary.cod_advance_payable_now ?? 0),
        balance_due: Number(summary.cod.balance_due ?? summary.cod_balance_due ?? summary.total ?? 0),
        is_cod_fee_advance: Boolean(summary.cod.is_cod_fee_advance || summary.is_cod_fee_advance),
        advance_label: summary.cod.advance_label || summary.cod_advance_label || "Advance",
      }, summary.cod);
    }
    return {
      available: Boolean(summary.cod_available ?? true),
      advance_enabled: Boolean(summary.cod_advance_enabled),
      advance_type: summary.cod_advance_type || "fixed",
      advance_amount: Number(summary.cod_advance_amount || 0),
      advance_payable_now: Number(summary.cod_advance_payable_now || 0),
      balance_due: Number(summary.cod_balance_due || summary.total || 0),
      is_cod_fee_advance: Boolean(summary.is_cod_fee_advance),
      advance_label: summary.cod_advance_label || "Advance",
    };
  }

  function isCodAdvanceRequired(summary) {
    var cod = getCodMeta(summary);
    return Boolean(cod.advance_enabled && Number(cod.advance_payable_now) > 0);
  }

  function placeOrderButtonHtml(summary) {
    if (state.paymentMethod === "cod") {
      if (isCodAdvanceRequired(summary)) {
        var cod = getCodMeta(summary);
        var label = (cod && cod.is_cod_fee_advance) ? " COD Fee" : " Advance";
        return "Pay " + money(cod.advance_payable_now) + label;
      }
      return "Place COD Order";
    }
    var totalText = summary ? money(summary.total) : "—";
    return 'Pay <span id="wc-live-total">' + totalText + "</span>";
  }

  function placeOrderButtonText(summary) {
    if (state.paymentMethod === "cod") {
      if (isCodAdvanceRequired(summary)) {
        var cod = getCodMeta(summary);
        var label = (cod && cod.is_cod_fee_advance) ? " COD Fee" : " Advance";
        return "Pay " + money(cod.advance_payable_now) + label;
      }
      return "Place COD Order";
    }
    return "Pay " + (summary ? money(summary.total) : "—");
  }

  function syncPaymentMethodUi() {
    document.querySelectorAll(".wc-pay-opt").forEach(function (o) {
      o.classList.toggle("active", o.getAttribute("data-pay") === state.paymentMethod);
    });
  }

  function updateCodOptionCopy(summary) {
    var subtitleEl = document.getElementById("wc-cod-subtitle");
    var badgeEl = document.getElementById("wc-cod-badge");
    var noteEl = document.getElementById("wc-cod-advance-note");
    if (!subtitleEl && !badgeEl && !noteEl) return;

    if (isCodAdvanceRequired(summary)) {
      var cod = getCodMeta(summary);
      var advance = money(cod.advance_payable_now);
      var balance = money(cod.balance_due);
      var isFeeOnly = Boolean(cod.is_cod_fee_advance);

      if (subtitleEl) {
        subtitleEl.textContent = isFeeOnly
          ? "Pay " + advance + " COD fee online. Remaining " + balance + " on delivery."
          : "Pay " + advance + " advance online. Remaining " + balance + " on delivery.";
      }
      if (badgeEl) {
        badgeEl.style.display = "";
        badgeEl.textContent = isFeeOnly ? "COD Fee Online" : "Advance";
      }
      if (noteEl) {
        if (state.paymentMethod === "cod") {
          noteEl.style.display = "";
          var headerText = isFeeOnly ? "COD Fee required online:" : "Advance deposit required:";
          noteEl.innerHTML =
            "<strong>" + esc(headerText) + "</strong> " +
            esc(advance) +
            " to be paid now online.<br><span>Remaining " +
            esc(balance) +
            " to be paid on delivery.</span>";
        } else {
          noteEl.style.display = "none";
          noteEl.innerHTML = "";
        }
      }
    } else {
      if (subtitleEl) subtitleEl.textContent = "Pay when your order arrives";
      if (badgeEl) badgeEl.style.display = "none";
      if (noteEl) {
        noteEl.style.display = "none";
        noteEl.innerHTML = "";
      }
    }
  }

  function updatePlaceOrderButton(summary) {
    var placeOrderBtn = document.getElementById("wc-place-order");
    if (placeOrderBtn) placeOrderBtn.innerHTML = placeOrderButtonHtml(summary);
    var expressPayBtn = document.getElementById("wc-express-pay");
    if (expressPayBtn) expressPayBtn.textContent = placeOrderButtonText(summary);
  }

  function money(n) {
    var c = (state.config && state.config.currency) || "INR";
    var sym = c === "INR" ? "₹" : c + " ";
    return sym + Number(n || 0).toFixed(2);
  }

  function updateCartBadges() {
    var count = WobcartCart.count();
    document.querySelectorAll("[data-cart-badge]").forEach(function (el) {
      el.textContent = count > 0 ? String(count) : "";
      el.style.display = count > 0 ? "" : "none";
    });
  }

  function renderHeader(title) {
    var name = title || (state.config && state.config.company_name) || "Checkout";
    var logo = state.config && state.config.logo_url;
    var brandHtml = logo
      ? '<div class="wc-header-brand"><img class="wc-store-logo" src="' +
        logo +
        '" alt=""><span class="wc-header-title">' +
        name +
        "</span></div>"
      : "<h2>" + name + "</h2>";
    return (
      '<div class="wc-header">' +
      brandHtml +
      '<button type="button" class="wc-close" id="wc-close" aria-label="Close checkout">&times;</button></div>'
    );
  }

  function esc(s) {
    if (s == null) return "";
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function customerLocationsUrl(path) {
    var base = configUrl.replace(/\/customer\/wobcart-checkout\/config\/?$/, "");
    return base + "/customer/locations/" + path;
  }

  function customerAuthUrl(path) {
    var base = configUrl.replace(/\/customer\/wobcart-checkout\/config\/?$/, "");
    return base + "/customer/auth/" + path;
  }

  function resolveGoogleClientId(auth) {
    if (auth && auth.google_client_id) return auth.google_client_id;
    var el = getScriptEl();
    return (el && el.getAttribute("data-google-client-id")) || "";
  }

  function isGoogleLoginEnabled(auth) {
    return !!(auth && auth.google_login_enabled && resolveGoogleClientId(auth));
  }

  function renderGoogleSignInSection(auth) {
    if (!isGoogleLoginEnabled(auth)) return "";
    return (
      '<div id="wc-google-signin-wrap">' +
      '<div id="wc-google-signin" class="wc-google-signin"></div>' +
      '<div class="wc-auth-divider"><span>or sign in with email</span></div></div>'
    );
  }

  function renderContactSection(auth) {
    var contactVal = loadContact();
    var contactStepHidden = state.contactStep === "auth" ? "none" : "";
    var authPanelHidden = state.contactStep === "auth" ? "" : "none";
    var guestPromptHidden = state.contactStep === "auth" ? "none" : "";

    return (
      '<div class="wc-checkout-card" id="wc-contact-card">' +
      '<h3 class="wc-card-title">Login</h3>' +
      '<div id="wc-contact-step" style="display:' +
      contactStepHidden +
      '">' +
      renderGoogleSignInSection(auth) +
      '<div class="wc-field"><label>Email address <span class="wc-required">*</span></label><input id="wc-contact" type="email" inputmode="email" autocomplete="email" placeholder="Email address" value="' +
      esc(contactVal) +
      '"></div>' +
      '<p class="wc-field-note">You can also use your mobile number if you signed up with phone.</p>' +
      '<button type="button" class="wc-btn" id="wc-contact-continue">Continue</button>' +
      "</div>" +
      '<div id="wc-auth-panel" style="display:' +
      authPanelHidden +
      '"></div>' +
      (state.config && state.config.guest_checkout_enabled !== false
        ? '<div class="wc-guest-wrap" id="wc-guest-prompt" style="display:' +
          guestPromptHidden +
          '"><p class="wc-guest-divider">Or</p>' +
          '<button type="button" class="wc-btn wc-btn-guest" id="wc-guest-checkout">Checkout without login</button></div>'
        : "") +
      "</div>"
    );
  }

  function showContactAuthStep() {
    state.contactStep = "auth";
    var step = document.getElementById("wc-contact-step");
    var panel = document.getElementById("wc-auth-panel");
    var prompt = document.getElementById("wc-guest-prompt");
    var locked = document.getElementById("wc-checkout-locked");
    if (step) step.style.display = "none";
    if (panel) panel.style.display = "";
    if (prompt) prompt.style.display = "none";
    if (locked) locked.style.display = "";
  }

  function showContactIdleStep() {
    state.contactStep = "idle";
    var step = document.getElementById("wc-contact-step");
    var panel = document.getElementById("wc-auth-panel");
    var prompt = document.getElementById("wc-guest-prompt");
    var locked = document.getElementById("wc-checkout-locked");
    if (step) step.style.display = "";
    if (panel) {
      panel.style.display = "none";
      panel.innerHTML = "";
    }
    if (prompt) prompt.style.display = "";
    if (locked) locked.style.display = "none";
  }

  function loadGoogleScript() {
    return new Promise(function (resolve, reject) {
      if (window.google && window.google.accounts) {
        resolve();
        return;
      }
      var existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existing) {
        var attempts = 0;
        var timer = setInterval(function () {
          if (window.google && window.google.accounts) {
            clearInterval(timer);
            resolve();
          } else if (++attempts > 50) {
            clearInterval(timer);
            reject(new Error("Google Sign-In failed to load"));
          }
        }, 100);
        return;
      }
      var gsi = document.createElement("script");
      gsi.src = "https://accounts.google.com/gsi/client";
      gsi.async = true;
      gsi.defer = true;
      gsi.onload = function () {
        resolve();
      };
      gsi.onerror = function () {
        reject(new Error("Google Sign-In failed to load"));
      };
      document.head.appendChild(gsi);
    });
  }

  function initGoogleSignIn(auth) {
    if (state.token || !isGoogleLoginEnabled(auth)) return;
    var container = document.getElementById("wc-google-signin");
    if (!container) return;
    container.innerHTML = "";
    var clientId = resolveGoogleClientId(auth);
    loadGoogleScript()
      .then(function () {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleGoogleSignIn,
        });
        window.google.accounts.id.renderButton(container, {
          theme: "outline",
          size: "large",
          width: Math.max(container.offsetWidth || 0, 280),
          text: "continue_with",
          shape: "rectangular",
        });
      })
      .catch(function () {});
  }

  function handleGoogleSignIn(response) {
    if (!response || !response.credential) {
      showError("Google sign-in failed. Please try again.");
      return;
    }
    fetch(customerAuthUrl("google-sign-in"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ id_token: response.credential }),
    })
      .then(function (res) {
        return res.json().then(function (json) {
          if (!res.ok) {
            var msg = (json && (json.message || json.error)) || "Google sign-in failed";
            throw new Error(msg);
          }
          return json.data !== undefined ? json.data : json;
        });
      })
      .then(function (data) {
        if (!data.access_token) throw new Error("Google sign-in failed");
        saveToken(data.access_token);
        try {
          localStorage.setItem(authStorageKey(), data.access_token);
        } catch (e) {}
        state.user = data.user;
        return request("/express-profile");
      })
      .then(function (profile) {
        onAuthSuccess({
          token: state.token,
          user: profile.user || state.user,
          saved_addresses: profile.saved_addresses || [],
        });
      })
      .catch(function (e) {
        showError(e.message);
      });
  }

  function ensureCountriesLoaded() {
    if (state.countriesList.length) return Promise.resolve(state.countriesList);
    return fetch(customerLocationsUrl("countries"), {
      headers: { Accept: "application/json" },
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (json) {
        var list = json.data !== undefined ? json.data : json;
        state.countriesList = Array.isArray(list) ? list : [];
        return state.countriesList;
      })
      .catch(function () {
        state.countriesList = [];
        return [];
      });
  }

  function defaultCountry() {
    if (!state.countriesList.length) return null;
    var india = state.countriesList.find(function (c) {
      return c.code === "IN";
    });
    return india || state.countriesList[0];
  }

  function ensureDefaultCountry() {
    if (state.address.country_id) {
      var exists = state.countriesList.some(function (c) {
        return String(c.id) === String(state.address.country_id);
      });
      if (exists) return;
    }
    var fallback = defaultCountry();
    if (!fallback) return;
    state.address.country_id = fallback.id;
    state.address.country_code = fallback.code;
    state.address.country = fallback.name;
  }

  function defaultStateForCountry(countryId) {
    if (!countryId || !state.statesList.length) return null;
    var india = defaultCountry();
    if (!india || String(countryId) !== String(india.id)) return null;
    return (
      state.statesList.find(function (st) {
        return String(st.name || "").toLowerCase() === "kerala";
      }) || null
    );
  }

  function ensureDefaultState() {
    if (!state.statesList.length) return;
    if (state.address.state_id) {
      var exists = state.statesList.some(function (st) {
        return String(st.id) === String(state.address.state_id);
      });
      if (exists) return;
      state.address.state_id = null;
      state.address.state = "";
    }
    var fallback = defaultStateForCountry(
      state.address.country_id || (defaultCountry() && defaultCountry().id)
    );
    if (!fallback) return;
    state.address.state_id = fallback.id;
    state.address.state = fallback.name;
  }

  function isStateRequired() {
    return state.statesList.length > 0;
  }

  function hasValidState(address) {
    address = address || buildAddressPayload();
    return !isStateRequired() || !!address.state_id;
  }

  function updateCheckoutActions() {
    var address = buildAddressPayload();
    var stateMissing = isStateRequired() && !address.state_id;
    var shippingBlocked = state.summary && state.summary.shipping_available === false;
    var btn = document.getElementById("wc-place-order");
    if (btn) btn.disabled = stateMissing || shippingBlocked;
    var stateWrap = document.querySelector('[data-searchable="wc-addr-state"]');
    if (stateWrap) stateWrap.classList.toggle("wc-field--error", stateMissing);
  }

  function ensureStatesLoaded() {
    ensureDefaultCountry();
    var countryId = (state.address && state.address.country_id) || (defaultCountry() && defaultCountry().id);
    if (!countryId) return Promise.resolve([]);
    return fetch(customerLocationsUrl(countryId + "/states"), {
      headers: { Accept: "application/json" },
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (json) {
        var list = json.data !== undefined ? json.data : json;
        state.statesList = Array.isArray(list) ? list : [];
        return state.statesList;
      })
      .catch(function () {
        state.statesList = [];
        return [];
      });
  }

  function formatAddressLine(addr) {
    var parts = [addr.address_line1];
    if (addr.address_line2) parts.push(addr.address_line2);
    parts.push(addr.city);
    if (addr.state) parts.push(addr.state);
    if (addr.postal_code) parts.push(addr.postal_code);
    return parts.filter(Boolean).join(", ");
  }

  function applySavedAddress(addr) {
    if (!addr) return;
    state.selectedAddressUuid = addr.uuid;
    state.showNewAddress = false;
    state.address = {
      name: addr.full_name,
      phone: addr.phone,
      email: addr.email,
      address_line1: addr.address_line1,
      address_line2: addr.address_line2,
      city: addr.city,
      state: addr.state,
      state_id: addr.state_id,
      postal_code: addr.postal_code,
      country_code: addr.country_code || "IN",
      country_id: addr.country_id,
      country: addr.country,
    };
  }

  function syncAddressFromForm() {
    var nameEl = document.getElementById("wc-addr-name");
    var phoneEl = document.getElementById("wc-addr-phone");
    var emailEl = document.getElementById("wc-addr-email");
    var pinEl = document.getElementById("wc-addr-pin");
    var line1El = document.getElementById("wc-addr-line1");
    var line2El = document.getElementById("wc-addr-line2");
    var cityEl = document.getElementById("wc-addr-city");
    var stateEl = document.getElementById("wc-addr-state");
    var countryEl = document.getElementById("wc-addr-country");

    if (nameEl) state.address.name = nameEl.value.trim();
    if (phoneEl) state.address.phone = phoneEl.value.trim();
    if (emailEl) state.address.email = emailEl.value.trim();
    if (pinEl) state.address.postal_code = pinEl.value.trim();
    if (line1El) state.address.address_line1 = line1El.value.trim();
    if (line2El) state.address.address_line2 = line2El.value.trim();
    if (cityEl) state.address.city = cityEl.value.trim();

    if (stateEl) {
      state.address.state_id = stateEl.value ? parseInt(stateEl.value, 10) : null;
      state.address.state = stateEl.getAttribute("data-label") || "";
    }
    if (countryEl) {
      state.address.country_id = countryEl.value ? parseInt(countryEl.value, 10) : null;
      state.address.country_code = countryEl.getAttribute("data-code") || "IN";
      state.address.country = countryEl.getAttribute("data-label") || "";
    }

    scheduleLiveSummary();
  }

  function defaultSavedAddress() {
    if (!state.savedAddresses.length) return null;
    return (
      state.savedAddresses.find(function (a) {
        return a.is_default;
      }) || state.savedAddresses[0]
    );
  }

  function ensureSavedAddressSelection() {
    if (!state.savedAddresses.length) {
      state.showNewAddress = true;
      return;
    }
    if (state.showNewAddress) return;
    if (!state.selectedAddressUuid) {
      applySavedAddress(defaultSavedAddress());
      return;
    }
    var stillExists = state.savedAddresses.some(function (a) {
      return a.uuid === state.selectedAddressUuid;
    });
    if (!stillExists) applySavedAddress(defaultSavedAddress());
  }

  function renderSearchableSelect(cfg) {
    var selected = null;
    cfg.options.forEach(function (o) {
      if (String(o.id) === String(cfg.value)) selected = o;
    });
    var displayLabel = selected ? selected.name : cfg.placeholder;
    var optionsHtml = "";
    if (cfg.options.length) {
      optionsHtml = cfg.options
        .map(function (o) {
          var active = String(o.id) === String(cfg.value) ? " wc-searchable-option--active" : "";
          var extra = o.code ? ' data-code="' + esc(o.code) + '"' : "";
          return (
            '<button type="button" class="wc-searchable-option' +
            active +
            '" data-value="' +
            o.id +
            '" data-label="' +
            esc(o.name) +
            '"' +
            extra +
            ">" +
            esc(o.name) +
            "</button>"
          );
        })
        .join("");
    } else {
      optionsHtml = '<div class="wc-searchable-empty">No options available</div>';
    }
    return (
      '<div class="wc-field wc-searchable" data-searchable="' +
      cfg.id +
      '">' +
      "<label>" +
      esc(cfg.label) +
      (cfg.required ? ' <span class="wc-required">*</span>' : "") +
      "</label>" +
      '<input type="hidden" id="' +
      cfg.id +
      '" value="' +
      esc(cfg.value || "") +
      '"' +
      (selected && selected.code ? ' data-code="' + esc(selected.code) + '"' : "") +
      ' data-label="' +
      esc(selected ? selected.name : "") +
      '">' +
      '<button type="button" class="wc-searchable-trigger" data-trigger="' +
      cfg.id +
      '" data-placeholder="' +
      esc(cfg.placeholder) +
      '">' +
      '<span class="wc-searchable-value' +
      (selected ? "" : " wc-searchable-placeholder") +
      '">' +
      esc(displayLabel) +
      '</span><span class="wc-searchable-chevron" aria-hidden="true"></span></button>' +
      '<div class="wc-searchable-panel" data-panel="' +
      cfg.id +
      '" style="display:none">' +
      '<input type="text" class="wc-searchable-search" placeholder="Search..." data-search="' +
      cfg.id +
      '">' +
      '<div class="wc-searchable-options" data-options="' +
      cfg.id +
      '">' +
      optionsHtml +
      "</div></div></div>"
    );
  }

  function renderCountrySelect() {
    return renderSearchableSelect({
      id: "wc-addr-country",
      label: "Country",
      placeholder: "Select country",
      value: state.address.country_id || "",
      options: state.countriesList,
    });
  }

  function renderStateSelect() {
    var stateField =
      state.statesList.length > 0
        ? renderSearchableSelect({
            id: "wc-addr-state",
            label: "State",
            placeholder: "Select state",
            value: state.address.state_id || "",
            options: state.statesList,
            required: true,
          })
        : '<div class="wc-field"><label>State <span class="wc-required">*</span></label><p class="wc-field-note">Select a country to load states.</p></div>';
    return '<div id="wc-addr-state-wrap">' + stateField + "</div>";
  }

  function renderSavedAddressSection() {
    if (!state.token || !state.savedAddresses.length) return "";
    var cards = state.savedAddresses
      .map(function (a) {
        var active =
          state.selectedAddressUuid === a.uuid && !state.showNewAddress ? " wc-address-card--active" : "";
        var typeLabel = a.address_type
          ? a.address_type.charAt(0).toUpperCase() + a.address_type.slice(1)
          : "Home";
        return (
          '<button type="button" class="wc-address-card' +
          active +
          '" data-addr="' +
          a.uuid +
          '">' +
          '<div class="wc-address-card-top">' +
          "<strong>" +
          esc(a.full_name) +
          "</strong>" +
          (a.is_default ? '<span class="wc-badge">Default</span>' : "") +
          '<span class="wc-address-type">' +
          esc(typeLabel) +
          "</span>" +
          "</div>" +
          '<p class="wc-address-card-lines">' +
          esc(formatAddressLine(a)) +
          "</p>" +
          (a.phone ? '<p class="wc-address-card-phone">' + esc(a.phone) + "</p>" : "") +
          "</button>"
        );
      })
      .join("");
    var newActive = state.showNewAddress ? " wc-address-card--active" : "";
    return (
      '<div class="wc-address-list">' +
      cards +
      '<button type="button" class="wc-address-card wc-address-card--new' +
      newActive +
      '" id="wc-new-address-btn">' +
      '<span class="wc-address-new-icon">+</span> Add new address</button></div>'
    );
  }

  function renderAddressFormFields() {
    var showForm = !state.token || !state.savedAddresses.length || state.showNewAddress;
    if (!showForm) return "";
    var showEmail = state.guestMode;
    return (
      '<div id="wc-address-form">' +
      (showEmail
        ? '<div class="wc-field"><label>Email address <span class="wc-required">*</span></label><input id="wc-addr-email" type="email" placeholder="Email address" value="' +
          esc(state.address.email || state.email || "") +
          '"></div>' +
          '<p class="wc-guest-account-note" id="wc-guest-account-note" style="display:' +
          (state.guestHasAccount ? "" : "none") +
          '">We found an account for this email. Your order will be placed on that account.</p>'
        : "") +
      '<div class="wc-field"><label>Full name <span class="wc-required">*</span></label><input id="wc-addr-name" autocomplete="name" placeholder="Full name" value="' +
      esc(state.address.name || "") +
      '"></div>' +
      '<div class="wc-row"><div class="wc-field"><label>Phone <span class="wc-required">*</span></label><input id="wc-addr-phone" type="tel" inputmode="numeric" maxlength="10" autocomplete="tel" placeholder="10-digit mobile" value="' +
      esc(normalizePhoneDigits(state.address.phone || "")) +
      '"></div><div class="wc-field"><label>Pincode <span class="wc-required">*</span></label><input id="wc-addr-pin" autocomplete="postal-code" inputmode="numeric" placeholder="682001" maxlength="6" value="' +
      esc(state.address.postal_code || "") +
      '"></div></div>' +
      '<div class="wc-field"><label>Address line 1 <span class="wc-required">*</span></label><input id="wc-addr-line1" autocomplete="address-line1" placeholder="Flat, house no., building name" value="' +
      esc(state.address.address_line1 || "") +
      '"></div>' +
      '<div class="wc-field"><label>Address line 2</label><input id="wc-addr-line2" autocomplete="address-line2" placeholder="Street, area, landmark (optional)" value="' +
      esc(state.address.address_line2 || "") +
      '"></div>' +
      renderCountrySelect() +
      '<div class="wc-row"><div class="wc-field"><label>City <span class="wc-required">*</span></label><input id="wc-addr-city" autocomplete="address-level2" placeholder="City" value="' +
      esc(state.address.city || "") +
      '"></div>' +
      renderStateSelect() +
      "</div>" +
      (state.guestMode
        ? '<label class="wc-checkbox-row" id="wc-save-address-wrap" style="display:' +
          (state.guestHasAccount ? "" : "none") +
          '"><input type="checkbox" id="wc-save-address"' +
          (state.saveGuestAddress ? " checked" : "") +
          "> Save this address to my account</label>"
        : "") +
      "</div>"
    );
  }

  function updateSaveAddressCheckbox() {
    var wrap = document.getElementById("wc-save-address-wrap");
    var checkbox = document.getElementById("wc-save-address");
    var note = document.getElementById("wc-guest-account-note");
    if (wrap) wrap.style.display = state.guestMode && state.guestHasAccount ? "" : "none";
    if (checkbox) checkbox.checked = !!state.saveGuestAddress;
    if (note) note.style.display = state.guestMode && state.guestHasAccount ? "" : "none";
  }

  function checkGuestAccount() {
    if (!state.guestMode) return;
    var emailInput = document.getElementById("wc-addr-email");
    var email = emailInput ? emailInput.value.trim() : state.address.email || state.email || "";
    if (!email || email.indexOf("@") === -1) {
      state.guestHasAccount = false;
      state.saveGuestAddress = false;
      updateSaveAddressCheckbox();
      return;
    }
    request("/identify-contact", { method: "POST", body: { contact: email } })
      .then(function (data) {
        state.guestHasAccount = !!(data && data.exists);
        if (!state.guestHasAccount) state.saveGuestAddress = false;
        updateSaveAddressCheckbox();
      })
      .catch(function () {
        state.guestHasAccount = false;
        state.saveGuestAddress = false;
        updateSaveAddressCheckbox();
      });
  }

  var guestAccountTimer = null;
  function scheduleGuestAccountCheck() {
    if (!state.guestMode) return;
    if (guestAccountTimer) clearTimeout(guestAccountTimer);
    guestAccountTimer = setTimeout(checkGuestAccount, 400);
  }

  function ensureStyles() {
    if (document.getElementById("wobcart-checkout-styles-v10")) return;
    var style = document.createElement("style");
    style.id = "wobcart-checkout-styles-v10";
    style.textContent =
      "#wobcart-checkout-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);backdrop-filter:blur(4px);z-index:100000;display:flex;align-items:flex-end;justify-content:center;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;-webkit-font-smoothing:antialiased}" +
      "@media(min-width:768px){#wobcart-checkout-overlay{align-items:center;padding:24px}}" +
      "#wobcart-checkout-modal{background:#fff;width:100%;height:max-content;max-height:94vh;overflow:hidden;display:flex;flex-direction:column;border-radius:20px 20px 0 0;box-shadow:0 25px 50px -12px rgba(0,0,0,.28);margin:0}" +
      "@media(min-width:768px){#wobcart-checkout-modal{border-radius:20px;max-height:90vh}#wobcart-checkout-modal.wc-modal--checkout{max-width:920px}#wobcart-checkout-modal.wc-modal--compact{max-width:440px}}" +
      ".wc-header{padding:18px 22px;border-bottom:1px solid #eef0f3;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;background:#fff;position:sticky;top:0;z-index:3}" +
      ".wc-header h2,.wc-header-title{margin:0;font-size:18px;font-weight:600;color:#111827;letter-spacing:-.02em}" +
      ".wc-header-brand{display:flex;align-items:center;gap:10px;min-width:0}" +
      ".wc-store-logo{height:28px;width:auto;max-width:120px;object-fit:contain}" +
      ".wc-close{background:#f3f4f6;border:none;width:36px;height:36px;border-radius:10px;font-size:20px;line-height:1;cursor:pointer;color:#6b7280;display:flex;align-items:center;justify-content:center;transition:background .15s,color .15s}" +
      ".wc-close:hover{background:#e5e7eb;color:#111827}" +
      ".wc-body{padding:0;overflow-x:hidden;overflow-y:auto;flex:1 1 auto;min-height:0}" +
      ".wc-body--padded{padding:20px 22px 0}" +
      ".wc-layout{display:flex;flex-direction:column}" +
      "@media(min-width:768px){.wc-layout{display:grid;grid-template-columns:minmax(280px,360px) 1fr;align-items:start}}" +
      ".wc-order-panel{padding:20px 22px;background:linear-gradient(180deg,#f9fafb 0%,#f3f4f6 100%);border-bottom:1px solid #eef0f3}" +
      "@media(min-width:768px){.wc-order-panel{border-bottom:none;border-right:1px solid #eef0f3;padding:24px}}" +
      ".wc-form-panel{padding:20px 22px 0;background:#fff}" +
      "@media(min-width:768px){.wc-form-panel{padding:24px 24px 0}}" +
      ".wc-section-title{font-size:11px;font-weight:700;color:#6b7280;margin:0 0 12px;text-transform:uppercase;letter-spacing:.08em}" +
      ".wc-section-title--spaced{margin-top:20px}" +
      ".wc-items-card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:4px 12px;margin-bottom:16px;box-shadow:0 1px 2px rgba(0,0,0,.04)}" +
      ".wc-item{display:flex;gap:14px;padding:12px 0;border-bottom:1px solid #f0f1f3;align-items:flex-start}" +
      ".wc-item:last-child{border-bottom:none}" +
      ".wc-item img{width:64px;height:64px;object-fit:cover;border-radius:10px;background:#f3f4f6;border:1px solid #eee;flex-shrink:0}" +
      ".wc-item-info{flex:1;min-width:0;padding-top:2px}" +
      ".wc-item-name{font-size:14px;font-weight:600;color:#111827;margin:0 0 6px;line-height:1.35}" +
      ".wc-item-meta{font-size:13px;color:#6b7280;margin:0}" +
      ".wc-item-price{font-size:14px;font-weight:600;color:#111827;margin-top:4px}" +
      ".wc-qty{display:inline-flex;align-items:center;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-top:8px;background:#fff}" +
      ".wc-qty button{width:32px;height:32px;border:none;background:#fff;cursor:pointer;font-size:18px;color:#374151;transition:background .15s}" +
      ".wc-qty button:hover{background:#f9fafb}" +
      ".wc-qty span{min-width:32px;text-align:center;font-size:13px;font-weight:600;color:#111827}" +
      ".wc-field{margin-bottom:14px}" +
      ".wc-field label{display:block;font-size:12px;color:#374151;margin-bottom:6px;font-weight:600}" +
      "#wobcart-checkout-overlay .wc-field input,#wobcart-checkout-overlay .wc-field select,#wobcart-checkout-overlay .wc-field textarea{width:100%;box-sizing:border-box;padding:11px 13px;border:1px solid #d1d5db;border-radius:10px;font-size:14px;color:#111827 !important;background:#fff !important;transition:border-color .15s,box-shadow .15s;outline:none;text-transform:none;letter-spacing:normal;display:block}" +
      "#wobcart-checkout-overlay .wc-field input:focus,#wobcart-checkout-overlay .wc-field select:focus,#wobcart-checkout-overlay .wc-field textarea:focus{border-color:#111827;box-shadow:0 0 0 3px rgba(17,24,39,.08)}" +
      "#wobcart-checkout-overlay .wc-field input::placeholder{color:#9ca3af}" +
      ".wc-searchable{position:relative}" +
      ".wc-searchable-value{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      ".wc-searchable-placeholder{color:#9ca3af !important}" +
      ".wc-searchable-chevron{flex-shrink:0;pointer-events:none;color:#6b7280;font-size:14px;line-height:1}" +
      ".wc-searchable-chevron::before{content:'\\25BE';display:block}" +
      ".wc-searchable-panel{position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:30;background:#fff;border:1px solid #d1d5db;border-radius:10px;box-shadow:0 10px 25px rgba(0,0,0,.12);overflow:hidden}" +
      ".wc-searchable-search{width:100%;box-sizing:border-box;padding:10px 12px;border:none;border-bottom:1px solid #eef0f3;font-size:14px;color:#111827 !important;background:#fff !important;outline:none;display:block}" +
      ".wc-searchable-search::placeholder{color:#9ca3af}" +
      ".wc-searchable-options{max-height:220px;overflow-y:auto;padding:4px 0}" +
      ".wc-searchable-option{display:block;width:100%;padding:10px 12px;border:none;background:transparent;text-align:left;font-size:14px;color:#111827 !important;cursor:pointer;box-sizing:border-box}" +
      ".wc-searchable-option:hover{background:#f9fafb !important}" +
      ".wc-searchable-option--active{background:#f3f4f6 !important;font-weight:600}" +
      ".wc-searchable-empty,.wc-searchable-no-results{padding:12px;text-align:center;font-size:13px;color:#6b7280}" +
      ".wc-shipping-warn{background:#fef3c7;border:1px solid #f59e0b;border-radius:12px;padding:12px 14px;margin:0 0 16px;font-size:13px;color:#92400e}" +
      ".wc-shipping-warn strong{display:block;margin-bottom:4px;font-size:13px}" +
      ".wc-shipping-warn p{margin:0 0 6px;line-height:1.45}" +
      ".wc-shipping-countries{margin:0;font-size:12px}" +
      ".wc-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}" +
      "@media(max-width:480px){.wc-row{grid-template-columns:1fr}}" +
      ".wc-coupon-row{display:flex;gap:8px;align-items:stretch}" +
      ".wc-coupon-row input{flex:1}" +
      ".wc-coupon-error{margin-top:6px;padding:7px 11px;font-size:12px;color:#b91c1c;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;line-height:1.35;text-align:left}" +
      ".wc-applied-coupon-banner{display:flex;align-items:center;justify-content:space-between;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:10px 12px;margin-top:8px;font-size:13px;color:#065f46}" +
      ".wc-applied-coupon-info{display:flex;flex-direction:column;gap:2px}" +
      ".wc-applied-coupon-title{font-weight:600;color:#047857;display:flex;align-items:center;gap:6px}" +
      ".wc-applied-coupon-saving{font-size:12px;color:#059669}" +
      "#wobcart-checkout-overlay .wc-remove-coupon-btn{background:transparent !important;border:none !important;color:#dc2626 !important;font-size:12px !important;font-weight:600 !important;cursor:pointer !important;padding:4px 8px !important;text-decoration:underline !important;border-radius:4px}" +
      "#wobcart-checkout-overlay .wc-remove-coupon-btn:hover{background:#fee2e2 !important}" +
      ".wc-available-coupons-wrap{margin-top:12px}" +
      ".wc-available-coupons-header{display:flex;align-items:center;justify-content:space-between;font-size:11px;font-weight:700;color:#6b7280;margin-bottom:8px;text-transform:uppercase;letter-spacing:.05em}" +
      ".wc-available-coupons-list{display:flex;flex-direction:column;gap:8px;max-height:220px;overflow-y:auto;padding-right:2px}" +
      "#wobcart-checkout-overlay .wc-coupon-card{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border:1px dashed #d1d5db;border-radius:10px;background:#f9fafb;cursor:pointer;transition:all .15s ease;text-align:left;color:inherit}" +
      "#wobcart-checkout-overlay .wc-coupon-card:hover{border-color:#111827;background:#f3f4f6}" +
      "#wobcart-checkout-overlay .wc-coupon-card--active{border:1px solid #10b981;background:#f0fdf4 !important}" +
      ".wc-coupon-card-left{display:flex;flex-direction:column;gap:3px;flex:1;min-width:0}" +
      ".wc-coupon-card-badge-row{display:flex;align-items:center;gap:8px}" +
      ".wc-coupon-code-pill{display:inline-flex;align-items:center;background:#111827;color:#fff;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:11px;font-weight:700;padding:2px 8px;border-radius:6px;letter-spacing:.05em}" +
      ".wc-coupon-card--active .wc-coupon-code-pill{background:#059669}" +
      ".wc-coupon-discount-tag{font-size:12px;font-weight:700;color:#059669}" +
      ".wc-coupon-card-desc{font-size:11px;color:#6b7280;line-height:1.35;margin-top:2px}" +
      "#wobcart-checkout-overlay .wc-coupon-apply-action{font-size:12px;font-weight:600;color:#2563eb;padding:5px 12px;border-radius:6px;background:#eff6ff;border:1px solid #dbeafe;white-space:nowrap;flex-shrink:0;cursor:pointer}" +
      "#wobcart-checkout-overlay .wc-coupon-card:hover .wc-coupon-apply-action{background:#2563eb;color:#fff !important;border-color:#2563eb}" +
      "#wobcart-checkout-overlay .wc-coupon-card--active .wc-coupon-apply-action{background:#10b981;color:#fff !important;border-color:#10b981}" +
      ".wc-coupons-loading{font-size:12px;color:#6b7280;padding:8px 0;text-align:center}" +
      "#wobcart-checkout-overlay button{font:inherit;text-transform:none;letter-spacing:normal;border:none;appearance:none;-webkit-appearance:none}" +
      "#wobcart-checkout-overlay .wc-searchable-trigger{width:100%;box-sizing:border-box;padding:11px 36px 11px 13px;border:1px solid #d1d5db !important;border-radius:10px;font-size:14px;color:#111827 !important;background:#fff !important;text-align:left;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:8px;outline:none;transition:border-color .15s,box-shadow .15s}" +
      "#wobcart-checkout-overlay .wc-searchable-trigger:hover{border-color:#9ca3af !important}" +
      "#wobcart-checkout-overlay .wc-searchable-trigger--open{border-color:#111827 !important;box-shadow:0 0 0 3px rgba(17,24,39,.08)}" +
      "#wobcart-checkout-overlay .wc-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;width:100%;padding:14px 18px;border:none;border-radius:12px;background:#111827;color:#fff !important;font-size:15px;font-weight:600;cursor:pointer;transition:transform .1s,background .15s,opacity .15s;letter-spacing:-.01em}" +
      "#wobcart-checkout-overlay .wc-btn:hover:not(:disabled){background:#000 !important;color:#fff !important}" +
      "#wobcart-checkout-overlay .wc-btn:active:not(:disabled){transform:scale(.99);color:#fff !important}" +
      "#wobcart-checkout-overlay .wc-btn:disabled{opacity:.55;cursor:not-allowed;color:#fff !important}" +
      "#wobcart-checkout-overlay .wc-btn span,#wobcart-checkout-overlay .wc-btn:hover span{color:inherit !important}" +
      "#wobcart-checkout-overlay .wc-btn-secondary{background:#fff !important;color:#111827 !important;border:1px solid #e5e7eb;margin-top:10px;box-shadow:0 1px 2px rgba(0,0,0,.04)}" +
      "#wobcart-checkout-overlay .wc-btn-secondary:hover:not(:disabled){background:#f9fafb !important;color:#111827 !important;border-color:#d1d5db}" +
      "#wobcart-checkout-overlay .wc-btn-outline{background:#fff !important;color:#111827 !important;border:1px solid #d1d5db;width:auto;padding:11px 16px;font-size:13px;flex-shrink:0}" +
      "#wobcart-checkout-overlay .wc-btn-outline:hover:not(:disabled){background:#f9fafb !important;color:#111827 !important;border-color:#111827}" +
      "#wobcart-checkout-overlay .wc-btn-pay{font-size:16px;padding:15px 20px}" +
      ".wc-error{color:#dc2626;font-size:13px;margin:0 0 10px;padding:10px 12px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;line-height:1.4}" +
      ".wc-signed-in{display:flex;align-items:center;gap:8px;font-size:13px;color:#047857;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:10px 12px;margin-bottom:16px}" +
      ".wc-signed-in-dot{width:8px;height:8px;border-radius:50%;background:#10b981;flex-shrink:0}" +
      ".wc-summary-box{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:14px 16px;font-size:13px;box-shadow:0 1px 2px rgba(0,0,0,.04)}" +
      ".wc-summary-line{display:flex;justify-content:space-between;align-items:center;margin:5px 0;color:#4b5563;gap:12px}" +
      ".wc-summary-line span:last-child{color:#111827;font-weight:500}" +
      ".wc-summary-total{font-weight:700;font-size:16px;margin-top:10px;padding-top:12px;border-top:1px dashed #e5e7eb;color:#111827}" +
      ".wc-summary-total span:last-child{font-size:18px;font-weight:700}" +
      ".wc-chip{display:inline-block;padding:8px 12px;border:1px solid #e5e7eb;border-radius:999px;font-size:12px;font-weight:500;margin:0 8px 8px 0;cursor:pointer;background:#fff;color:#374151;transition:all .15s}" +
      ".wc-chip:hover{border-color:#9ca3af}" +
      ".wc-chip.active{background:#111827;color:#fff;border-color:#111827}" +
      ".wc-address-list{display:grid;gap:10px;margin-bottom:16px}" +
      "#wobcart-checkout-overlay .wc-address-card{display:block;width:100%;text-align:left;padding:14px 16px;border:2px solid #e5e7eb;border-radius:12px;background:#fff;cursor:pointer;transition:border-color .15s,box-shadow .15s;color:inherit}" +
      "#wobcart-checkout-overlay .wc-address-card:hover{border-color:#9ca3af;background:#fff !important;color:inherit !important}" +
      ".wc-address-card--active{border-color:#111827;box-shadow:0 0 0 1px #111827;background:#fafafa}" +
      ".wc-address-card-top{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:6px}" +
      ".wc-address-card-top strong{font-size:14px;color:#111827}" +
      ".wc-address-type{font-size:11px;color:#6b7280;text-transform:uppercase;letter-spacing:.04em;margin-left:auto}" +
      ".wc-address-card-lines{font-size:13px;color:#4b5563;margin:0 0 4px;line-height:1.45}" +
      ".wc-address-card-phone{font-size:12px;color:#6b7280;margin:0}" +
      ".wc-address-card--new{display:flex;align-items:center;justify-content:center;gap:8px;border-style:dashed;color:#374151;font-size:14px;font-weight:600}" +
      ".wc-address-new-icon{font-size:18px;line-height:1;font-weight:400}" +
      ".wc-google-signin{display:flex;justify-content:center;min-height:44px;margin-bottom:4px}" +
      ".wc-google-signin iframe{margin:0 auto}" +
      ".wc-auth-divider{display:flex;align-items:center;gap:12px;margin:14px 0 16px;color:#9ca3af;font-size:12px}" +
      ".wc-auth-divider::before,.wc-auth-divider::after{content:'';flex:1;height:1px;background:#e5e7eb}" +
      ".wc-auth-divider span{white-space:nowrap}" +
      ".wc-inline-link{background:none;border:none;padding:0;margin:0;color:#2563eb;font-size:inherit;font-weight:600;cursor:pointer;text-decoration:underline;display:inline !important;width:auto !important;vertical-align:baseline}" +
      ".wc-otp-resend{display:block;width:100%;text-align:center}" +
      ".wc-otp-resend:disabled{color:#94a3b8;cursor:default;text-decoration:none}" +
      ".wc-inline-link:hover{color:#1d4ed8}" +
      ".wc-checkout-card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:18px 16px;margin-bottom:4px;box-shadow:0 1px 2px rgba(0,0,0,.04)}" +
      ".wc-card-title{margin:0 0 14px;font-size:16px;font-weight:700;color:#111827;letter-spacing:-.01em}" +
      ".wc-required{color:#dc2626}" +
      ".wc-field--error .wc-searchable-trigger{border-color:#dc2626 !important;box-shadow:0 0 0 3px rgba(220,38,38,.12)}" +
      ".wc-field-note{margin:-6px 0 12px;font-size:12px;color:#6b7280;line-height:1.45}" +
      ".wc-guest-wrap{margin-top:14px}" +
      ".wc-auth-guest-wrap{margin-top:16px}" +
      ".wc-guest-divider{margin:0 0 10px;font-size:13px;color:#6b7280;text-align:center}" +
      "#wobcart-checkout-overlay .wc-btn-guest{background:#fff !important;color:#111827 !important;border:1.5px solid #111827 !important;box-shadow:none}" +
      "#wobcart-checkout-overlay .wc-btn-guest:hover:not(:disabled){background:#f9fafb !important;color:#111827 !important;border-color:#111827 !important}" +
      ".wc-guest-prompt{margin:14px 0 0;font-size:13px;color:#6b7280;text-align:center}" +
      ".wc-guest-banner{margin-bottom:14px}" +
      ".wc-guest-note{font-size:13px;color:#047857;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px;padding:10px 12px;margin:0;line-height:1.55}" +
      ".wc-guest-note-line{margin:0}" +
      ".wc-guest-note-line + .wc-guest-note-line{margin-top:8px}" +
      ".wc-guest-note-login{white-space:normal}" +
      ".wc-guest-note .wc-inline-link{color:#047857;font-weight:600;text-decoration:underline}" +
      ".wc-guest-note .wc-inline-link:hover{color:#065f46}" +
      ".wc-checkbox-row{display:flex;align-items:flex-start;gap:10px;margin:14px 0 0;font-size:13px;color:#374151;line-height:1.45;cursor:pointer}" +
      ".wc-checkbox-row input[type=checkbox]{width:16px;height:16px;margin:2px 0 0;flex-shrink:0;accent-color:#111827;cursor:pointer}" +
      ".wc-guest-account-note{margin:-4px 0 12px;padding:10px 12px;font-size:12px;line-height:1.45;color:#047857;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:10px}" +
      ".wc-section-locked{background:#f9fafb;border:1px dashed #d1d5db;border-radius:12px;padding:16px;margin:0 0 16px;font-size:13px;color:#6b7280;line-height:1.55;text-align:center}" +
      ".wc-section-locked .wc-inline-link{color:#2563eb;font-weight:600;text-decoration:underline}" +
      ".wc-section-locked .wc-inline-link:hover{color:#1d4ed8}" +
      ".wc-auth-back{display:inline-flex;align-items:center;gap:4px;background:none;border:none;padding:0;margin:0 0 12px;font-size:13px;color:#6b7280;cursor:pointer;font-weight:500}" +
      ".wc-auth-back:hover{color:#111827}" +
      ".wc-auth-panel-title{margin:0 0 4px;font-size:15px;font-weight:600;color:#111827}" +
      ".wc-auth-hint{font-size:12px;color:#6b7280;margin:8px 0 12px;line-height:1.45}" +
      ".wc-auth-link{display:inline-block;margin-top:10px;font-size:13px;color:#2563eb;cursor:pointer;text-decoration:none;background:none;border:none;padding:0;font-weight:500}" +
      ".wc-auth-link:hover{text-decoration:underline;color:#1d4ed8}" +
      ".wc-auth-link--muted{color:#6b7280;margin-top:12px}" +
      ".wc-pay-methods{display:grid;gap:10px}" +
      ".wc-pay-opt{display:flex;align-items:center;gap:12px;padding:14px 14px;border:2px solid #e5e7eb;border-radius:12px;cursor:pointer;background:#fff;transition:border-color .15s,background .15s,box-shadow .15s}" +
      ".wc-pay-opt:hover{border-color:#9ca3af}" +
      ".wc-pay-opt.active{border-color:#111827;background:#fafafa;box-shadow:0 0 0 1px #111827}" +
      ".wc-pay-radio{width:18px;height:18px;border-radius:50%;border:2px solid #d1d5db;flex-shrink:0;position:relative;transition:border-color .15s}" +
      ".wc-pay-opt.active .wc-pay-radio{border-color:#111827}" +
      ".wc-pay-opt.active .wc-pay-radio::after{content:'';position:absolute;inset:3px;border-radius:50%;background:#111827}" +
      ".wc-pay-info{flex:1;min-width:0}" +
      ".wc-pay-info strong{display:block;font-size:14px;color:#111827;margin-bottom:2px}" +
      ".wc-pay-info span{font-size:12px;color:#6b7280}" +
      ".wc-pay-badge{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;background:#ecfdf5;color:#047857;padding:4px 8px;border-radius:6px;flex-shrink:0}" +
      ".wc-pay-badge--advance{background:#fff7ed;color:#c2410c}" +
      ".wc-cod-advance-note{display:none;margin:10px 0 0;padding:12px 14px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;font-size:13px;color:#9a3412;line-height:1.45}" +
      ".wc-cod-advance-note strong{font-weight:700}" +
      ".wc-pay-summary{background:#f9fafb;border:1px solid #eef0f3;border-radius:12px;padding:12px 14px;margin-bottom:14px;font-size:13px}" +
      ".wc-pay-summary .wc-summary-line{margin:4px 0;font-size:12px}" +
      ".wc-pay-summary .wc-summary-total{margin-top:8px;padding-top:8px;font-size:13px}" +
      ".wc-sticky-pay{position:static;background:#fff;padding:16px 0 0;margin-top:16px}" +
      ".wc-secure-note{text-align:center;font-size:11px;color:#9ca3af;margin:8px 0 0;display:flex;align-items:center;justify-content:center;gap:4px}" +
      ".wc-express{padding:28px 8px;text-align:center}" +
      ".wc-express-greeting{font-size:20px;font-weight:600;color:#111827;margin:0 0 8px;letter-spacing:-.02em}" +
      ".wc-express-address{font-size:13px;color:#6b7280;margin:0 0 20px;line-height:1.5}" +
      ".wc-badge{display:inline-block;background:#ecfdf5;color:#047857;font-size:11px;font-weight:600;padding:4px 10px;border-radius:999px;margin-left:6px}" +
      ".wc-success-icon{width:56px;height:56px;border-radius:50%;background:#ecfdf5;color:#059669;font-size:28px;line-height:56px;margin:0 auto 16px}" +
      ".wc-success-title{font-size:20px;font-weight:600;color:#111827;text-align:center;margin:0 0 8px}" +
      ".wc-success-sub{font-size:13px;color:#6b7280;text-align:center;margin:0 0 24px}" +
      ".wc-powered{display:flex;align-items:center;justify-content:center;gap:6px;padding:10px 14px;border-top:1px solid #eef0f3;text-decoration:none;color:#9ca3af;transition:opacity .15s;background:#fafafa;flex-shrink:0;margin:0}" +
      "@media(min-width:768px){.wc-powered{border-radius:0 0 20px 20px}}" +
      ".wc-powered:hover{opacity:.85;color:#6b7280}" +
      ".wc-powered-label{font-size:10px;letter-spacing:.03em}" +
      ".wc-powered-logo{height:15px;width:auto;display:block;object-fit:contain;opacity:.85}" +
      "@keyframes wcSlideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}" +
      "#wobcart-checkout-modal{animation:wcSlideUp .25s ease-out}";
    document.head.appendChild(style);
  }

  function renderShell(title, bodyHtml, compact, modalClass) {
    ensureStyles();
    closeModalOnly();
    var overlay = document.createElement("div");
    overlay.id = "wobcart-checkout-overlay";
    var modalCls = compact ? "wc-modal--compact" : modalClass || "";
    overlay.innerHTML =
      '<div id="wobcart-checkout-modal"' +
      (modalCls ? ' class="' + modalCls + '"' : "") +
      ">" +
      renderHeader(title) +
      '<div class="wc-body' +
      (compact ? " wc-body--padded" : "") +
      '">' +
      bodyHtml +
      "</div>" +
      poweredByHtml() +
      "</div>";
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) closeModal();
    });
    document.body.appendChild(overlay);
    var closeBtn = document.getElementById("wc-close");
    if (closeBtn) closeBtn.onclick = closeModal;
  }

  function errHtml(msg) {
    return '<p class="wc-error">' + msg + "</p>";
  }

  function closeAllSearchablePanels() {
    var overlay = document.getElementById("wobcart-checkout-overlay");
    if (!overlay) return;
    overlay.querySelectorAll(".wc-searchable-panel").forEach(function (panel) {
      panel.style.display = "none";
    });
    overlay.querySelectorAll(".wc-searchable-trigger").forEach(function (trigger) {
      trigger.classList.remove("wc-searchable-trigger--open");
    });
    overlay.querySelectorAll(".wc-searchable-search").forEach(function (input) {
      input.value = "";
    });
  }

  function filterSearchableOptions(id, term) {
    var container = document.querySelector('[data-options="' + id + '"]');
    if (!container) return;
    term = (term || "").toLowerCase().trim();
    var visible = 0;
    container.querySelectorAll(".wc-searchable-option").forEach(function (opt) {
      var name = (opt.getAttribute("data-label") || opt.textContent || "").toLowerCase();
      var show = !term || name.indexOf(term) !== -1;
      opt.style.display = show ? "" : "none";
      if (show) visible++;
    });
    var emptyEl = container.querySelector(".wc-searchable-no-results");
    if (!visible && container.querySelector(".wc-searchable-option")) {
      if (!emptyEl) {
        emptyEl = document.createElement("div");
        emptyEl.className = "wc-searchable-no-results";
        emptyEl.textContent = "No results found";
        container.appendChild(emptyEl);
      }
      emptyEl.style.display = "";
    } else if (emptyEl) {
      emptyEl.style.display = "none";
    }
  }

  function setSearchableSelectValue(id, value, label, meta) {
    var hidden = document.getElementById(id);
    var trigger = document.querySelector('[data-trigger="' + id + '"]');
    if (!hidden || !trigger) return;
    hidden.value = value || "";
    hidden.setAttribute("data-label", label || "");
    if (meta && meta.code) hidden.setAttribute("data-code", meta.code);
    else hidden.removeAttribute("data-code");
    var span = trigger.querySelector(".wc-searchable-value");
    var placeholder = trigger.getAttribute("data-placeholder") || "Select...";
    if (span) {
      span.textContent = value ? label : placeholder;
      span.classList.toggle("wc-searchable-placeholder", !value);
    }
    var panel = document.querySelector('[data-options="' + id + '"]');
    if (panel) {
      panel.querySelectorAll(".wc-searchable-option").forEach(function (opt) {
        opt.classList.toggle("wc-searchable-option--active", opt.getAttribute("data-value") === String(value));
      });
    }
  }

  function bindSearchableSelects(handlers, root) {
    handlers = handlers || {};
    root = root || document;

    root.querySelectorAll("[data-trigger]").forEach(function (trigger) {
      var id = trigger.getAttribute("data-trigger");
      trigger.onclick = function (e) {
        e.stopPropagation();
        var panel = root.querySelector('[data-panel="' + id + '"]') || document.querySelector('[data-panel="' + id + '"]');
        var isOpen = panel && panel.style.display !== "none";
        closeAllSearchablePanels();
        if (!isOpen && panel) {
          panel.style.display = "block";
          trigger.classList.add("wc-searchable-trigger--open");
          var search = root.querySelector('[data-search="' + id + '"]') || document.querySelector('[data-search="' + id + '"]');
          if (search) {
            search.value = "";
            filterSearchableOptions(id, "");
            setTimeout(function () {
              search.focus();
            }, 50);
          }
        }
      };
    });

    root.querySelectorAll(".wc-searchable-search").forEach(function (input) {
      var id = input.getAttribute("data-search");
      input.onclick = function (e) {
        e.stopPropagation();
      };
      input.oninput = function () {
        filterSearchableOptions(id, input.value);
      };
    });

    root.querySelectorAll(".wc-searchable-option").forEach(function (opt) {
      opt.onclick = function (e) {
        e.stopPropagation();
        var wrap = opt.closest("[data-searchable]");
        if (!wrap) return;
        var id = wrap.getAttribute("data-searchable");
        var value = opt.getAttribute("data-value");
        var label = opt.getAttribute("data-label") || opt.textContent || "";
        var code = opt.getAttribute("data-code");
        setSearchableSelectValue(id, value, label, { code: code });
        closeAllSearchablePanels();
        if (handlers[id]) handlers[id](value, { label: label, code: code });
        else syncAddressFromForm();
      };
    });
  }

  var searchableDocHandlerBound = false;

  function ensureSearchableDocHandler() {
    if (searchableDocHandlerBound) return;
    searchableDocHandlerBound = true;
    document.addEventListener("click", closeAllSearchablePanels);
  }

  function bindAddressSearchableSelects() {
    ensureSearchableDocHandler();
    bindSearchableSelects({
      "wc-addr-country": function (value, meta) {
        var country = state.countriesList.find(function (c) {
          return String(c.id) === String(value);
        });
        if (country) {
          state.address.country_id = country.id;
          state.address.country_code = country.code;
          state.address.country = country.name;
        } else if (meta) {
          state.address.country_id = value ? parseInt(value, 10) : null;
          state.address.country_code = meta.code || "IN";
          state.address.country = meta.label || "";
        }
        state.statesList = [];
        state.address.state_id = null;
        state.address.state = "";
        ensureStatesLoaded().then(function () {
          ensureDefaultState();
          var wrap = document.getElementById("wc-addr-state-wrap");
          if (wrap) {
            wrap.outerHTML = renderStateSelect();
            bindAddressSearchableSelects();
          }
          syncAddressFromForm();
          scheduleLiveSummary();
        });
      },
    });
  }

  function fetchPreview(items) {
    return request("/cart-preview", { method: "POST", body: { items: items } });
  }

  function setCouponError(msg) {
    var err = document.getElementById("wc-coupon-error");
    if (!err) return;
    if (!msg) {
      err.innerHTML = "";
      err.style.display = "none";
    } else {
      err.innerHTML = esc(msg);
      err.style.display = "block";
    }
  }

  function scheduleLiveSummary() {
    if (state.summaryTimer) clearTimeout(state.summaryTimer);
    state.summaryTimer = setTimeout(refreshLiveSummary, 300);
  }

  function refreshLiveSummary() {
    if (!state.items.length) return Promise.resolve();
    var requestId = ++state.summaryRequestId;
    var attemptedCoupon = (state.couponCode || "").trim();
    var body = {
      items: state.items,
      coupon_code: state.couponCode || undefined,
      address: buildAddressPayload(),
      payment_method: state.paymentMethod || "razorpay",
    };
    if (state.selectedAddressUuid) body.customer_address_uuid = state.selectedAddressUuid;

    return request("/live-summary", { method: "POST", body: body })
      .then(function (summary) {
        // Ignore stale responses so mid-typing races don't hide COD / flip method.
        if (requestId !== state.summaryRequestId) return;
        state.summary = summary;
        setCouponError("");
        var totalText = money(summary.total);
        var totalEl = document.getElementById("wc-live-total");
        var boxEl = document.getElementById("wc-summary-box");
        var paySummaryEl = document.getElementById("wc-pay-summary");
        if (totalEl) totalEl.textContent = totalText;
        if (boxEl) boxEl.innerHTML = renderSummaryLines(summary);
        if (paySummaryEl) paySummaryEl.innerHTML = renderPaymentSummaryLines(summary);
        updatePaymentVisibility(summary);
        updateShippingWarning(summary);
        updateCheckoutActions();
        updateAvailableCouponsUi();
      })
      .catch(function (err) {
        if (requestId !== state.summaryRequestId) return;
        var errorMsg = (err && err.message) || "";
        if (attemptedCoupon) {
          setCouponError(errorMsg || "Unable to apply coupon");
          state.couponCode = "";
          refreshLiveSummary();
        }
      });
  }

  function isInlineAddressCompleteForCod(address) {
    var a = address || {};
    var line1 = String(a.address_line1 || "").trim();
    var city = String(a.city || "").trim();
    var pin = String(a.postal_code || "").replace(/\D/g, "");
    if (line1.length < 5 || !city || pin.length !== 6) return false;
    if (/^(.)\1{4,}$/.test(line1)) return false;
    return true;
  }

  function isTaxEnabled(summary) {
    if (summary && summary.tax_enabled === false) return false;
    if (state.config && state.config.gst_enabled === false) return false;
    return true;
  }

  function taxSummaryLabel(summary) {
    return (summary && summary.tax_label) || (state.config && state.config.gst_tax_label) || "Tax";
  }

  function shouldShowTax(summary) {
    return isTaxEnabled(summary) && summary && summary.tax > 0;
  }

  function renderDiscountLines(summary) {
    if (!summary || !(summary.discount > 0)) return "";
    var html = "";
    var breakdown = summary.discount_breakdown;
    if (breakdown && (breakdown.coupon > 0 || breakdown.milestone > 0)) {
      if (breakdown.coupon > 0) {
        var couponLabel = summary.coupon_code ? "Coupon (" + summary.coupon_code + ")" : "Coupon discount";
        html += '<div class="wc-summary-line"><span>' + esc(couponLabel) + '</span><span>-' + money(breakdown.coupon) + "</span></div>";
      }
      if (breakdown.milestone > 0) {
        html += '<div class="wc-summary-line"><span>Loyalty discount</span><span>-' + money(breakdown.milestone) + "</span></div>";
      }
      return html;
    }
    html += '<div class="wc-summary-line"><span>Discount</span><span>-' + money(summary.discount) + "</span></div>";
    return html;
  }

  function renderSummaryLines(summary) {
    if (!summary) return "";
    var html = "";
    html += '<div class="wc-summary-line"><span>Subtotal</span><span>' + money(summary.subtotal) + "</span></div>";
    html += renderDiscountLines(summary);
    if (summary.delivery_charge > 0)
      html += '<div class="wc-summary-line"><span>Shipping</span><span>' + money(summary.delivery_charge) + "</span></div>";
    if (shouldShowTax(summary))
      html += '<div class="wc-summary-line"><span>' + esc(taxSummaryLabel(summary)) + '</span><span>' + money(summary.tax) + "</span></div>";
    if (summary.cod_fee > 0)
      html += '<div class="wc-summary-line"><span>COD Handling Fee</span><span>' + money(summary.cod_fee) + "</span></div>";
    html += '<div class="wc-summary-line wc-summary-total"><span>Total</span><span>' + money(summary.total) + "</span></div>";
    if (summary.cod && summary.cod.prepaid_discount_nudge)
      html += '<p class="wc-signed-in" style="margin-top:10px;font-size:12px">' + summary.cod.prepaid_discount_nudge + "</p>";
    return html;
  }

  function renderPaymentSummaryLines(summary) {
    if (!summary) return "";
    var html = "";
    var hasExtras = summary.discount > 0 || summary.delivery_charge > 0 || shouldShowTax(summary) || summary.cod_fee > 0;
    if (!hasExtras) return "";
    html += '<div class="wc-summary-line"><span>Subtotal</span><span>' + money(summary.subtotal) + "</span></div>";
    html += renderDiscountLines(summary);
    if (summary.delivery_charge > 0)
      html += '<div class="wc-summary-line"><span>Shipping</span><span>' + money(summary.delivery_charge) + "</span></div>";
    if (shouldShowTax(summary))
      html += '<div class="wc-summary-line"><span>' + esc(taxSummaryLabel(summary)) + '</span><span>' + money(summary.tax) + "</span></div>";
    if (summary.cod_fee > 0)
      html += '<div class="wc-summary-line"><span>COD Handling Fee</span><span>' + money(summary.cod_fee) + "</span></div>";
    html += '<div class="wc-summary-line wc-summary-total"><span>Total</span><span>' + money(summary.total) + "</span></div>";
    return html;
  }

  function updatePaymentVisibility(summary) {
    var codOpt = document.getElementById("wc-pay-cod-opt");
    if (!codOpt) return;

    var codEnabled = Boolean(state.config && state.config.cod_enabled);
    if (!codEnabled) {
      codOpt.style.display = "none";
      if (state.paymentMethod === "cod") state.paymentMethod = "razorpay";
      var disabledNote = document.getElementById("wc-cod-advance-note");
      if (disabledNote) {
        disabledNote.style.display = "none";
        disabledNote.innerHTML = "";
      }
      syncPaymentMethodUi();
      updatePlaceOrderButton(summary || state.summary);
      return;
    }

    var cod = getCodMeta(summary);
    var address = buildAddressPayload();
    var addressComplete = Boolean(
      state.selectedAddressUuid || isInlineAddressCompleteForCod(address)
    );

    // While the guest/inline address is still being typed, always keep COD visible
    // if the store enables it. Only hide once the address is complete and the
    // backend confirms COD is unavailable for that location/order.
    var codOk;
    if (!summary) {
      codOk = true;
    } else if (!addressComplete) {
      codOk = true;
    } else {
      codOk = Boolean(cod.available);
    }

    codOpt.style.display = codOk ? "" : "none";

    // Never silently steal COD selection mid-typing. Only fall back when the
    // completed address is definitively ineligible for COD.
    if (!codOk && addressComplete && state.paymentMethod === "cod") {
      state.paymentMethod = "razorpay";
    }

    if (!codOk) {
      var noteEl = document.getElementById("wc-cod-advance-note");
      if (noteEl) {
        noteEl.style.display = "none";
        noteEl.innerHTML = "";
      }
    } else {
      updateCodOptionCopy(summary || state.summary);
    }

    syncPaymentMethodUi();
    updatePlaceOrderButton(summary || state.summary);
  }

  function updateShippingWarning(summary) {
    var el = document.getElementById("wc-shipping-warning");
    if (!el) return;
    if (summary && summary.shipping_available === false) {
      var msg = summary.shipping_unavailable_message || "Shipping is not available to this location.";
      var countriesHtml = "";
      if (summary.available_shipping_countries && summary.available_shipping_countries.length) {
        countriesHtml =
          '<p class="wc-shipping-countries">We currently ship to: ' +
          summary.available_shipping_countries
            .map(function (c) {
              return esc(c.name);
            })
            .join(", ") +
          "</p>";
      }
      el.innerHTML = '<div class="wc-shipping-warn"><strong>Shipping not available</strong><p>' + esc(msg) + "</p>" + countriesHtml + "</div>";
      el.style.display = "";
    } else {
      el.innerHTML = "";
      el.style.display = "none";
    }
    updateCheckoutActions();
  }

  function buildAddressPayload() {
    var a = state.address;
    return {
      name: a.name || (state.user && state.user.name) || "",
      phone: a.phone || state.phone || (state.user && state.user.phone) || "",
      email: a.email || state.email || (state.user && state.user.email) || "",
      address_line1: a.address_line1 || "",
      address_line2: a.address_line2 || "",
      city: a.city || "",
      state: a.state || "",
      state_id: a.state_id || undefined,
      postal_code: a.postal_code || "",
      country_id: a.country_id || undefined,
      country_code: a.country_code || "IN",
      country: a.country || undefined,
    };
  }

  function renderCartDrawer() {
    if (!state.items || !state.items.length) {
      closeModalOnly();
      showCheckoutToast("Your cart is empty", "info");
      return;
    }
    fetchPreview(state.items)
      .then(function (preview) {
        var itemsHtml =
          '<div class="wc-items-card">' +
          preview.items
          .map(function (item) {
            return (
              '<div class="wc-item" data-variant="' +
              item.variant_uuid +
              '">' +
              (item.thumbnail ? '<img src="' + item.thumbnail + '" alt="">' : '<div style="width:64px;height:64px;border-radius:10px;background:#f3f4f6"></div>') +
              '<div class="wc-item-info"><p class="wc-item-name">' +
              item.name +
              (item.variant_name ? " — " + item.variant_name : "") +
              '</p><p class="wc-item-price">' +
              money(item.unit_price) +
              '</p><div class="wc-qty"><button type="button" data-qty-minus="' +
              item.variant_uuid +
              '">−</button><span>' +
              item.quantity +
              '</span><button type="button" data-qty-plus="' +
              item.variant_uuid +
              '">+</button></div></div></div>'
            );
          })
          .join("") +
          "</div>";

        renderShell(
          "Your Cart",
          itemsHtml +
            '<div class="wc-summary-box"><div class="wc-summary-line"><span>Items</span><span>' +
            preview.item_count +
            '</span></div><div class="wc-summary-line wc-summary-total"><span>Subtotal</span><span>' +
            money(preview.subtotal) +
            '</span></div></div><button class="wc-btn wc-btn-pay" id="wc-cart-checkout" style="margin-top:16px">Proceed to checkout</button>',
          true,
          "wc-modal--compact"
        );

        document.getElementById("wc-cart-checkout").onclick = function () {
          openCheckout({ items: state.items });
        };

        document.querySelectorAll("[data-qty-minus]").forEach(function (btn) {
          btn.onclick = function () {
            WobcartCart.update(btn.getAttribute("data-qty-minus"), getQty(btn) - 1);
            state.items = WobcartCart.getItems();
            renderCartDrawer();
          };
        });
        document.querySelectorAll("[data-qty-plus]").forEach(function (btn) {
          btn.onclick = function () {
            WobcartCart.update(btn.getAttribute("data-qty-plus"), getQty(btn) + 1);
            state.items = WobcartCart.getItems();
            renderCartDrawer();
          };
        });
      })
      .catch(function (e) {
        showCheckoutToast(e.message || "An error occurred", "error");
      });
  }

  function getQty(btn) {
    var span = btn.parentElement.querySelector("span");
    return parseInt(span.textContent, 10) || 1;
  }

  function renderExpressCheckout() {
    var profile = state.expressProfile;
    var addr = profile.default_address;
    state.paymentMethod = profile.last_payment_method === "cod" ? "cod" : "razorpay";
    var payLabel = placeOrderButtonText(state.summary);

    renderShell(
      "Express checkout",
      '<div class="wc-express"><div class="wc-success-icon" style="background:#eff6ff;color:#2563eb">⚡</div>' +
        '<p class="wc-express-greeting">Welcome back, ' +
        (profile.user.name || "there") +
        "!</p>" +
        '<p class="wc-express-address">' +
        (addr
          ? formatAddressLine({
              address_line1: addr.address_line1,
              address_line2: addr.address_line2,
              city: addr.city,
              state: addr.state,
              postal_code: addr.postal_code,
            })
          : "Complete your order in one tap") +
        '</p><div class="wc-summary-box" id="wc-summary-box"></div><button class="wc-btn wc-btn-pay" id="wc-express-pay" style="margin-top:20px">' +
        payLabel +
        '</button><button class="wc-btn wc-btn-secondary" id="wc-express-edit">Edit details</button><div id="wc-error"></div></div>',
      true
    );

    if (addr) {
      state.address = {
        name: addr.full_name,
        phone: addr.phone,
        email: addr.email,
        address_line1: addr.address_line1,
        address_line2: addr.address_line2,
        city: addr.city,
        state: addr.state,
        state_id: addr.state_id,
        postal_code: addr.postal_code,
        country_code: addr.country_code || "IN",
        country_id: addr.country_id,
        country: addr.country,
      };
      state.selectedAddressUuid = addr.uuid;
    }
    refreshLiveSummary();

    document.getElementById("wc-express-edit").onclick = function () {
      state.mode = "full";
      renderFullCheckout();
    };
    document.getElementById("wc-express-pay").onclick = function () {
      placeOrder();
    };
  }

  function renderFullCheckout() {
    ensureSavedAddressSelection();
    var needsAddressData = canShowCheckoutDetails();

    if (needsAddressData && !state.countriesList.length) {
      ensureCountriesLoaded()
        .then(function () {
          ensureDefaultCountry();
          return ensureStatesLoaded();
        })
        .then(function () {
          ensureDefaultState();
          renderFullCheckoutInner();
        });
      return;
    }

    renderFullCheckoutInner();
    ensureStatesLoaded().then(function () {
      ensureDefaultState();
      var wrap = document.getElementById("wc-addr-state-wrap");
      if (wrap) {
        wrap.outerHTML = renderStateSelect();
        bindAddressSearchableSelects();
      }
      syncAddressFromForm();
      scheduleLiveSummary();
    });
  }

  function renderFullCheckoutInner() {
    var auth = (state.config && state.config.auth) || {};
    var loggedIn = !!state.token;

    renderShell(
      "Secure checkout",
      '<div class="wc-layout">' +
        '<div class="wc-order-panel">' +
        '<p class="wc-section-title">Order summary</p>' +
        '<div class="wc-items-card" id="wc-items-list"></div>' +
        '<div class="wc-field"><label>Discount code</label><div class="wc-coupon-row"><input id="wc-coupon" placeholder="Enter coupon code" value="' +
        esc(state.couponCode || "") +
        '"><button class="wc-btn wc-btn-outline" id="wc-apply-coupon" type="button">Apply</button></div>' +
        '<div id="wc-coupon-error" class="wc-coupon-error" style="display:none"></div>' +
        '<div id="wc-applied-coupon-box"></div>' +
        '<div id="wc-available-coupons-box"></div></div>' +
        '<div class="wc-summary-box" id="wc-summary-box"></div></div>' +
        '<div class="wc-form-panel">' +
        (loggedIn
          ? '<div class="wc-signed-in"><span class="wc-signed-in-dot"></span>Signed in as <strong>' +
            esc(state.user.name || state.user.phone || state.user.email) +
            "</strong></div>"
          : state.guestMode
            ? '<div class="wc-guest-banner">' +
              '<div class="wc-guest-note"><p class="wc-guest-note-line">Checking out without login. Enter your delivery details below.</p>' +
              '<p class="wc-guest-note-line wc-guest-note-login">Already have an account? <button type="button" class="wc-inline-link" id="wc-guest-login">Sign in to purchase</button></p></div>' +
              "</div>"
            : renderContactSection(auth)) +
        '<div id="wc-checkout-locked" class="wc-section-locked" style="display:' +
        (canShowCheckoutDetails() || state.contactStep === "idle" ? "none" : "") +
        '">' +
        renderCheckoutLockedMessage() +
        "</div>" +
        '<div id="wc-checkout-details" style="display:' +
        (canShowCheckoutDetails() ? "" : "none") +
        '">' +
        '<p class="wc-section-title wc-section-title--spaced">Delivery address & billing details</p>' +
        renderSavedAddressSection() +
        renderAddressFormFields() +
        '<div id="wc-shipping-warning" style="display:none"></div>' +
        '<p class="wc-section-title wc-section-title--spaced">Payment method</p>' +
        '<div class="wc-pay-methods">' +
        '<div class="wc-pay-opt active" id="wc-pay-razorpay-opt" data-pay="razorpay"><span class="wc-pay-radio"></span><div class="wc-pay-info"><strong>UPI / Cards / Netbanking</strong><span>Secure payment via Razorpay</span></div><span class="wc-pay-badge">Fast</span></div>' +
        '<div class="wc-pay-opt" id="wc-pay-cod-opt" data-pay="cod" style="display:none"><span class="wc-pay-radio"></span><div class="wc-pay-info"><strong>Cash on Delivery</strong><span id="wc-cod-subtitle">Pay when your order arrives</span></div><span class="wc-pay-badge wc-pay-badge--advance" id="wc-cod-badge" style="display:none">Advance</span></div></div>' +
        '<div class="wc-cod-advance-note" id="wc-cod-advance-note" style="display:none"></div>' +
        '<div class="wc-sticky-pay"><div class="wc-pay-summary" id="wc-pay-summary"></div><button class="wc-btn wc-btn-pay" id="wc-place-order">Pay <span id="wc-live-total">—</span></button><p class="wc-secure-note">🔒 Secure & encrypted checkout</p></div>' +
        "</div>" +
        '<div id="wc-error"></div>' +
        "</div></div>",
      false,
      "wc-modal--checkout"
    );

    fetchPreview(state.items)
      .then(function (preview) {
      var list = document.getElementById("wc-items-list");
      if (!list) return;
      list.innerHTML = preview.items
        .map(function (item) {
          return (
            '<div class="wc-item">' +
            (item.thumbnail ? '<img src="' + item.thumbnail + '" alt="">' : '<div style="width:64px;height:64px;border-radius:10px;background:#f3f4f6"></div>') +
            '<div class="wc-item-info"><p class="wc-item-name">' +
            esc(item.name) +
            (item.variant_name ? " — " + esc(item.variant_name) : "") +
            '</p><p class="wc-item-meta">Qty ' +
            item.quantity +
            '</p><p class="wc-item-price">' +
            money(item.unit_price) +
            "</p></div></div>"
          );
        })
        .join("");
    })
      .catch(function () {});

    bindFullCheckoutEvents(auth);
    if (state.guestMode) {
      var guestLoginBtn = document.getElementById("wc-guest-login");
      if (guestLoginBtn) guestLoginBtn.onclick = exitGuestCheckout;
      var saveAddressCheckbox = document.getElementById("wc-save-address");
      if (saveAddressCheckbox) {
        saveAddressCheckbox.onchange = function () {
          state.saveGuestAddress = saveAddressCheckbox.checked;
        };
      }
      var guestEmailInput = document.getElementById("wc-addr-email");
      if (guestEmailInput) {
        guestEmailInput.addEventListener("input", scheduleGuestAccountCheck);
        guestEmailInput.addEventListener("blur", checkGuestAccount);
      }
      checkGuestAccount();
    }
    // Show COD immediately when enabled so guest selection is not delayed / flicker-prone.
    updatePaymentVisibility(state.summary);
    refreshLiveSummary();
    updateCheckoutActions();
  }

  function bindFullCheckoutEvents(auth) {
    if (!state.token && !state.guestMode) {
      initGoogleSignIn(auth);
      var continueBtn = document.getElementById("wc-contact-continue");
      if (continueBtn) {
        continueBtn.onclick = function () {
          handleContactContinue(auth);
        };
      }
      var guestBtn = document.getElementById("wc-guest-checkout");
      if (guestBtn) {
        guestBtn.onclick = enableGuestCheckout;
      }
      var contactInput = document.getElementById("wc-contact");
      if (contactInput) {
        contactInput.onkeydown = function (e) {
          if (e.key === "Enter") {
            e.preventDefault();
            handleContactContinue(auth);
          }
        };
      }
      if (state.contactStep === "auth" && state.identifyResult) {
        renderAuthStep(state.identifyResult, auth);
      }
    }
    if (!state.token && !state.guestMode && isGuestCheckoutEnabled()) {
      var lockedGuestBtn = document.getElementById("wc-locked-guest-checkout");
      if (lockedGuestBtn) lockedGuestBtn.onclick = enableGuestCheckout;
    }

    ["wc-addr-name", "wc-addr-phone", "wc-addr-pin", "wc-addr-line1", "wc-addr-line2", "wc-addr-city", "wc-addr-email"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener("input", syncAddressFromForm);
        el.addEventListener("change", syncAddressFromForm);
      }
    });

    bindAddressSearchableSelects();

    var phone = document.getElementById("wc-addr-phone");
    if (phone) {
      phone.addEventListener("input", function () {
        var digits = normalizePhoneDigits(phone.value);
        if (phone.value !== digits) phone.value = digits;
        syncAddressFromForm();
      });
    }

    var pin = document.getElementById("wc-addr-pin");
    if (pin) {
      pin.addEventListener("blur", function () {
        var code = pin.value.replace(/\D/g, "");
        if (code.length === 6) {
          request("/pincode/" + code)
            .then(function (data) {
              if (data.city) document.getElementById("wc-addr-city").value = data.city;
              if (data.state_id) {
                var match = state.statesList.find(function (st) {
                  return String(st.id) === String(data.state_id);
                });
                setSearchableSelectValue("wc-addr-state", data.state_id, match ? match.name : data.state || "");
              } else if (data.state) {
                var byName = state.statesList.find(function (st) {
                  return st.name === data.state;
                });
                if (byName) setSearchableSelectValue("wc-addr-state", byName.id, byName.name);
              }
              state.address.state_id = data.state_id;
              syncAddressFromForm();
              scheduleLiveSummary();
            })
            .catch(function () {});
        }
      });
    }

    document.querySelectorAll(".wc-address-card[data-addr]").forEach(function (card) {
      card.onclick = function () {
        var uuid = card.getAttribute("data-addr");
        var addr = state.savedAddresses.find(function (a) {
          return a.uuid === uuid;
        });
        if (!addr) return;
        applySavedAddress(addr);
        renderFullCheckout();
      };
    });

    var newAddrBtn = document.getElementById("wc-new-address-btn");
    if (newAddrBtn) {
      newAddrBtn.onclick = function () {
        state.showNewAddress = true;
        state.selectedAddressUuid = null;
        state.address = {
          name: (state.user && state.user.name) || "",
          phone: (state.user && state.user.phone) || state.phone || "",
          email: (state.user && state.user.email) || state.email || "",
          address_line1: "",
          address_line2: "",
          city: "",
          state: "",
          state_id: null,
          postal_code:
            (typeof localStorage !== "undefined"
              ? localStorage.getItem("wobcart_user_pincode")
              : "") || "",
        };
        ensureDefaultCountry();
        renderFullCheckout();
      };
    }

    var couponBtn = document.getElementById("wc-apply-coupon");
    var couponInput = document.getElementById("wc-coupon");
    if (couponBtn) {
      couponBtn.onclick = function () {
        var val = (document.getElementById("wc-coupon").value || "").trim();
        if (!val) {
          setCouponError("Please enter a coupon code");
          return;
        }
        setCouponError("");
        state.couponCode = val;
        scheduleLiveSummary();
      };
    }
    if (couponInput) {
      couponInput.oninput = function () {
        setCouponError("");
      };
      couponInput.onkeydown = function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          var val = (couponInput.value || "").trim();
          if (!val) {
            setCouponError("Please enter a coupon code");
            return;
          }
          setCouponError("");
          state.couponCode = val;
          scheduleLiveSummary();
        }
      };
    }

    updateAvailableCouponsUi();
    if (!state.availableCoupons || !state.availableCoupons.length) {
      fetchAvailableCoupons();
    }

    document.querySelectorAll("[data-pay]").forEach(function (opt) {
      opt.onclick = function () {
        var prev = state.paymentMethod;
        state.paymentMethod = opt.getAttribute("data-pay");
        syncPaymentMethodUi();
        updateCodOptionCopy(state.summary);
        updatePlaceOrderButton(state.summary);
        // Re-fetch summary when switching to/from COD so cod_fee updates live
        if (prev !== state.paymentMethod) scheduleLiveSummary();
      };
    });

    var placeBtn = document.getElementById("wc-place-order");
    if (placeBtn) placeBtn.onclick = placeOrder;
  }

  function syncAddressFromForm() {
    var stateHidden = document.getElementById("wc-addr-state");
    var stateId = stateHidden ? stateHidden.value : "";
    var stateName = stateHidden ? stateHidden.getAttribute("data-label") || "" : "";
    var countryHidden = document.getElementById("wc-addr-country");
    var countryId = countryHidden ? countryHidden.value : "";
    var countryCode = countryHidden ? countryHidden.getAttribute("data-code") || "IN" : "IN";
    var countryName = countryHidden ? countryHidden.getAttribute("data-label") || "" : "";
    if (!countryId && state.address.country_id) {
      countryId = state.address.country_id;
      countryCode = state.address.country_code || "IN";
      countryName = state.address.country || "";
    }
    var usingSaved =
      state.token && state.savedAddresses.length && state.selectedAddressUuid && !state.showNewAddress;
    if (usingSaved) {
      scheduleLiveSummary();
      return;
    }
    state.address = {
      name: val("wc-addr-name"),
      phone: normalizePhoneDigits(val("wc-addr-phone")),
      email: val("wc-addr-email") || state.address.email || state.email || (state.user && state.user.email) || "",
      address_line1: val("wc-addr-line1"),
      address_line2: val("wc-addr-line2"),
      city: val("wc-addr-city"),
      state: stateName,
      state_id: stateId ? parseInt(stateId, 10) : null,
      postal_code: val("wc-addr-pin"),
      country_id: countryId ? parseInt(countryId, 10) : state.address.country_id || null,
      country_code: countryCode,
      country: countryName,
    };
    state.selectedAddressUuid = null;
    scheduleLiveSummary();
    updateCheckoutActions();
  }

  function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
  }

  function normalizePhoneDigits(value) {
    return String(value || "").replace(/\D/g, "").slice(0, 10);
  }

  function isValidPhone(value) {
    return /^\d{10}$/.test(normalizePhoneDigits(value));
  }

  function handleContactContinue(auth) {
    var contactInput = document.getElementById("wc-contact");
    var contact = contactInput ? contactInput.value.trim() : "";
    if (contact.length < 3) {
      showError("Please enter your email address or phone number");
      return;
    }
    if (contact.indexOf("@") === -1 && !isValidPhone(contact)) {
      showError("Please enter a valid 10-digit mobile number");
      return;
    }
    if (contact.indexOf("@") === -1) {
      contact = normalizePhoneDigits(contact);
      if (contactInput) contactInput.value = contact;
    }
    saveContact(contact);
    state.identifyResult = null;
    if (contact.indexOf("@") === -1) {
      state.authMethod = "otp";
    } else {
      state.authMethod = "otp";
    }

    showContactAuthStep();
    var panel = document.getElementById("wc-auth-panel");
    var continueBtn = document.getElementById("wc-contact-continue");
    if (panel) {
      panel.innerHTML = '<p class="wc-auth-hint">Checking your account...</p>';
    }
    if (continueBtn) continueBtn.disabled = true;

    request("/identify-contact", { method: "POST", body: { contact: contact } })
      .then(function (data) {
        state.identifyResult = data;
        if (data.type === "phone") {
          state.phone = data.contact;
          state.authMethod = "otp";
        } else {
          state.email = data.contact;
          state.address.email = data.contact;
          if (data.exists && data.has_password && auth.email_password_enabled) {
            state.authMethod = "password";
          } else {
            state.authMethod = "otp";
          }
        }
        renderAuthStep(data, auth);
      })
      .catch(function (e) {
        if (panel) panel.innerHTML = errHtml(e.message) + authBackButtonHtml();
        bindAuthBackButton();
      })
      .finally(function () {
        if (continueBtn) continueBtn.disabled = false;
      });
  }

  function authBackButtonHtml() {
    return '<button type="button" class="wc-auth-back" id="wc-change-contact">← Back to email</button>';
  }

  function bindAuthBackButton() {
    var backBtn = document.getElementById("wc-change-contact");
    if (backBtn) backBtn.onclick = resetContactStep;
  }

  function isGuestCheckoutEnabled() {
    return !state.config || state.config.guest_checkout_enabled !== false;
  }

  function authGuestCheckoutLinkHtml() {
    if (!isGuestCheckoutEnabled()) return "";
    return (
      '<div class="wc-guest-wrap wc-auth-guest-wrap">' +
      '<p class="wc-guest-divider">Or</p>' +
      '<button type="button" class="wc-btn wc-btn-guest" id="wc-auth-guest-checkout">Checkout without login</button>' +
      "</div>"
    );
  }

  function authOtpSignInLinkHtml() {
    return (
      '<div class="wc-guest-wrap wc-auth-guest-wrap">' +
      '<p class="wc-guest-divider">Or</p>' +
      '<button type="button" class="wc-btn wc-btn-guest" id="wc-auth-otp-signin">Sign in with OTP</button>' +
      "</div>"
    );
  }

  function bindAuthGuestCheckout() {
    var btn = document.getElementById("wc-auth-guest-checkout");
    if (btn) btn.onclick = enableGuestCheckout;
  }

  function bindAuthOtpSignIn(data, auth) {
    var btn = document.getElementById("wc-auth-otp-signin");
    if (btn) {
      btn.onclick = function () {
        state.authMethod = "otp";
        renderAuthStep(data, auth);
      };
    }
  }

  function renderCheckoutLockedMessage() {
    if (!isGuestCheckoutEnabled()) {
      return "Sign in to enter delivery address and payment details.";
    }
    return (
      'Sign in or <button type="button" class="wc-inline-link" id="wc-locked-guest-checkout">checkout without login</button> to enter delivery address and payment details.'
    );
  }

  function enableGuestCheckout() {
    var contactInput = document.getElementById("wc-contact");
    var contact = contactInput ? contactInput.value.trim() : "";
    if (!contact && state.email) contact = state.email;
    if (!contact && state.phone) contact = state.phone;
    state.guestMode = true;
    state.contactStep = "guest";
    var priorIdentify = state.identifyResult;
    state.identifyResult = null;
    state.guestHasAccount = false;
    state.saveGuestAddress = false;
    state.showNewAddress = true;
    if (contact && contact.indexOf("@") !== -1) {
      state.email = contact;
      state.address.email = contact;
      saveContact(contact);
      if (
        priorIdentify &&
        priorIdentify.type === "email" &&
        priorIdentify.exists &&
        String(priorIdentify.contact).toLowerCase() === contact.toLowerCase()
      ) {
        state.guestHasAccount = true;
      }
    } else if (contact) {
      saveContact(contact);
    }
    renderFullCheckout();
  }

  function exitGuestCheckout() {
    state.guestMode = false;
    state.guestHasAccount = false;
    state.saveGuestAddress = false;
    state.contactStep = "idle";
    state.identifyResult = null;
    state.authMethod = "otp";
    renderFullCheckout();
  }

  function renderAuthStep(data, auth) {
    var panel = document.getElementById("wc-auth-panel");
    if (!panel) return;

    if (data.type === "phone") {
      if (!auth.phone_otp_enabled) {
        panel.innerHTML =
          authBackButtonHtml() +
          errHtml("Phone OTP login is not available. Try email or checkout without login.") +
          authGuestCheckoutLinkHtml();
        bindAuthBackButton();
        bindAuthGuestCheckout();
        return;
      }
      panel.innerHTML =
        authBackButtonHtml() +
        '<p class="wc-auth-panel-title">Verify your phone</p>' +
        '<p class="wc-auth-hint" id="wc-otp-intro">Enter the verification code sent to <strong>' +
        esc(data.contact) +
        "</strong></p>" +
        '<div class="wc-field"><label>Verification code <span class="wc-required">*</span></label><input id="wc-otp" inputmode="numeric" maxlength="8" placeholder="Enter OTP"></div>' +
        '<p class="wc-auth-hint" id="wc-otp-status">Sending code...</p>' +
        '<button type="button" class="wc-btn" id="wc-verify-phone">Verify & continue</button>' +
        '<button type="button" class="wc-inline-link wc-otp-resend" id="wc-resend-phone-otp" style="display:none;margin-top:10px">Resend code</button>' +
        authGuestCheckoutLinkHtml();
      bindAuthBackButton();
      bindAuthGuestCheckout();
      document.getElementById("wc-verify-phone").onclick = verifyPhoneOtp;
      var phoneOtpInput = document.getElementById("wc-otp");
      if (phoneOtpInput) {
        phoneOtpInput.onkeydown = function (e) {
          if (e.key === "Enter") {
            e.preventDefault();
            verifyPhoneOtp();
          }
        };
      }
      sendPhoneOtp(true);
      return;
    }

    state.email = data.contact;
    var hasPassword = data.exists && data.has_password && auth.email_password_enabled;
    var hasOtp = auth.email_otp_enabled;

    if (hasPassword && state.authMethod === "password") {
      panel.innerHTML =
        authBackButtonHtml() +
        '<p class="wc-auth-panel-title">Welcome back</p>' +
        '<p class="wc-auth-hint">Sign in with your password for <strong>' +
        esc(data.contact) +
        "</strong></p>" +
        '<div class="wc-field"><label>Password <span class="wc-required">*</span></label><input id="wc-password" type="password" autocomplete="current-password" placeholder="Password"></div>' +
        '<button type="button" class="wc-btn" id="wc-login-pw">Sign in & continue</button>' +
        (hasOtp ? authOtpSignInLinkHtml() : authGuestCheckoutLinkHtml());
      bindAuthBackButton();
      if (hasOtp) bindAuthOtpSignIn(data, auth);
      else bindAuthGuestCheckout();
      document.getElementById("wc-login-pw").onclick = loginPassword;
      var pwInput = document.getElementById("wc-password");
      if (pwInput) {
        pwInput.onkeydown = function (e) {
          if (e.key === "Enter") {
            e.preventDefault();
            loginPassword();
          }
        };
      }
      return;
    }

    if (hasOtp) {
      renderEmailOtpStep(data, auth, !data.exists);
      return;
    }

    if (hasPassword) {
      state.authMethod = "password";
      renderAuthStep(data, auth);
      return;
    }

    panel.innerHTML =
      authBackButtonHtml() + errHtml("No sign-in method is available. Please checkout without login.") + authGuestCheckoutLinkHtml();
    bindAuthBackButton();
    bindAuthGuestCheckout();
  }

  function renderEmailOtpStep(data, auth, isNewAccount) {
    var panel = document.getElementById("wc-auth-panel");
    if (!panel) return;

    var hasPassword = data.exists && data.has_password && auth.email_password_enabled;
    var title = isNewAccount ? "Verify your email" : "Sign in to your account";

    panel.innerHTML =
      authBackButtonHtml() +
      '<p class="wc-auth-panel-title">' +
      title +
      "</p>" +
      '<p class="wc-auth-hint" id="wc-otp-intro">Enter the verification code sent to <strong>' +
      esc(data.contact) +
      "</strong></p>" +
      '<div class="wc-field" id="wc-otp-field"><label>Verification code <span class="wc-required">*</span></label><input id="wc-otp" inputmode="numeric" maxlength="4" placeholder="4-digit code"></div>' +
      '<p class="wc-auth-hint" id="wc-otp-status">Sending code...</p>' +
      '<button type="button" class="wc-btn" id="wc-verify-email">Verify & continue</button>' +
      '<button type="button" class="wc-inline-link wc-otp-resend" id="wc-resend-email-otp" style="display:none;margin-top:10px">Resend code</button>' +
      (hasPassword
        ? '<p class="wc-guest-prompt" style="text-align:left;margin-top:12px">Or <button type="button" class="wc-inline-link" id="wc-use-password">sign in with password</button></p>'
        : "") +
      authGuestCheckoutLinkHtml();

    bindAuthBackButton();
    bindAuthGuestCheckout();
    document.getElementById("wc-verify-email").onclick = verifyEmailOtp;
    var resendBtn = document.getElementById("wc-resend-email-otp");
    if (resendBtn) {
      resendBtn.onclick = function () {
        sendEmailOtpAndShowField(isNewAccount, true);
      };
    }
    var otpInput = document.getElementById("wc-otp");
    if (otpInput) {
      otpInput.onkeydown = function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          verifyEmailOtp();
        }
      };
    }
    if (hasPassword) {
      document.getElementById("wc-use-password").onclick = function () {
        state.authMethod = "password";
        renderAuthStep(data, auth);
      };
    }
    sendEmailOtpAndShowField(isNewAccount, false);
  }

  var otpResendInterval = null;
  var OTP_RESEND_SECONDS = 60;

  function clearOtpResendCooldown() {
    if (otpResendInterval) {
      clearInterval(otpResendInterval);
      otpResendInterval = null;
    }
  }

  function formatResendCountdown(seconds) {
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return "Resend code in " + m + ":" + (s < 10 ? "0" : "") + s;
  }

  function startOtpResendCooldown(btnId, onResend) {
    clearOtpResendCooldown();
    var btn = document.getElementById(btnId);
    if (!btn) return;
    var remaining = OTP_RESEND_SECONDS;
    btn.style.display = "";
    btn.disabled = true;
    btn.textContent = formatResendCountdown(remaining);
    otpResendInterval = setInterval(function () {
      remaining -= 1;
      if (remaining <= 0) {
        clearOtpResendCooldown();
        btn.disabled = false;
        btn.textContent = "Resend code";
        btn.onclick = onResend;
        return;
      }
      btn.textContent = formatResendCountdown(remaining);
    }, 1000);
  }

  function resetContactStep() {
    clearOtpResendCooldown();
    state.identifyResult = null;
    state.authMethod = "otp";
    state.email = null;
    showContactIdleStep();
    showError("");
    var contactInput = document.getElementById("wc-contact");
    if (contactInput) contactInput.focus();
  }

  function sendEmailOtpAndShowField(isNewAccount, isResend) {
    var status = document.getElementById("wc-otp-status");
    var resendBtn = document.getElementById("wc-resend-email-otp");
    var verifyBtn = document.getElementById("wc-verify-email");
    if (status) {
      status.style.display = "";
      status.textContent = isResend ? "Resending code..." : "Sending code...";
    }
    if (resendBtn) resendBtn.style.display = "none";
    if (verifyBtn) verifyBtn.disabled = true;

    request("/request-email-otp", { method: "POST", body: { email: state.email } })
      .then(function () {
        if (status) {
          status.textContent = "Code sent. Check your inbox.";
        }
        if (verifyBtn) verifyBtn.disabled = false;
        startOtpResendCooldown("wc-resend-email-otp", function () {
          sendEmailOtpAndShowField(isNewAccount, true);
        });
        var otpInput = document.getElementById("wc-otp");
        if (otpInput) otpInput.focus();
      })
      .catch(function (e) {
        showError(e.message);
        if (status) {
          status.textContent = "Couldn't send the code. Tap resend to try again.";
        }
        if (resendBtn) {
          resendBtn.style.display = "";
          resendBtn.disabled = false;
          resendBtn.textContent = "Resend code";
          resendBtn.onclick = function () {
            sendEmailOtpAndShowField(isNewAccount, true);
          };
        }
        if (verifyBtn) verifyBtn.disabled = false;
      });
  }

  function sendPhoneOtp(isAuto) {
    var status = document.getElementById("wc-otp-status");
    var resendBtn = document.getElementById("wc-resend-phone-otp");
    var verifyBtn = document.getElementById("wc-verify-phone");
    if (status) status.textContent = isAuto ? "Sending code..." : "Resending code...";
    if (resendBtn) resendBtn.style.display = "none";
    if (verifyBtn) verifyBtn.disabled = true;

    request("/request-otp", { method: "POST", body: { phone: state.phone } })
      .then(function (data) {
        state.logId = data.log_id;
        if (status) status.textContent = "Code sent. Check your messages.";
        if (verifyBtn) verifyBtn.disabled = false;
        startOtpResendCooldown("wc-resend-phone-otp", function () {
          sendPhoneOtp(false);
        });
        var otpInput = document.getElementById("wc-otp");
        if (otpInput) otpInput.focus();
      })
      .catch(function (e) {
        showError(e.message);
        if (status) status.textContent = "Couldn't send the code. Tap resend to try again.";
        if (resendBtn) {
          resendBtn.style.display = "";
          resendBtn.disabled = false;
          resendBtn.textContent = "Resend code";
          resendBtn.onclick = function () {
            sendPhoneOtp(false);
          };
        }
        if (verifyBtn) verifyBtn.disabled = false;
      });
  }

  function verifyPhoneOtp() {
    var otp = val("wc-otp");
    request("/verify-otp", {
      method: "POST",
      body: { phone: state.phone, otp: otp, log_id: state.logId, name: val("wc-addr-name") || undefined },
    })
      .then(onAuthSuccess)
      .catch(function (e) {
        showError(e.message);
      });
  }

  function verifyEmailOtp() {
    request("/verify-email-otp", {
      method: "POST",
      body: { email: state.email, otp: val("wc-otp"), name: val("wc-addr-name") || undefined },
    })
      .then(onAuthSuccess)
      .catch(function (e) {
        showError(e.message);
      });
  }

  function loginPassword() {
    request("/login-password", {
      method: "POST",
      body: { email: state.email, password: val("wc-password") },
    })
      .then(onAuthSuccess)
      .catch(function (e) {
        showError(e.message);
      });
  }

  function onAuthSuccess(data) {
    if (data && data.user && data.user.can_set_password) {
      renderSetPasswordStep(data);
      return;
    }
    completeAuthSuccess(data);
  }

  function completeAuthSuccess(data) {
    saveToken(data.token);
    try {
      if (data.token) localStorage.setItem(authStorageKey(), data.token);
    } catch (e) {}
    state.guestMode = false;
    state.contactStep = "verified";
    state.user = data.user;
    state.savedAddresses = data.saved_addresses || [];
    if (state.savedAddresses.length) {
      applySavedAddress(defaultSavedAddress());
    } else {
      state.showNewAddress = true;
      state.address = {
        name: (state.user && state.user.name) || "",
        phone: (state.user && state.user.phone) || state.phone || "",
        email: (state.user && state.user.email) || state.email || "",
      };
      ensureDefaultCountry();
    }
    renderFullCheckout();
  }

  function renderSetPasswordStep(data) {
    saveToken(data.token);
    try {
      if (data.token) localStorage.setItem(authStorageKey(), data.token);
    } catch (e) {}
    state.guestMode = false;
    state.user = data.user;
    var panel = document.getElementById("wc-auth-panel");
    if (!panel) {
      completeAuthSuccess(data);
      return;
    }
    showContactAuthStep();
    panel.style.display = "";
    panel.innerHTML =
      '<p class="wc-auth-panel-title">Set a password (optional)</p>' +
      '<p class="wc-auth-hint">Create a password for faster sign-in next time, or continue with OTP or Google.</p>' +
      '<div class="wc-field"><label>Password <span class="wc-required">*</span></label><input id="wc-set-password" type="password" autocomplete="new-password" placeholder="At least 6 characters"></div>' +
      '<div class="wc-field"><label>Confirm password <span class="wc-required">*</span></label><input id="wc-set-password-confirm" type="password" autocomplete="new-password" placeholder="Re-enter password"></div>' +
      '<button type="button" class="wc-btn" id="wc-save-password">Save password & continue</button>' +
      '<button type="button" class="wc-btn wc-btn-secondary" id="wc-skip-password" style="margin-top:8px">Skip for now</button>';
    document.getElementById("wc-save-password").onclick = function () {
      var password = val("wc-set-password");
      var confirm = val("wc-set-password-confirm");
      if (password.length < 6) {
        showError("Password must be at least 6 characters");
        return;
      }
      if (password !== confirm) {
        showError("Passwords do not match");
        return;
      }
      request("/set-password", {
        method: "POST",
        body: { password: password, password_confirmation: confirm },
      })
        .then(function (updated) {
          completeAuthSuccess(updated || data);
        })
        .catch(function (e) {
          showError(e.message);
        });
    };
    document.getElementById("wc-skip-password").onclick = function () {
      completeAuthSuccess(data);
    };
  }

  function showError(msg) {
    var err = document.getElementById("wc-error");
    if (!err) return;
    if (!msg) {
      err.innerHTML = "";
      return;
    }
    err.innerHTML = errHtml(msg);
  }

  function placeOrder() {
    if (!state.token && !state.guestMode) {
      showError("Please sign in, verify your contact, or checkout without account");
      return;
    }
    syncAddressFromForm();
    var address = buildAddressPayload();
    if (!address.name || !address.phone || !address.address_line1 || !address.city || !address.postal_code) {
      showError("Please complete delivery address");
      return;
    }
    if (isStateRequired() && !address.state_id) {
      showError("Please select a state");
      updateCheckoutActions();
      return;
    }
    if (!isValidPhone(address.phone)) {
      showError("Please enter a valid 10-digit mobile number");
      return;
    }
    if (state.guestMode && !address.email) {
      showError("Please enter your email for order updates");
      return;
    }
    if (!address.country_id && !address.country_code) {
      showError("Please select a country");
      return;
    }
    if (state.summary && state.summary.shipping_available === false) {
      showError(state.summary.shipping_unavailable_message || "Shipping is not available to this location.");
      return;
    }
    if (
      state.paymentMethod === "cod" &&
      state.summary &&
      state.summary.cod &&
      state.summary.cod.available === false
    ) {
      showError(state.summary.cod.reason || "Cash on Delivery is not available for this order.");
      state.paymentMethod = "razorpay";
      updatePaymentVisibility(state.summary);
      return;
    }

    var btn = document.getElementById("wc-place-order") || document.getElementById("wc-express-pay");
    if (btn) btn.disabled = true;

    var orderPath = state.guestMode ? "/place-guest-order" : "/place-order";
    var advanceRequiredAtSubmit = isCodAdvanceRequired(state.summary);

    request(orderPath, {
      method: "POST",
      body: {
        items: state.items,
        address: address,
        payment_method: state.paymentMethod,
        coupon_code: state.couponCode || undefined,
        save_address: state.guestMode && state.guestHasAccount && state.saveGuestAddress,
      },
    })
      .then(function (result) {
        if (result.checkout_token) {
          saveToken(result.checkout_token);
        }
        if (shouldOpenRazorpay(result)) {
          openRazorpay(
            Object.assign({}, result, { gateway_key: resolveGatewayKey(result) }),
            address
          );
          return;
        }
        // Plain COD (no advance) succeeds immediately. If advance was required but
        // the gateway payload is missing, treat it as a failure instead of success.
        if (state.paymentMethod === "cod" && result.success && result.order_uuid) {
          if (advanceRequiredAtSubmit || isCodAdvanceRequired(state.summary)) {
            throw new Error(
              result.message || "Unable to start the COD advance payment. Please try again."
            );
          }
          // Backend may still require advance even if the local summary was stale.
          if (result.gateway_order_id) {
            openRazorpay(
              Object.assign({}, result, { gateway_key: resolveGatewayKey(result) }),
              address
            );
            return;
          }
          stepSuccess(result.order_uuid);
          return;
        }
        if (state.paymentMethod === "razorpay") {
          throw new Error(
            result.message || "Unable to start Razorpay payment. Please refresh and try again."
          );
        }
        if (result.success && result.order_uuid) {
          stepSuccess(result.order_uuid);
          return;
        }
        throw new Error("Unable to start payment");
      })
      .catch(function (e) {
        showError(e.message);
        if (btn) btn.disabled = false;
      });
  }

  function loadRazorpayScript(cb) {
    if (window.Razorpay) return cb();
    var s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = cb;
    document.head.appendChild(s);
  }

  function showPaymentVerifying() {
    renderShell(
      "Verifying payment",
      '<div class="wc-express"><div class="wc-success-icon" style="background:#eff6ff;color:#2563eb">⏳</div>' +
        '<p class="wc-success-title">Verifying your payment</p>' +
        '<p class="wc-success-sub">Please wait while we confirm your payment securely.</p></div>',
      true
    );
  }

  function openRazorpay(result, address) {
    var gatewayKey = resolveGatewayKey(result);
    var checkoutToken = result.checkout_token || state.token || null;
    var isGuestPayment = Boolean(checkoutToken && (result.checkout_token || state.guestMode));
    if (!gatewayKey || !result.gateway_order_id) {
      showError("Payment gateway is not configured. Please contact the store.");
      var btn = document.getElementById("wc-place-order") || document.getElementById("wc-express-pay");
      if (btn) btn.disabled = false;
      return;
    }
    loadRazorpayScript(function () {
      state.paymentFlow = "razorpay";
      var options = {
        key: gatewayKey,
        amount: result.amount,
        currency: result.currency || "INR",
        name: (state.config && state.config.company_name) || "Store",
        description: isCodAdvanceRequired(state.summary)
          ? (getCodMeta(state.summary).is_cod_fee_advance ? "COD fee payment" : "COD advance deposit")
          : "Order payment",
        order_id: result.gateway_order_id,
        prefill: {
          name: address.name,
          email: address.email || "",
          contact: address.phone,
        },
        theme: { color: "#111827" },
        config: {
          display: {
            blocks: {
              upi: { name: "Pay via UPI", instruments: [{ method: "upi" }] },
              other: {
                name: "Cards & More",
                instruments: [{ method: "card" }, { method: "netbanking" }, { method: "wallet" }],
              },
            },
            sequence: ["block.upi", "block.other"],
            preferences: { show_default_blocks: false },
          },
        },
        handler: function (response) {
          if (!response.razorpay_payment_id || !response.razorpay_order_id || !response.razorpay_signature) {
            showError("Payment response incomplete. Please contact support if amount was deducted.");
            return;
          }
          var verifyPath = isGuestPayment ? "/guest/razorpay/verify" : "/razorpay/verify";
          var verifyBody = {
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            transaction_uuid: result.transaction_uuid,
          };
          if (isGuestPayment && checkoutToken) {
            verifyBody.checkout_token = checkoutToken;
          }
          state.verifyInBackground = false;
          var pending = {
            verifyPath: verifyPath,
            verifyBody: verifyBody,
            authToken: checkoutToken,
            isGuestPayment: isGuestPayment,
            result: result,
            ts: Date.now(),
          };
          savePendingVerify(pending);
          verifyRazorpayPayment(pending, { background: false });
        },
        modal: {
          ondismiss: function () {
            if (state.paymentFlow === "verifying" || state.paymentFlow === "success") {
              state.verifyInBackground = true;
              closeModalOnly();
              showCheckoutToast("Confirming your payment in the background…", "info");
              return;
            }
            state.paymentFlow = "idle";
            clearPendingVerify();
            cancelPendingRazorpayPayment(result, checkoutToken, isGuestPayment);
            var btn = document.getElementById("wc-place-order") || document.getElementById("wc-express-pay");
            if (btn) btn.disabled = false;
          },
        },
      };
      new window.Razorpay(options).open();
    });
  }

  function stepSuccess(orderUuid) {
    WobcartCart.clear();
    saveToken(null);
    renderShell(
      "Order confirmed",
      '<div class="wc-express"><div class="wc-success-icon">✓</div>' +
        '<p class="wc-success-title">Thank you for your order!</p>' +
        (orderUuid ? '<p class="wc-success-sub">Order reference: ' + orderUuid + "</p>" : '<p class="wc-success-sub">We\'ll send you a confirmation shortly.</p>') +
        '<button class="wc-btn wc-btn-pay" id="wc-done">Continue shopping</button>',
      true
    );
    document.getElementById("wc-done").onclick = closeModal;
  }

  function loadAuthenticatedProfile() {
    if (!state.token) {
      renderFullCheckout();
      return;
    }
    request("/express-profile")
      .then(function (profile) {
        state.expressProfile = profile;
        state.user = profile.user;
        state.savedAddresses = profile.saved_addresses || [];
        if (state.savedAddresses.length && !state.selectedAddressUuid && !state.showNewAddress) {
          applySavedAddress(defaultSavedAddress());
        } else if (!state.savedAddresses.length) {
          state.showNewAddress = true;
        }
        if (
          profile.express_eligible &&
          state.config.express_checkout_enabled &&
          state.mode !== "full"
        ) {
          state.paymentMethod = profile.last_payment_method === "cod" ? "cod" : "razorpay";
          renderExpressCheckout();
        } else {
          renderFullCheckout();
        }
      })
      .catch(function () {
        saveToken(null);
        state.token = null;
        state.user = null;
        state.savedAddresses = [];
        renderFullCheckout();
      });
  }

  function tryExpressThenFull() {
    loadAuthenticatedProfile();
  }

  function showCheckoutLoading() {
    renderShell(
      "Secure checkout",
      '<div style="padding:48px 24px;text-align:center;color:#6b7280;font-size:14px">Loading checkout…</div>',
      false,
      "wc-modal--checkout"
    );
  }

  function prefetchCheckoutConfig() {
    if (state.config && state.config.enabled !== undefined) {
      return Promise.resolve(state.config);
    }

    try {
      if (window.__WOBCART_PREFETCHED_CONFIG__) {
        state.config = window.__WOBCART_PREFETCHED_CONFIG__;
        delete window.__WOBCART_PREFETCHED_CONFIG__;
        return Promise.resolve(state.config);
      }
    } catch (e) {}

    return fetch(configUrl)
      .catch(function () {
        throw new Error("Unable to load checkout configuration");
      })
      .then(function (r) {
        return r.json();
      })
      .then(function (json) {
        state.config =
          (json.data || json).enabled !== undefined ? json.data || json : json;
        return state.config;
      });
  }

  function openCheckout(opts) {
    opts = opts || {};
    state.items = opts.items && opts.items.length ? opts.items : loadCart();
    if (!state.items.length) {
      showCheckoutToast("No items to checkout", "error");
      return;
    }
    state.mode = opts.express ? "express" : opts.mode || "auto";
    bootstrapAuthToken();
    state.couponCode = (
      opts.couponCode ||
      opts.coupon ||
      (typeof localStorage !== "undefined"
        ? localStorage.getItem("wobcart_pending_coupon")
        : "") ||
      ""
    ).trim();
    state.availableCoupons = [];
    state.summary = null;
    fetchAvailableCoupons();
    state.showNewAddress = false;
    state.selectedAddressUuid = null;
    state.guestMode = false;
    state.identifyResult = null;
    state.authMethod = "otp";
    state.contactStep = "idle";
    state.paymentFlow = "idle";
    state.verifyInBackground = false;

    showCheckoutLoading();

    prefetchCheckoutConfig()
      .then(function (config) {
        if (!config || !config.enabled) {
          alert("Wobcart Checkout is not available on this store.");
          closeModalOnly();
          return;
        }
        if (state.token) {
          tryExpressThenFull();
        } else {
          renderFullCheckout();
        }
      })
      .catch(function () {
        closeModalOnly();
        alert("Unable to load checkout configuration.");
      });
  }

  var WobcartCart = {
    add: function (item) {
      var items = loadCart();
      var uuid = item.variant_uuid;
      var qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      var found = items.find(function (i) {
        return i.variant_uuid === uuid;
      });
      if (found) found.quantity += qty;
      else items.push({ variant_uuid: uuid, quantity: qty, added_at: Date.now() });
      saveCart(items);
      return items;
    },
    remove: function (variantUuid) {
      var items = loadCart().filter(function (i) {
        return i.variant_uuid !== variantUuid;
      });
      saveCart(items);
      return items;
    },
    update: function (variantUuid, quantity) {
      quantity = parseInt(quantity, 10);
      var items = loadCart();
      if (quantity <= 0) return WobcartCart.remove(variantUuid);
      items.forEach(function (i) {
        if (i.variant_uuid === variantUuid) i.quantity = quantity;
      });
      saveCart(items);
      return items;
    },
    getItems: function () {
      return loadCart();
    },
    count: function () {
      return loadCart().reduce(function (n, i) {
        return n + (parseInt(i.quantity, 10) || 0);
      }, 0);
    },
    clear: function () {
      saveCart([]);
    },
    open: function () {
      state.items = loadCart();
      if (!state.items.length) {
        showCheckoutToast("Your cart is empty", "info");
        return;
      }
      prefetchCheckoutConfig().finally(function () {
        renderCartDrawer();
      });
    },
  };

  window.WobcartCart = WobcartCart;
  window.WobcartCheckout = {
    open: function (opts) {
      openCheckout(opts || {});
    },
    express: function (opts) {
      openCheckout(Object.assign({}, opts || {}, { express: true }));
    },
    setAuthToken: function (token) {
      if (token) saveToken(token);
      else saveToken(null);
    },
    clearAuthToken: function () {
      saveToken(null);
      state.user = null;
      state.savedAddresses = [];
      state.selectedAddressUuid = null;
    },
    syncAuthFromStore: function () {
      return bootstrapAuthToken();
    },
    resumePendingPayment: resumePendingVerification,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", resumePendingVerification);
  } else {
    resumePendingVerification();
  }

  document.addEventListener("click", function (e) {
    var addBtn = e.target.closest("[data-add-to-cart]");
    if (addBtn) {
      e.preventDefault();
      var uuid = addBtn.getAttribute("data-variant-uuid");
      var qty = parseInt(addBtn.getAttribute("data-quantity") || "1", 10);
      if (uuid) WobcartCart.add({ variant_uuid: uuid, quantity: qty });
      return;
    }

    var buyBtn = e.target.closest("[data-buy-now]");
    if (buyBtn) {
      e.preventDefault();
      var items = [];
      try {
        var raw = buyBtn.getAttribute("data-items");
        if (raw) items = JSON.parse(raw);
        else if (buyBtn.getAttribute("data-variant-uuid"))
          items = [{ variant_uuid: buyBtn.getAttribute("data-variant-uuid"), quantity: 1 }];
      } catch (err) {}
      openCheckout({ items: items });
      return;
    }

    var legacy = e.target.closest(".wobcart-checkout-btn");
    if (legacy) {
      e.preventDefault();
      var legacyItems = [];
      try {
        var legacyRaw = legacy.getAttribute("data-items");
        if (legacyRaw) legacyItems = JSON.parse(legacyRaw);
      } catch (err2) {}
      openCheckout({ items: legacyItems });
    }
  });

  updateCartBadges();
  prefetchCheckoutConfig().catch(function () {});
})();
