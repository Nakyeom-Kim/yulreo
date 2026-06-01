"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";

export default function Header() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Brand" },
    { href: "/instrument", label: "Instrument" },
    { href: "/sound", label: "Sound" },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 lg:px-8 py-4 md:py-5 lg:py-6 pointer-events-none">
      <Link href="/" className="pointer-events-auto transition-opacity hover:opacity-70 flex items-center">
        <Image src="/logo.png" alt="Yul-reo Logo" width={160} height={60} className="h-6 md:h-8 lg:h-10 w-auto object-contain" priority />
      </Link>
      <nav className="flex gap-4 md:gap-6 lg:gap-8 pointer-events-auto text-foreground">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "text-xs md:text-sm lg:text-base font-medium tracking-wider transition-all duration-300 hover:opacity-100",
              pathname === link.href ? "opacity-100 font-bold" : "opacity-50"
            )}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
