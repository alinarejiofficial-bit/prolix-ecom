# Tasks: Homepage Visual Enhancements (Running Bar, Big Offers, 3-Image Lookbook, Reviews)

- [x] Task 1: Research & Plan Homepage Visual Enhancements <!-- id: hp-plan -->
  - [x] Analyze provided user screenshots and component structure (`HomeAnnouncements.jsx`, `Banner.jsx`, `Collections.jsx`, `Testimonials.jsx`) <!-- id: hp-plan-1 -->
  - [x] Create `implementation_plan.md` artifact detailing designs and CSS architecture for all 4 sections <!-- id: hp-plan-2 -->
  - [x] Obtain user approval before executing code changes <!-- id: hp-plan-3 -->

- [x] Task 2: Enhance Running Announcement Bar (`HomeAnnouncements.jsx`) <!-- id: hp-bar -->
  - [x] Implement seamless dual-track infinite marquee ticker with zero gaps or jumps <!-- id: hp-bar-1 -->
  - [x] Add premium styling (subtle dark/contrast background, refined typography, glowing accent icons, edge fade masks) <!-- id: hp-bar-2 -->
  - [x] Enhance coupon copy chips with interactive click-to-copy and toast feedback <!-- id: hp-bar-3 -->

- [x] Task 3: Redesign Big Offers Section (`Banner.jsx`) <!-- id: hp-offer -->
  - [x] Remove hardcoded asymmetric positioning (`left: 25.3%`) and uneven heights <!-- id: hp-offer-1 -->
  - [x] Build balanced dual-image layout with centered luxury offer card (frosted glass/elevated card) <!-- id: hp-offer-2 -->
  - [x] Integrate discount tag, responsive countdown timer, bold headline, and animated CTA button <!-- id: hp-offer-3 -->
  - [x] Maintain responsive stacked mobile layout with zero horizontal overflow <!-- id: hp-offer-4 -->

- [x] Task 4: Upgrade 3-Image Promo / Lookbook Section (`Collections.jsx`) <!-- id: hp-promo -->
  - [x] Establish uniform aspect ratios, modern rounded corners (`border-radius: 20px`), and smooth hover zoom <!-- id: hp-promo-1 -->
  - [x] Add protective gradient overlays to ensure text readability across any image brightness <!-- id: hp-promo-2 -->
  - [x] Add floating glassmorphism discount badges (`offer_text`) and ensure all cards have elegant CTA buttons (with smart fallbacks) <!-- id: hp-promo-3 -->
  - [x] Upgrade interactive lookbook hotspot pin with animated pulse and polished product popover <!-- id: hp-promo-4 -->

- [x] Task 5: Redesign Reviews / Testimonials Section (`Testimonials.jsx`) <!-- id: hp-reviews -->
  - [x] Implement adaptive layout: Featured Spotlight Card when 1 review exists vs balanced grid/carousel when multiple exist <!-- id: hp-reviews-1 -->
  - [x] Elevate review card design: golden stars, decorative quotation mark watermark, "Verified Buyer" badge, elegant typography <!-- id: hp-reviews-2 -->
  - [x] Fix empty 2/3 white space on desktop by centering single/few testimonials <!-- id: hp-reviews-3 -->

- [x] Task 6: Verification & Visual Polish <!-- id: hp-verify -->
  - [x] Check console and Next.js dev server for errors <!-- id: hp-verify-1 -->
  - [x] Verify responsiveness across mobile (375px), tablet (768px), and desktop (1280px+) <!-- id: hp-verify-2 -->
  - [x] Verify hover states, marquee infinite loop smoothness, copy actions, and transitions <!-- id: hp-verify-3 -->

# Tasks: User Feedback Refinements (Marquee Ribbon, Compact Offer Section, Multi-Review Carousel)

- [x] Task 7: Harmonize Running Bar with Hero Banner <!-- id: refine-bar -->
  - [x] Adjust running bar into a containerized luxury ribbon/pill with refined light/dark theme matching the rounded hero banner <!-- id: refine-bar-1 -->
  - [x] Enrich short announcement messages (e.g. "hello") with elegant editorial store highlights <!-- id: refine-bar-2 -->

- [x] Task 8: Scale Down & Compact Big Offers Section <!-- id: refine-offer -->
  - [x] Reduce offer image heights from 520px to sleek 380px <!-- id: refine-offer-1 -->
  - [x] Proportionately scale down center card padding, font sizes, and vertical margins <!-- id: refine-offer-2 -->

- [x] Task 10: Slow down marquee ticker & enforce 100% real backend data <!-- id: marquee-speed -->
  - [x] Adjusted ticker animation speed from 32s to a relaxed, smooth 58s <!-- id: marquee-speed-1 -->
  - [x] Removed synthetic text enrichment so only real announcements from `/customer/home-announcements` are displayed <!-- id: marquee-speed-2 -->

- [x] Task 12: Generate & Curate Premium Fashion Images for Admin Upload <!-- id: admin-images -->
  - [x] Created `admin_upload_images/` in project root and `public/images/admin_presets/` <!-- id: admin-images-1 -->
  - [x] Provided 8 curated high-fashion editorial images optimized for Offers, Lookbook cards, and Hero banners <!-- id: admin-images-2 -->
  - [x] Verified static asset resolution and accessibility via local HTTP server <!-- id: admin-images-3 -->


# Tasks: Minimal Modern Collections Section Redesign (Screenshot 2 Aesthetic)

- [x] Task 1: Research & Plan Minimal Modern Collections Redesign <!-- id: minimal-col-plan -->
  - [x] Analyze provided user screenshots (rounded pill cards vs Byredo-style square editorial layout) <!-- id: minimal-col-plan-1 -->
  - [x] Create `implementation_plan.md` artifact detailing layout, typography, responsiveness, and component architecture <!-- id: minimal-col-plan-2 -->
  - [x] Obtain user approval before executing code changes <!-- id: minimal-col-plan-3 -->

- [x] Task 2: Implement Editorial Minimal SCSS Styles (`public/scss/custom.scss`) <!-- id: minimal-col-scss -->
  - [x] Build `.wc-minimal-collections` styles: sidebar "DISCOVER" label, tight grid gap (8px-12px), sharp square aspect ratio (1:1), zero border radius <!-- id: minimal-col-scss-1 -->
  - [x] Add editorial typography styles (padded 2-digit index `01`, tracked uppercase titles, subtle hover zoom, micro-interactions) <!-- id: minimal-col-scss-2 -->
  - [x] Ensure seamless responsive behavior across mobile (2 columns), tablet (3 columns), and desktop (4-5 columns) <!-- id: minimal-col-scss-3 -->

- [x] Task 3: Redesign Collections Component (`components/products/Collections.jsx`) <!-- id: minimal-col-comp -->
  - [x] Refactor markup into editorial layout with "DISCOVER" side/top label and square image tiles <!-- id: minimal-col-comp-1 -->
  - [x] Render 2-digit index (`01`, `02`...) and uppercase collection title aligned on opposite ends <!-- id: minimal-col-comp-2 -->
  - [x] Harmonize item counts and hover states (subtle, non-intrusive, zero clutter) <!-- id: minimal-col-comp-3 -->
  - [x] Modernize pagination to match minimal aesthetic <!-- id: minimal-col-comp-4 -->

- [x] Task 4: Harmonize Skeleton Loader & Homepage Collections <!-- id: minimal-col-harm -->
  - [x] Update `CollectionsSkeleton` in `SectionSkeletons.jsx` to reflect 1:1 square ratio and editorial grid <!-- id: minimal-col-harm-1 -->
  - [x] Harmonize `HomeCategories.jsx` on homepage with matching minimal modern styling <!-- id: minimal-col-harm-2 -->

- [x] Task 5: Verification & Visual Polish <!-- id: minimal-col-verify -->
  - [x] Verify on `/shop-collection` and homepage across viewport sizes <!-- id: minimal-col-verify-1 -->
  - [x] Check image fallback handling, empty states, and error resilience <!-- id: minimal-col-verify-2 -->

# Tasks: Universal Site Font Rollout (Kumbh Sans)

- [x] Task 7: Apply Kumbh Sans Across Entire Store <!-- id: kumbh-sans-rollout -->
  - [x] Update all SCSS variables (`$font-main`, `$font-2`, `$font-3`, `$font-4`, `$font-5`) in `_variable.scss` to "Kumbh Sans" <!-- id: kumbh-sans-rollout-1 -->
  - [x] Update `_reset.scss` and `_form.scss` to use Kumbh Sans across all typography classes and form inputs <!-- id: kumbh-sans-rollout-2 -->
  - [x] Add universal site typography rule in `custom.scss` to enforce Kumbh Sans across headings, nav, cards, and buttons while preserving icon fonts <!-- id: kumbh-sans-rollout-3 -->
  - [x] Verify compiled CSS bundle contains Kumbh Sans font rules <!-- id: kumbh-sans-rollout-4 -->
# Tasks: Section Harmonization & Admin Toggle Self-Containment

- [x] Task 8: Harmonize Categories Section & Bind to Admin Feature Flags <!-- id: harm-cat-admin -->
  - [x] Integrate full section header ("Shop by Category" / "Browse our curated seasonal collections") into `HomeCategories.jsx` and `Collections.jsx` <!-- id: harm-cat-admin-1 -->
  - [x] Switch aspect ratio from square (1:1) to fashion portrait (`3:4`) to preserve models' heads and bodies <!-- id: harm-cat-admin-2 -->
  - [x] Refine bottom labeling into an elegant, cohesive presentation without wide empty voids <!-- id: harm-cat-admin-3 -->
  - [x] Bind component strictly to `isModuleEnabled("content")` and `isFeatureEnabled("home_collections")` with full self-containment (zero orphan pieces or layout gaps when toggled off or empty) <!-- id: harm-cat-admin-4 -->
  - [x] Verify toggle behavior, SSR, and responsive rendering <!-- id: harm-cat-admin-5 -->

## Review & Verification
- **Admin Toggle Self-Containment**:
  - `HomeCategories.jsx` and `Collections.jsx` are fully self-contained. The outer `<section>`, `parentClass`, container, heading, subtitle, grid, cards, and skeleton loaders are all encapsulated within the component.
  - When admin disables the module (`content` or `home_collections`) or when categories are empty/error, `return null` is executed immediately. Zero DOM nodes, orphan headers, or whitespace gaps remain on the page.
  - When enabled, the full section (header, subtitle, 4 cards in portrait 3:4 ratio, index badges, and interactive hover states) renders seamlessly in place.
- **Section Harmonization**:
  - Consistent section header (`Shop by Category` / `Browse our curated seasonal collections`) added using standard `.heading-section` markup.
  - Aspect ratio updated to `3:4` fashion portrait with `border-radius: 14px` and subtle card border/shadow matching the store theme.
  - Bottom metadata features clean 2-digit index chip (`01`, `02`, etc.), uppercase tracked category name, and subtle hover arrow (`↗`).
- **Site Typography**:
  - Universal **Kumbh Sans** font applied across all variables, headings, body, cards, and inputs while safely preserving font icons.

# Tasks: Refine Offers Section & 3-Photo Curated Collections

- [x] Task 9: Refine Offers Section (`Banner.jsx`) & Redesign 3-Photo Collections (`Collections.jsx`) <!-- id: refine-offers-lookbook -->
  - [x] Fix "Weird Dot" on second image by removing the broken hotspot pin element (`.wc-hotspot-pin`) <!-- id: refine-offers-lookbook-1 -->
  - [x] Format raw backend strings in 3-photo cards (`50 percentage off` -> `50% OFF`, title case for titles and buttons) <!-- id: refine-offers-lookbook-2 -->
  - [x] Add unified section heading (`Curated Collections` / `Explore our seasonal edits and handpicked trending styles`) to the 3-photo section <!-- id: refine-offers-lookbook-3 -->
  - [x] Elevate 3-photo card design (cinematic lighting gradient, sleek glassmorphic discount badges, refined Kumbh Sans typography, modern pill CTA buttons) <!-- id: refine-offers-lookbook-4 -->
  - [x] Redesign Offers Section (`Banner.jsx`): Replace cartoonish yellow badge with elegant minimalist chip, format titles/subtitles with title case, upgrade frosted glassmorphism card, and give photos natural breathing room <!-- id: refine-offers-lookbook-5 -->
  - [x] Harmonize spacing between Shop by Category, Offers Section, and New Arrivals <!-- id: refine-offers-lookbook-6 -->
  - [x] Verify both sections visually and test across mobile, tablet, and desktop viewports <!-- id: refine-offers-lookbook-7 -->

# Tasks: Category Slider Implementation

- [x] Task 10: Implement Responsive Slider for Homepage Categories (`HomeCategories.jsx`) <!-- id: cat-slider -->
  - [x] Replace static grid with Swiper carousel (`Pagination`, `Navigation`) in `HomeCategories.jsx` <!-- id: cat-slider-1 -->
  - [x] Configure responsive breakpoints: 2 slides on mobile, 2.5 on small tablets, 3 on tablets, 4 on desktop <!-- id: cat-slider-2 -->
  - [x] Add auto-locking: seamlessly displays 4 cards when 4 exist, slides smoothly with dots and navigation arrows when 5+ categories exist <!-- id: cat-slider-3 -->
  - [x] Add SCSS styles for category slider wrapper, hover navigation arrows, and pagination dots in `custom.scss` <!-- id: cat-slider-4 -->
  - [x] Verify slider functionality on localhost across viewports <!-- id: cat-slider-5 -->

# Tasks: Fix Double Flashing & Delayed Pop-in (HomeCategories & Banner)

- [x] Task 11: Eliminate Double Flashing & Make Categories Section Native/Instant <!-- id: fix-double-flash -->
  - [x] Add in-memory category caching in `services/categoryService.js` with `getCachedCategories` <!-- id: fix-double-flash-1 -->
  - [x] Refactor `HomeCategories.jsx`: remove `useIntersectionObserver` (fetch on mount) and remove `useWowRefresh` + `wow fadeInUp` <!-- id: fix-double-flash-2 -->
  - [x] Render stable static heading directly (avoiding gray flashing placeholder bars) and initialize state from cached categories <!-- id: fix-double-flash-3 -->
  - [x] Clean up WOW.js classes in `Banner.jsx` and `Collections.jsx` to prevent sibling section flicker <!-- id: fix-double-flash-4 -->
  - [x] Verify clean, instant, flicker-free rendering on localhost <!-- id: fix-double-flash-5 -->

# Tasks: Fix Hero Banner Double Flashing & Delayed Pop-in (Hero.jsx)

- [x] Task 12: Eliminate Double Flash on Hero Banner Image (`Hero.jsx`) <!-- id: fix-hero-flash -->
  - [x] Add in-memory and local storage caching in `services/bannerService.js` for `bannerSliders` <!-- id: fix-hero-flash-1 -->
  - [x] Refactor `Hero.jsx`: initialize state from cache synchronously so image is **already there** at frame 0 <!-- id: fix-hero-flash-2 -->
  - [x] Replace mismatched `BannerSliderSkeleton` with seamless 16:9 rounded container matching the hero banner frame <!-- id: fix-hero-flash-3 -->
  - [x] Upgrade Swiper to `EffectFade` with `crossFade: true` and `speed={700}` to prevent slide cloning flicker <!-- id: fix-hero-flash-4 -->
  - [x] Add deep brown `#2b1f1a` background to `.wc-hero-frame` in `custom.scss` to prevent white underline flash <!-- id: fix-hero-flash-5 -->
  - [x] Verify instant, seamless, zero-flash rendering on localhost <!-- id: fix-hero-flash-6 -->

# Tasks: Slow Down Announcement Marquee Speed (HomeAnnouncements.jsx)

- [x] Task 13: Calm & Slow Down Announcement Marquee Ticker Speed <!-- id: slow-marquee -->
  - [x] Optimize repeat multiplier in `HomeAnnouncements.jsx` so track width doesn't excessively inflate linear velocity <!-- id: slow-marquee-1 -->
  - [x] Increase animation duration to relaxed 110s (~35px/s) for effortless, elegant reading <!-- id: slow-marquee-2 -->
  - [x] Update fallback CSS rule in `custom.scss` to 110s <!-- id: slow-marquee-3 -->
  - [x] Verify smooth, gentle gliding on localhost <!-- id: slow-marquee-4 -->

## Review & Verification
- **Marquee Speed Optimization**:
  - Previously, when only 1 announcement was returned (e.g. `"EVERY PRODUCTS AT 50 PERCENTAGE OFF AS PART OF SUMMER SALE"`), the track was repeated 24 times, creating an enormous ~13,500px track width. Over an 85s duration, this forced the text to scroll at ~155px/second, making it fly past too quickly to read.
  - Reduced repeat multiplier to a balanced 6-8 items per track (~3,800px width) and increased the scroll duration to `110s`.
  - Linear velocity is now slowed down to a calm, readable **~35px/second** (more than 4x slower). Customers can effortlessly read the announcement as it gently glides across the pill.

# Tasks: Product Card Modernization & Visual Polish (ProductCard1.jsx)

- [x] Task 14: Modernize Product Card (Zara / SSENSE Editorial Style) <!-- id: modernize-product-card -->
  - [x] Modern Luxury Slide-Up Action: Removed the giant permanent black button from card-product-info, added a sleek slide-up pill over the image on card hover <!-- id: modernize-product-card-1 -->
  - [x] Price Hierarchy: Reordered price layout to display bold selling price first (`₹3,499`), followed by muted strikethrough MRP (`₹5,599`) <!-- id: modernize-product-card-2 -->
  - [x] Upgraded Discount Badge: Replaced the supermarket-style green badge with a frosted matte-black pill (`rgba(18, 18, 18, 0.88)` with backdrop-filter blur) <!-- id: modernize-product-card-3 -->
  - [x] Upgraded Wishlist Button: Added glassmorphic frosted white circular button with micro-interaction hover zoom <!-- id: modernize-product-card-4 -->
  - [x] Touch & Mobile Support: Ensured slide-up action is accessible on mobile/touch screens without layout breakage <!-- id: modernize-product-card-5 -->
  - [x] Synchronized List View: Applied matching price hierarchy (`formatInr`, selling price first) to `ProductsCards6.jsx` <!-- id: modernize-product-card-6 -->

  - [x] Wishlist Circle Fix: Enforced strict 1:1 aspect ratio (`aspect-ratio: 1 / 1 !important`, `width: 38px !important`, `height: 38px !important`, `flex: 0 0 38px !important`, `padding: 0 !important`, `overflow: hidden`) preventing browser flex or responsive overrides from turning it into an oval <!-- id: modernize-product-card-7 -->
  - [x] Variant Options Priority: Multi-variant products now consistently display "Select Options" rather than showing "Added" when one variant is in cart, ensuring customers can freely choose their size/options <!-- id: modernize-product-card-8 -->

## Review & Verification (Task 14)
- **Wishlist Circle**:
  - The wishlist button now has strict `width: 38px; height: 38px; aspect-ratio: 1 / 1 !important; border-radius: 50% !important; padding: 0 !important;` guaranteeing a 100% mathematically round circle across all screen viewports without vertical stretching.
- **Button Clarity**:
  - Products with variants (`hasVariants: true`, e.g. sizes M/L/XL/XXL) now properly display **"Select Options"** so users can choose sizes without confusion.
  - Guarded `isAddedToCartProducts` against `!id` to prevent any unintended match.




