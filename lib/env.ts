// Public Supabase settings, safe to use in both browser and server code.
// Each variable is read as a literal `process.env.NEXT_PUBLIC_*` so Next.js can inline it into the browser bundle.

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Add it to .env.local and to your hosting provider's environment settings.`,
    );
  }
  return value;
}

export const supabaseUrl = required(
  "NEXT_PUBLIC_SUPABASE_URL",
  process.env.NEXT_PUBLIC_SUPABASE_URL,
);

export const supabasePublishableKey = required(
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);
