"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { cn } from "@/utils/cn";

// Sound mapping config
interface SoundItem {
  id: string;
  name: string;
  audioUrl: string;
}

// Reusable Right Column Image mapping template
const BUTTON_IMAGES: Record<string, string> = {
  washer: "/sound-img/img/graphics-세탁기종료.png",
  call: "/sound-img/img/graphics-전화벨.png",
  emergency: "/sound-img/img/graphics-재난문자.png",
  unlock: "/sound-img/img/graphics-eo.png",
  headlight: "/sound-img/img/graphics-piri.png",
  pedestrian: "/sound-img/img/graphics-gayageum.png",
  tv: "/sound-img/img/graphics-geomungo.png",
  "tv-off": "/sound-img/img/graphics-geomungo.png",
  message: "/sound-img/img/graphics-jwago.png",
  card: "/sound-img/img/graphics-pyeonjong.png",
  alarm: "/sound-img/img/graphics-기상알람.png",
  intercom: "/sound-img/img/graphics-pyeongyeong.png",
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

export default function SoundPage() {
  const [currentPage, setCurrentPage] = useState(1); // 1, 2, 3
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [activeRightImage, setActiveRightImage] = useState<string | null>(null);
  
  // Audio state
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const activeAudiosRef = useRef<HTMLAudioElement[]>([]);
  const reqRef = useRef<number | null>(null);
  
  // Animation scale/vibration state updated by Web Audio API
  const [audioIntensity, setAudioIntensity] = useState(0);
  const autoCloseTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Draggable slider states for Alarm and Call
  const alarmDragX = useMotionValue(0);
  const callDragX = useMotionValue(0);
  const alarmTextOpacity = useTransform(alarmDragX, [0, 300], [1, 0]);
  const callTextOpacity = useTransform(callDragX, [0, 300], [1, 0]);

  const totalPages = 3;

  const handlePrevPage = () => {
    stopSound();
    setCurrentPage((prev) => (prev === 1 ? totalPages : prev - 1));
  };

  const handleNextPage = () => {
    stopSound();
    setCurrentPage((prev) => (prev === totalPages ? 1 : prev + 1));
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
    setActiveRightImage(null); // Clear active image on stop
    setAudioIntensity(0);
    alarmDragX.set(0);
    callDragX.set(0);
  };

  const playSound = (id: string, url: string) => {
    stopSound();
    setPlayingId(id);

    // If the clicked button has a registered image in the template, show it
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopSound();
    };
  }, []);



  return (
    <div className="relative min-h-screen bg-background overflow-hidden select-none">
      
      {/* 2 Vertical Lines (Calculated from Mobile.svg reference coordinates) */}
      {/* Line 2: 1237.97px -> 35.5224% from Right */}
      <div className="absolute right-[35.5224%] top-[80px] bottom-0 w-[1px] bg-[#706A75]/30 z-10" />
      
      {/* Line 3: 1759.87px -> 8.3401% from Right */}
      <div className="absolute right-[8.3401%] top-[80px] bottom-0 w-[1px] bg-[#706A75]/30 z-10" />

      {/* Navigation Arrows (Positioned exactly at 5.3047% to match x=101.85px in SVG - Scaled up 2x to w-16 h-16) */}
      <button 
        onClick={handlePrevPage}
        className="absolute left-[5.3047%] -translate-x-1/2 top-1/2 -translate-y-1/2 z-20 p-4 group cursor-pointer focus:outline-none"
        aria-label="Previous page"
      >
        <svg className="w-16 h-16 text-[#706A75] hover:opacity-70 transition-opacity duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button 
        onClick={handleNextPage}
        className="absolute right-[5.3047%] translate-x-1/2 top-1/2 -translate-y-1/2 z-20 p-4 group cursor-pointer focus:outline-none"
        aria-label="Next page"
      >
        <svg className="w-16 h-16 text-[#706A75] hover:opacity-70 transition-opacity duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Main Content Area: Aligned strictly between left: 15.625% (300px) and right: 35.5224% (1237.97px) */}
      <div 
        className="absolute top-[80px] bottom-0 flex items-center justify-center overflow-hidden"
        style={{ left: "15.625%", right: "35.5224%" }}
      >
        <AnimatePresence mode="wait">
          {currentPage === 1 && (
            <motion.div
              key="page-1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="relative w-full h-full flex items-end justify-center"
            >
              {/* Smartphone Frame using paths from Mobile.svg */}
              <div 
                className="relative w-full h-full flex items-end justify-center pb-0"
              >
                <svg 
                  viewBox="298 74 941.97 1006.42" 
                  className="w-full h-auto max-h-full pointer-events-auto"
                >
                  <defs>
                    <clipPath id="screen-clip">
                      <path d="M1100.71,1141.5H320V207.03c0-61.2,49.62-110.82,110.82-110.82h90.83c6.41,0,12.55,2.87,16.43,7.97,2.48,3.26,4.52,7.12,7.03,11.6,12.11,21.58,28.91,28.91,66.08,28.91h198.34c37.17,0,53.97-7.33,66.08-28.91,2.51-4.48,4.55-8.34,7.03-11.6,3.88-5.1,10.02-7.97,16.43-7.97h90.83c61.2,0,110.82,49.62,110.82,110.82v934.47Z"/>
                    </clipPath>
                  </defs>

                  {/* Phone Outer & Inner Borders */}
                  <path 
                    className="stroke-[#3F3A2E] fill-none" 
                    strokeWidth={1.5}
                    strokeMiterlimit={10} 
                    d="M997.45,76.58H423.26c-67.87,0-122.9,55.02-122.9,122.9v961.67h819.98V199.47c0-67.87-55.02-122.9-122.9-122.9ZM1100.71,1141.5H320V207.03c0-61.2,49.62-110.82,110.82-110.82h90.83c6.41,0,12.55,2.87,16.43,7.97,2.48,3.26,4.52,7.12,7.03,11.6,12.11,21.58,28.91,28.91,66.08,28.91h198.34c37.17,0,53.97-7.33,66.08-28.91,2.51-4.48,4.55-8.34,7.03-11.6,3.88-5.1,10.02-7.97,16.43-7.97h90.83c61.2,0,110.82,49.62,110.82,110.82v934.47Z"
                  />
                  
                  {/* Right Side Physical Button */}
                  <path 
                    className="fill-[#3F3A2E] cursor-pointer" 
                    onClick={() => playSound("unlock", "/sound/sound/mobile_unlock_eo.mp3")}
                    d="M1136.32,438.79h3.99v141.76h-3.99c-8.08,0-14.64-6.56-14.64-14.64v-112.47c0-8.08,6.56-14.64,14.64-14.64Z" 
                    transform="translate(2261.9807 1019.335) rotate(-180)"
                  />

                  {/* Interactive Buttons (Using PNG images with drop shadow for clickability feedback) */}
                  {/* 재난문자 */}
                  <motion.g 
                    onClick={() => playSound("emergency", "/sound/sound/mobile_emergency_alert.mp3")}
                    className="cursor-pointer"
                    style={{
                      transformOrigin: "439.56px 293.45px"
                    }}
                  >
                    <image 
                      href="/sound-img/sound-mobile-emergency-1.png" 
                      x="375.66" 
                      y="229.55" 
                      width="127.8" 
                      height="127.8" 
                      filter="drop-shadow(0px 6px 10px rgba(63, 58, 46, 0.15))"
                    />
                    <text className="fill-[#3F3A2E] font-medium" style={{ fontFamily: "Pretendard, sans-serif", fontSize: "22px" }} transform="translate(401.51 388.72)">재난문자</text>
                  </motion.g>

                  {/* 알람 */}
                  <motion.g 
                    onClick={() => playSound("alarm", "/sound/sound/mobile_notification.mp3")}
                    className="cursor-pointer"
                    style={{
                      transformOrigin: "619.8px 293.45px"
                    }}
                  >
                    <image 
                      href="/sound-img/sound-mobile-alarm-1.png" 
                      x="555.9" 
                      y="229.55" 
                      width="127.8" 
                      height="127.8" 
                      filter="drop-shadow(0px 6px 10px rgba(63, 58, 46, 0.15))"
                    />
                    <text className="fill-[#3F3A2E] font-medium" style={{ fontFamily: "Pretendard, sans-serif", fontSize: "22px" }} transform="translate(600.77 388.72)">알람</text>
                  </motion.g>

                  {/* 문자 */}
                  <motion.g 
                    onClick={() => playSound("message", "/sound/sound/mobile_message.mp3")}
                    className="cursor-pointer"
                    style={{
                      transformOrigin: "800.03px 293.45px"
                    }}
                  >
                    <image 
                      href="/sound-img/sound-mobile-message-1.png" 
                      x="736.13" 
                      y="229.55" 
                      width="127.8" 
                      height="127.8" 
                      filter="drop-shadow(0px 6px 10px rgba(63, 58, 46, 0.15))"
                    />
                    <text className="fill-[#3F3A2E] font-medium" style={{ fontFamily: "Pretendard, sans-serif", fontSize: "22px" }} transform="translate(780.86 388.72)">문자</text>
                  </motion.g>

                  {/* 전화 */}
                  <motion.g 
                    onClick={() => playSound("call", "/sound/sound/mobile_ringtone_daegeum.mp3")}
                    className="cursor-pointer"
                    style={{
                      transformOrigin: "980.27px 293.45px"
                    }}
                  >
                    <image 
                      href="/sound-img/sound-mobile-call-1.png" 
                      x="916.37" 
                      y="229.55" 
                      width="127.8" 
                      height="127.8" 
                      filter="drop-shadow(0px 6px 10px rgba(63, 58, 46, 0.15))"
                    />
                    <text className="fill-[#3F3A2E] font-medium" style={{ fontFamily: "Pretendard, sans-serif", fontSize: "22px" }} transform="translate(961.1 388.72)">전화</text>
                  </motion.g>



                  {/* Overlays for -2 State when active */}
                  {/* Call Screen Overlay (Full screen size in coordinate space with draggable slide knob) */}
                  {playingId === "call" && (
                    <g>
                      {/* Dark brown full screen inner overlay */}
                      <path className="fill-[#3F3A2E]" d="M1100.71,1141.5H320V207.03c0-61.2,49.62-110.82,110.82-110.82h90.83c6.41,0,12.55,2.87,16.43,7.97,2.48,3.26,4.52,7.12,7.03,11.6,12.11,21.58,28.91,28.91,66.08,28.91h198.34c37.17,0,53.97-7.33,66.08-28.91,2.51-4.48,4.55-8.34,7.03-11.6,3.88-5.1,10.02-7.97,16.43-7.97h90.83c61.2,0,110.82,49.62,110.82,110.82v934.47Z"/>
                      <text className="fill-[#FFF] font-medium" style={{ fontFamily: "Pretendard, sans-serif", fontSize: "65px" }} transform="translate(654.72 348.62)">율려</text>
                      
                      {/* White slider capsule container */}
                      <g transform="translate(375.66, 858.56)">
                        <rect fill="#FFF" x="0" y="0" width="668.51" height="132.32" rx="66.16" ry="66.16" />
                        {/* Fades out as the user drags */}
                        <motion.text 
                          className="fill-[#3F3A2E] font-medium" 
                          style={{ fontFamily: "Pretendard, sans-serif", fontSize: "42.87px", opacity: callTextOpacity }} 
                          transform="translate(224.38 84.03)"
                        >
                          밀어서 통화하기
                        </motion.text>
                        
                        {/* Interactive Draggable Handle */}
                        <motion.g
                          drag="x"
                          style={{ x: callDragX }}
                          dragConstraints={{ left: 0, right: 536.19 }}
                          dragElastic={0.1}
                          dragMomentum={false}
                          onDragEnd={(event, info) => {
                            if (info.offset.x > 350) {
                              stopSound();
                            } else {
                              animate(callDragX, 0, { type: "spring", stiffness: 300, damping: 30 });
                            }
                          }}
                          className="cursor-grab active:cursor-grabbing"
                        >
                          <path fill="#3F3A2E" d="M66.16,122.32c-30.97,0-56.16-25.19-56.16-56.16S35.19,10,66.16,10h1.82c30.97,0,56.16,25.19,56.16,56.16s-25.19,56.16-56.16,56.16h-1.82Z" />
                          <path fill="#FFF" d="M97.21,89.84c-1.49,1.51-2.77,3.04-4.37,4.27-3.62,2.78-8.24,3.53-12.79,3.04-8.88-.97-17.17-6.86-23.69-12.77-8.89-8.06-19.87-20.93-20.33-33.18-.15-4.01.65-8.05,3.18-11.19,1.19-1.47,2.61-2.73,3.97-4.05,1.44-1.39,3.8-1.13,5.18.24l11.92,11.92c1.21,1.27,1.68,3.51.39,4.83l-5.16,5.28c3.94,8.56,10.65,15.79,19.41,19.37l5.38-5.25c1.26-1.23,3.49-.62,4.68.45l12.03,12.04c1.33,1.33,1.6,3.6.21,5.01Z" />
                        </motion.g>
                      </g>
                    </g>
                  )}

                  {/* Alarm Stop Slider Overlay (Interactive Draggable Slider) */}
                  {playingId === "alarm" && (
                    <g transform="translate(375.66, 858.56)">
                      {/* Dark brown capsule background */}
                      <rect fill="#3F3A2E" x="0" y="0" width="668.51" height="132.32" rx="66.16" ry="66.16" />
                      {/* Fades out as the user drags */}
                      <motion.text 
                        className="fill-[#FFF] font-medium" 
                        style={{ fontFamily: "Pretendard, sans-serif", fontSize: "42.87px", opacity: alarmTextOpacity }} 
                        transform="translate(261.08 84.03)"
                      >
                        밀어서 중단
                      </motion.text>
                      
                      {/* Interactive Draggable Handle */}
                      <motion.g
                        drag="x"
                        style={{ x: alarmDragX }}
                        dragConstraints={{ left: 0, right: 536.19 }}
                        dragElastic={0.1}
                        dragMomentum={false}
                        onDragEnd={(event, info) => {
                          if (info.offset.x > 350) {
                            stopSound();
                          } else {
                            animate(alarmDragX, 0, { type: "spring", stiffness: 300, damping: 30 });
                          }
                        }}
                        className="cursor-grab active:cursor-grabbing"
                      >
                        <path fill="#FFF" d="M66.16,122.32c-30.97,0-56.16-25.19-56.16-56.16S35.19,10,66.16,10h1.82c30.97,0,56.16,25.19,56.16,56.16s-25.19,56.16-56.16,56.16h-1.82Z" />
                        <rect fill="#3F3A2E" x="45.5" y="44.59" width="43.13" height="43.13" rx="1" ry="1" />
                      </motion.g>
                    </g>
                  )}

                  {/* Message Notification Banner Overlay (Spring slide down animation from top - Clipped to inner screen) */}
                  {playingId === "message" && (
                    <motion.g
                      initial={{ y: -150, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -150, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 120, damping: 18 }}
                      onClick={stopSound}
                      className="cursor-pointer"
                      clipPath="url(#screen-clip)"
                    >
                      <image href="/sound-img/sound-mobile-message-2.svg" x="321.5" y="140" width="777" height="203" />
                    </motion.g>
                  )}

                  {/* Emergency Alert Notification Banner Overlay (Spring slide down animation from top - Clipped to inner screen) */}
                  {playingId === "emergency" && (
                    <motion.g
                      initial={{ y: -150, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -150, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 120, damping: 18 }}
                      onClick={stopSound}
                      className="cursor-pointer"
                      clipPath="url(#screen-clip)"
                    >
                      <image href="/sound-img/sound-mobile-emergency-2.svg" x="321.5" y="140" width="777" height="202" />
                    </motion.g>
                  )}
                </svg>
              </div>
            </motion.div>
          )}

          {currentPage === 2 && (
            <motion.div
              key="page-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="relative w-full h-full flex items-end justify-center pointer-events-auto"
            >
              {/* Traffic / Pedestrian & Bus layout using traffic.svg */}
              <div className="relative w-full h-full flex items-end justify-center pb-0">
                <svg 
                  viewBox="177.15 50 1043.8 1030" 
                  className="w-full h-auto max-h-full pointer-events-auto"
                >
                  {/* Bus Front Body */}
                  <path 
                    stroke="#3F3A2E"
                    fill="none"
                    strokeWidth={1.5}
                    strokeMiterlimit={10}
                    d="M1171.39,539.6h-32.25l-26.56-26.56v-10.75c0-21.91-17.76-39.66-39.66-39.66H494.52c-21.91,0-39.66,17.76-39.66,39.66v10.75l-26.56,26.56h-32.25c-6.33,0-11.46,5.13-11.46,11.46v132.73c0,6.33,5.13,11.6,11.46,11.46h32.43c6.33,0,11.46-5.13,11.46-11.46v-121.07l14.92-14.92v614.21h657.72v-614.21l14.92,14.92v121.07c0,6.33,5.13,11.6,11.46,11.46h32.43c6.33,0,11.46-5.13,11.46-11.46v-132.73c0-6.33-5.13-11.46-11.46-11.46ZM909.48,869.98c0-3.09,4.08-7.17,10.39-10.39,8.92-4.55,21.51-7.16,34.56-7.16s25.64,2.61,34.56,7.16c6.31,3.22,10.39,7.3,10.39,10.39,0,2.1-1.89,4.66-5.08,7.1h-79.73c-3.19-2.44-5.08-4.99-5.08-7.1ZM1093.06,915.06c0,10.77-5.05,20.36-12.9,26.55l-8.63-27.69c-6.83-21.92-27.12-36.85-50.07-36.85h-12.84c1.14-2.27,1.74-4.65,1.74-7.1,0-15.77-25.05-28.55-55.94-28.55s-55.94,12.78-55.94,28.55c0,2.45.61,4.83,1.74,7.1h-12.84c-22.96,0-43.24,14.93-50.07,36.85l-10.88,34.94h-318.24c-18.67,0-33.8-15.13-33.8-33.8v-384.47c0-10.28,8.34-18.62,18.62-18.62h581.44c10.28,0,18.62,8.34,18.62,18.62v384.47Z"
                  />

                  {/* Bus Left Headlight Inner Core */}
                  <path fill="#3F3A2E" d="M486.68,615.99h12.13c13.05,0,23.65,10.6,23.65,23.65v39.99c0,13.05-10.6,23.65-23.65,23.65h-12.13v-87.29h0Z"/>

                  {/* Bus Right Headlight Inner Core */}
                  <path fill="#3F3A2E" d="M1044.98,615.99h12.13c13.05,0,23.65,10.6,23.65,23.65v39.99c0,13.05-10.6,23.65-23.65,23.65h-12.13v-87.29h0Z" transform="translate(2125.7411 1319.2679) rotate(-180)"/>

                  {/* Traffic Light Post */}
                  <rect stroke="#3F3A2E" fill="none" strokeWidth={1.5} x="218.45" y="59.42" width="65.87" height="1102.58"/>
                  <polygon fill="#FFF" stroke="#3F3A2E" strokeWidth={1.5} points="432.16 406.25 287.21 411.26 287.21 400.98 215.56 400.98 215.56 426.1 287.21 426.1 287.21 415.94 432.32 410.93 432.16 406.25"/>
                  <polygon fill="#FFF" stroke="#3F3A2E" strokeWidth={1.5} points="287.21 113.81 432.16 118.82 432.32 114.14 287.21 109.12 287.21 98.9 215.56 98.9 215.56 124.02 287.21 124.02 287.21 113.81"/>

                  {/* Pedestrian Signal Light (Blinker Component - Toggles between State 1 & State 2) */}
                  {playingId === "pedestrian" ? (
                    /* Active State (sound-traffic-blinker-2.svg) */
                    <g transform="translate(341.69, 117.74)">
                      {/* Brackets */}
                      <polygon fill="#FFF" stroke="#3F3A2E" strokeMiterlimit={10} points="90.48 288.51 -54.47 293.52 -54.47 283.24 -126.12 283.24 -126.12 308.36 -54.47 308.36 -54.47 298.2 90.64 293.19 90.48 288.51"/>
                      <polygon fill="#FFF" stroke="#3F3A2E" strokeMiterlimit={10} points="-54.47 -3.94 90.48 1.08 90.64 -3.6 -54.47 -8.62 -54.47 -18.84 -126.12 -18.84 -126.12 6.28 -54.47 6.28 -54.47 -3.94"/>
                      
                      {/* Outer frame */}
                      <path fill="#3F3A2E" d="M144.79,135.48V9.31c0-5.14-4.17-9.31-9.31-9.31H9.31C4.17,0,0,4.17,0,9.31v126.18c0,5.14,4.17,9.31,9.31,9.31-5.14,0-9.31,4.17-9.31,9.31v126.18c0,5.14,4.17,9.31,9.31,9.31h126.18c5.14,0,9.31-4.17,9.31-9.31v-126.18c0-5.14-4.17-9.31-9.31-9.31,5.14,0,9.31-4.17,9.31-9.31Z"/>
                      {/* Top light outer border */}
                      <path fill="#3F3A2E" stroke="#FFF" strokeMiterlimit={10} d="M24.6,8.8h100.8c7.33,0,13.28,5.95,13.28,13.28v95.42c0,8.63-7.01,15.63-15.63,15.63H26.95c-8.63,0-15.63-7.01-15.63-15.63V22.09c0-7.33,5.95-13.28,13.28-13.28Z"/>
                      {/* Top light background (white) */}
                      <path fill="#FFF" d="M119.33,14.19H30.67c-4.83,0-8.84,3.71-9.22,8.51l-7.55,96.15c-.6,7.71,5.5,14.29,13.24,14.29h95.71c7.74,0,13.85-6.59,13.24-14.29l-7.55-96.15c-.38-4.8-4.39-8.51-9.22-8.51Z"/>
                      {/* Bottom light outer border */}
                      <path fill="#3F3A2E" stroke="#FFF" strokeMiterlimit={10} d="M24.6,153.45h100.8c7.33,0,13.28,5.95,13.28,13.28v95.42c0,8.63-7.01,15.63-15.63,15.63H26.95c-8.63,0-15.63-7.01-15.63-15.63v-95.42c0-7.33,5.95-13.28,13.28-13.28Z"/>
                      {/* Bottom light background (white) */}
                      <path fill="#FFF" d="M119.33,158.84H30.67c-4.83,0-8.84,3.71-9.22,8.51l-7.55,96.15c-.6,7.71,5.5,14.29,13.24,14.29h95.71c7.74,0,13.85-6.59,13.24-14.29l-7.55-96.15c-.38-4.8-4.39-8.51-9.22-8.51Z"/>
                      
                      {/* Walking Man (Head & Torso) - lit in brown against white background */}
                      <g fill="#3F3A2E">
                        <circle cx="70.29" cy="178.52" r="9.98"/>
                        <path d="M62.67,189.84h15.24c2.5,0,4.54,2.03,4.54,4.54v27.16h-24.32v-27.16c0-2.5,2.03-4.54,4.54-4.54Z"/>
                        <polygon points="42.83 260.98 51.12 263.73 71.59 220.84 58.75 219.89 42.83 260.98"/>
                        <polygon points="96.39 261.53 88 263.98 70.29 220.84 81.97 219.89 96.39 261.53"/>
                        <rect x="41.99" y="262.91" width="12.78" height="3.26" transform="translate(85.66 -1.79) rotate(18.33)"/>
                        <rect x="88.2" y="262.12" width="12.78" height="3.26" transform="translate(-70.02 37) rotate(-16.25)"/>
                        <path d="M67.43,191.8l-4.38-1.96c-1.92,0-3.47.31-4.87,1.3l-13.91,10.07-.9,19.62,7.12-.14.81-16.46,16.13-12.43Z"/>
                        <path d="M82.57,191.37c-1.08-1.38-3.22-1.53-5.45-1.53l1.03,2.32c-.99,1.66-.95,3.75.11,5.37l9.74,12.48,19.25,3.92.96-7.06-16.14-3.34-9.49-12.16Z"/>
                      </g>
                    </g>
                  ) : (
                    /* Inactive State (sound-traffic-blinker-1.svg) */
                    <g transform="translate(341.69, 117.74)">
                      <motion.g 
                        onClick={() => playSound("pedestrian", "/sound/sound/traffic_crosswalk_signal.mp3")}
                        className="cursor-pointer"
                        style={{ transformOrigin: "72.4px 144.8px" }}
                      >
                        {/* Brackets */}
                        <polygon fill="#FFF" stroke="#3F3A2E" strokeMiterlimit={10} points="90.48 288.51 -54.47 293.52 -54.47 283.24 -126.12 283.24 -126.12 308.36 -54.47 308.36 -54.47 298.2 90.64 293.19 90.48 288.51"/>
                        <polygon fill="#FFF" stroke="#3F3A2E" strokeMiterlimit={10} points="-54.47 -3.94 90.48 1.08 90.64 -3.6 -54.47 -8.62 -54.47 -18.84 -126.12 -18.84 -126.12 6.28 -54.47 6.28 -54.47 -3.94"/>
                        
                        {/* Outer frame */}
                        <path fill="#3F3A2E" d="M144.79,135.48V9.31c0-5.14-4.17-9.31-9.31-9.31H9.31C4.17,0,0,4.17,0,9.31v126.18c0,5.14,4.17,9.31,9.31,9.31-5.14,0-9.31,4.17-9.31,9.31v126.18c0,5.14,4.17,9.31,9.31,9.31h126.18c5.14,0,9.31-4.17,9.31-9.31v-126.18c0-5.14-4.17-9.31-9.31-9.31,5.14,0,9.31-4.17,9.31-9.31Z"/>
                        {/* Top light outer border */}
                        <path fill="#3F3A2E" stroke="#FFF" strokeMiterlimit={10} d="M24.6,8.8h100.8c7.33,0,13.28,5.95,13.28,13.28v95.42c0,8.63-7.01,15.63-15.63,15.63H26.95c-8.63,0-15.63-7.01-15.63-15.63V22.09c0-7.33,5.95-13.28,13.28-13.28Z"/>
                        {/* Top light background (white) */}
                        <path fill="#FFF" d="M119.33,14.19H30.67c-4.83,0-8.84,3.71-9.22,8.51l-7.55,96.15c-.6,7.71,5.5,14.29,13.24,14.29h95.71c7.74,0,13.85-6.59,13.24-14.29l-7.55-96.15c-.38-4.8-4.39-8.51-9.22-8.51Z"/>
                        {/* Bottom light outer border */}
                        <path fill="#3F3A2E" stroke="#FFF" strokeMiterlimit={10} d="M24.6,153.45h100.8c7.33,0,13.28,5.95,13.28,13.28v95.42c0,8.63-7.01,15.63-15.63,15.63H26.95c-8.63,0-15.63-7.01-15.63-15.63v-95.42c0-7.33,5.95-13.28,13.28-13.28Z"/>
                        {/* Bottom light background (white) */}
                        <path fill="#FFF" d="M119.33,158.84H30.67c-4.83,0-8.84,3.71-9.22,8.51l-7.55,96.15c-.6,7.71,5.5,14.29,13.24,14.29h95.71c7.74,0,13.85-6.59,13.24-14.29l-7.55-96.15c-.38-4.8-4.39-8.51-9.22-8.51Z"/>
                        
                        {/* Standing Man in top light (dark brown) */}
                        <g fill="#3F3A2E">
                          <path d="M86.16,76.03l1-26.16c0-2.51-2.03-4.54-4.54-4.54h-15.24c-2.51,0-4.54,2.03-4.54,4.54l1,26.16-3.19,44.01h8.74l5.62-37.5,5.62,37.5h8.74l-3.19-44.01Z"/>
                          <rect x="56.6" y="120.05" width="12.78" height="3.26"/>
                          <rect x="80.62" y="120.05" width="12.78" height="3.26"/>
                          <path d="M69.05,45.34h-4.26c-1.94,0-3.71,1.1-4.56,2.84l-5.74,14.75,6.48,18.54,6.55-2.79-5.39-15.58,6.91-17.77Z"/>
                          <path d="M80.95,45.34h4.26c1.94,0,3.71,1.1,4.56,2.84l5.74,14.75-6.48,18.54-6.55-2.79,5.39-15.58-6.91-17.77Z"/>
                          <circle cx="75" cy="33.03" r="9.98"/>
                        </g>
                      </motion.g>
                    </g>
                  )}

                  {/* Bus Headlights (Toggles between State 1 & State 2) */}
                  {playingId === "headlight" ? (
                    /* Active Flashing State (sound-traffic-button-2.svg) */
                    <g transform="translate(486.68, 605.4)">
                      <path fill="#3F3A2E" d="M0,10.59h12.13c13.05,0,23.65,10.6,23.65,23.65v39.99c0,13.05-10.6,23.65-23.65,23.65H0V10.59h0Z"/>
                      <path fill="#3F3A2E" d="M558.31,10.59h12.13c13.05,0,23.65,10.6,23.65,23.65v39.99c0,13.05-10.6,23.65-23.65,23.65h-12.13V10.59h0Z" transform="translate(1152.3868 108.4808) rotate(-180)"/>
                      <g stroke="#3F3A2E" strokeLinecap="round" strokeMiterlimit={10} strokeWidth="5px">
                        <line x1="59.31" y1="54.24" x2="82.34" y2="54.24"/>
                        <line x1="56.21" y1="10.91" x2="77.65" y2="2.5"/>
                        <line x1="56.21" y1="97.57" x2="77.65" y2="105.98"/>
                        <line x1="534.77" y1="54.24" x2="511.74" y2="54.24"/>
                        <line x1="537.87" y1="97.57" x2="516.43" y2="105.98"/>
                        <line x1="537.87" y1="10.91" x2="516.43" y2="2.5"/>
                      </g>
                    </g>
                  ) : (
                    /* Inactive State (sound-traffic-button-1.svg) */
                    <g transform="translate(486.68, 615.99)">
                      <motion.g 
                        onClick={() => playSound("headlight", "/sound/sound/traffic_stop_bell.mp3")}
                        className="cursor-pointer"
                        style={{ transformOrigin: "297px 43.6px" }}
                      >
                        <path fill="#3F3A2E" d="M0,0h12.13c13.05,0,23.65,10.6,23.65,23.65v39.99c0,13.05-10.6,23.65-23.65,23.65H0V0h0Z"/>
                        <path fill="#3F3A2E" d="M558.31,0h12.13C583.48,0,594.08,10.6,594.08,23.65v39.99c0,13.05-10.6,23.65-23.65,23.65h-12.13V0h0Z" transform="translate(1152.3868 87.2918) rotate(-180)"/>
                      </motion.g>
                    </g>
                  )}

                  {/* Bus Card Tag / Reader Terminal (Interactive Button - Toggles between State 1 & State 2) */}
                  {playingId === "card" ? (
                    /* Active Tags State (sound-traffic-card-2.svg) */
                    <g transform="translate(652.74, 776.19)">
                      <path 
                        fill="#3F3A2E"
                        fillRule="evenodd"
                        d="M144.84,50.81H14.87c-8.21,0-14.87,6.66-14.87,14.87v63.35c0,8.21,6.66,14.87,14.87,14.87h49.62v28.78h30.74v-28.78h49.62c8.21,0,14.87-6.66,14.87-14.87v-63.35c0-8.21-6.66-14.87-14.87-14.87ZM152.71,129.03c0,4.34-3.53,7.87-7.87,7.87H14.87c-4.34,0-7.87-3.53-7.87-7.87v-63.35c0-4.34,3.53-7.87,7.87-7.87h129.97c4.34,0,7.87,3.53,7.87,7.87v63.35Z"
                      />
                      <path fill="#3F3A2E" d="M102.39,81.18l-.71-2.74c-.45-1.71-2.19-2.74-3.9-2.29l-43.74,11.4c-1.71.45-2.74,2.19-2.29,3.9l.71,2.74,49.93-13.01Z"/>
                      <path fill="#3F3A2E" d="M53.82,99.41l4.22,16.2c.45,1.71,2.19,2.74,3.9,2.29l43.74-11.4c1.71-.45,2.74-2.19,2.29-3.9l-4.22-16.2-49.93,13.01Z"/>
                      <g stroke="#3F3A2E" strokeLinecap="round" strokeMiterlimit={10} strokeWidth="5px">
                        <line x1="77.01" y1="25.53" x2="77.01" y2="2.5"/>
                        <line x1="33.68" y1="28.63" x2="25.27" y2="7.19"/>
                        <line x1="120.34" y1="28.63" x2="128.75" y2="7.19"/>
                      </g>
                    </g>
                  ) : (
                    /* Inactive State (sound-traffic-card-1.svg) */
                    <g transform="translate(652.74, 827)">
                      <motion.g 
                        onClick={() => playSound("card", "/sound/sound/transit_card.mp3")}
                        className="cursor-pointer"
                        style={{ transformOrigin: "79.8px 60.9px" }}
                      >
                        <path 
                          fill="#3F3A2E"
                          fillRule="evenodd"
                          d="M144.84,0H14.87C6.66,0,0,6.66,0,14.87v63.35c0,8.21,6.66,14.87,14.87,14.87h49.62v28.78h30.74v-28.78h49.62c8.21,0,14.87-6.66,14.87-14.87V14.87c0-8.21-6.66-14.87-14.87-14.87ZM152.71,78.22c0,4.34-3.53,7.87-7.87,7.87H14.87c-4.34,0-7.87-3.53-7.87-7.87V14.87c0-4.34,3.53-7.87,7.87-7.87h129.97c4.34,0,7.87,3.53,7.87,7.87v63.35Z"
                        />
                        <path fill="#3F3A2E" d="M102.39,30.37l-.71-2.74c-.45-1.71-2.19-2.74-3.9-2.29l-43.74,11.4c-1.71.45-2.74,2.19-2.29,3.9l.71,2.74,49.93-13.01Z"/>
                        <path fill="#3F3A2E" d="M53.82,48.6l4.22,16.2c.45,1.71,2.19,2.74,3.9,2.29l43.74-11.4c1.71-.45,2.74-2.19,2.29-3.9l-4.22-16.2-49.93,13.01Z"/>
                      </motion.g>
                    </g>
                  )}
                </svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Page 3 Main Shelves Container: Matches Page 2 size and position exactly */}
      <AnimatePresence mode="wait">
        {currentPage === 3 && (
          <motion.div
            key="page-3-shelves"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute top-[80px] bottom-0 z-10 pointer-events-auto flex items-end justify-center"
            style={{ left: "15.625%", right: "35.5224%" }}
          >
            <div className="relative w-full h-full flex items-end justify-center pb-0">
              <svg 
                viewBox="177.15 50 1043.8 1030" 
                className="w-full h-auto max-h-full pointer-events-auto"
              >
                {/* Shelves */}
                <rect stroke="#3F3A2E" fill="none" strokeWidth={1} strokeMiterlimit={10} x="248.85" y="555.77" width="934.43" height="15.54"/>
                <rect stroke="#3F3A2E" fill="none" strokeWidth={1} strokeMiterlimit={10} x="248.85" y="1007.45" width="934.43" height="15.54"/>

                {/* TV Stand Post & Details */}
                <rect stroke="#3F3A2E" fill="none" strokeWidth={1} strokeMiterlimit={10} x="260.84" y="476.86" width="428.5" height="73.97"/>
                <rect stroke="#3F3A2E" fill="none" strokeWidth={1} strokeMiterlimit={10} x="269.16" y="484.24" width="200.55" height="59.21"/>
                <rect stroke="#3F3A2E" fill="none" strokeWidth={1} strokeMiterlimit={10} x="479.71" y="484.24" width="200.55" height="59.21"/>
                <line stroke="#3F3A2E" fill="none" strokeWidth={1} strokeMiterlimit={10} x1="368.51" y1="484.24" x2="368.51" y2="543.45"/>
                <line stroke="#3F3A2E" fill="none" strokeWidth={1} strokeMiterlimit={10} x1="370.36" y1="484.24" x2="370.36" y2="543.45"/>
                <line stroke="#3F3A2E" fill="none" strokeWidth={1} strokeMiterlimit={10} x1="579.06" y1="484.24" x2="579.06" y2="543.45"/>
                <line stroke="#3F3A2E" fill="none" strokeWidth={1} strokeMiterlimit={10} x1="580.91" y1="484.24" x2="580.91" y2="543.45"/>

                {/* Laundry Basket */}
                <polygon stroke="#3F3A2E" fill="none" strokeWidth={0.82} strokeMiterlimit={10} points="732.33 858.08 862.33 858.08 847.86 999.1 746.8 999.1 732.33 858.08"/>
                <line stroke="#3F3A2E" fill="none" strokeWidth={0.82} strokeMiterlimit={10} x1="745.14" y1="982.92" x2="849.52" y2="982.92"/>
                <line stroke="#3F3A2E" fill="none" strokeWidth={0.82} strokeMiterlimit={10} x1="743.37" y1="965.65" x2="851.29" y2="965.65"/>
                <line stroke="#3F3A2E" fill="none" strokeWidth={0.82} strokeMiterlimit={10} x1="741.47" y1="947.16" x2="853.19" y2="947.16"/>
                <line stroke="#3F3A2E" fill="none" strokeWidth={0.82} strokeMiterlimit={10} x1="739.43" y1="927.33" x2="855.22" y2="927.33"/>
                <line stroke="#3F3A2E" fill="none" strokeWidth={0.82} strokeMiterlimit={10} x1="737.24" y1="905.99" x2="857.41" y2="905.99"/>
                <line stroke="#3F3A2E" fill="none" strokeWidth={0.82} strokeMiterlimit={10} x1="734.88" y1="882.98" x2="859.77" y2="882.98"/>
                <line stroke="#3F3A2E" fill="none" strokeWidth={0.82} strokeMiterlimit={10} x1="843.76" y1="858.08" x2="833.42" y2="999.1"/>
                <line stroke="#3F3A2E" fill="none" strokeWidth={0.82} strokeMiterlimit={10} x1="825.19" y1="858.08" x2="818.98" y2="999.1"/>
                <line stroke="#3F3A2E" fill="none" strokeWidth={0.82} strokeMiterlimit={10} x1="806.61" y1="858.08" x2="804.55" y2="999.1"/>
                <line stroke="#3F3A2E" fill="none" strokeWidth={0.82} strokeMiterlimit={10} x1="788.04" y1="858.08" x2="790.11" y2="999.1"/>
                <line stroke="#3F3A2E" fill="none" strokeWidth={0.82} strokeMiterlimit={10} x1="769.47" y1="858.08" x2="775.67" y2="999.1"/>
                <line stroke="#3F3A2E" fill="none" strokeWidth={0.82} strokeMiterlimit={10} x1="750.9" y1="858.08" x2="761.24" y2="999.1"/>
                <path fill="#3F3A2E" d="M740.03,858.08l50.56-22.83c9.83-4.44,21.31-2.96,29.7,3.83l23.47,19h-103.73Z"/>

                {/* Intercom Button (Toggles between State 1 & State 2) */}
                <g transform="translate(268.4, 602.94)">
                  {playingId === "intercom" ? (
                    /* Active Calling State (sound-home-Intercom-2.svg) */
                    <g>
                      <rect fill="#3F3A2E" width="128.81" height="177.45" rx="4.9" ry="4.9"/>
                      <rect fill="#FFF" x="9.87" y="10.72" width="109.07" height="77.07" rx="2.47" ry="2.47"/>
                      <circle fill="#FFF" cx="64.41" cy="150.38" r="16.19"/>
                      <circle fill="#3F3A2E" cx="64.41" cy="37.36" r="18.49"/>
                      <path fill="#3F3A2E" d="M52.81,57.11h23.19c6.75,0,12.24,5.48,12.24,12.24v16.75h-47.66v-16.75c0-6.75,5.48-12.24,12.24-12.24Z"/>
                    </g>
                  ) : (
                    /* Inactive State (sound-home-Intercom-1.svg) */
                    <motion.g 
                      onClick={() => playSound("intercom", "/sound/sound/home_ring.mp3")}
                      className="cursor-pointer"
                      style={{ transformOrigin: "64.4px 88.7px" }}
                    >
                      <rect fill="#3F3A2E" width="128.81" height="177.45" rx="4.9" ry="4.9"/>
                      <rect fill="#FFF" x="9.87" y="10.72" width="109.07" height="77.07" rx="2.47" ry="2.47"/>
                      <circle fill="#FFF" cx="64.41" cy="150.38" r="16.19"/>
                    </motion.g>
                  )}
                </g>

                {/* TV Button (Toggles between State 1 & State 2) */}
                {playingId === "tv" ? (
                  /* Active State (sound-home-tv-2.svg) */
                  <motion.g 
                    onClick={() => playSound("tv-off", "/sound/sound/home_tv_off.mp3")}
                    className="cursor-pointer"
                    style={{ transformOrigin: "475px 283px" }}
                  >
                    <rect fill="#3F3A2E" x="369.53" y="176.73" width="212.62" height="366.61" rx="5.47" ry="5.47" transform="translate(115.81 835.88) rotate(-90)"/>
                    <rect fill="#FFF" stroke="#3F3A2E" strokeMiterlimit={10} x="379.53" y="186.73" width="192.62" height="346.61" transform="translate(835.88 -115.81) rotate(90)"/>
                  </motion.g>
                ) : (
                  /* Inactive State (sound-home-tv-1.svg) */
                  <motion.g 
                    onClick={() => playSound("tv", "/sound/sound/home_tv_on.mp3")}
                    className="cursor-pointer"
                    style={{ transformOrigin: "475px 283px" }}
                  >
                    <rect fill="#3F3A2E" x="369.53" y="176.73" width="212.62" height="366.61" rx="5.47" ry="5.47" transform="translate(115.81 835.88) rotate(-90)"/>
                    <rect fill="#3F3A2E" stroke="#FFF" strokeMiterlimit={10} x="379.53" y="186.73" width="192.62" height="346.61" transform="translate(835.88 -115.81) rotate(90)"/>
                  </motion.g>
                )}

                {/* Washing Machine Button (Toggles between State 1 & State 2) */}
                <g transform="translate(877.37, 661.33)">
                  {playingId === "washer" ? (
                    /* Active State (sound-home-washing-2.svg) */
                    <g>
                      <rect fill="#3F3A2E" width="252.44" height="337.77" rx="5.72" ry="5.72"/>
                      <circle fill="#3F3A2E" stroke="#FFF" strokeMiterlimit={10} cx="126.22" cy="208.65" r="104.99"/>
                      <line stroke="#FFF" strokeLinecap="round" strokeMiterlimit={10} strokeWidth={1} x1="8.73" y1="38.64" x2="243.71" y2="38.64"/>
                      <circle fill="#FFF" cx="231.21" cy="19.19" r="11.14"/>
                      <circle fill="#FFF" cx="204.86" cy="19.19" r="4.74"/>
                      <circle fill="#FFF" cx="192.43" cy="19.19" r="4.74"/>
                      <rect fill="#FFF" x="8.73" y="42.87" width="18.94" height="11.33" rx=".72" ry=".72"/>
                      
                      <path fill="#FFF" d="M105.53,272.31l35.34-41.11,57.94,24.75c8.88-13.6,14.04-29.84,14.04-47.29,0-47.84-38.78-86.63-86.63-86.63s-86.63,38.78-86.63,86.63c0,12.7,2.74,24.77,7.65,35.64l23.42-.22,34.87,28.23Z"/>
                      <path fill="#FFF" d="M91.87,288.2l13.66-15.89-34.87-28.23-23.42.22c8.87,19.62,24.84,35.34,44.63,43.9Z"/>
                      <path fill="#FFF" d="M140.87,231.19l-35.34,41.11-13.66,15.89c10.53,4.55,22.15,7.08,34.35,7.08,2.46,0,4.89-.11,7.3-.31,27.34-2.28,51.08-17.26,65.29-39.03l-57.94-24.75Z"/>
                      <path fill="#3F3A2E" d="M91.73,287.75c-19.38-8.48-34.89-23.68-43.75-42.88,2.16-.24,9.05-.95,14.89-.95,3.58,0,6.15.26,7.62.77,9.7,3.38,31.43,24.87,34.35,27.79l-13.12,15.26Z"/>
                      <path fill="#FFF" d="M62.88,244.42c4.39,0,6.48.41,7.46.75,9.3,3.24,29.9,23.44,33.83,27.34l-12.57,14.63c-18.9-8.36-34.06-23.17-42.86-41.85,2.69-.28,8.86-.87,14.15-.87M62.88,243.42c-7.1,0-15.64,1.03-15.64,1.03,8.87,19.62,24.84,35.34,44.63,43.9l13.66-15.89s-24.28-24.54-34.87-28.23c-1.71-.6-4.6-.8-7.79-.8h0Z"/>
                      <path fill="#3F3A2E" d="M126.22,294.94c-11.63,0-22.9-2.28-33.53-6.77l13.21-15.37c.27-.45,22.23-37.96,35.07-40.95.85-.2,1.82-.3,2.89-.3,15.93,0,50.08,21.98,54.24,24.7-14.67,22.2-38.2,36.18-64.64,38.39-2.44.2-4.88.31-7.26.31Z"/>
                      <path fill="#FFF" d="M143.87,232.04c15.34,0,47.92,20.69,53.55,24.35-6.94,10.35-16.2,19.22-26.85,25.68-11.37,6.9-23.86,10.96-37.13,12.07-2.43.2-4.86.31-7.22.31-11.33,0-22.32-2.18-32.7-6.47l12.77-14.85.06-.07.05-.08c.22-.38,22.07-37.7,34.7-40.64.81-.19,1.75-.29,2.77-.29M143.87,231.04c-1.09,0-2.09.1-3,.31-13.2,3.07-35.34,41.11-35.34,41.11l-13.66,15.89c10.53,4.55,22.15,7.08,34.35,7.08,2.46,0,4.89-.11,7.3-.31,27.34-2.28,51.08-17.26,65.29-39.03,0,0-37.7-25.06-54.94-25.06h0Z"/>
                      <path fill="#3F3A2E" stroke="#FFF" strokeMiterlimit={10} d="M118.49,176.58l14.71,22.63c1.63,2.51,4.42,4.03,7.42,4.03l36.44,6.1c1.77,0,3.5.53,4.96,1.52l1.22.83c5.54,3.75,13.08.23,13.76-6.42l1.26-12.33c.25-2.48-.55-4.95-2.21-6.81l-37.62-35.81c-2.83-3.15-7.5-3.86-11.13-1.69l-25.94,15.53c-4.3,2.57-5.61,8.21-2.88,12.41Z"/>
                    </g>
                  ) : (
                    /* Inactive State (sound-home-washing-1.svg) */
                    <motion.g 
                      onClick={() => playSound("washer", "")}
                      className="cursor-pointer"
                      style={{ transformOrigin: "126.2px 168.9px" }}
                    >
                      <rect fill="#3F3A2E" width="252.44" height="337.77" rx="5.72" ry="5.72"/>
                      <circle fill="#3F3A2E" stroke="#FFF" strokeMiterlimit={10} cx="126.22" cy="208.65" r="104.99"/>
                      <circle fill="#FFF" cx="126.22" cy="208.65" r="86.63"/>
                      <line stroke="#FFF" strokeLinecap="round" strokeMiterlimit={10} strokeWidth={1} x1="8.73" y1="38.64" x2="243.71" y2="38.64"/>
                      <circle fill="#FFF" cx="231.21" cy="19.19" r="11.14"/>
                      <circle fill="#FFF" cx="204.86" cy="19.19" r="4.74"/>
                      <circle fill="#FFF" cx="192.43" cy="19.19" r="4.74"/>
                      <rect fill="#FFF" x="8.73" y="42.87" width="18.94" height="11.33" rx=".72" ry=".72"/>
                    </motion.g>
                  )}
                </g>
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reusable Right Column Container (Frame/Template): Animates the mapped image and text when a button is clicked */}
      <AnimatePresence mode="wait">
        {activeRightImage && (
          <motion.div
            key="right-column-image"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute left-[64.4776%] right-[8.3401%] bottom-0 z-10 pointer-events-none flex flex-col justify-end"
            style={{ top: "80px" }}
          >
            {/* Graphics Card Description (Positions above the image) */}
            {playingId && BUTTON_TEXTS[playingId] && (
              <div className="w-full px-6 pb-6 pointer-events-auto select-text relative z-30">
                <p className="text-lg font-semibold text-[#3F3A2E] leading-relaxed whitespace-pre-line">
                  {BUTTON_TEXTS[playingId].description}
                </p>
                {BUTTON_TEXTS[playingId].subDescription && (
                  <p className="text-xs text-[#3F3A2E]/60 mt-1 font-normal tracking-wide leading-relaxed whitespace-pre-line">
                    {BUTTON_TEXTS[playingId].subDescription}
                  </p>
                )}
              </div>
            )}

            <div className="relative w-full overflow-hidden -mt-8 z-0">
              {/* Soft white gradient overlay starting exactly at the top of the image to mask the edge */}
              <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-[#ffffff] via-[#ffffff] to-transparent pointer-events-none z-20" />
              <img 
                src={activeRightImage} 
                alt="Active right column graphic" 
                className="w-full h-auto object-contain object-bottom relative z-10"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
