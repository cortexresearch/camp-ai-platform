import type { Metadata } from "next";
import Link from "next/link";
import { Container, PageHero, Card, Button } from "@/components/ui";
import { resetPasswordAction } from "@/lib/actions";

export const metadata: Metadata = { title: "Reset password" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  return (
    <>
      <PageHero eyebrow="Account recovery" title="Reset your password" lede="Choose a new password." />
      <Container className="py-12">
        <div className="mx-auto max-w-md">
          <Card className="p-6">
            {error && (
              <p className="mb-4 rounded-lg border border-danger-400/40 bg-danger-400/10 px-3.5 py-2.5 text-[13px] text-danger-400">
                {error}
              </p>
            )}
            {!token ? (
              <p className="text-[13.5px] leading-relaxed text-mist-300">
                Missing reset token. Request a new link from the{" "}
                <Link href="/forgot-password" className="text-aurora-300 hover:underline">
                  forgot password
                </Link>{" "}
                page.
              </p>
            ) : (
              <form action={resetPasswordAction} className="space-y-4">
                <input type="hidden" name="token" value={token} />
                <div>
                  <label className="field-label" htmlFor="new_password">New password</label>
                  <input
                    className="field-input"
                    id="new_password"
                    name="new_password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="field-label" htmlFor="confirm_password">Confirm new password</label>
                  <input
                    className="field-input"
                    id="confirm_password"
                    name="confirm_password"
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                <Button type="submit" className="w-full">Reset password</Button>
              </form>
            )}
          </Card>
        </div>
      </Container>
    </>
  );
}
