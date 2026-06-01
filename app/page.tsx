"use client";

import FadeIn from "@/components/FadeIn";
import { useInteractionSound } from "@/hooks/useInteractionSound";

export default function Home() {
  const { playHoverSound, playClickSound } = useInteractionSound();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="h-screen flex items-center justify-center relative overflow-hidden bg-background">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50 pointer-events-none z-10" />
        
        {/* Placeholder for Graphic */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
           <div className="w-[80vw] h-[80vw] max-w-[600px] max-h-[600px] rounded-full bg-gradient-to-tr from-stone-400 to-stone-200 blur-3xl animate-pulse" />
        </div>

        <FadeIn className="z-20 text-center" delay={0.2}>
          <h1 
            onMouseEnter={playHoverSound}
            onClick={playClickSound}
            className="text-4xl md:text-5xl lg:text-7xl font-heading tracking-widest font-light mb-4 md:mb-8 cursor-default transition-all duration-700 hover:scale-105"
          >
            Yul-reo
          </h1>
          <p className="text-base md:text-lg lg:text-2xl font-light tracking-widest text-foreground/70">
            차분한 일상의 변주
          </p>
        </FadeIn>
      </section>

      {/* Philosophy Section */}
      <section className="min-h-screen flex items-center justify-center py-16 md:py-24 px-6 md:px-8 bg-background text-foreground">
        <div className="max-w-3xl mx-auto space-y-24 md:space-y-32">
          <FadeIn direction="up" delay={0.1}>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading mb-4 md:mb-8">01</h2>
            <p className="text-base md:text-lg lg:text-xl leading-relaxed font-light break-keep">
              율려는 복잡한 세상 속에서 <br className="hidden md:block" />
              단순함이 가지는 본질적인 아름다움을 탐구합니다.
            </p>
          </FadeIn>

          <FadeIn direction="up" delay={0.2}>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading mb-4 md:mb-8 text-right">02</h2>
            <p className="text-base md:text-lg lg:text-xl leading-relaxed font-light break-keep text-right">
              소리와 형태의 완벽한 균형을 통해 <br className="hidden md:block" />
              당신의 감각을 일깨웁니다.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center text-sm font-heading tracking-widest bg-background text-foreground/50 border-t border-foreground/10">
        <FadeIn direction="up">
          © {new Date().getFullYear()} YUL-REO. ALL RIGHTS RESERVED.
        </FadeIn>
      </footer>
    </div>
  );
}

