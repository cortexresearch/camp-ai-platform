import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHero, Card, Button } from "@/components/ui";
import { signupAction } from "@/lib/actions";
import { getCurrentEpisode, episodeLabel } from "@/lib/season";

export const metadata: Metadata = {
  alternates: { canonical: "/signup" },
  title: "Sign up",
  description:
    "Create a free CampAI account to submit builds, vote, and compete for the season prize.",
};

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const currentEpisode = await getCurrentEpisode();

  return (
    <>
      <PageHero eyebrow={currentEpisode ? episodeLabel(currentEpisode) : "Sign up"} title="Sign up" lede="Create an account to submit a build and rate others." />
      <Container className="py-12">
        <div className="mx-auto max-w-md">
          <Card className="p-6">
            {error && (
              <p className="mb-4 rounded-lg border border-danger-400/40 bg-danger-400/10 px-3.5 py-2.5 text-[13px] text-danger-400">
                {error}
              </p>
            )}
            <form action={signupAction} className="space-y-4">
              <div>
                <span className="field-label">I'm signing up as a</span>
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-ink-700 bg-ink-900/40 px-3.5 py-2.5 text-[13px] text-mist-300 transition-colors has-[:checked]:border-ember-500 has-[:checked]:bg-ember-500/10 has-[:checked]:text-mist-100">
                    <input type="radio" name="role" value="builder" defaultChecked className="sr-only" />
                    Builder
                  </label>
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-ink-700 bg-ink-900/40 px-3.5 py-2.5 text-[13px] text-mist-300 transition-colors has-[:checked]:border-ember-500 has-[:checked]:bg-ember-500/10 has-[:checked]:text-mist-100">
                    <input type="radio" name="role" value="judge" className="sr-only" />
                    Judge
                  </label>
                </div>
              </div>
              <div>
                <label className="field-label" htmlFor="name">Name</label>
                <input className="field-input" id="name" name="name" type="text" required autoComplete="name" />
              </div>
              <div>
                <label className="field-label" htmlFor="handle">Handle</label>
                <input
                  className="field-input"
                  id="handle"
                  name="handle"
                  type="text"
                  placeholder="e.g. jsmith"
                  pattern="[A-Za-z0-9\-]{3,24}"
                  maxLength={24}
                  autoComplete="off"
                />
                <p className="mt-1.5 text-[11.5px] text-mist-700">
                  Your profile URL: campai.cortexresearch.group/u/&lt;handle&gt;. Letters, numbers, hyphens —
                  we'll lowercase it for you. Leave blank to auto-generate.
                </p>
              </div>
              <div>
                <label className="field-label" htmlFor="email">Email</label>
                <input className="field-input" id="email" name="email" type="email" required autoComplete="email" />
              </div>
              <div>
                <label className="field-label" htmlFor="password">Password</label>
                <input
                  className="field-input"
                  id="password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <p className="mt-1.5 text-[11.5px] text-mist-700">At least 8 characters.</p>
              </div>
              <Button type="submit" className="w-full">Create account</Button>
            </form>
            <p className="mt-5 text-center text-[13px] text-mist-500">
              Already have an account? <Link href="/login" className="text-aurora-300 hover:underline">Log in</Link>
            </p>
          </Card>
        </div>
      </Container>
    </>
  );
}
