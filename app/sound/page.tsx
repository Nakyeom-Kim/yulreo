"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInteractionSound } from "@/hooks/useInteractionSound";
import FadeIn from "@/components/FadeIn";
import { getInstrumentMotionStyle } from "@/utils/instrumentMotions";

// 통합된 트랙 설정 (각 버튼 인덱스에 매핑됨)
const TRACK_CONFIGS = [
  {
    // index 0: 합주 (대금, 피리, 가야금)
    slots: {
      left: { id: "daegeum", img: "daegeum.png", audio: "/sound/sound effect/school bell/daegeum-kkokdugaksi.wav", minBin: 10, maxBin: 50, centerIndex: 20, offsetX: -250, offsetY: 50 },
      right: { id: "piri", img: "piri.png", audio: "/sound/sound effect/school bell/piri-kkokdugaksi.wav", minBin: 30, maxBin: 70, centerIndex: 40, offsetX: 250, offsetY: 50 },
      bottom: { id: "gayageum", img: "gayageum.png", audio: "/sound/sound effect/school bell/gayageum-kkokdugaksi.wav", minBin: 0, maxBin: 40, centerIndex: 8, offsetX: 0, offsetY: 150 },
    },
    staticImages: [
      // 중앙 가야금 (맨 뒤 레이어): 넓게 퍼져있는 노란색 블록, 화면 중앙~좌측을 넓게 덮으며 왼쪽이 살짝 잘림
      { id: "gayageum-cl", audioKey: "bottom", instrument: "Gayageum", img: "gayageum.png", className: "fixed top-[25vh] left-[-10vw] w-[80vw] max-w-none opacity-90 -z-10" },

      // 좌측 상단 대금: 오른쪽으로 5vw 이동(left-[-10vw]) 및 크기 살짝 축소(w-[40vw])
      { id: "daegeum-tl", audioKey: "left", instrument: "Daegeum", img: "daegeum.png", className: "fixed top-[5vh] left-[-10vw] w-[40vw] max-w-none opacity-90" },

      // 우측 중앙 대금: 크기를 53vw로 조정, 레퍼런스 이미지처럼 화면 최우측에 붙고 중앙에서 중앙을 향해 뻗어나가는 형태
      { id: "daegeum-mr", audioKey: "left", instrument: "Daegeum", img: "daegeum.png", className: "fixed top-[35vh] right-0 w-[53vw] max-w-none opacity-90" },

      // 우측 상단 피리: 우측 가장자리가 아니라 화면 가로 70~80% 부근에 위치하며 위쪽이 약간 잘림
      { id: "piri-tr", audioKey: "right", instrument: "Piri", img: "piri.png", className: "fixed top-[-10vh] right-[10vw] w-[30vw] max-w-none opacity-90" },

      // 좌측 하단 피리: 오른쪽으로 5vw 이동 (left-[5vw])
      { id: "piri-bl", audioKey: "right", instrument: "Piri", img: "piri.png", className: "fixed bottom-[-10vh] left-[5vw] w-[30vw] max-w-none opacity-90" }
    ]
  },
  {
    // index 1: 메시지 사운드 (대금, 거문고, 장구) - 약 100px 정도만 끝부분이 겹치도록 간격 확보
    slots: {
      left: { id: "daegeum", img: "daegeum.png", audio: "/sound/sound effect/message/daegeum-message.mp3", minBin: 10, maxBin: 50, centerIndex: 20, offsetX: -250, offsetY: -80 },
      right: { id: "geomungo", img: "geomungo.png", audio: "/sound/sound effect/message/geomungo-message.mp3", minBin: 0, maxBin: 40, centerIndex: 8, offsetX: 250, offsetY: -80 },
      bottom: { id: "janggu", img: "janggu.png", audio: "/sound/sound effect/message/janggu-message.mp3", minBin: 0, maxBin: 30, centerIndex: 5, offsetX: 0, offsetY: 180 },
    },
    staticImages: [
      // 거문고: 맨 밑으로 가도록 가장 낮은 양수값(10) 부여
      { id: "geomungo-t", audioKey: "right", instrument: "Geomungo", img: "geomungo.png", className: "fixed top-0 left-0 h-[60vh] w-auto max-w-none opacity-80", zIndex: 10 },

      // 대금 1 (좌측 하단): 거문고와 장구 사이 레이어(20)
      { id: "daegeum-ml", audioKey: "left", instrument: "Daegeum", img: "daegeum.png", className: "fixed bottom-0 left-0 h-[25vh] w-auto max-w-none opacity-90", zIndex: 20 },

      // 대금 2 (우측 상단): 거문고와 장구 사이 레이어(20)
      { id: "daegeum-tr2", audioKey: "left", instrument: "Daegeum", img: "daegeum.png", className: "fixed top-[5vh] right-[-10vw] h-[25vh] w-auto max-w-none opacity-90", zIndex: 20 },

      // 장구: 모든 악기 위로 무조건 덮어지도록 가장 높은 양수값(50) 부여
      { id: "janggu-cb", audioKey: "bottom", instrument: "Janggu", img: "janggu.png", className: "fixed bottom-[-10vh] right-[5vw] h-[90vh] w-auto max-w-none opacity-90", zIndex: 50 },
    ]
  },
  {
    // index 2: 3번 버튼 (가야금, 장구, 태평소)
    slots: {
      left: { id: "gayageum", img: "gayageum.png", audio: "/sound/sound effect/bell/bell_gayageum.mp3", minBin: 10, maxBin: 50, centerIndex: 20, offsetX: -250, offsetY: 0 },
      right: { id: "janggu", img: "janggu.png", audio: "/sound/sound effect/bell/bell_janggu.mp3", minBin: 30, maxBin: 70, centerIndex: 40, offsetX: 250, offsetY: 0 },
      bottom: { id: "taepyeongso", img: "taepyeongso.png", audio: "/sound/sound effect/bell/bell_taepyeongso.mp3", minBin: 20, maxBin: 127, centerIndex: 8, offsetX: 0, offsetY: 150 },
    },
    staticImages: [
      // === 가야금 (상단 5개, 하단 5개) ===
      // === 가야금 (상단 5개, 하단 5개) ===
      // === 가야금 (상단 5개, 하단 5개) ===
      // w-auto를 빼고 명시적인 w-[30vw] 부여하여 크기 축소 버그 방지 (object-contain이 알아서 비율 유지)
      { id: "gaya-t1", audioKey: "left", instrument: "Gayageum", img: "gayageum.png", className: "fixed top-[0vh] left-[10%] -translate-x-1/2 h-[15vh] w-[30vw] opacity-80", zIndex: 30 },
      { id: "gaya-t2", audioKey: "left", instrument: "Gayageum", img: "gayageum.png", className: "fixed top-[5vh] left-[30%] -translate-x-1/2 h-[15vh] w-[30vw] opacity-80", zIndex: 30 },
      { id: "gaya-t3", audioKey: "left", instrument: "Gayageum", img: "gayageum.png", className: "fixed top-[0vh] left-[50%] -translate-x-1/2 h-[15vh] w-[30vw] opacity-80", zIndex: 30 },
      { id: "gaya-t4", audioKey: "left", instrument: "Gayageum", img: "gayageum.png", className: "fixed top-[5vh] right-[30%] translate-x-1/2 h-[15vh] w-[30vw] opacity-80", zIndex: 30 },
      { id: "gaya-t5", audioKey: "left", instrument: "Gayageum", img: "gayageum.png", className: "fixed top-[0vh] right-[10%] translate-x-1/2 h-[15vh] w-[30vw] opacity-80", zIndex: 30 },
      
      // 하단 가야금 5개 (명시적 너비 부여)
      { id: "gaya-b1", audioKey: "left", instrument: "Gayageum", img: "gayageum.png", className: "fixed bottom-[0vh] left-[10%] -translate-x-1/2 h-[15vh] w-[30vw] opacity-80", zIndex: 30 },
      { id: "gaya-b2", audioKey: "left", instrument: "Gayageum", img: "gayageum.png", className: "fixed bottom-[5vh] left-[30%] -translate-x-1/2 h-[15vh] w-[30vw] opacity-80", zIndex: 30 },
      { id: "gaya-b3", audioKey: "left", instrument: "Gayageum", img: "gayageum.png", className: "fixed bottom-[0vh] left-[50%] -translate-x-1/2 h-[15vh] w-[30vw] opacity-80", zIndex: 30 },
      { id: "gaya-b4", audioKey: "left", instrument: "Gayageum", img: "gayageum.png", className: "fixed bottom-[5vh] right-[30%] translate-x-1/2 h-[15vh] w-[30vw] opacity-80", zIndex: 30 },
      { id: "gaya-b5", audioKey: "left", instrument: "Gayageum", img: "gayageum.png", className: "fixed bottom-[0vh] right-[10%] translate-x-1/2 h-[15vh] w-[30vw] opacity-80", zIndex: 30 },

      // === 정중앙 (태평소 1개, 장구 1개 겹치기) ===
      // 태평소 (정확한 70vh~90vh 계산을 위해 기준을 100vh로 두고 너비를 150vw로 넉넉하게 줌)
      { id: "taepyeongso-c", audioKey: "bottom", instrument: "Taepyeongso", img: "taepyeongso.png", className: "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[100vh] w-[150vw] opacity-80", zIndex: 10 },
      
      // 장구 (앞쪽, 너비 지정)
      { id: "janggu-c", audioKey: "right", instrument: "Janggu", img: "janggu.png", className: "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[35vh] w-[60vw] opacity-95", zIndex: 50 },
    ]
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
  const endTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const smoothedIntensitiesRef = useRef<{ left: number; right: number; bottom: number }>({ left: 0, right: 0, bottom: 0 });
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 범용 슬롯(Left, Right, Bottom)용 Analyser와 DOM Ref 관리
  const analysersRef = useRef<{
    left: AnalyserNode | null;
    right: AnalyserNode | null;
    bottom: AnalyserNode | null;
  }>({ left: null, right: null, bottom: null });

  const lastStampRef = useRef<{ left: { x: number, y: number }; right: { x: number, y: number }; bottom: { x: number, y: number } }>({
    left: { x: -999, y: -999 }, right: { x: -999, y: -999 }, bottom: { x: -999, y: -999 },
  });

  const smoothPosRef = useRef<{ left: { x: number, y: number }; right: { x: number, y: number }; bottom: { x: number, y: number } }>({
    left: { x: 0, y: 0 }, right: { x: 0, y: 0 }, bottom: { x: 0, y: 0 },
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
      if (endTimeoutRef.current) clearTimeout(endTimeoutRef.current);
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
    if (endTimeoutRef.current) clearTimeout(endTimeoutRef.current);
    setIsPlaying(false);

    if (index === 0 || index === 1 || index === 2) {
      setActiveTrackIndex(index);
      const trackConfig = TRACK_CONFIGS[index];

      const existingTrails = document.querySelectorAll('.music-trail');
      existingTrails.forEach(trail => trail.remove());

      lastStampRef.current = {
        left: { x: -999, y: -999 }, right: { x: -999, y: -999 }, bottom: { x: -999, y: -999 }
      };

      smoothPosRef.current = {
        left: { x: 0, y: 0 }, right: { x: 0, y: 0 }, bottom: { x: 0, y: 0 }
      };

      smoothedIntensitiesRef.current = { left: 0, right: 0, bottom: 0 };
      itemRefs.current = [];

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
            // 모든 트랙 재생이 끝난 후 1.5초(1500ms) 동안 이미지가 화면에 더 머무르게 대기
            endTimeoutRef.current = setTimeout(() => {
              setIsPlaying(false);
              if (reqRef.current) cancelAnimationFrame(reqRef.current);
            }, 1500);
          }
        };
      });

      setIsPlaying(true);

      const createTrail = (parentRef: HTMLDivElement, imgSrc: string, moveX: number, moveY: number, scale: number) => {
        if (!parentRef || !parentRef.parentElement) return;

        const trail = document.createElement("img");
        trail.src = `/img/${imgSrc}?v=4`;

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

      const getDist = (x1: number, y1: number, x2: number, y2: number) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

      const updateLoop = () => {
        const dataArray = new Uint8Array(128);
        const time = performance.now();

        const keys: ("left" | "right" | "bottom")[] = ["left", "right", "bottom"];
        const currentIntensities: Record<string, number> = {};
        const currentPitches: Record<string, number> = {};

        keys.forEach(key => {
          const analyser = analysersRef.current[key];
          const config = trackConfig.slots[key as keyof typeof trackConfig.slots];
          if (analyser) {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            let maxVal = -1;
            let maxIdx = config.minBin;
            for (let i = config.minBin; i < config.maxBin; i++) {
              sum += dataArray[i];
              if (dataArray[i] > maxVal) {
                maxVal = dataArray[i];
                maxIdx = i;
              }
            }
            const avg = sum / (config.maxBin - config.minBin);
            const pitch = (config.maxBin - config.minBin) > 0 ? (maxIdx - config.minBin) / (config.maxBin - config.minBin) : 0.5;
            
            // 사운드 페이지의 합주/메시지 사운드들은 단일 악기 대비 음압이 낮아 모션이 잘 안 보이므로 강도를 1.8배 증폭
            const rawIntensity = Math.pow(avg / 255, 1.5);
            const intensity = Math.min(1.0, rawIntensity * 1.8);
            currentIntensities[key] = intensity;
            currentPitches[key] = pitch;

            if (intensity > smoothedIntensitiesRef.current[key]) {
              smoothedIntensitiesRef.current[key] += (intensity - smoothedIntensitiesRef.current[key]) * 0.8;
            } else {
              smoothedIntensitiesRef.current[key] += (intensity - smoothedIntensitiesRef.current[key]) * 0.25;
            }
          }
        });

        if ((trackConfig as any).staticImages) {
          (trackConfig as any).staticImages.forEach((img: any, idx: number) => {
            const node = itemRefs.current[idx];
            if (!node) return;
            const audioKey = img.audioKey as "left" | "right" | "bottom";
            const audio = audiosRef.current[audioKey];
            if (!audio) return;
            const motionResult = getInstrumentMotionStyle({
              instrument: img.instrument,
              audio,
              intensity: currentIntensities[audioKey],
              smoothedIntensity: smoothedIntensitiesRef.current[audioKey],
              smoothedPitch: currentPitches[audioKey] || 0.5,
              isFadingOut: false,
              elapsedFade: 0,
              time,
              disablePositionalTranslation: true,
              disableBaseScale: true,
              disableProgressFade: true,
              elementId: img.id,
              refs: { wrapper: node }
            });
            node.style.transform = motionResult.transform;
            node.style.opacity = String(motionResult.opacity);
            node.style.filter = motionResult.filter;
            if (motionResult.transformOrigin) {
              node.style.transformOrigin = motionResult.transformOrigin;
            }
          });
        } else {
          keys.forEach((key) => {
            const node = key === "left" ? leftRef.current : key === "right" ? rightRef.current : bottomRef.current;
            if (!node) return;
            const config = trackConfig.slots[key];
            const audio = audiosRef.current[key];
            if (!audio) return;

            const mappedInstrument = config.id.startsWith("bell") ? "Janggu" : config.id.charAt(0).toUpperCase() + config.id.slice(1);
            const motionResult = getInstrumentMotionStyle({
              instrument: mappedInstrument,
              audio,
              intensity: currentIntensities[key],
              smoothedIntensity: smoothedIntensitiesRef.current[key],
              smoothedPitch: 0.5,
              isFadingOut: false,
              elapsedFade: 0,
              time,
              disableProgressFade: true,
              refs: { wrapper: node }
            });
            node.style.transform = motionResult.transform;
            node.style.opacity = String(motionResult.opacity);
            node.style.filter = motionResult.filter;
          });
        }

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

              {(currentConfig as any).staticImages ? (
                <>
                  {(currentConfig as any).staticImages.map((img: any, idx: number) => (
                    <div key={idx} className={img.className} style={{ transformOrigin: "center center", zIndex: img.zIndex !== undefined ? img.zIndex : idx }}>
                      <div ref={(el) => { itemRefs.current[idx] = el; }} className="w-full h-full transition-[opacity,filter] duration-300 ease-in-out">
                        <img src={`/img/${img.img}?v=4`} alt={img.id} className="w-full h-full object-contain" />
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {/* Left Slot */}
                  <div className="absolute flex flex-col items-center justify-center z-10 w-48 md:w-64 lg:w-96">
                    {currentConfig.slots.left && (
                      <div ref={leftRef} className="transition-[opacity,filter] duration-300 ease-in-out origin-center z-10 relative">
                        <img src={`/img/${currentConfig.slots.left.img}?v=4`} alt={currentConfig.slots.left.id} width={600} height={600} className="w-48 md:w-64 lg:w-96 h-auto object-contain" />
                      </div>
                    )}
                  </div>

                  {/* Right Slot */}
                  <div className="absolute flex flex-col items-center justify-center z-10 w-48 md:w-64 lg:w-96">
                    {currentConfig.slots.right && (
                      <div ref={rightRef} className="transition-[opacity,filter] duration-300 ease-in-out origin-center z-10 relative">
                        <img src={`/img/${currentConfig.slots.right.img}?v=4`} alt={currentConfig.slots.right.id} width={600} height={600} className="w-48 md:w-64 lg:w-96 h-auto object-contain" />
                      </div>
                    )}
                  </div>

                  {/* Bottom Slot */}
                  <div className="absolute flex flex-col items-center justify-center z-10 w-48 md:w-64 lg:w-96">
                    {currentConfig.slots.bottom && (
                      <div ref={bottomRef} className="transition-[opacity,filter] duration-300 ease-in-out origin-center z-10 relative">
                        <img src={`/img/${currentConfig.slots.bottom.img}?v=4`} alt={currentConfig.slots.bottom.id} width={600} height={600} className="w-48 md:w-64 lg:w-96 h-auto object-contain" />
                      </div>
                    )}
                  </div>
                </>
              )}

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
