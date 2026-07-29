"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ fallbackHref = "/prospects" }: { fallbackHref?: string }) {
  const router = useRouter();

  function handleClick() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-sm text-muted-foreground transition-colors hover:text-primary"
    >
      ← Prospects
    </button>
  );
}
