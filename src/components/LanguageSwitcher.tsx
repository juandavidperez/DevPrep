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

  const toggleOpen = () => setOpen(!open);

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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleOpen}
        className="flex h-8 items-center gap-2 rounded-lg px-2 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
        aria-label="Switch Language"
      >
        <Languages className="h-4 w-4" />
        <span className="uppercase">{locale}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-32 rounded-xl border border-slate-800 bg-slate-900 p-1 shadow-xl">
          {locales.map((loc) => (
            <button
              key={loc}
              onClick={() => switchLocale(loc)}
              className={clsx(
                "flex w-full items-center px-3 py-2 text-sm transition rounded-lg",
                locale === loc 
                  ? "bg-blue-600/10 text-blue-400" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              {loc === 'en' ? 'English' : 'Español'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
