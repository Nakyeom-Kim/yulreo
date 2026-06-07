"use client";

import { useState, useRef, useEffect } from "react";
import FadeIn from "@/components/FadeIn";
import { useInteractionSound } from "@/hooks/useInteractionSound";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { getInstrumentMotionStyle } from "@/utils/instrumentMotions";

export default function InstrumentPage() {
  const { playHoverSound, playClickSound } = useInteractionSound();
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeInstrument, setActiveInstrument] = useState<{ ko: string; en: string } | null>(null);
  const [activeButtonIndex, setActiveButtonIndex] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  const instrumentNames = [
    "훈", "편종", "편경", "대금", "태평소",
    "피리", "생황", "박", "어", "장구",
    "북", "좌고", "가야금", "거문고", "해금"
  ];

  // Web Audio API 레퍼런스
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const activeAudioRef = useRef<HTMLAudioElement | null>(null);
  const reqRef = useRef<number | null>(null);

  // 이미지를 제어하기 위한 DOM 레퍼런스
  const imgWrapperRef = useRef<HTMLDivElement>(null);
  const rippleLeftRef = useRef<HTMLImageElement>(null);
  const rippleRightRef = useRef<HTMLImageElement>(null);
  const mainImgRef = useRef<HTMLImageElement>(null); // 메인 이미지 자체를 왜곡하기 위한 레퍼런스
  const jwagoDirectionRef = useRef(-1); // 좌고 오-왼 번갈아 왜곡을 위한 방향 상태 (초기값 -1)
  const jwagoLastIntensityRef = useRef(0); // 좌고 비트(타격) 감지용 이전 강도
  const jwagoBeatCooldownRef = useRef(0); // 비트 중복 감지 방지용 쿨다운 시간
  // 타악기 여음 대기를 끊기 위한 타이머 레퍼런스
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // 타악기 및 현악기 소리 순차 재생을 위한 인덱스 레퍼런스
  const jangguIndexRef = useRef(0);
  const eoIndexRef = useRef(0);
  const gayageumIndexRef = useRef(0);
  const geomungoIndexRef = useRef(0);
  const haegeumIndexRef = useRef(0);

  // 페이지 이탈 시 정리 및 이미지 프리로드
  useEffect(() => {
    // 이미지 사전 로딩 (프리로드) - 버튼 클릭 시 딜레이 방지
    const imagesToPreload = [
      "/img/hun.png", "/img/hun01.png", "/img/pyeonjong.png", "/img/pyeongyeong.png",
      "/img/daegeum.png", "/img/taepyeongso.png", "/img/piri.png",
      "/img/saenghwang.png", "/img/saenghwang01.png", "/img/bak.png", "/img/eo.png",
      "/img/janggu.png", "/img/buk.png", "/img/jwago.png",
      "/img/gayageum.png", "/img/geomungo.png", "/img/haegeum.png"
    ];
    imagesToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current.src = "";
      }
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(err => console.error("Error closing AudioContext:", err));
        audioCtxRef.current = null;
      }
    };
  }, []);

  const handleButtonClick = (index: number) => {
    let audioSrc = "";
    let imgSrc = "";
    let instrumentName = { ko: "", en: "" };
    
    // 주파수 분석 대역 설정 (기본값: 타악기용 저음역대)
    let minBin = 0;
    let maxBin = 20;

    if (index === 0) {
      // 1번 버튼: 훈
      audioSrc = "/sound/instrument/hun01.mp3";
      imgSrc = "/img/hun.png";
      instrumentName = { ko: "훈", en: "Hun" };
      minBin = 10;
      maxBin = 50;
    } else if (index === 1) {
      // 2번 버튼: 편종
      audioSrc = "/sound/instrument/pyeonjong01.mp3";
      imgSrc = "/img/pyeonjong.png";
      instrumentName = { ko: "편종", en: "Pyeonjong" };
      minBin = 30;
      maxBin = 100;
    } else if (index === 2) {
      // 3번 버튼: 편경
      audioSrc = "/sound/instrument/pyeongyeoing01.mp3";
      imgSrc = "/img/pyeongyeong.png";
      instrumentName = { ko: "편경", en: "Pyeongyeong" };
      minBin = 30;
      maxBin = 100;
    } else if (index === 3) {
      // 4번 버튼: 대금
      audioSrc = "/sound/instrument/deageum01.mp3";
      imgSrc = "/img/daegeum.png";
      instrumentName = { ko: "대금", en: "Daegeum" };
      minBin = 20;
      maxBin = 60;
    } else if (index === 4) {
      // 5번 버튼: 태평소
      audioSrc = "/sound/instrument/taepyeongso01.mp3";
      imgSrc = "/img/taepyeongso.png";
      instrumentName = { ko: "태평소", en: "Taepyeongso" };
      minBin = 30;
      maxBin = 100;
    } else if (index === 5) {
      // 6번 버튼: 피리
      audioSrc = "/sound/instrument/piri01.mp3";
      imgSrc = "/img/piri.png";
      instrumentName = { ko: "피리", en: "Piri" };
      minBin = 40;
      maxBin = 120;
    } else if (index === 6) {
      // 7번 버튼: 생황
      audioSrc = "/sound/instrument/saenghwang01.mp3";
      imgSrc = "/img/saenghwang.png";
      instrumentName = { ko: "생황", en: "Saenghwang" };
      minBin = 30;
      maxBin = 100;
    } else if (index === 7) {
      // 8번 버튼: 박
      audioSrc = "/sound/instrument/bak01.mp3";
      imgSrc = "/img/bak.png";
      instrumentName = { ko: "박", en: "Bak" };
      minBin = 20;
      maxBin = 80;
    } else if (index === 8) {
      // 9번 버튼 (인덱스 8): 어
      const eoSounds = [
        "/sound/instrument/eo01.wav",
        "/sound/instrument/eo02.wav"
      ];
      audioSrc = eoSounds[eoIndexRef.current];
      eoIndexRef.current = (eoIndexRef.current + 1) % eoSounds.length;
      
      imgSrc = "/img/eo.png";
      instrumentName = { ko: "어", en: "Eo" };
      // '어'는 나무를 긁는 소리이므로 고음역대(High frequency)에 반응하도록 설정
      minBin = 40;
      maxBin = 120;
    } else if (index === 9) {
      // 10번 버튼 (인덱스 9): 장구
      const jangguSounds = [
        "/sound/instrument/Janggu01.wav",
        "/sound/instrument/Janggu02.wav",
        "/sound/instrument/Janggu03.wav",
        "/sound/instrument/Janggu04.wav"
      ];
      // 무작위가 아닌 순서대로(돌아가면서) 재생
      audioSrc = jangguSounds[jangguIndexRef.current];
      jangguIndexRef.current = (jangguIndexRef.current + 1) % jangguSounds.length;
      
      imgSrc = "/img/janggu.png";
      instrumentName = { ko: "장구", en: "Janggu" };
    } else if (index === 10) {
      // 11번 버튼 (인덱스 10): 북
      audioSrc = "/sound/instrument/buk01.mp3";
      imgSrc = "/img/buk.png";
      instrumentName = { ko: "북", en: "Buk" };
      minBin = 0;
      maxBin = 20;
    } else if (index === 11) {
      // 12번 버튼 (인덱스 11): 좌고
      audioSrc = "/sound/instrument/Jwago 01.mp3";
      imgSrc = "/img/jwago.png";
      instrumentName = { ko: "좌고", en: "Jwago" };
      minBin = 0;
      maxBin = 20;
      jwagoDirectionRef.current = -1; // 재생 시작 시 초기화 (첫 비트 때 토글되어 1(오른쪽)부터 시작)
      jwagoLastIntensityRef.current = 0;
      jwagoBeatCooldownRef.current = 0;
    } else if (index === 12) {
      // 13번 버튼 (인덱스 12): 가야금
      const gayageumSounds = [
        "/sound/instrument/gayageum01.mp3",
        "/sound/instrument/gayageum02.mp3",
        "/sound/instrument/gayageum03.mp3",
        "/sound/instrument/gayageum04.mp3"
      ];
      audioSrc = gayageumSounds[gayageumIndexRef.current];
      gayageumIndexRef.current = (gayageumIndexRef.current + 1) % gayageumSounds.length;
      imgSrc = "/img/gayageum.png";
      instrumentName = { ko: "가야금", en: "Gayageum" };
      minBin = 20;
      maxBin = 80;
    } else if (index === 13) {
      // 14번 버튼 (인덱스 13): 거문고
      const geomungoSounds = [
        "/sound/instrument/gumungo01.mp3",
        "/sound/instrument/gumungo02.mp3",
        "/sound/instrument/gumungo03.mp3",
        "/sound/instrument/gumungo04.mp3"
      ];
      audioSrc = geomungoSounds[geomungoIndexRef.current];
      geomungoIndexRef.current = (geomungoIndexRef.current + 1) % geomungoSounds.length;
      imgSrc = "/img/geomungo.png";
      instrumentName = { ko: "거문고", en: "Geomungo" };
      minBin = 10;
      maxBin = 60;
    } else if (index === 14) {
      // 15번 버튼 (인덱스 14): 해금
      const haegeumSounds = [
        "/sound/instrument/haegeum01.mp3",
        "/sound/instrument/haegeum02.mp3",
        "/sound/instrument/haegeum03.mp3"
      ];
      audioSrc = haegeumSounds[haegeumIndexRef.current];
      haegeumIndexRef.current = (haegeumIndexRef.current + 1) % haegeumSounds.length;
      imgSrc = "/img/haegeum.png";
      instrumentName = { ko: "해금", en: "Haegeum" };
      minBin = 30;
      maxBin = 100;
    } else {
      // 지정되지 않은 버튼은 기본 사운드 재생
      playClickSound();
      return;
    }

    // 재생 중인 소리나 타이머가 있다면 초기화
    if (activeAudioRef.current) {
      activeAudioRef.current.pause();
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    // Audio Context 초기화
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === "suspended") ctx.resume();

    if (!analyserRef.current) {
      analyserRef.current = ctx.createAnalyser();
      analyserRef.current.fftSize = 256;
    }

    if (!gainNodeRef.current) {
      gainNodeRef.current = ctx.createGain();
      gainNodeRef.current.gain.setValueAtTime(0.9, ctx.currentTime);
    }

    if (!activeAudioRef.current) {
      activeAudioRef.current = new Audio();
      activeAudioRef.current.crossOrigin = "anonymous";
    }

    const audio = activeAudioRef.current;

    // MediaElementAudioSourceNode는 단 한 번만 생성하여 메모리 누수 및 노이즈 발생 차단
    if (!sourceRef.current) {
      sourceRef.current = ctx.createMediaElementSource(audio);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(ctx.destination);
    }

    audio.src = audioSrc;
    audio.play().catch(e => console.error("Audio play failed:", e));
    setActiveImage(imgSrc);
    setActiveInstrument(instrumentName);
    setActiveButtonIndex(index);

    let isFadingOut = false;
    let fadeOutStart = 0;
    let smoothedIntensity = 0; // 진동(떨림) 현상을 방지하기 위한 부드러운 오디오 봉투(Envelope) 값
    let smoothedPitch = 0.5; // 해금 등에서 사용할 부드러운 피치(주파수 고저) 추적 변수

    const updateLoop = () => {
      if (!analyserRef.current) return;
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);

      // 악기 특성에 맞는 주파수 대역의 평균 및 최대 피치(고저)를 구함
      let sum = 0;
      let maxVal = 0;
      let peakBin = minBin;
      
      for (let i = minBin; i < maxBin; i++) {
        const val = dataArray[i];
        sum += val;
        if (val > maxVal) {
          maxVal = val;
          peakBin = i;
        }
      }
      const avg = sum / (maxBin - minBin); // 0 ~ 255
      
      // 피치(고저) 계산: 피크 주파수의 위치를 0.0(저음) ~ 1.0(고음) 범위로 정규화
      const pitchRatio = maxVal > 30 ? (peakBin - minBin) / (maxBin - minBin) : 0.5;
      smoothedPitch = smoothedPitch + (pitchRatio - smoothedPitch) * 0.15; // 부드럽게 피치 추적
      const intensity = Math.pow(avg / 255, 1.5); // 지수 함수를 사용해 큰 소리일 때 더 극적으로 변화하도록 설정
      
      // 즉각적인 타격감은 살리면서 잔향이 끊기거나 떨리는 현상(Jitter)을 방지하는 스무딩(Envelope Follower)
      if (intensity > smoothedIntensity) {
        smoothedIntensity = smoothedIntensity + (intensity - smoothedIntensity) * 0.8;
      } else {
        smoothedIntensity = smoothedIntensity + (intensity - smoothedIntensity) * 0.25;
      }

      if (imgWrapperRef.current) {
        const motionResult = getInstrumentMotionStyle({
          instrument: instrumentName.en,
          audio,
          intensity,
          smoothedIntensity,
          smoothedPitch,
          isFadingOut,
          elapsedFade: isFadingOut ? (performance.now() - fadeOutStart) / 1000 : 0,
          time: performance.now(),
          jwagoState: {
            direction: jwagoDirectionRef.current,
            lastIntensity: jwagoLastIntensityRef.current,
            beatCooldown: jwagoBeatCooldownRef.current,
            updateState: (newDir, newCooldown) => {
              jwagoDirectionRef.current = newDir;
              jwagoBeatCooldownRef.current = newCooldown;
            }
          },
          refs: {
            wrapper: imgWrapperRef.current,
            mainImg: mainImgRef.current,
            rippleLeft: rippleLeftRef.current,
            rippleRight: rippleRightRef.current,
          }
        });
        
        jwagoLastIntensityRef.current = smoothedIntensity;

        if (isFadingOut && motionResult.opacity <= 0) {
          if (reqRef.current) cancelAnimationFrame(reqRef.current);
          setActiveImage(null);
          setActiveInstrument(null);
          setActiveButtonIndex(null);
          return;
        }

        imgWrapperRef.current.style.transform = motionResult.transform;
        imgWrapperRef.current.style.opacity = String(motionResult.opacity);
        imgWrapperRef.current.style.filter = motionResult.filter;
      }

      reqRef.current = requestAnimationFrame(updateLoop);
    };

    // 루프 시작
    reqRef.current = requestAnimationFrame(updateLoop);

    // 소리가 완전히 끝나면 즉시 정리 (편종, 편경, 대금, 어는 재생 종료 시점에 즉시 제거)
    audio.onended = () => {
      if (
        instrumentName.en === "Pyeonjong" ||
        instrumentName.en === "Pyeongyeong" ||
        instrumentName.en === "Daegeum" ||
        instrumentName.en === "Eo"
      ) {
        setActiveImage(null);
        setActiveInstrument(null);
        setActiveButtonIndex(null);
        if (reqRef.current) cancelAnimationFrame(reqRef.current);
      } else {
        isFadingOut = true;
        fadeOutStart = performance.now();
      }
    };
  };

  return (
    <div className="flex flex-col min-h-screen pt-24 md:pt-32 pb-8 md:pb-12 px-4 md:px-8 bg-background relative overflow-hidden">
      
      {/* 상단 여백 영역 (남은 공간을 모두 차지하여 이미지 센터링) */}
      <div className="flex-grow flex items-center justify-center relative z-0">
        <AnimatePresence>
          {activeImage && (
            <motion.div
              initial={{ 
                opacity: 0, 
                scale: 0.9, 
                y: 15,
                x: activeInstrument?.en === "Saenghwang" ? 7 : 0
              }}
              animate={{ 
                opacity: 1, 
                scale: 1.0, 
                y: 0,
                x: activeInstrument?.en === "Saenghwang" ? 7 : 0
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="absolute flex items-center justify-center pointer-events-none z-0"
            >
              {/* transform에 CSS transition-duration이 걸려 있으면 60fps 고주파 떨림이 뭉개지므로 opacity, filter만 트랜지션 적용 */}
              <div
                ref={imgWrapperRef}
                className="transition-[opacity,filter] duration-300 ease-in-out origin-center relative flex items-center justify-center"
              >
                {/* 좌고(Jwago) 전용 흐릿하고 큰 배경(고스트) 이미지 - 좌/우 반갈라서 독립 제어 */}
                {activeInstrument?.en === "Jwago" && (
                  <>
                    <img
                      ref={rippleLeftRef}
                      src={`${activeImage}?v=4`}
                      alt=""
                      className="absolute inset-0 w-48 md:w-64 lg:w-96 h-auto object-contain z-0 blur-[6px] pointer-events-none"
                      style={{ 
                        clipPath: "inset(0 50% 0 0)", 
                        transformOrigin: "center center",
                        WebkitMaskImage: "radial-gradient(circle, black 40%, transparent 70%)",
                        maskImage: "radial-gradient(circle, black 40%, transparent 70%)"
                      }}
                    />
                    <img
                      ref={rippleRightRef}
                      src={`${activeImage}?v=4`}
                      alt=""
                      className="absolute inset-0 w-48 md:w-64 lg:w-96 h-auto object-contain z-0 blur-[6px] pointer-events-none"
                      style={{ 
                        clipPath: "inset(0 0 0 50%)", 
                        transformOrigin: "center center",
                        WebkitMaskImage: "radial-gradient(circle, black 40%, transparent 70%)",
                        maskImage: "radial-gradient(circle, black 40%, transparent 70%)"
                      }}
                    />
                  </>
                )}
                {(activeInstrument?.en === "Hun" || activeInstrument?.en === "Saenghwang") ? (
                  <>
                    <img
                      src={activeInstrument?.en === "Hun" ? "/img/hun01.png?v=4" : "/img/saenghwang01.png?v=4"}
                      alt="Instrument Graphic Base"
                      width={500}
                      height={500}
                      className="w-48 md:w-64 lg:w-96 h-auto object-contain absolute z-10"
                    />
                    <img
                      ref={mainImgRef}
                      src={`${activeImage}?v=4`}
                      alt="Instrument Graphic Overlay"
                      width={500}
                      height={500}
                      className="w-48 md:w-64 lg:w-96 h-auto object-contain relative z-20"
                      style={{ maskImage: "radial-gradient(circle, transparent 0%, transparent 100%)", WebkitMaskImage: "radial-gradient(circle, transparent 0%, transparent 100%)" }}
                    />
                  </>
                ) : (
                  <img
                    ref={mainImgRef}
                    src={`${activeImage}?v=4`}
                    alt="Instrument Graphic"
                    width={500}
                    height={500}
                    className="w-48 md:w-64 lg:w-96 h-auto object-contain relative z-10"
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {!activeImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute flex items-center justify-center pointer-events-none z-0"
            >
              <p className="text-sm md:text-base tracking-[0.2em] text-foreground/40 font-light font-sans">
                Click the button
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 하단 패널 영역 (고정) */}
      <div className="relative z-10 mt-4">
        {/* 악기명 표시 영역 (버튼 위) */}
        <div className="h-20 flex items-end justify-center mb-6">
          <AnimatePresence>
            {activeInstrument && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-center"
              >
                <div className="text-base md:text-lg font-bold font-sans text-foreground mb-1">
                  {activeInstrument.ko}
                </div>
                {/* 영문은 기본적으로 폰트 스택의 Baskervville이 적용됨 */}
                <div className="text-sm md:text-base font-light tracking-widest text-foreground/60 uppercase font-sans">
                  {activeInstrument.en}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
        >
          {/* gap-x는 좌우 간격, gap-y는 위아래 간격입니다. */}
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 md:gap-x-0 md:gap-y-3 lg:gap-y-4 max-w-5xl mx-auto px-4 md:px-0">
            
            {/* 첫 번째 줄 (1~7번 버튼) - 모바일에서는 원래대로 자연스럽게 이어짐 */}
            <div className="contents md:flex md:justify-center md:gap-x-5 lg:gap-x-6 md:w-full">
              {[...Array(7)].map((_, i) => {
                const isActive = activeButtonIndex === i;
                return (
                  <button
                    key={i}
                    onClick={() => handleButtonClick(i)}
                    className={cn(
                      "w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 shrink-0 rounded-full border bg-background transition-all duration-500 hover:scale-115 active:scale-95 flex items-center justify-center relative",
                      isActive 
                        ? "border-foreground/20 text-foreground scale-110 shadow-[0_0_20px_rgba(76,72,59,0.15)]" 
                        : "border-foreground/20 text-foreground/50 hover:bg-foreground/5 hover:border-foreground/40"
                    )}
                    aria-label={`Instrument button: ${instrumentNames[i]}`}
                  >
                    <span className="relative z-10 text-[10px] md:text-xs tracking-tighter whitespace-nowrap font-sans">{instrumentNames[i]}</span>
                  </button>
                );
              })}
            </div>

            {/* 두 번째 줄 (8~15번 버튼) */}
            <div className="contents md:flex md:justify-center md:gap-x-5 lg:gap-x-6 md:w-full">
              {[...Array(8)].map((_, i) => {
                const index = i + 7;
                const isActive = activeButtonIndex === index;
                return (
                  <button
                    key={index}
                    onClick={() => handleButtonClick(index)}
                    className={cn(
                      "w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 shrink-0 rounded-full border bg-background transition-all duration-500 hover:scale-115 active:scale-95 flex items-center justify-center relative",
                      isActive 
                        ? "border-foreground/20 text-foreground scale-110 shadow-[0_0_20px_rgba(76,72,59,0.15)]" 
                        : "border-foreground/20 text-foreground/50 hover:bg-foreground/5 hover:border-foreground/40"
                    )}
                    aria-label={`Instrument button: ${instrumentNames[index]}`}
                  >
                    <span className="relative z-10 text-[10px] md:text-xs tracking-tighter whitespace-nowrap font-sans">{instrumentNames[index]}</span>
                  </button>
                );
              })}
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
