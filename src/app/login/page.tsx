import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHero, Card, Button } from "@/components/ui";
import { loginAction } from "@/lib/actions";
import { getCurrentEpisode, episodeLabel } from "@/lib/season";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { error, success } = await searchParams;
  const currentEpisode = await getCurrentEpisode();

  return (
    <>
      <PageHero eyebrow={currentEpisode ? episodeLabel(currentEpisode) : "Log in"} title="Log in" lede="Welcome back." />
      <Container className="py-12">
        <div className="mx-auto max-w-md">
          <Card className="p-6">
            {error && (
              <p className="mb-4 rounded-lg border border-danger-400/40 bg-danger-400/10 px-3.5 py-2.5 text-[13px] text-danger-400">
                {error}
              </p>
            )}
            {success && (
              <p className="mb-4 rounded-lg border border-signal-400/40 bg-signal-400/10 px-3.5 py-2.5 text-[13px] text-signal-400">
                {success}
              </p>
            )}
            <form action={loginAction} className="space-y-4">
              <div>
                <label className="field-label" htmlFor="email">Email</label>
                <input className="field-input" id="email" name="email" type="email" required autoComplete="email" />
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <label className="field-label" htmlFor="password">Password</label>
                  <Link href="/forgot-password" className="text-[12px] text-aurora-300 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <input
                  className="field-input"
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full">Log in</Button>
            </form>
            <p className="mt-5 text-center text-[13px] text-mist-500">
              New here? <Link href="/signup" className="text-aurora-300 hover:underline">Sign up</Link>
            </p>
          </Card>
        </div>
      </Container>
    </>
  );
}
