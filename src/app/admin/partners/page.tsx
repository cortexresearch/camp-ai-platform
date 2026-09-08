import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container, PageHero, Card, Pill, Button, EmptyState, Stat } from "@/components/ui";
import { AdminNav } from "@/components/AdminNav";
import { getCurrentUser } from "@/lib/auth";
import { pool } from "@/lib/db";
import { updatePartnerInquiryStatusAction } from "@/lib/actions";

export const metadata: Metadata = { title: "Partner inquiries" };
export const dynamic = "force-dynamic";

interface PartnerInquiry {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  website_url: string;
  interest: "sponsorship" | "prizes" | "tool-placement" | "other";
  message: string;
  status: "new" | "contacted" | "closed";
  created_at: string;
}

const INTEREST_LABEL: Record<PartnerInquiry["interest"], string> = {
  sponsorship: "Sponsoring a challenge",
  prizes: "Providing prizes",
  "tool-placement": "Tool placement",
  other: "Other",
};

const STATUS_TONE: Record<PartnerInquiry["status"], "ember" | "aurora" | "neutral"> = {
  new: "ember",
  contacted: "aurora",
  closed: "neutral",
};

export default async function AdminPartnersPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!user.is_admin) redirect("/builds");

  const result = await pool.query<PartnerInquiry>(
    `select id, company_name, contact_name, email, website_url, interest, message, status, created_at
     from partner_inquiries order by created_at desc`
  );
  const inquiries = result.rows;
  const newCount = inquiries.filter((i) => i.status === "new").length;

  return (
    <>
      <PageHero
        eyebrow="Admin"
        title="Partner inquiries"
        lede="Everyone who's reached out about sponsoring, prizes, or getting a tool in front of builders."
      />
      <Container className="py-12">
        <div className="mx-auto max-w-3xl space-y-6">
          <AdminNav active="partners" />

          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
            <Stat label="Total" value={inquiries.length} />
            <Stat label="New" value={newCount} tone="ember" />
            <Stat label="Contacted" value={inquiries.filter((i) => i.status === "contacted").length} tone="aurora" />
          </div>

          {inquiries.length === 0 ? (
            <EmptyState title="No inquiries yet" body="Submissions from the partnership page will show up here." />
          ) : (
            <div className="space-y-4">
              {inquiries.map((inq) => (
                <Card key={inq.id} className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-[15px] font-semibold text-mist-100">{inq.company_name}</p>
                      <p className="mt-0.5 text-[12.5px] text-mist-500">
                        {inq.contact_name} · <a href={`mailto:${inq.email}`} className="text-aurora-300 hover:underline">{inq.email}</a>
                      </p>
                      {inq.website_url && (
                        <a href={inq.website_url} target="_blank" rel="noopener noreferrer" className="mt-0.5 inline-block text-[12.5px] text-aurora-300 hover:underline">
                          {inq.website_url} ↗
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Pill tone={STATUS_TONE[inq.status]}>{inq.status}</Pill>
                      <Pill tone="neutral">{INTEREST_LABEL[inq.interest]}</Pill>
                    </div>
                  </div>

                  {inq.message && (
                    <p className="mt-3 text-[13px] leading-relaxed text-mist-500">{inq.message}</p>
                  )}

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-mist-700">
                      {new Date(inq.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                    </p>
                    <form action={updatePartnerInquiryStatusAction} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={inq.id} />
                      <select
                        className="field-input !w-auto !py-1.5 text-[12.5px]"
                        name="status"
                        defaultValue={inq.status}
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="closed">Closed</option>
                      </select>
                      <Button type="submit" size="sm" variant="secondary">Update</Button>
                    </form>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </Container>
    </>
  );
}
