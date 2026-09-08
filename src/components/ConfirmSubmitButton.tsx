"use client";

import type { ReactNode } from "react";
import { Button } from "./ui";

export function ConfirmSubmitButton({
  children,
  confirmMessage,
  formAction,
  variant = "primary",
  size = "md",
  className = "",
}: {
  children: ReactNode;
  confirmMessage: string;
  formAction?: (formData: FormData) => void;
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  return (
    <Button
      type="submit"
      formAction={formAction}
      variant={variant}
      size={size}
      className={className}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {children}
    </Button>
  );
}
