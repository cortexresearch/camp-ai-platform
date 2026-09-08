"use client";

import { useState } from "react";
import { Button, Card, Pill, DemoNote } from "@/components/ui";

const TOPICS = ["General", "Builder support", "Partnership", "Press", "Judge application", "Code of conduct report"];

const FIELD_CLASS =
  "w-full rounded-lg border border-ink-600 bg-ink-850 px-3.5 py-2.5 text-[16px] text-mist-100 placeholder:text-mist-700 focus:border-ember-500/50 focus:outline-none focus:ring-1 focus:ring-ember-500/30 sm:text-[13.5px]";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <Card className="p-8 text-center">
        <Pill tone="signal">Message received</Pill>
        <h2 className="mt-4 font-display text-lg font-semibold text-mist-100">
          Thanks, {name || "there"} — we've got it.
        </h2>
        <p className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-mist-500">
          This demo doesn&apos;t send or persist messages anywhere. In the real product this routes to the{" "}
          {topic.toLowerCase()} queue and the production team replies from there.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
        className="space-y-5"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-mist-100">Name</span>
            <input required value={name} onChange={(e) => setName(e.target.value)} className={FIELD_CLASS} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-medium text-mist-100">Email</span>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={FIELD_CLASS}
            />
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-mist-100">Topic</span>
          <select value={topic} onChange={(e) => setTopic(e.target.value)} className={FIELD_CLASS}>
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-medium text-mist-100">Message</span>
          <textarea
            required
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={FIELD_CLASS}
          />
        </label>

        <DemoNote>Demonstration form — submitting doesn&apos;t send anything or persist to a backend.</DemoNote>

        <Button type="submit" className="w-full sm:w-auto">
          Send message
        </Button>
      </form>
    </Card>
  );
}
