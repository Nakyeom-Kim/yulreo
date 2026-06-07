"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const links = [
    { href: "/instrument", label: "Instrument" },
    { href: "/sound", label: "Sound" },
  ];

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-6 lg:px-8 py-4 md:py-5 lg:py-6 pointer-events-none">
        <Link 
          href="/" 
          onClick={closeMenu}
          className="pointer-events-auto transition-opacity hover:opacity-70 flex items-center z-50"
        >
          <Image 
            src="/logo2.png" 
            alt="Yul-reo Logo" 
            width={160} 
            height={60} 
            className="h-8 md:h-8 lg:h-10 w-auto object-contain" 
            priority 
          />
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex gap-4 md:gap-6 lg:gap-8 pointer-events-auto text-foreground">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-xs md:text-sm lg:text-base font-normal tracking-wider transition-all duration-300 hover:opacity-100",
                pathname === link.href ? "opacity-100" : "opacity-30"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Hamburger Button */}
        <button
          onClick={toggleMenu}
          className="md:hidden pointer-events-auto text-foreground z-50 p-2 focus:outline-none cursor-pointer"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-lg flex flex-col items-center justify-center gap-8 md:hidden cursor-pointer"
            onClick={closeMenu}
          >
            <nav className="flex flex-col items-center gap-8 cursor-default" onClick={(e) => e.stopPropagation()}>
              {links.map((link, idx) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * (idx + 1) }}
                >
                  <Link
                    href={link.href}
                    onClick={closeMenu}
                    className={cn(
                      "text-xl font-light tracking-widest transition-all duration-300",
                      pathname === link.href ? "text-foreground" : "text-foreground/30"
                    )}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
