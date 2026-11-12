# NavConnect

NavConnect is an accessible hospital wayfinding demo for Lakeridge Health
Oshawa. It includes a patient-facing navigation experience and a staff
dashboard for monitoring active navigations, help requests, and route
closures.

## Tools used

- [Next.js](https://nextjs.org/) 16 with the App Router
- [React](https://react.dev/) 19 and [TypeScript](https://www.typescriptlang.org/)
- [Supabase](https://supabase.com/) for shared Postgres state, Realtime
  updates, and Presence
- CSS Modules and global CSS for the interface styling
- [ESLint](https://eslint.org/) with the Next.js configuration for linting
- [npm](https://www.npmjs.com/) for dependency management and project scripts
- [Vercel](https://vercel.com/) for deployment

## Getting started

Install dependencies and start the development server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in a browser. The patient
app is available at `/`, and the staff dashboard is available at
`/staff-dashboard`.

To test the app from a phone on the local network:

```bash
npm run dev -- -H 0.0.0.0
```

## Environment variables

Create a `.env.local` file with the Supabase project values required by the
app:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SECRET_KEY=your-supabase-secret-key
```

Keep the secret key server-side and never expose it with a `NEXT_PUBLIC_`
prefix.

## Useful commands

```bash
npm run lint    # Check the code with ESLint
npm run build   # Create a production build
npm run start   # Run the production build locally
```

Database scripts are also available for Supabase migrations and generated
types:

```bash
npm run db:new -- <name>
npm run db:push
npm run db:status
npm run db:types
```

## Deploying with Vercel

The app is deployed with [Vercel](https://vercel.com/). Import this repository
into a Vercel project, keep the default Next.js build settings, and add the
same Supabase environment variables in the Vercel project settings for the
appropriate environments. Vercel will build the app with `npm run build` and
serve it using Next.js.

Before deploying, run:

```bash
npm run lint
npm run build
```
