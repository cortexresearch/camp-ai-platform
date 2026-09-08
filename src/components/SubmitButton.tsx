"use client";

import { useFormStatus } from "react-dom";
import { Button } from "./ui";

export function SubmitButton({
  children,
  pendingLabel,
  className = "",
}: {
  children: string;
  pendingLabel: string;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`${className} ${pending ? "cursor-not-allowed opacity-60" : ""}`}
    >
      {pending ? pendingLabel : children}
    </Button>
  );
}
