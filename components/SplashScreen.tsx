"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function SplashScreen() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // 2초 후에 스플래시 스크린 숨김 처리 (로고가 노출되는 시간)
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.0, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background pointer-events-none"
        >
          <Image
            src="/logo.png"
            alt="Yulreo Logo"
            width={300}
            height={150}
            className="w-48 md:w-64 h-auto object-contain"
            priority
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
