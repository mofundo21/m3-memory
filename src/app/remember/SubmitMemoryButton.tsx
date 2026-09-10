"use client";

import { useFormStatus } from "react-dom";

export function SubmitMemoryButton() {
  const { pending } = useFormStatus();

  return (
    <button className="primary-action" type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? "Saving memory..." : "Share this memory"}
    </button>
  );
}
