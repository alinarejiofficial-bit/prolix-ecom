# Lessons & Guidelines

## 1. Do Not Run `next build` While `next dev` Is Actively Running on the Same Directory
- **Issue**: Running `next build` overwrites the active `.next/` build directory with production artifacts. When a developer has `next dev` running on port 3000 in another terminal, this desynchronizes Next.js development manifests.
- **Symptom**: Fast Refresh fails and throws `Runtime TypeError: Cannot read properties of undefined (reading 'call')` with `Next.js ... (outdated) Webpack` because Webpack's module ID map in `.next/cache` has corrupted references between the production build and the dev server.
- **Fix**: 
  1. Stop the running dev server.
  2. Fully delete the `.next` directory (`Remove-Item -Recurse -Force .next`).
  3. Start `npx next dev -p 3000` with a clean slate.
- **Rule**: Never run `next build` in the same directory while testing with `next dev`. If `next build` is ever executed, immediately wipe `.next/` before resuming `next dev`.

## 2. Respect Feature Flags & Keep Changes Minimal
- **Pattern**: When a section or feature is gated behind an admin module toggle (e.g., `isModuleEnabled("contact_messages")`), do NOT unilaterally bypass or remove the feature flag. The admin panel explicitly allows the merchant to toggle features on or off.
- **Rule**: Always honor `isModuleEnabled(...)` so the admin panel remains in full control. When a feature is disabled by the merchant, design clean, elegant fallback UI without bypassing their intent or adding hundreds of lines of unsolicited markup. Keep code minimal and clean.

## 3. Safe API Response Parsing & Dev SSL Expiration Handling
- **Issue**: Calling `response.json()` unconditionally on non-200 responses (e.g. 500 Internal Server Error, 502) throws `SyntaxError: Unexpected token 'I', "Internal S"... is not valid JSON`. If an upstream domain's SSL certificate expires (`CERT_HAS_EXPIRED`), Next.js's dev proxy fails with 500.
- **Rule**:
  1. Always verify `response.ok` before attempting `response.json()`. If not OK, safely extract error message from JSON/text without crashing the parser.
  2. Avoid rendering raw unhandled red exception strings into customer-facing storefront carousels; handle gracefully or hide failing carousels.
## 4. Prevent Hydration Mismatches with Browser Storage (`localStorage` / `window`)
- **Issue**: Initializing React state directly from browser-only storage (`useState(() => localStorage.getItem(...) || [])`) causes a hard **Hydration Error** in Next.js. The server renders the initial fallback state (e.g. skeleton), while the client synchronously renders the stored data during hydration.
- **Symptom**: Next.js throws `Recoverable Error: Hydration failed because the server rendered HTML didn't match the client`. React then tears down the entire component tree from the DOM and recreates it on the client, resulting in a visible double-flash / blank flicker.
- **Rule**:
  1. Never initialize `useState` from `localStorage` or browser-only APIs in SSR-rendered client components. Initial state in `useState` must be identical between server and client.
  2. Read cached browser storage inside `useEffect` immediately on client mount. Because `useEffect` runs only after hydration is complete, updating state here transitions smoothly without triggering hydration errors or DOM tree regeneration.
