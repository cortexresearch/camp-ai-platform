import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHero, Card, Button } from "@/components/ui";
import { requestPasswordResetAction } from "@/lib/actions";

export const metadata: Metadata = { title: "Forgot password" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string }>;
}) {
  const { sent } = await searchParams;

  return (
    <>
      <PageHero
        eyebrow="Account recovery"
        title="Forgot your password?"
        lede="Enter your email and we'll send you a link to reset it."
      />
      <Container className="py-12">
        <div className="mx-auto max-w-md">
          <Card className="p-6">
            {sent ? (
              <p className="text-[13.5px] leading-relaxed text-mist-300">
                If an account exists for that email, we&apos;ve sent a password reset link. Check your
                inbox (and spam folder) — the link expires in 1 hour.
              </p>
            ) : (
              <form action={requestPasswordResetAction} className="space-y-4">
                <div>
                  <label className="field-label" htmlFor="email">Email</label>
                  <input className="field-input" id="email" name="email" type="email" required autoComplete="email" />
                </div>
                <Button type="submit" className="w-full">Send reset link</Button>
              </form>
            )}
            <p className="mt-5 text-center text-[13px] text-mist-500">
              <Link href="/login" className="text-aurora-300 hover:underline">Back to log in</Link>
            </p>
          </Card>
        </div>
      </Container>
    </>
  );
}
