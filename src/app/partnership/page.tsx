import type { Metadata } from "next";
import { Container, PageHero, Card, Button } from "@/components/ui";
import { submitPartnerInquiryAction } from "@/lib/actions";

export const metadata: Metadata = {
  alternates: { canonical: "/partnership" },
  title: "Partner with us",
  description: "Interested in sponsoring CampAI? Tell us about your company and what you have in mind.",
};

export default async function PartnershipPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; submitted?: string }>;
}) {
  const { error, submitted } = await searchParams;

  return (
    <>
      <PageHero
        eyebrow="Partner with 🏕️ AI"
        title="Let's talk"
        lede="Interested in sponsoring a challenge, providing prizes, or getting your tool in front of builders? Tell us a bit about what you have in mind and we'll follow up."
      />
      <Container className="py-12">
        <div className="mx-auto max-w-lg">
          {submitted ? (
            <Card className="p-8 text-center">
              <p className="font-display text-lg font-semibold text-mist-100">Thanks — got it.</p>
              <p className="mt-2 text-[14px] leading-relaxed text-mist-500">
                We&apos;ll review your inquiry and follow up at the email you gave us.
              </p>
            </Card>
          ) : (
            <Card className="p-6 sm:p-8">
              {error && (
                <p className="mb-5 rounded-lg border border-danger-400/40 bg-danger-400/10 px-3.5 py-2.5 text-[13px] text-danger-400">
                  {error}
                </p>
              )}
              <form action={submitPartnerInquiryAction} className="space-y-4">
                <div>
                  <label className="field-label" htmlFor="company_name">Company</label>
                  <input className="field-input" id="company_name" name="company_name" type="text" required />
                </div>
                <div>
                  <label className="field-label" htmlFor="contact_name">Your name</label>
                  <input className="field-input" id="contact_name" name="contact_name" type="text" required />
                </div>
                <div>
                  <label className="field-label" htmlFor="email">Email</label>
                  <input className="field-input" id="email" name="email" type="email" required />
                </div>
                <div>
                  <label className="field-label" htmlFor="website_url">Website (optional)</label>
                  <input className="field-input" id="website_url" name="website_url" type="url" placeholder="https://" />
                </div>
                <div>
                  <label className="field-label" htmlFor="interest">What are you interested in?</label>
                  <select className="field-input" id="interest" name="interest" defaultValue="sponsorship">
                    <option value="sponsorship">Sponsoring a challenge</option>
                    <option value="prizes">Providing prizes</option>
                    <option value="tool-placement">Getting a tool in front of builders</option>
                    <option value="other">Something else</option>
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="message">Tell us more (optional)</label>
                  <textarea className="field-input" id="message" name="message" rows={4} />
                </div>
                <Button type="submit" className="w-full">Send inquiry</Button>
              </form>
            </Card>
          )}
        </div>
      </Container>
    </>
  );
}
