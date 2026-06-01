"use client";

import { useState, useRef, useEffect } from "react";
import FadeIn from "@/components/FadeIn";
import { useInteractionSound } from "@/hooks/useInteractionSound";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";

export default function InstrumentPage() {
  const { playHoverSound, playClickSound } = useInteractionSound();
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [activeInstrument, setActiveInstrument] = useState<{ ko: string; en: string } | null>(null);
  const [activeButtonIndex, setActiveButtonIndex] = useState<number | null>(null);

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
      "/img/hun.png", "/img/pyeonjong.png", "/img/pyeongyeong.png",
      "/img/daegeum.png", "/img/taepyeongso.png", "/img/piri.png",
      "/img/saenghwang.png", "/img/bak.png", "/img/eo.png",
      "/img/janggu.png", "/img/buk.png", "/img/jwago.png",
      "/img/gayageum.png", "/img/geomungo.png", "/img/haegeum.png"
    ];
    imagesToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });

    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
      if (activeAudioRef.current) {
        activeAudioRef.current.pause();
      }
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
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
      // 스르륵 작아지지 않고 통통 튀는(Snappy) 느낌을 주도록 감쇠 속도 상향
      if (intensity > smoothedIntensity) {
        smoothedIntensity = smoothedIntensity + (intensity - smoothedIntensity) * 0.8; // 빠른 반응 (Attack)
      } else {
        smoothedIntensity = smoothedIntensity + (intensity - smoothedIntensity) * 0.25; // 더 빠르게 감쇠하여 튀는 느낌 부여 (Release)
      }

      const baseScale = 1;       // 기본 크기
      const maxMultiplier = 5;   // 소리가 가장 클 때 커지는 최대 폭
      let opacity = 1.0;
      let scale = baseScale + intensity * maxMultiplier;
      let transformStr = `scale(${scale})`;

      if (isFadingOut) {
        const elapsedFade = (performance.now() - fadeOutStart) / 1000; // 1.0초 동안 부드럽게 페이드아웃
        if (elapsedFade >= 1.0) {
          if (reqRef.current) cancelAnimationFrame(reqRef.current);
          setActiveImage(null);
          setActiveInstrument(null);
          setActiveButtonIndex(null);
          return;
        }
        opacity = 1.0 - elapsedFade;
        
        if (instrumentName.en === "Hun") {
          // 사라지는 순간에도 멈칫하지 않고 크기가 부드럽게 계속 팽창 (2.5배에서 3.1배로)
          const growthFactor = 1.0 + (1.0 + elapsedFade * 0.4) * 1.5;
          scale = baseScale * growthFactor;
          transformStr = `scale(${scale})`;
        } else if (instrumentName.en === "Gayageum" || instrumentName.en === "Geomungo") {
          // 가야금과 거문고는 사라질 때도 크기 변화 없이 투명도만 낮아짐 (기본 1.7배 크기 유지)
          transformStr = `scale(${baseScale * 1.7})`;
        } else if (instrumentName.en === "Piri" || instrumentName.en === "Haegeum") {
          // 피리와 해금은 사라질 때 멈추거나 팽창하지 않고 원래 스케일을 그대로 유지함
          transformStr = `scale(${baseScale})`;
          // 페이드아웃(소리 종료) 진입 시 투명도가 갑자기 1.0으로 튀는 현상 방지
          const duration = audio.duration || 3.0;
          const endProgress = Math.min(1.0, audio.currentTime / duration);
          let baseOpacity = 1.0;
          if (endProgress > 0.5) {
            const fadeProgress = (endProgress - 0.5) * 2.0;
            baseOpacity = Math.max(0, 1.0 - Math.pow(fadeProgress, 1.2));
          }
          // 원래 낮아져 있던 투명도에서부터 마저 자연스럽게 사라짐
          opacity = baseOpacity * Math.max(0, 1.0 - elapsedFade * 2.0);
        } else {
          scale = (baseScale + intensity * maxMultiplier) * (1.0 + elapsedFade * 0.1);
          transformStr = `scale(${scale})`;
        }
      } else {
        // '훈' 악기일 경우 사운드가 나오면서 점점 커지도록 시간 경과(play progress)에 따라 점진적 팽창 모션 추가 (주파수 지터링 제거)
        if (instrumentName.en === "Hun") {
          const durationProgress = audio.currentTime / (audio.duration || 4.0); // 0.0 ~ 1.0
          const growthFactor = 1.0 + durationProgress * 1.5; // 최대 2.5배까지 진동 없이 완전히 매끄럽게 커짐
          scale = baseScale * growthFactor; // 실시간 60fps 주파수 편차값(intensity)을 제외해 멈칫거림 없는 절대적 순수 팽창 구현
          transformStr = `scale(${scale})`;
        }

        // '대금' 악기일 경우 소리 주파수에 반응하며 팽창 및 타임라인 소멸 동기화 (기본 이미지 스케일 1.85로 대폭 상향)
        if (instrumentName.en === "Daegeum") {
          const duration = audio.duration || 3.5;
          const progress = Math.min(1.0, audio.currentTime / duration);
          const daegeumBaseScale = 1.85; // 기존 1.45에서 1.85로 한층 더 크게 키움
          scale = (daegeumBaseScale + intensity * 0.5) * (1.0 - progress * 0.1);
          transformStr = `scale(${scale})`;
          opacity = 1.0 - Math.pow(progress, 1.5); // 소리가 끝나가면서 멈추지 않고 가면서 부드럽게 완전 페이드아웃
        }

        // '피리' 악기일 경우
        if (instrumentName.en === "Piri") {
          const duration = audio.duration || 3.0;
          const progress = Math.min(1.0, audio.currentTime / duration);
          scale = (baseScale + intensity * 0.5) * (1.0 - progress * 0.1);
          transformStr = `scale(${scale})`;
          
          // 소리 재생의 절반이 지난 시점부터 서서히(스르륵) 투명해지도록 처리
          if (progress > 0.5) {
            const fadeProgress = (progress - 0.5) * 2.0; // 0.0 ~ 1.0
            opacity = 1.0 - Math.pow(fadeProgress, 1.2); 
          } else {
            opacity = 1.0;
          }
        }

        // '해금' 악기일 경우 사운드가 끝나갈 무렵(80% 지점 이후) 자연스럽게 스르륵 사라지게 처리
        if (instrumentName.en === "Haegeum") {
          const duration = audio.duration || 3.0;
          const progress = Math.min(1.0, audio.currentTime / duration);
          if (progress > 0.8) {
            const fadeProgress = (progress - 0.8) * 5.0; // 0.0 ~ 1.0
            opacity = 1.0 - Math.pow(fadeProgress, 1.2);
          }
        }

        // '편종' 또는 '편경' 악기일 경우 소리가 끝나가면서 이미지도 완벽히 같이 서서히 위 또는 아래로 가며 사라짐
        if (instrumentName.en === "Pyeonjong" || instrumentName.en === "Pyeongyeong") {
          const duration = audio.duration || 2.5;
          const progress = Math.min(1.0, audio.currentTime / duration);
          
          // 1. Box 크기 변화
          const pyeonjongScale = 0.8 + intensity * 0.6;
          
          // 2. 좌우 떨림
          const time = performance.now();
          const isStrikePeak = audio.currentTime < 0.35;
          
          let shakeX = 0;
          let shakeY = 0;
          
          if (isStrikePeak) {
            shakeX = (Math.random() - 0.5) * intensity * 25;
            shakeY = (Math.random() - 0.5) * intensity * 25;
          } else {
            const vibrationSpeed = 0.08;
            const baseVibration = 10.0 * (1.0 - progress);
            const currentAmp = Math.max(0, baseVibration) + intensity * 15;
            shakeX = Math.sin(time * vibrationSpeed) * currentAmp;
            shakeY = (Math.random() - 0.5) * intensity * 2;
          }
          
          transformStr = `scale(${pyeonjongScale}) translate(${shakeX}px, ${shakeY}px)`;
          opacity = 1.0 - Math.pow(progress, 1.5);
        }

        // '장구' 악기일 경우 사운드별로 다른 방향/형태로 왜곡
        if (instrumentName.en === "Janggu") {
          if (audio.src.includes("Janggu01")) {
            // 1번 사운드: 왼쪽을 고정하고 오른쪽만 뻗어나가며(늘어나며) 커짐
            if (imgWrapperRef.current) imgWrapperRef.current.style.transformOrigin = "left center";
            const scaleX = 1.0 + smoothedIntensity * 1.5; // 오른쪽으로 크게 늘어남
            const scaleY = 1.0 + smoothedIntensity * 0.4; // 위아래로도 살짝 커짐
            transformStr = `scale(${scaleX}, ${scaleY})`;
          } else if (audio.src.includes("Janggu02") || audio.src.includes("Janggu03")) {
            // 2, 3번 사운드: 중앙을 고정하고 양옆으로 늘어남
            if (imgWrapperRef.current) imgWrapperRef.current.style.transformOrigin = "center center";
            const scaleX = 1.0 + smoothedIntensity * 2.0; 
            const scaleY = 1.0 + smoothedIntensity * 0.4; 
            transformStr = `scale(${scaleX}, ${scaleY})`;
          } else {
            // 4번 사운드: 비율 유지하며 전체적으로 통통 튀게 커짐
            if (imgWrapperRef.current) imgWrapperRef.current.style.transformOrigin = "center center";
            const janggu4Scale = 1.0 + smoothedIntensity * 1.5;
            transformStr = `scale(${janggu4Scale})`;
          }
        }

        // '어' 악기일 경우 긁는 소리에 맞춰 크기 변화 대신 진동(떨림) 효과를 극대화
        if (instrumentName.en === "Eo") {
          scale = baseScale * 2;
          if (intensity > 0.02) {
            const shakeAmount = intensity * 80;
            const shakeX = (Math.random() - 0.5) * shakeAmount;
            const shakeY = (Math.random() - 0.5) * shakeAmount;
            const rotateAmount = (Math.random() - 0.5) * intensity * 40;
            transformStr = `scale(${scale}) translate(${shakeX}px, ${shakeY}px) rotate(${rotateAmount}deg)`;
          } else {
            transformStr = `scale(${scale})`;
          }
        }

        // '북' 악기일 경우 커질 때 강하게 진동(떨림)하는 타격감 부여
        if (instrumentName.en === "Buk") {
          const shakeAmount = intensity * 10;
          const shakeX = (Math.random() - 0.5) * shakeAmount;
          const shakeY = (Math.random() - 0.5) * shakeAmount;
          const rotateAmount = (Math.random() - 0.5) * intensity * 3;
          transformStr = `scale(${scale}) translate(${shakeX}px, ${shakeY}px) rotate(${rotateAmount}deg)`;
        }

        // '좌고' 악기일 경우 메인 이미지도 방향에 따라 장구처럼 크게 왜곡되도록 수정
        if (instrumentName.en === "Jwago") {
          transformStr = `scale(${baseScale + intensity * 0.05})`; // 전체 컨테이너는 아주 미세하게만 진동
          
          if (rippleLeftRef.current && rippleRightRef.current && mainImgRef.current) {
            const currentInt = smoothedIntensity;
            const lastInt = jwagoLastIntensityRef.current;
            const now = performance.now();
            
            // Peak Detection (비트 감지)
            if (currentInt > 0.15 && currentInt > lastInt + 0.05 && now - jwagoBeatCooldownRef.current > 250) {
              jwagoDirectionRef.current *= -1; // 방향 반전
              jwagoBeatCooldownRef.current = now; 
            }
            jwagoLastIntensityRef.current = currentInt;

            const direction = jwagoDirectionRef.current;
            
            // 고스트(잔상) 이미지 왜곡 스케일
            const maxStretch = smoothedIntensity * 8.0; 
            const stretchScale = 1.0 + maxStretch;
            const baseRippleScale = 1.0;
            const scaleY = 1.0 + smoothedIntensity * 0.5;

            // 메인 이미지 왜곡 스케일 (옆으로 늘어남 + 전체 크기 빵빵하게 커짐)
            const mainStretchScale = 1.0 + smoothedIntensity * 1.8; 
            const mainScaleY = 1.0 + smoothedIntensity * 1.2;

            if (direction < 0) {
              // 왼쪽으로 뻗어나감 (고정점 오른쪽)
              mainImgRef.current.style.transformOrigin = "right center";
              mainImgRef.current.style.transform = `scale(${mainStretchScale}, ${mainScaleY})`;

              rippleLeftRef.current.style.transform = `scale(${stretchScale}, ${scaleY})`;
              rippleLeftRef.current.style.opacity = String(0.3 + smoothedIntensity * 0.4);
              rippleRightRef.current.style.transform = `scale(${baseRippleScale}, ${baseRippleScale})`;
              rippleRightRef.current.style.opacity = "0.0"; 
            } else {
              // 오른쪽으로 뻗어나감 (고정점 왼쪽)
              mainImgRef.current.style.transformOrigin = "left center";
              mainImgRef.current.style.transform = `scale(${mainStretchScale}, ${mainScaleY})`;

              rippleRightRef.current.style.transform = `scale(${stretchScale}, ${scaleY})`;
              rippleRightRef.current.style.opacity = String(0.3 + smoothedIntensity * 0.4);
              rippleLeftRef.current.style.transform = `scale(${baseRippleScale}, ${baseRippleScale})`;
              rippleLeftRef.current.style.opacity = "0.0";
            }
          }
        } else {
          // 좌고가 아닐 때는 메인 이미지의 개별 transform 초기화
          if (mainImgRef.current) mainImgRef.current.style.transform = "none";
        }

        // '거문고' 악기일 경우 주파수에 반응하여 아래쪽으로 튕기며 강하게 떨림 (기본 크기 1.7배)
        if (instrumentName.en === "Geomungo") {
          const bounceY = intensity * 150; // 양수: 아래쪽으로 이동
          const trembleX = (Math.random() - 0.5) * intensity * 60; 
          const trembleY = (Math.random() - 0.5) * intensity * 60;
          transformStr = `scale(${baseScale * 1.7}) translate(${trembleX}px, ${bounceY + trembleY}px)`;
        }

        // '가야금' 악기일 경우 주파수에 반응하여 위쪽으로 튕기며 강하게 떨림 (기본 크기 1.7배)
        if (instrumentName.en === "Gayageum") {
          const bounceY = -intensity * 200; // 음수: 위쪽으로 이동
          const trembleX = (Math.random() - 0.5) * intensity * 100; 
          const trembleY = (Math.random() - 0.5) * intensity * 100;
          transformStr = `scale(${baseScale * 1.7}) translate(${trembleX}px, ${bounceY + trembleY}px)`;
        }
        // '태평소' 악기일 경우 사운드에 맞춰 크기 변화를 매우 과장되게(Exaggerated) 표현
        if (instrumentName.en === "Taepyeongso") {
          // 화면 밖으로 나가지 않도록 최대 크기는 제한(3.0배)하되, 시작 크기를 0.6으로 확 줄여서 상대적인 팽창 폭은 매우 크게 느껴지도록 수정
          const taepyeongsoMultiplier = 8;
          scale = Math.min(3.0, 0.6 + intensity * taepyeongsoMultiplier); 
          transformStr = `scale(${scale})`;
        }
      }

      if (imgWrapperRef.current) {
        // 클립 패스 및 transform-origin 초기화 (장구 1번에서 변경될 수 있으므로 기본값 강제 할당)
        imgWrapperRef.current.style.clipPath = "none";
        if (instrumentName.en !== "Janggu") {
          imgWrapperRef.current.style.transformOrigin = "center center";
        }

        if (instrumentName.en === "Hun") {
          imgWrapperRef.current.style.transform = `translateY(-30px) ${transformStr}`;
        } else if (instrumentName.en === "Daegeum") {
          // 대금: 화면 맨 좌측 20%(-30vw)에서 시작하여 80%(+30vw) 지점까지 완만한 위-아래-위 곡선(Cosine Wave)을 그리며 끝까지 멈추지 않고 이동하며 서서히 소멸
          const time = performance.now();
          const duration = audio.duration || 3.5;
          const progress = Math.min(1.0, audio.currentTime / duration);
          
          // X축: Sine Ease-In-Out 곡선 수평 이동
          const easeProgress = -(Math.cos(Math.PI * progress) - 1) / 2;
          const baseX = -30 + (easeProgress * 60); 
          const windShiver = Math.sin(time * 0.04) * intensity * 12; // 은은한 미세 공기 떨림
          const xPosStr = `calc(${baseX}vw + ${windShiver}px)`;
          
          // Y축: 완만한 위-아래-위 (Cosine Wave) 파동 곡선 궤적
          const yPos = -Math.cos(progress * 2 * Math.PI) * 45;
          
          imgWrapperRef.current.style.transform = `translate(${xPosStr}, ${yPos}px) ${transformStr}`;
        } else if (instrumentName.en === "Piri") {
          // 피리: 화면 상단에서 하단으로 주파수에 실시간 반응하는 역동적인 S자 곡선을 그리며 내려옴
          const duration = audio.duration || 3.0;
          let progress = audio.currentTime / duration;
          if (isFadingOut) {
            // 소리가 끝나 페이드아웃 상태에 진입해도 제자리에 멈추지 않고 관성을 유지하며 계속 부드럽게 내려가게 함
            const elapsedFade = (performance.now() - fadeOutStart) / 1000;
            progress += elapsedFade * 0.4; 
          }
          
          // Y축: 위(-35vh)에서 아래(35vh)로 일정한 속도로 하강
          const yPos = -35 + (progress * 70); 
          
          // X축: 소리(주파수)가 커질수록 좌우로 요동치는 폭이 크게 늘어나고, 떨림이 추가됨
          const baseWaveWidth = 10; // 기본 곡선 폭 (vw)
          const dynamicWaveWidth = baseWaveWidth + smoothedIntensity * 40; // 주파수에 비례해 최대 50vw 폭까지 요동침
          
          const mainCurve = Math.sin(progress * Math.PI * 3.5); // 떨어지는 동안 약 1.75번 좌우 왕복
          const time = performance.now();
          const frequencyVibration = Math.sin(time * 0.05) * (intensity * 1.5); // 떨림을 아주 미세한 수준으로 크게 줄임
          
          const xPos = (mainCurve * dynamicWaveWidth) + frequencyVibration; 
          
          const xPosStr = `calc(${xPos}vw)`;
          const yPosStr = `calc(${yPos}vh)`;
          
          imgWrapperRef.current.style.transform = `translate(${xPosStr}, ${yPosStr}) ${transformStr}`;
        } else if (instrumentName.en === "Haegeum") {
          // 해금: 오른쪽에서 왼쪽으로 수평 이동하며, 사운드 고저(피치)에 맞춰 위아래로 움직임
          const duration = audio.duration || 3.0;
          let progress = audio.currentTime / duration;
          if (isFadingOut) {
            // 사라질 때도 멈추지 않고 관성에 따라 왼쪽으로 조금 더 이동
            const elapsedFade = (performance.now() - fadeOutStart) / 1000;
            progress += elapsedFade * 0.4;
          }
          
          // 소리가 거의 없을 때(완전 무음)만 스르륵 사라지게(투명해지게) 처리
          // 해금 소리 자체가 작을 수 있으므로 계수를 50.0으로 대폭 상향 (조금만 소리가 나도 선명하게 보이도록)
          opacity = opacity * Math.min(1.0, smoothedIntensity * 50.0);
          
          // X축: 오른쪽(35vw)에서 시작해 왼쪽(-35vw)으로 이동
          const xPos = 35 - (progress * 70); 
          
          // Y축: 하단 버튼에 가려지지 않도록 전체적인 궤적을 꽤 많이 위로 올림
          const linearY = -40 + (progress * 30); // 시작점(-40vh) -> 도착점(-10vh) 대폭 상향
          const sag = Math.sin(progress * Math.PI) * 20; // 포물선 처짐(Sag)
          const baseYPos = linearY + sag;
          
          // 피치(음의 고저) 반응: 진동폭을 약간 줄여서 우발적으로 너무 밑으로 떨어지는 것 방지
          const pitchOffset = (0.5 - smoothedPitch) * 40; 
          const yPos = baseYPos + pitchOffset; 
          
          const xPosStr = `calc(${xPos}vw)`;
          const yPosStr = `calc(${yPos}vh)`;
          
          imgWrapperRef.current.style.transform = `translate(${xPosStr}, ${yPosStr}) ${transformStr}`;
        } else if (instrumentName.en === "Pyeonjong") {
          const duration = audio.duration || 2.5;
          const progress = Math.min(1.0, audio.currentTime / duration);
          const easeProgress = 1 - Math.pow(1 - progress, 2.0);
          const yPos = -30 - (easeProgress * 80);
          imgWrapperRef.current.style.transform = `translateY(${yPos}px) ${transformStr}`;
        } else if (instrumentName.en === "Pyeongyeong") {
          const duration = audio.duration || 2.5;
          const progress = Math.min(1.0, audio.currentTime / duration);
          const easeProgress = 1 - Math.pow(1 - progress, 2.0);
          const yPos = 10 + (easeProgress * 80);
          imgWrapperRef.current.style.transform = `translateY(${yPos}px) ${transformStr}`;
        } else {
          imgWrapperRef.current.style.transform = transformStr;
        }
        imgWrapperRef.current.style.opacity = String(opacity);
        imgWrapperRef.current.style.filter = "none";
      }

      reqRef.current = requestAnimationFrame(updateLoop);
    };

    // 루프 시작
    reqRef.current = requestAnimationFrame(updateLoop);

    // 소리가 완전히 끝나면 즉시 정리 (편종, 편경, 대금은 재생 종료 시점에 맞춰 상승/하강/수평이동 및 소멸이 이미 완료되었으므로 즉시 제거)
    audio.onended = () => {
      if (
        instrumentName.en === "Pyeonjong" ||
        instrumentName.en === "Pyeongyeong" ||
        instrumentName.en === "Daegeum"
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
      {/* 중앙에 이미지 표시 영역 */}
      <AnimatePresence>
        {activeImage && (
          <motion.div
            initial={{ 
              opacity: 0, 
              scale: 0.9, 
              y: (activeInstrument?.en === "Hun" || activeInstrument?.en === "Pyeonjong") 
                ? -15 
                : (activeInstrument?.en === "Pyeongyeong" ? 5 : 0)
            }}
            animate={{ 
              opacity: 1, 
              scale: 1.0, 
              y: (activeInstrument?.en === "Hun" || activeInstrument?.en === "Pyeonjong") 
                ? -30 
                : (activeInstrument?.en === "Pyeongyeong" ? 10 : 0)
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.21, 0.47, 0.32, 0.98] }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
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
                    src={`${activeImage}?v=3`}
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
                    src={`${activeImage}?v=3`}
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
              <img
                ref={mainImgRef}
                src={`${activeImage}?v=3`}
                alt="Instrument Graphic"
                width={500}
                height={500}
                className="w-48 md:w-64 lg:w-96 h-auto object-contain relative z-10"
              />
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
            className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
          >
            <p className="text-sm md:text-base tracking-[0.2em] text-foreground/40 font-light font-sans uppercase">
              Click the Button
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 여백을 밀어내서 버튼들을 제일 하단으로 배치 */}
      <div className="flex-grow flex flex-col justify-end relative z-10">
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
                      "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 shrink-0 rounded-full border bg-background transition-all duration-500 hover:scale-115 active:scale-95 flex items-center justify-center relative",
                      isActive 
                        ? "border-foreground/20 text-foreground scale-110 shadow-[0_0_20px_rgba(63,58,46,0.15)]" 
                        : "border-foreground/20 text-foreground/50 hover:bg-foreground/5 hover:border-foreground/40"
                    )}
                    aria-label={`Instrument button: ${instrumentNames[i]}`}
                  >
                    <span className="relative z-10 text-[9px] sm:text-[10px] md:text-xs tracking-tighter whitespace-nowrap font-sans">{instrumentNames[i]}</span>
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
                      "w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 shrink-0 rounded-full border bg-background transition-all duration-500 hover:scale-115 active:scale-95 flex items-center justify-center relative",
                      isActive 
                        ? "border-foreground/20 text-foreground scale-110 shadow-[0_0_20px_rgba(63,58,46,0.15)]" 
                        : "border-foreground/20 text-foreground/50 hover:bg-foreground/5 hover:border-foreground/40"
                    )}
                    aria-label={`Instrument button: ${instrumentNames[index]}`}
                  >
                    <span className="relative z-10 text-[9px] sm:text-[10px] md:text-xs tracking-tighter whitespace-nowrap font-sans">{instrumentNames[index]}</span>
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
