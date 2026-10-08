This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the   development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Google Sign-In Setup

To enable Google Sign-In functionality, you need to:

1. **Get a Google OAuth Client ID:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google+ API
   - Go to "Credentials" and create an OAuth 2.0 Client ID

2. **Configure Authorized Origins (IMPORTANT):**
   - In Google Cloud Console, edit your OAuth 2.0 Client ID
   - Under **"Authorized JavaScript origins"**, add:
     - `http://localhost:3000` (for local development)
     - `https://your-production-domain.com` (for production)
   - Under **"Authorized redirect URIs"**, add:
     - `http://localhost:3000` (for local development)
     - `https://your-production-domain.com` (for production)
   - **Save** the changes

3. **Add the Client ID to your environment variables:**
   - Create a `.env.local` file in the root directory
   - Add: `NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id_here`

4. **The Google Sign-In button will appear in the Auth Modal** once the client ID is configured.

**Note:** If you see "no registered origin" error, it means you haven't added the authorized JavaScript origins in step 2 above.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# wobcart
