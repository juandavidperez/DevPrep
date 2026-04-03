"use client";

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/navigation';
import { locales, type Locale } from '@/i18n/config';
import { Languages } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale as Locale });
    setOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition hover:bg-surface-highest/40 hover:text-text-primary"
        aria-label="Switch Language"
      >
        <Languages className="h-4 w-4 shrink-0" />
        <span className="uppercase">{locale}</span>
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 w-36 rounded-xl border border-border-subtle bg-surface-container p-1 shadow-xl backdrop-blur-lg">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              className={clsx(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition",
                locale === loc
                  ? "bg-surface-highest text-text-primary"
                  : "text-text-secondary hover:bg-surface-highest/40 hover:text-text-primary"
              )}
            >
              <span className="font-mono text-xs uppercase text-primary">{loc}</span>
              {loc === 'en' ? 'English' : 'Español'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
