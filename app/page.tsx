"use client";

import { useState, useRef, useEffect } from "react";
import { useInteractionSound } from "@/hooks/useInteractionSound";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { getInstrumentMotionStyle } from "@/utils/instrumentMotions";

// 국악기 분류 체계인 8음(八音) 브랜드 컬러에 기반한 버튼 활성화 시 그림자(boxShadow) 색상 매핑
const INSTRUMENT_SHADOW_COLORS = [
  "rgba(192, 122, 108, 0.35)",  // 0. 훈 (토) - Yulreo Soil
  "rgba(189, 204, 210, 0.55)",  // 1. 편종 (금) - Yulreo Metal (연하므로 불투명도 조정)
  "rgba(143, 147, 169, 0.45)",  // 2. 편경 (석) - Yulreo Rock
  "rgba(169, 184, 140, 0.45)",  // 3. 대금 (죽) - Yulreo Bamboo
  "rgba(169, 184, 140, 0.45)",  // 4. 태평소 (죽) - Yulreo Bamboo
  "rgba(169, 184, 140, 0.45)",  // 5. 피리 (죽) - Yulreo Bamboo
  "rgba(142, 168, 146, 0.45)",  // 6. 생황 (포) - Yulreo Gourd
  "rgba(170, 134, 87, 0.4)",    // 7. 박 (목) - Yulreo Wood
  "rgba(170, 134, 87, 0.4)",    // 8. 어 (목) - Yulreo Wood
  "rgba(208, 156, 156, 0.4)",   // 9. 장구 (혁) - Yulreo Leather
  "rgba(208, 156, 156, 0.4)",   // 10. 북 (혁) - Yulreo Leather
  "rgba(208, 156, 156, 0.4)",   // 11. 좌고 (혁) - Yulreo Leather
  "rgba(236, 227, 180, 0.65)",  // 12. 가야금 (사) - Yulreo Silk (연하므로 불투명도 조정)
  "rgba(236, 227, 180, 0.65)",  // 13. 거문고 (사) - Yulreo Silk (연하므로 불투명도 조정)
  "rgba(236, 227, 180, 0.65)",  // 14. 해금 (사) - Yulreo Silk (연하므로 불투명도 조정)
];

export default function InstrumentPage() {
  const { playClickSound } = useInteractionSound();
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeInstrument, setActiveInstrument] = useState<{ ko: string; en: string; desc: string } | null>(null);
  const [activeButtonIndex, setActiveButtonIndex] = useState<number | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);

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
  const currentClickIdRef = useRef(0);

  // 이미지를 제어하기 위한 DOM 레퍼런스
  const imgWrapperRef = useRef<HTMLDivElement>(null);
  const rippleLeftRef = useRef<HTMLImageElement>(null);
  const rippleRightRef = useRef<HTMLImageElement>(null);
  const mainImgRef = useRef<HTMLImageElement>(null); // 메인 이미지 자체를 왜곡하기 위한 레퍼런스
  const jwagoDirectionRef = useRef(-1); // 좌고 오-왼 번갈아 왜곡을 위한 방향 상태 (초기값 -1)
  const jwagoLastIntensityRef = useRef(0); // 좌고 비트(타격) 감지용 이전 강도
  const jwagoBeatCooldownRef = useRef(0); // 비트 중복 감지 방지용 쿨다운 시간
  const jwagoBeatsRef = useRef(0); // 좌고 비트 카운터 (방향 결정용, 홀수=왼쪽 / 짝수=오른쪽)
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
    const isMobileDevice = window.innerWidth < 768;
    if (!isMobileDevice) {
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
    }

    const currentHideTimer = hideTimerRef.current;

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
        activeAudioRef.current.onended = null;
        activeAudioRef.current.src = "";
      }
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch {}
        sourceRef.current = null;
      }
      // analyserRef, gainNodeRef도 초기화해야 새 AudioContext 생성 시 재연결됨
      analyserRef.current = null;
      gainNodeRef.current = null;
      if (currentHideTimer) clearTimeout(currentHideTimer);
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(err => console.error("Error closing AudioContext:", err));
        audioCtxRef.current = null;
      }
    };
  }, []);

  const handleButtonClick = (index: number) => {
    const clickId = ++currentClickIdRef.current;
    let audioSrc = "";
    let imgSrc = "";
    let videoSrc = "";
    let instrumentName = { ko: "", en: "", desc: "" };
    
    // 주파수 분석 대역 설정 (기본값: 타악기용 저음역대)
    let minBin = 0;
    let maxBin = 20;

    if (index === 0) {
      // 1번 버튼: 훈
      audioSrc = "/sound/instrument/hun01.mp3";
      imgSrc = "/img/hun.png";
      instrumentName = { ko: "훈", en: "Hun", desc: "한국의 오카리나" };
      minBin = 10;
      maxBin = 50;
    } else if (index === 1) {
      // 2번 버튼: 편종
      audioSrc = "/sound/instrument/pyeonjong01.mp3";
      imgSrc = "/img/pyeonjong.png";
      instrumentName = { ko: "편종", en: "Pyeonjong", desc: "한국의 실로폰" };
      minBin = 30;
      maxBin = 100;
    } else if (index === 2) {
      // 3번 버튼: 편경
      audioSrc = "/sound/instrument/pyeongyeong01.mp3";
      imgSrc = "/img/pyeongyeong.png";
      instrumentName = { ko: "편경", en: "Pyeongyeong", desc: "한국의 실로폰" };
      minBin = 30;
      maxBin = 100;
    } else if (index === 3) {
      // 4번 버튼: 대금
      audioSrc = "/sound/instrument/deageum01.mp3";
      imgSrc = "/img/daegeum.png";
      videoSrc = "/mov/daegeum.mp4";
      instrumentName = { ko: "대금", en: "Daegeum", desc: "한국의 플루트" };
      minBin = 20;
      maxBin = 60;
    } else if (index === 4) {
      // 5번 버튼: 태평소
      audioSrc = "/sound/instrument/taepyeongso01.mp3";
      imgSrc = "/img/taepyeongso.png";
      instrumentName = { ko: "태평소", en: "Taepyeongso", desc: "한국의 나팔" };
      minBin = 30;
      maxBin = 100;
    } else if (index === 5) {
      // 6번 버튼: 피리
      audioSrc = "/sound/instrument/piri01.mp3";
      imgSrc = "/img/piri.png";
      instrumentName = { ko: "피리", en: "Piri", desc: "한국의 피리" };
      minBin = 40;
      maxBin = 120;
    } else if (index === 6) {
      // 7번 버튼: 생황
      audioSrc = "/sound/instrument/saenghwang01.mp3";
      imgSrc = "/img/saenghwang.png";
      instrumentName = { ko: "생황", en: "Saenghwang", desc: "한국의 아코디언" };
      minBin = 30;
      maxBin = 100;
    } else if (index === 7) {
      // 8번 버튼: 박
      audioSrc = "/sound/instrument/bak01.mp3";
      imgSrc = "/img/bak.png";
      videoSrc = "/mov/bak1.mp4";
      instrumentName = { ko: "박", en: "Bak", desc: "한국의 캐스터네츠" };
      minBin = 20;
      maxBin = 80;
    } else if (index === 8) {
      // 9번 버튼 (인덱스 8): 어
      const eoSounds = [
        "/sound/instrument/eo01.wav",
        "/sound/instrument/eo02.wav"
      ];
      const eoVideos = [
        "/mov/eo1.mp4",
        "/mov/eo2.mp4"
      ];
      audioSrc = eoSounds[eoIndexRef.current];
      videoSrc = eoVideos[eoIndexRef.current];
      eoIndexRef.current = (eoIndexRef.current + 1) % eoSounds.length;
      
      imgSrc = "/img/eo.png";
      instrumentName = { ko: "어", en: "Eo", desc: "한국의 귀로" };
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
      const jangguVideos = [
        "/mov/janggu1.mp4",
        "/mov/janggu2.mp4",
        "/mov/janggu3.mp4",
        "/mov/janggu4.mp4"
      ];
      // 무작위가 아닌 순서대로(돌아가면서) 재생
      audioSrc = jangguSounds[jangguIndexRef.current];
      videoSrc = jangguVideos[jangguIndexRef.current];
      jangguIndexRef.current = (jangguIndexRef.current + 1) % jangguSounds.length;
      
      imgSrc = "/img/janggu.png";
      instrumentName = { ko: "장구", en: "Janggu", desc: "한국의 드럼" };
      minBin = 5;
      maxBin = 40;
    } else if (index === 10) {
      // 11번 버튼 (인덱스 10): 북
      audioSrc = "/sound/instrument/buk01.mp3";
      imgSrc = "/img/buk.png";
      videoSrc = "/mov/buk.mp4";
      instrumentName = { ko: "북", en: "Buk", desc: "한국의 베이스 드럼" };
      minBin = 0;
      maxBin = 20;
    } else if (index === 11) {
      // 12번 버튼 (인덱스 11): 좌고
      audioSrc = "/sound/instrument/Jwago01.mp3";
      imgSrc = "/img/jwago.png";
      videoSrc = "/mov/jwago.mp4";
      instrumentName = { ko: "좌고", en: "Jwago", desc: "한국의 팀파니" };
      minBin = 0;
      maxBin = 35; // 0~752Hz — 좌고(큰 북) 저음역대를 더 넓게 커버하도록 확장
      jwagoDirectionRef.current = -1; // 재생 시작 시 초기화 (비트 1이 왼쪽에서 시작)
      jwagoLastIntensityRef.current = 0;
      jwagoBeatCooldownRef.current = 0;
      jwagoBeatsRef.current = 0; // 비트 카운터 초기화
    } else if (index === 12) {
      // 13번 버튼 (인덱스 12): 가야금
      const gayageumSounds = [
        "/sound/instrument/gayageum01.mp3",
        "/sound/instrument/gayageum02.mp3",
        "/sound/instrument/gayageum03.mp3",
        "/sound/instrument/gayageum04.mp3"
      ];
      const gayageumVideos = [
        "/mov/gayageum1.mp4",
        "/mov/gayageum2.mp4"
      ];
      audioSrc = gayageumSounds[gayageumIndexRef.current];
      videoSrc = gayageumVideos[gayageumIndexRef.current % gayageumVideos.length];
      gayageumIndexRef.current = (gayageumIndexRef.current + 1) % gayageumSounds.length;
      imgSrc = "/img/gayageum.png";
      instrumentName = { ko: "가야금", en: "Gayageum", desc: "한국의 하프" };
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
      const geomungoVideos = [
        "/mov/geomungo1.mp4",
        "/mov/geomungo2.mp4",
        "/mov/geomungo3.mp4"
      ];
      audioSrc = geomungoSounds[geomungoIndexRef.current];
      videoSrc = geomungoVideos[geomungoIndexRef.current % geomungoVideos.length];
      geomungoIndexRef.current = (geomungoIndexRef.current + 1) % geomungoSounds.length;
      imgSrc = "/img/geomungo.png";
      instrumentName = { ko: "거문고", en: "Geomungo", desc: "한국의 첼로" };
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
      instrumentName = { ko: "해금", en: "Haegeum", desc: "한국의 바이올린" };
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
      activeAudioRef.current.onended = null;
    }
    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch (e) {
        console.warn("Failed to disconnect source node:", e);
      }
      sourceRef.current = null;
    }
    if (reqRef.current) cancelAnimationFrame(reqRef.current);
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
      analyserRef.current.fftSize = 2048;
    }

    if (!gainNodeRef.current) {
      gainNodeRef.current = ctx.createGain();
      
      // 최초 생성 시 연결 해두기
      analyserRef.current.connect(gainNodeRef.current);
      gainNodeRef.current.connect(ctx.destination);
    }

    // 북(Buk) 및 좌고(Jwago) 소리는 저음이라 잘 안 들리므로 게인을 2.5배로 증폭하고, 다른 악기들은 기본 0.95 유지
    const volumeVal = (instrumentName.en === "Buk" || instrumentName.en === "Jwago") ? 2.5 : 0.95;
    gainNodeRef.current.gain.setValueAtTime(volumeVal, ctx.currentTime);

    // 새 Audio 객체 생성하여 재사용 버그 및 오디오 무음 현상 방지
    const audio = new Audio();
    activeAudioRef.current = audio;

    // 새 MediaElementAudioSourceNode 생성 후 연결
    sourceRef.current = ctx.createMediaElementSource(audio);
    sourceRef.current.connect(analyserRef.current);

    audio.src = audioSrc;

    // let 선언을 audio.play() 앞으로 이동 — catch 클로저에서 TDZ 오류 방지
    let isFadingOut = false;
    let fadeOutStart = 0;
    let fadeOutStartCurrentTime = 0;

    audio.play().catch(e => {
      console.error("Audio play failed:", e);
      // 재생 실패/중단 시 이미지 고정 방지용 fallback 타이머
      if (clickId === currentClickIdRef.current) {
        hideTimerRef.current = setTimeout(() => {
          if (clickId === currentClickIdRef.current) {
            isFadingOut = true;
            fadeOutStart = performance.now();
            fadeOutStartCurrentTime = 0;
          }
        }, 2000);
      }
    });
    setActiveImage(imgSrc);
    setActiveVideo(videoSrc || null);
    setActiveInstrument(instrumentName);
    setActiveButtonIndex(index);
    let smoothedIntensity = 0; // 진동(떨림) 현상을 방지하기 위한 부드러운 오디오 봉투(Envelope) 값
    let smoothedPitch = 0.5; // 해금 등에서 사용할 부드러운 피치(주파수 고저) 추적 변수

    const updateLoop = () => {
      if (clickId !== currentClickIdRef.current) return;
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

      // 소리 재생이 시작된 후, 분석된 강도가 극도로 낮아지면(잔향이 끝남) 이미지 페이드아웃 처리
      const minPlayTime = (
        instrumentName.en === "Piri" || 
        instrumentName.en === "Saenghwang" || 
        instrumentName.en === "Haegeum" || 
        instrumentName.en === "Daegeum" || 
        instrumentName.en === "Taepyeongso" || 
        instrumentName.en === "Hun"
      ) ? 1.2 : 0.6;

      if (audio.currentTime > minPlayTime && smoothedIntensity < 0.003 && !isFadingOut) {
        isFadingOut = true;
        fadeOutStart = performance.now();
        fadeOutStartCurrentTime = audio.currentTime;
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
          frozenTime: isFadingOut ? fadeOutStartCurrentTime : undefined,
          jwagoState: {
            // getter를 사용해 updateState 호출 즉시 최신 값 반영 (같은 프레임 내 동기화)
            get direction() { return jwagoDirectionRef.current; },
            get lastIntensity() { return jwagoLastIntensityRef.current; },
            get beatCooldown() { return jwagoBeatCooldownRef.current; },
            get beatCount() { return jwagoBeatsRef.current; },
            updateState: (newDir: number, newCooldown: number, newBeatCount: number) => {
              jwagoDirectionRef.current = newDir;
              jwagoBeatCooldownRef.current = newCooldown;
              jwagoBeatsRef.current = newBeatCount;
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
          audio.pause();
          audio.currentTime = 0;
          if (reqRef.current) cancelAnimationFrame(reqRef.current);
          setActiveImage(null);
          setActiveVideo(null);
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
      if (clickId !== currentClickIdRef.current) return;
      if (
        instrumentName.en === "Pyeonjong" ||
        instrumentName.en === "Pyeongyeong" ||
        instrumentName.en === "Daegeum" ||
        instrumentName.en === "Eo" ||
        instrumentName.en === "Bak" ||
        instrumentName.en === "Buk" ||
        instrumentName.en === "Jwago" ||
        instrumentName.en === "Janggu" ||
        instrumentName.en === "Gayageum" ||
        instrumentName.en === "Geomungo"
      ) {
        setActiveImage(null);
        setActiveVideo(null);
        setActiveInstrument(null);
        setActiveButtonIndex(null);
        if (reqRef.current) cancelAnimationFrame(reqRef.current);
      } else {
        isFadingOut = true;
        fadeOutStart = performance.now();
        fadeOutStartCurrentTime = audio.duration || 4.0;
      }
    };
  };

  return (
    <div className="flex flex-col min-h-[100dvh] pt-20 md:pt-28 lg:pt-32 dynamic-bottom-padding px-4 md:px-10 lg:px-16 wide:px-24 bg-background relative overflow-hidden">
      
      {/* 상단 여백 영역 (남은 공간을 모두 차지하여 이미지 센터링) */}
      <div className="flex-grow flex items-center justify-center relative z-0">
        <AnimatePresence>
          {activeImage && (
            <motion.div
              key={activeImage}
              initial={activeVideo ? {
                opacity: 0,
                scale: 1.0,
                y: 0,
                x: 0
              } : { 
                opacity: 0, 
                scale: activeInstrument?.en === "Hun" ? 0 : 0.9, 
                y: 15,
                x: activeInstrument?.en === "Saenghwang" ? 7 : 0
              }}
              animate={activeVideo ? {
                opacity: 1,
                scale: 1.0,
                y: 0,
                x: 0
              } : { 
                opacity: 1, 
                scale: 1.0, 
                y: 0,
                x: activeInstrument?.en === "Saenghwang" ? 7 : 0
              }}
              exit={{ opacity: 0 }}
              transition={activeVideo ? { duration: 0.3 } : { duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="absolute flex items-center justify-center pointer-events-none z-0"
            >
              {/* transform에 CSS transition-duration이 걸려 있으면 60fps 고주파 떨림이 뭉개지므로 opacity, filter만 트랜지션 적용 */}
              <div
                ref={(el) => { if (el) imgWrapperRef.current = el; }}
                className="transition-[opacity,filter] duration-300 ease-in-out origin-center relative flex items-center justify-center after:content-[''] after:absolute after:inset-x-0 after:top-0 after:h-12 after:bg-gradient-to-b after:from-[#ffffff] after:to-transparent after:pointer-events-none after:z-30"
              >
                {/* 좌고(Jwago) 전용 흐릿하고 큰 배경(고스트) 이미지 - 좌/우 반갈라서 독립 제어 */}
                {activeInstrument?.en === "Jwago" && !activeVideo && (
                  <>
                    <img
                      ref={(el) => { if (el) rippleLeftRef.current = el; }}
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
                      ref={(el) => { if (el) rippleRightRef.current = el; }}
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
                {(activeInstrument?.en === "Pyeonjong" || activeInstrument?.en === "Pyeongyeong") ? (
                  <div className="grid grid-cols-4 gap-3 md:gap-4 lg:gap-5">
                    {[...Array(8)].map((_, i) => (
                      <img
                        key={i}
                        src={`${activeImage}?v=4`}
                        alt={`${activeInstrument.en} Graphic ${i}`}
                        className="w-24 md:w-36 lg:w-40 h-auto object-contain relative z-10"
                      />
                    ))}
                  </div>
                ) : (activeInstrument?.en === "Hun" || activeInstrument?.en === "Saenghwang") ? (
                  <>
                    <img
                      src={activeInstrument?.en === "Hun" ? "/img/hun01.png?v=4" : "/img/saenghwang01.png?v=4"}
                      alt="Instrument Graphic Base"
                      width={500}
                      height={500}
                      className="w-48 md:w-64 lg:w-96 h-auto object-contain absolute z-10"
                    />
                    <img
                      ref={(el) => { if (el) mainImgRef.current = el; }}
                      src={`${activeImage}?v=4`}
                      alt="Instrument Graphic Overlay"
                      width={500}
                      height={500}
                      className="w-48 md:w-64 lg:w-96 h-auto object-contain relative z-20"
                      style={{ maskImage: "radial-gradient(circle, transparent 0%, transparent 100%)", WebkitMaskImage: "radial-gradient(circle, transparent 0%, transparent 100%)" }}
                    />
                  </>
                ) : activeVideo ? (
                  <video
                    src={activeVideo}
                    autoPlay
                    muted
                    playsInline
                    loop
                    className={cn(
                      "aspect-[16/9] object-contain relative z-10",
                      activeInstrument?.en === "Janggu"
                        ? "w-[64vw] max-w-[1440px] max-h-[41vh] md:w-auto md:h-[58.5vh] md:max-h-[60vh] md:max-w-none"
                        : "w-[85vw] max-w-[1920px] max-h-[55vh] md:w-auto md:h-[78vh] md:max-h-[80vh] md:max-w-none"
                    )}
                  />
                ) : (
                  <img
                    ref={(el) => { if (el) mainImgRef.current = el; }}
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
        <div className="h-24 md:h-28 lg:h-32 flex items-end justify-center mb-4 md:mb-6">
          <AnimatePresence>
            {activeInstrument && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="text-center"
              >
                <div className="text-base md:text-lg font-bold font-sans text-foreground leading-none">
                  {activeInstrument.ko}
                </div>
                {/* 영문은 기본적으로 폰트 스택의 Baskervville이 적용됨 */}
                <div className="text-xs font-light tracking-widest text-foreground/45 font-sans leading-none mt-[2px]">
                  {activeInstrument.en}
                </div>
                {/* 악기 부연설명 (한글) */}
                <div className="text-sm md:text-base font-normal tracking-wide text-foreground/75 font-sans mt-2">
                  {activeInstrument.desc}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.21, 0.47, 0.32, 0.98] }}
          className="relative w-full"
        >
          {/* gap-x는 좌우 간격, gap-y는 위아래 간격입니다. */}
          <div className="flex flex-wrap justify-center gap-x-3 gap-y-2 md:gap-x-0 md:gap-y-3 lg:gap-y-[24px] max-w-[920px] mx-auto px-4 md:px-0">
            
            {/* 첫 번째 줄 (1~7번 버튼) - 모바일에서는 원래대로 자연스럽게 이어짐 */}
            <div className="contents md:flex md:justify-center md:gap-x-[16px] lg:gap-x-[24px] md:w-full">
              {[...Array(7)].map((_, i) => {
                const isActive = activeButtonIndex === i;
                return (
                  <button
                    key={i}
                    onClick={() => handleButtonClick(i)}
                    className={cn(
                      "w-11 h-11 md:w-[52px] md:h-[52px] lg:w-16 lg:h-16 wide:w-[72px] wide:h-[72px] shrink-0 rounded-full border bg-background transition-all duration-500 hover:scale-115 active:scale-95 flex items-center justify-center relative",
                      isActive 
                        ? "border-foreground/20 text-foreground scale-110" 
                        : "border-foreground/20 text-foreground/50 hover:bg-foreground/5 hover:border-foreground/40"
                    )}
                    style={isActive ? { boxShadow: `0 0 20px ${INSTRUMENT_SHADOW_COLORS[i]}` } : undefined}
                    aria-label={`Instrument button: ${instrumentNames[i]}`}
                  >
                    <span className="relative z-10 text-xs tracking-tighter whitespace-nowrap font-sans translate-y-[2px]">{instrumentNames[i]}</span>
                  </button>
                );
              })}
            </div>

            {/* 두 번째 줄 (8~15번 버튼) */}
            <div className="contents md:flex md:justify-center md:gap-x-[16px] lg:gap-x-[24px] md:w-full">
              {[...Array(8)].map((_, i) => {
                const index = i + 7;
                const isActive = activeButtonIndex === index;
                return (
                  <button
                    key={index}
                    onClick={() => handleButtonClick(index)}
                    className={cn(
                      "w-11 h-11 md:w-[52px] md:h-[52px] lg:w-16 lg:h-16 wide:w-[72px] wide:h-[72px] shrink-0 rounded-full border bg-background transition-all duration-500 hover:scale-115 active:scale-95 flex items-center justify-center relative",
                      isActive 
                        ? "border-foreground/20 text-foreground scale-110" 
                        : "border-foreground/20 text-foreground/50 hover:bg-foreground/5 hover:border-foreground/40"
                    )}
                    style={isActive ? { boxShadow: `0 0 20px ${INSTRUMENT_SHADOW_COLORS[index]}` } : undefined}
                    aria-label={`Instrument button: ${instrumentNames[index]}`}
                  >
                    <span className="relative z-10 text-xs tracking-tighter whitespace-nowrap font-sans translate-y-[2px]">{instrumentNames[index]}</span>
                  </button>
                );
              })}
            </div>

          </div>

          {/* 국악기 더 알아보기 링크 */}
          <a
            href="https://www.gugak.go.kr/site/main/index001"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-block absolute bottom-2 right-0 z-30 text-xs tracking-wider text-foreground/50 hover:text-foreground/90 transition-colors duration-300 font-sans cursor-pointer whitespace-nowrap"
          >
            더 알아보기 &gt;
          </a>
        </motion.div>
      </div>
    </div>
  );
}
