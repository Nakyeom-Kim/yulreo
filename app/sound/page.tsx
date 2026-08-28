"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useMotionValue, useTransform, animate, MotionValue } from "framer-motion";
import { cn } from "@/utils/cn";
import MobileDevice from "@/components/sound/MobileDevice";
import TrafficDevice from "@/components/sound/TrafficDevice";
import HomeDevice from "@/components/sound/HomeDevice";

// Sound mapping config
interface SoundItem {
  id: string;
  name: string;
  audioUrl: string;
}

// Reusable Right Column Image mapping template
const BUTTON_IMAGES: Record<string, string> = {
  washer: "/sound-img/img/graphics-세탁기종료.webp",
  call: "/sound-img/img/graphics-전화벨.webp",
  emergency: "/sound-img/img/graphics-재난문자.webp",
  unlock: "/sound-img/img/graphics-eo.webp",
  headlight: "/sound-img/img/graphics-piri.webp",
  pedestrian: "/sound-img/img/graphics-gayageum.webp",
  tv: "/sound-img/img/graphics-geomungo.webp",
  "tv-off": "/sound-img/img/graphics-geomungo.webp",
  message: "/sound-img/img/graphics-jwago.webp",
  card: "/sound-img/img/graphics-pyeonjong.webp",
  alarm: "/sound-img/img/graphics-기상알람.webp",
  intercom: "/sound-img/img/graphics-pyeongyeong.webp",
};

// Reusable Right Column Text mapping template
const BUTTON_TEXTS: Record<string, { description: string; subDescription?: string }> = {
  washer: {
    description: "대금 • 가야금",
    subDescription: "세탁이 끝났다는 알림음"
  },
  call: {
    description: "장구 • 거문고 • 대금",
    subDescription: "핸드폰 전화벨소리"
  },
  emergency: {
    description: "북 • 박",
    subDescription: "재난문자 알림 소리"
  },
  unlock: {
    description: "어",
    subDescription: "핸드폰 잠금 해제 소리"
  },
  headlight: {
    description: "피리",
    subDescription: "버스 하차벨 누르는 소리"
  },
  pedestrian: {
    description: "가야금",
    subDescription: "횡단보도 보행자 신호 소리"
  },
  tv: {
    description: "거문고",
    subDescription: "티비 켜진 소리"
  },
  "tv-off": {
    description: "거문고",
    subDescription: "티비 꺼진 소리"
  },
  message: {
    description: "좌고",
    subDescription: "문자 알림 소리"
  },
  card: {
    description: "편종",
    subDescription: "버스 카드 찍는 소리"
  },
  alarm: {
    description: "가야금 • 해금 • 대금",
    subDescription: "핸드폰 알람 소리"
  },
  intercom: {
    description: "편경",
    subDescription: "초인종 누르는 소리"
  },
};

// Default text when no sound is playing in each card
const CARD_DEFAULT_INFOS = [
  {
    title: "일상 속 알림 소리",
    description: "스마트폰에서 울려 퍼지는 다양한 알림음을 들어보세요"
  },
  {
    title: "거리의 신호 소리",
    description: "매일 이용하는 대중교통에서 마주치는 알림음을 들어보세요"
  },
  {
    title: "머무는 공간의 소리",
    description: "집안 곳곳에서 들려오는 생활 속 알림음을 들어보세요"
  }
];

// Carousel Card Component that responds in real-time to drag position
interface CarouselCardProps {
  slideIdx: number;
  cardIdx: number;
  currentIndex: number;
  stepWidth: number;
  cardWidth: number;
  dragX: MotionValue<number>;
  playingId: string | null;
  activeRightImage: string | null;
  playSound: (id: string, url: string) => void;
  stopSound: () => void;
  callDragX: MotionValue<number>;
  alarmDragX: MotionValue<number>;
  isPlayingInCard: (cardIdx: number, pId: string | null) => boolean;
}

function CarouselCard({
  slideIdx,
  cardIdx,
  currentIndex,
  stepWidth,
  cardWidth,
  dragX,
  playingId,
  activeRightImage,
  playSound,
  stopSound,
  callDragX,
  alarmDragX,
  isPlayingInCard,
}: CarouselCardProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const centerPosition = -slideIdx * stepWidth;

  // Real-time animation mapping linked directly to dragX motion value
  const opacity = useTransform(
    dragX,
    [centerPosition - stepWidth, centerPosition, centerPosition + stepWidth],
    [0.35, 1, 0.35]
  );

  const scale = useTransform(
    dragX,
    [centerPosition - stepWidth, centerPosition, centerPosition + stepWidth],
    [0.94, 1, 0.94]
  );

  const blurRadius = useTransform(
    dragX,
    [centerPosition - stepWidth, centerPosition, centerPosition + stepWidth],
    [1.5, 0, 1.5]
  );
  const filter = useTransform(blurRadius, (r) => `blur(${r}px)`);

  const pointerEvents = (currentIndex === slideIdx ? "auto" : "none") as "auto" | "none";

  // Use dynamic motion values only on client-side to prevent SSR hydration mismatch and initial load blur issues
  const dynamicStyle = isMounted 
    ? {
        width: `${cardWidth}px`,
        opacity,
        scale,
        filter,
        pointerEvents,
      }
    : {
        width: `${cardWidth}px`,
        opacity: slideIdx === currentIndex ? 1 : 0.35,
        scale: slideIdx === currentIndex ? 1 : 0.94,
        filter: slideIdx === currentIndex ? "none" : "blur(1.5px)",
        pointerEvents,
      };

  return (
    <motion.div
      style={dynamicStyle}
      className={cn(
        "h-[72vh] md:h-[650px] shrink-0 rounded-[24px] border border-foreground/10 bg-background/90 backdrop-blur-md overflow-hidden flex flex-col md:flex-row transition-shadow duration-500",
        currentIndex === slideIdx
          ? "shadow-[0_20px_50px_rgba(76,72,59,0.1)]"
          : "shadow-[0_10px_40px_rgba(76,72,59,0.04)]"
      )}
    >
      {/* Left: Device SVG */}
      <div className="w-full md:w-[58%] h-[55%] md:h-full flex items-center justify-center p-4 md:p-8 relative border-b md:border-b-0 md:border-r border-foreground/5 bg-foreground/[0.005]">
        {cardIdx === 0 && (
          <MobileDevice
            playingId={playingId}
            playSound={playSound}
            stopSound={stopSound}
            callDragX={callDragX}
            alarmDragX={alarmDragX}
          />
        )}
        {cardIdx === 1 && (
          <TrafficDevice
            playingId={playingId}
            playSound={playSound}
          />
        )}
        {cardIdx === 2 && (
          <HomeDevice
            playingId={playingId}
            playSound={playSound}
          />
        )}
      </div>

      {/* Right: Info Panel */}
      <div className="w-full md:w-[42%] h-[45%] md:h-full flex flex-col justify-between p-6 md:p-8 bg-foreground/[0.01] relative overflow-hidden select-text border-t md:border-t-0 md:border-l border-foreground/5">
        {isPlayingInCard(cardIdx, playingId) && playingId && BUTTON_TEXTS[playingId] ? (
          <div className="w-full relative z-20 flex-grow flex flex-col justify-between h-full">
            <div className="w-full">
              <p className="text-base md:text-lg font-semibold text-[#4c483b] leading-relaxed whitespace-pre-line font-sans">
                {BUTTON_TEXTS[playingId].description}
              </p>
              {BUTTON_TEXTS[playingId].subDescription && (
                <p className="text-xs md:text-sm text-[#4c483b]/60 mt-2 font-normal tracking-wide leading-relaxed whitespace-pre-line">
                  {BUTTON_TEXTS[playingId].subDescription}
                </p>
              )}
            </div>
            <AnimatePresence mode="wait">
              {activeRightImage && (
                <motion.div
                  key={activeRightImage}
                  initial={{ opacity: 0, y: 0 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative w-full overflow-hidden flex-grow flex items-end justify-center min-h-[120px] max-h-[180px] md:max-h-[none] mt-4"
                >
                  <div className="absolute top-0 inset-x-0 h-8 bg-gradient-to-b from-[#ffffff] via-[#ffffff]/50 to-transparent pointer-events-none z-10" />
                  <img
                    src={activeRightImage}
                    alt="Active device graphic"
                    className="w-full h-full object-cover object-bottom relative z-0"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div className="w-full relative z-20 h-full flex flex-col justify-between flex-grow">
            <div className="w-full">
              <h3 className="text-base md:text-lg font-semibold text-[#4c483b] tracking-wide mb-3">
                {CARD_DEFAULT_INFOS[cardIdx].title}
              </h3>
              <p className="text-xs md:text-sm text-[#4c483b]/65 leading-relaxed font-light whitespace-pre-line">
                {CARD_DEFAULT_INFOS[cardIdx].description}
              </p>
            </div>
            <div className="w-full flex items-end justify-end mt-4 opacity-10 min-h-[100px]">
              <img
                src="/logo2.png"
                alt=""
                className="w-24 md:w-36 h-auto object-contain grayscale filter invert brightness-50"
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function SoundPage() {
  const [currentIndex, setCurrentIndex] = useState(1); // Start at index 1 (which represents Card0)
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeRightImage, setActiveRightImage] = useState<string | null>(null);

  // Responsive Carousel Width Config
  const [cardWidth, setCardWidth] = useState(850);
  const [stepWidth, setStepWidth] = useState(882); // cardWidth + gap (32)

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 640) {
        // Mobile Layout
        const targetWidth = w - 40; // paddings
        setCardWidth(targetWidth);
        setStepWidth(targetWidth + 16); // smaller gap
      } else if (w < 1024) {
        // Tablet Layout
        setCardWidth(680);
        setStepWidth(712);
      } else {
        // Desktop Layout
        setCardWidth(850);
        setStepWidth(882);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Preload all right-column images on mount for instant display
  useEffect(() => {
    const imageSrcs = Object.values(BUTTON_IMAGES);
    const unique = [...new Set(imageSrcs)];
    unique.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, []);

  // Audio state
  const activeAudiosRef = useRef<HTMLAudioElement[]>([]);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Draggable slider states for Alarm and Call (Inside Mobile Card)
  const alarmDragX = useMotionValue(0);
  const callDragX = useMotionValue(0);

  // Main Carousel motion value
  const dragX = useMotionValue(0);

  // Sync dragX on stepWidth or currentIndex changes
  useEffect(() => {
    dragX.set(-currentIndex * stepWidth);
  }, [stepWidth, currentIndex, dragX]);

  // Maps slide index [0, 1, 2, 3, 4] to actual card index [2, 0, 1, 2, 0]
  const getRealIndex = (idx: number) => {
    if (idx === 0) return 2;
    if (idx === 1) return 0;
    if (idx === 2) return 1;
    if (idx === 3) return 2;
    if (idx === 4) return 0;
    return 0;
  };

  const snapTo = (targetIndex: number) => {
    animate(dragX, -targetIndex * stepWidth, {
      type: "spring",
      stiffness: 220,
      damping: 26,
      onComplete: () => {
        // Infinite Loop teleportation logic (teleports instantly without animation)
        if (targetIndex === 0) {
          dragX.set(-3 * stepWidth);
          setCurrentIndex(3);
        } else if (targetIndex === 4) {
          dragX.set(-1 * stepWidth);
          setCurrentIndex(1);
        } else {
          setCurrentIndex(targetIndex);
        }
      }
    });
  };

  const handlePrevPage = () => {
    stopSound();
    snapTo(currentIndex - 1);
  };

  const handleNextPage = () => {
    stopSound();
    snapTo(currentIndex + 1);
  };

  const stopSound = () => {
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    activeAudiosRef.current.forEach((audio) => {
      audio.pause();
    });
    activeAudiosRef.current = [];
    setPlayingId(null);
    setActiveRightImage(null);
    alarmDragX.set(0);
    callDragX.set(0);
  };

  const playSound = (id: string, url: string) => {
    stopSound();
    setPlayingId(id);

    if (BUTTON_IMAGES[id]) {
      setActiveRightImage(BUTTON_IMAGES[id]);
    }

    if (id === "call") {
      const audio = new Audio("/sound/sound/mobile_ringtone.mp3");
      audio.loop = true;
      activeAudiosRef.current.push(audio);
      audio.play().catch((err) => {
        console.error("Audio play failed:", err);
      });
    } else if (id === "washer") {
      const WASHER_SOUNDS = [
        "/sound/sound/home_washing_machine_daegeum.wav",
        "/sound/sound/home_washing_machine_geomungo.wav"
      ];
      WASHER_SOUNDS.forEach((soundUrl, idx) => {
        const audio = new Audio(soundUrl);
        activeAudiosRef.current.push(audio);
        if (idx === 0) {
          audio.onended = () => {
            stopSound();
          };
        }
        audio.play().catch((err) => {
          console.error("Audio play failed:", err);
        });
      });
    } else if (url) {
      const audio = new Audio(url);
      activeAudiosRef.current.push(audio);

      if (id === "emergency" || id === "unlock" || id === "pedestrian" || id === "headlight" || id === "tv-off" || id === "alarm" || id === "card" || id === "message" || id === "intercom") {
        let isMinDurationEnforced = false;
        
        audio.addEventListener("loadedmetadata", () => {
          const duration = audio.duration;
          if (!isNaN(duration) && duration < 2.0) {
            isMinDurationEnforced = true;
            autoCloseTimerRef.current = setTimeout(() => {
              stopSound();
            }, 2000);
          }
        });

        audio.onended = () => {
          if (!isMinDurationEnforced) {
            stopSound();
          }
        };
      }

      audio.play().catch((err) => {
        console.error("Audio play failed:", err);
      });
    }
  };

  // Check if active playingId belongs to the current card index
  const isPlayingInCard = (cardIdx: number, pId: string | null): boolean => {
    if (!pId) return false;
    if (cardIdx === 0) {
      return ["call", "alarm", "message", "emergency", "unlock"].includes(pId);
    } else if (cardIdx === 1) {
      return ["pedestrian", "headlight", "card"].includes(pId);
    } else if (cardIdx === 2) {
      return ["intercom", "tv", "tv-off", "washer"].includes(pId);
    }
    return false;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSound();
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden select-none flex flex-col justify-between py-12 md:py-16">
      
      {/* Background/Header spacer spacing */}
      <div className="h-12 shrink-0" />

      {/* Navigation Arrows */}
      <button 
        onClick={handlePrevPage}
        className="absolute left-[2vw] md:left-[4vw] top-1/2 -translate-y-1/2 z-30 p-2 group cursor-pointer focus:outline-none hidden sm:block"
        aria-label="Previous page"
      >
        <svg className="w-12 h-12 md:w-16 md:h-16 text-[#4c483b]/60 hover:text-[#4c483b] transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button 
        onClick={handleNextPage}
        className="absolute right-[2vw] md:right-[4vw] top-1/2 -translate-y-1/2 z-30 p-2 group cursor-pointer focus:outline-none hidden sm:block"
        aria-label="Next page"
      >
        <svg className="w-12 h-12 md:w-16 md:h-16 text-[#4c483b]/60 hover:text-[#4c483b] transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Carousel Container */}
      <div 
        className="relative w-full flex-grow overflow-visible flex items-center justify-start z-10 touch-pan-y"
        style={{
          paddingLeft: `calc(50vw - ${cardWidth / 2}px)`
        }}
      >
        <motion.div
          drag="x"
          dragConstraints={{
            left: -4 * stepWidth,
            right: 0
          }}
          dragElastic={0.15}
          style={{ x: dragX }}
          onDragEnd={(e, info) => {
            const swipeThreshold = 80;
            const swipeVelocityThreshold = 150;
            const offset = info.offset.x;
            const velocity = info.velocity.x;

            let nextIndex = currentIndex;
            if (offset < -swipeThreshold || velocity < -swipeVelocityThreshold) {
              nextIndex = currentIndex + 1; // Slide forward (up to 4)
            } else if (offset > swipeThreshold || velocity > swipeVelocityThreshold) {
              nextIndex = currentIndex - 1; // Slide backward (down to 0)
            }
            
            stopSound();
            snapTo(nextIndex);
          }}
          className="flex gap-8 cursor-grab active:cursor-grabbing items-center h-full py-4 select-none"
        >
          {/* Card slide array: [2, 0, 1, 2, 0] */}
          {[2, 0, 1, 2, 0].map((cardIdx, slideIdx) => (
            <CarouselCard
              key={slideIdx}
              slideIdx={slideIdx}
              cardIdx={cardIdx}
              currentIndex={currentIndex}
              stepWidth={stepWidth}
              cardWidth={cardWidth}
              dragX={dragX}
              playingId={playingId}
              activeRightImage={activeRightImage}
              playSound={playSound}
              stopSound={stopSound}
              callDragX={callDragX}
              alarmDragX={alarmDragX}
              isPlayingInCard={isPlayingInCard}
            />
          ))}
        </motion.div>
      </div>

      {/* Page Indicators (Bottom) */}
      <div className="flex justify-center items-center gap-3 mt-4 z-20 shrink-0">
        {[0, 1, 2].map((idx) => {
          const isIndicatorActive = getRealIndex(currentIndex) === idx;
          return (
            <button
              key={idx}
              onClick={() => {
                if (getRealIndex(currentIndex) !== idx) {
                  stopSound();
                  const targetIndex = idx === 0 ? 1 : idx === 1 ? 2 : 3;
                  snapTo(targetIndex);
                }
              }}
              className={cn(
                "w-2.5 h-2.5 rounded-full transition-all duration-300 cursor-pointer",
                isIndicatorActive 
                  ? "bg-[#4c483b] scale-120" 
                  : "bg-[#4c483b]/20 hover:bg-[#4c483b]/40"
              )}
              aria-label={`Go to slide ${idx + 1}`}
            />
          );
        })}
      </div>

    </div>
  );
}
