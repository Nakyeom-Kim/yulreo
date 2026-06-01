"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInteractionSound } from "@/hooks/useInteractionSound";
import FadeIn from "@/components/FadeIn";

// 통합된 트랙 설정 (각 버튼 인덱스에 매핑됨)
const TRACK_CONFIGS = [
  {
    // index 0: 합주 (대금, 피리, 가야금)
    slots: {
      left: { id: "daegeum", img: "daegeum.png", audio: "/sound/sound effect/school bell/daegeum-kkokdugaksi.wav", minBin: 10, maxBin: 50, centerIndex: 20, offsetX: -250, offsetY: 50 },
      right: { id: "piri", img: "piri.png", audio: "/sound/sound effect/school bell/piri-kkokdugaksi.wav", minBin: 30, maxBin: 70, centerIndex: 40, offsetX: 250, offsetY: 50 },
      bottom: { id: "gayageum", img: "gayageum.png", audio: "/sound/sound effect/school bell/gayageum-kkokdugaksi.wav", minBin: 0, maxBin: 40, centerIndex: 8, offsetX: 0, offsetY: 150 },
    }
  },
  {
    // index 1: 메시지 사운드 (대금, 거문고, 장구) - 약 100px 정도만 끝부분이 겹치도록 간격 확보
    slots: {
      left: { id: "daegeum", img: "daegeum.png", audio: "/sound/sound effect/message/daegeum-message.mp3", minBin: 10, maxBin: 50, centerIndex: 20, offsetX: -250, offsetY: -80 },
      right: { id: "geomungo", img: "geomungo.png", audio: "/sound/sound effect/message/geomungo-message.mp3", minBin: 0, maxBin: 40, centerIndex: 8, offsetX: 250, offsetY: -80 },
      bottom: { id: "janggu", img: "janggu.png", audio: "/sound/sound effect/message/janggu-message.mp3", minBin: 0, maxBin: 30, centerIndex: 5, offsetX: 0, offsetY: 180 },
    }
  }
];

export default function SoundPage() {
  const { playClickSound, playHoverSound } = useInteractionSound();
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTrackIndex, setActiveTrackIndex] = useState<number | null>(null);

  const audiosRef = useRef<{
    left: HTMLAudioElement | null;
    right: HTMLAudioElement | null;
    bottom: HTMLAudioElement | null;
  }>({ left: null, right: null, bottom: null });

  const sourcesRef = useRef<{
    left: MediaElementAudioSourceNode | null;
    right: MediaElementAudioSourceNode | null;
    bottom: MediaElementAudioSourceNode | null;
  }>({ left: null, right: null, bottom: null });

  const gainNodesRef = useRef<{
    left: GainNode | null;
    right: GainNode | null;
    bottom: GainNode | null;
  }>({ left: null, right: null, bottom: null });

  const masterCompressorRef = useRef<DynamicsCompressorNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const reqRef = useRef<number | null>(null);

  // 범용 슬롯(Left, Right, Bottom)용 Analyser와 DOM Ref 관리
  const analysersRef = useRef<{
    left: AnalyserNode | null;
    right: AnalyserNode | null;
    bottom: AnalyserNode | null;
  }>({ left: null, right: null, bottom: null });

  const lastStampRef = useRef<{ left: {x: number, y: number}; right: {x: number, y: number}; bottom: {x: number, y: number} }>({
    left: {x: -999, y: -999}, right: {x: -999, y: -999}, bottom: {x: -999, y: -999},
  });

  const smoothPosRef = useRef<{ left: {x: number, y: number}; right: {x: number, y: number}; bottom: {x: number, y: number} }>({
    left: {x: 0, y: 0}, right: {x: 0, y: 0}, bottom: {x: 0, y: 0},
  });

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 이미지 사전 로딩 (프리로드) - 버튼 클릭 시 딜레이 방지
    const imagesToPreload = [
      "/img/daegeum.png", "/img/piri.png", "/img/gayageum.png",
      "/img/geomungo.png", "/img/janggu.png"
    ];
    imagesToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
      Object.values(audiosRef.current).forEach((audio) => {
        if (audio) audio.pause();
      });
    };
  }, []);

  const handleButtonClick = (index: number) => {
    Object.values(audiosRef.current).forEach((audio) => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });
    if (reqRef.current) cancelAnimationFrame(reqRef.current);
    setIsPlaying(false);

    if (index === 0 || index === 1) {
      setActiveTrackIndex(index);
      const trackConfig = TRACK_CONFIGS[index];

      const existingTrails = document.querySelectorAll('.music-trail');
      existingTrails.forEach(trail => trail.remove());
      
      lastStampRef.current = {
        left: {x: -999, y: -999}, right: {x: -999, y: -999}, bottom: {x: -999, y: -999}
      };
      
      smoothPosRef.current = {
        left: {x: 0, y: 0}, right: {x: 0, y: 0}, bottom: {x: 0, y: 0}
      };
      
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const createAnalyser = () => {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        return analyser;
      };

      if (!analysersRef.current.left) analysersRef.current.left = createAnalyser();
      if (!analysersRef.current.right) analysersRef.current.right = createAnalyser();
      if (!analysersRef.current.bottom) analysersRef.current.bottom = createAnalyser();

      const slots = [
        { key: "left", config: trackConfig.slots.left, analyser: analysersRef.current.left },
        { key: "right", config: trackConfig.slots.right, analyser: analysersRef.current.right },
        { key: "bottom", config: trackConfig.slots.bottom, analyser: analysersRef.current.bottom },
      ];

      // 개별 채널 볼륨 설정 (물리 파일이 가야금 기준으로 정규화 완료되었으므로, 합산 헤드룸인 0.8로 통일)
      const targetVol = 0.8;

      // 마스터 채널에서 모든 소리가 겹칠 때 생기는 클리핑 방지용 컴프레서 생성 (최초 1회만 생성하여 왜곡 제거)
      if (!masterCompressorRef.current) {
        masterCompressorRef.current = ctx.createDynamicsCompressor();
        const comp = masterCompressorRef.current;
        comp.threshold.setValueAtTime(-12, ctx.currentTime);
        comp.knee.setValueAtTime(30, ctx.currentTime);
        comp.ratio.setValueAtTime(4, ctx.currentTime);
        comp.attack.setValueAtTime(0.05, ctx.currentTime);
        comp.release.setValueAtTime(0.25, ctx.currentTime);
        comp.connect(ctx.destination);
      }
      const compressor = masterCompressorRef.current;

      let finishedCount = 0;
      slots.forEach((slot) => {
        const key = slot.key as "left" | "right" | "bottom";

        if (!audiosRef.current[key]) {
          audiosRef.current[key] = new Audio();
          audiosRef.current[key]!.crossOrigin = "anonymous";
        }
        const audio = audiosRef.current[key]!;
        audio.src = slot.config.audio;

        // MediaElementAudioSourceNode 및 GainNode를 최초 1회만 매핑 및 연결하여 노이즈 제거
        if (!sourcesRef.current[key]) {
          sourcesRef.current[key] = ctx.createMediaElementSource(audio);
          gainNodesRef.current[key] = ctx.createGain();
          gainNodesRef.current[key]!.gain.setValueAtTime(targetVol, ctx.currentTime);

          sourcesRef.current[key]!.connect(slot.analyser!);
          slot.analyser!.connect(gainNodesRef.current[key]!);
          gainNodesRef.current[key]!.connect(compressor);
        }

        audio.play().catch(e => console.error("Audio play failed:", e));

        audio.onended = () => {
          finishedCount++;
          if (finishedCount === slots.length) {
            setIsPlaying(false);
            if (reqRef.current) cancelAnimationFrame(reqRef.current);
          }
        };
      });

      setIsPlaying(true);

      const createTrail = (parentRef: HTMLDivElement, imgSrc: string, moveX: number, moveY: number, scale: number) => {
        if (!parentRef || !parentRef.parentElement) return;
        
        const trail = document.createElement("img");
        trail.src = `/img/${imgSrc}?v=2`;
        
        trail.className = "music-trail w-64 md:w-96 h-auto object-contain absolute top-0 left-0 pointer-events-none z-0";
        trail.style.opacity = "0.3"; 
        trail.style.transform = `translate(${moveX}px, ${moveY}px) scale(${scale})`;
        trail.style.transition = "opacity 1s ease-out";
        
        parentRef.parentElement.appendChild(trail);
        
        requestAnimationFrame(() => {
          trail.style.opacity = "0";
        });

        setTimeout(() => {
          if (parentRef.parentElement && parentRef.parentElement.contains(trail)) {
            parentRef.parentElement.removeChild(trail);
          }
        }, 1000);
      };

      const getDist = (x1: number, y1: number, x2: number, y2: number) => Math.sqrt((x2-x1)**2 + (y2-y1)**2);

      const updateLoop = () => {
        const dataArray = new Uint8Array(128);
        
        const processSlot = (key: "left" | "right" | "bottom", ref: React.RefObject<HTMLDivElement | null>) => {
          const analyser = analysersRef.current[key];
          const config = trackConfig.slots[key as keyof typeof trackConfig.slots];
          
          if (analyser && ref.current) {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            let maxVal = 0;
            let maxIndex = config.centerIndex;
            for (let i = config.minBin; i < config.maxBin; i++) {
              sum += dataArray[i];
              if (dataArray[i] > maxVal) { maxVal = dataArray[i]; maxIndex = i; }
            }
            const avg = sum / (config.maxBin - config.minBin);
            const intensity = Math.pow(avg / 255, 1.5);
            const scale = 1.0 + intensity * 0.8;
            
            const targetX = (maxIndex - config.centerIndex) * 15 + config.offsetX;
            const targetY = -intensity * 300 + config.offsetY;
            
            smoothPosRef.current[key].x += (targetX - smoothPosRef.current[key].x) * 0.05;
            smoothPosRef.current[key].y += (targetY - smoothPosRef.current[key].y) * 0.05;
            
            const moveX = smoothPosRef.current[key].x;
            const waveY = smoothPosRef.current[key].y;
            
            ref.current.style.transform = `translate(${moveX}px, ${waveY}px) scale(${scale})`;

            if (intensity > 0.1 && getDist(moveX, waveY, lastStampRef.current[key].x, lastStampRef.current[key].y) > 20) {
              lastStampRef.current[key] = { x: moveX, y: waveY };
              createTrail(ref.current, config.img, moveX, waveY, scale);
            }
          }
        };

        processSlot("left", leftRef);
        processSlot("right", rightRef);
        processSlot("bottom", bottomRef);

        reqRef.current = requestAnimationFrame(updateLoop);
      };

      reqRef.current = requestAnimationFrame(updateLoop);

    } else {
      playClickSound();
    }
  };

  const currentConfig = activeTrackIndex !== null ? TRACK_CONFIGS[activeTrackIndex] : null;

  return (
    <div className="flex flex-col min-h-screen pt-24 md:pt-32 pb-8 md:pb-12 px-4 md:px-8 bg-background relative overflow-hidden">
      
      <AnimatePresence>
        {isPlaying && currentConfig && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 px-4 md:px-12"
          >
            <div className="relative w-full h-[60vh] flex items-center justify-center">
              
              {/* Left Slot */}
              <div className="absolute flex flex-col items-center justify-center z-10 w-48 md:w-64 lg:w-96">
                <div ref={leftRef} className="transition-all duration-75 ease-in-out origin-center z-10 relative">
                  <img src={`/img/${currentConfig.slots.left.img}?v=2`} alt={currentConfig.slots.left.id} width={600} height={600} className="w-48 md:w-64 lg:w-96 h-auto object-contain" />
                </div>
              </div>

              {/* Right Slot */}
              <div className="absolute flex flex-col items-center justify-center z-10 w-48 md:w-64 lg:w-96">
                <div ref={rightRef} className="transition-all duration-75 ease-in-out origin-center z-10 relative">
                  <img src={`/img/${currentConfig.slots.right.img}?v=2`} alt={currentConfig.slots.right.id} width={600} height={600} className="w-48 md:w-64 lg:w-96 h-auto object-contain" />
                </div>
              </div>

              {/* Bottom Slot */}
              <div className="absolute flex flex-col items-center justify-center z-10 w-48 md:w-64 lg:w-96">
                <div ref={bottomRef} className="transition-all duration-75 ease-in-out origin-center z-10 relative">
                  <img src={`/img/${currentConfig.slots.bottom.img}?v=2`} alt={currentConfig.slots.bottom.id} width={600} height={600} className="w-48 md:w-64 lg:w-96 h-auto object-contain" />
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isPlaying && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
          >
            <p className="text-sm md:text-base tracking-[0.2em] text-foreground/40 font-light font-sans uppercase">
              Click the Button
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-grow flex flex-col justify-end relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-3 md:gap-x-6 md:gap-y-4 lg:gap-x-8 max-w-4xl mx-auto px-4 md:px-0">
            {[...Array(8)].map((_, i) => (
              <button
                key={i}
                onClick={() => handleButtonClick(i)}
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 shrink-0 rounded-full border border-foreground/20 bg-background transition-all duration-300 hover:scale-110 hover:bg-foreground/5 hover:border-foreground/40 active:scale-95 flex items-center justify-center text-[10px] md:text-xs font-sans text-foreground/50"
                aria-label={`Sound button ${i + 1}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
