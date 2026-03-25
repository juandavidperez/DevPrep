"use client";

import { Search } from "lucide-react";
import { useRouter } from "@/navigation";
import { usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";

export function DashboardSearch({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const params = new URLSearchParams(searchParams.toString());
    if (e.target.value) {
      params.set("q", e.target.value);
    } else {
      params.delete("q");
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  }

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
      <input
        type="text"
        defaultValue={searchParams.get("q") ?? ""}
        onChange={handleChange}
        placeholder={placeholder}
        className="h-9 w-56 rounded-lg border border-border-subtle bg-surface-lowest pl-9 pr-3 text-sm text-text-primary placeholder:text-text-secondary focus:border-primary/50 focus:outline-none transition"
      />
    </div>
  );
}
