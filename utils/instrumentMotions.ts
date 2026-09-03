export interface MotionContext {
  instrument: string; // "Hun", "Daegeum", "Piri", "Gayageum", etc.
  audio: HTMLAudioElement; // audio context
  intensity: number; // raw frequency intensity
  smoothedIntensity: number; // enveloped intensity
  smoothedPitch: number; // normalized peak frequency
  isFadingOut: boolean;
  elapsedFade: number; // seconds since fade started
  time: number; // performance.now()
  disablePositionalTranslation?: boolean; // If true, skip large positional translations
  disableBaseScale?: boolean; // If true, ignore built-in base scaling (e.g., 1.85 for Daegeum)
  disableProgressFade?: boolean; // If true, do not fade opacity based on audio progress
  elementId?: string; // e.g., "daegeum-tl" for specific static image behaviors
  
  // Specific states for Jwago
  jwagoState?: {
    direction: number;
    lastIntensity: number;
    beatCooldown: number;
    beatCount: number; // 울린 횟수 (홈수=왼쪽 / 짜수=오른쪽)
    updateState: (newDir: number, newCooldown: number, newBeatCount: number) => void;
  };
  // DOM Refs for specific effects (like Jwago and Janggu)
  refs?: {
    wrapper?: HTMLDivElement | null;
    mainImg?: HTMLImageElement | null;
    rippleLeft?: HTMLImageElement | null;
    rippleRight?: HTMLImageElement | null;
  };
  frozenTime?: number; // Exact currentTime at the start of fade out to prevent scale jumps
}

export interface MotionResult {
  transform: string;
  opacity: number;
  filter: string;
  transformOrigin?: string;
}

export function getInstrumentMotionStyle(ctx: MotionContext): MotionResult {
  const {
    instrument, audio, intensity, smoothedIntensity, smoothedPitch,
    isFadingOut, elapsedFade, time, jwagoState, refs
  } = ctx;

  // 'Bak', 'Eo', 'Buk', 'Jwago', 'Janggu', 'Gayageum', 'Geomungo', 'Daegeum', 'Hun', 'Pyeonjong', 'Pyeongyeong', 'Taepyeongso', 'Haegeum'는 영상 재생 방식으로 대체되어 모든 스케일/진동 모션 비활성화 (페이드아웃 투명도만 적용)
  if (["Bak", "Eo", "Buk", "Jwago", "Janggu", "Gayageum", "Geomungo", "Daegeum", "Hun", "Pyeonjong", "Pyeongyeong", "Taepyeongso", "Haegeum"].includes(instrument)) {
    return {
      transform: "scale(1)",
      opacity: isFadingOut ? Math.max(0, 1.0 - elapsedFade) : 1.0,
      filter: "none"
    };
  }

  const baseScale = 1;
  const maxMultiplier = 5;
  let opacity = 1.0;
  
  // 훈/생황 이외의 악기는 이전 인터랙션의 mask 및 opacity 잔여 스타일을 리셋 (DOM 재사용 방지)
  if (refs?.mainImg) {
    if (instrument !== "Hun" && instrument !== "Saenghwang") {
      refs.mainImg.style.maskImage = "";
      refs.mainImg.style.setProperty("-webkit-mask-image", "");
      refs.mainImg.style.clipPath = "";
      refs.mainImg.style.setProperty("-webkit-clip-path", "");
      refs.mainImg.style.opacity = "";
    }
  }
  
  // 2번 버튼(메시지 사운드)의 그래픽 요소들은 사용자의 요청으로 모든 모션을 완전히 제거하고 고정 상태로 렌더링
  if (ctx.elementId && ["janggu-cb", "geomungo-t", "daegeum-ml", "daegeum-tr2"].includes(ctx.elementId)) {
    return {
      transform: "scale(1)",
      opacity: 1.0,
      filter: "none"
    };
  }

  let scale = baseScale + intensity * maxMultiplier;
  let transformStr = `scale(${scale})`;

  if (isFadingOut) {
    if (elapsedFade >= 1.0) {
      // It's completely faded out, should be unmounted by caller
      return { transform: transformStr, opacity: 0, filter: "none" };
    }
    opacity = 1.0 - elapsedFade;
    
    if (instrument === "Hun") {
      const referenceTime = ctx.frozenTime !== undefined ? ctx.frozenTime : audio.currentTime;
      const startProgress = referenceTime / (audio.duration || 4.0);
      const growthFactor = 1.0 + (startProgress + elapsedFade * 0.4) * 1.5;
      scale = baseScale * growthFactor;
      transformStr = `scale(${scale})`;
    } else if (instrument === "Geomungo") {
      const gScale = ctx.disableBaseScale ? 1.0 : 1.7;
      transformStr = `scale(${baseScale * gScale})`;
    } else if (instrument === "Daegeum") {
      const referenceTime = ctx.frozenTime !== undefined ? ctx.frozenTime : audio.currentTime;
      const duration = audio.duration || 3.5;
      const progress = Math.min(1.0, referenceTime / duration);
      const daegeumBaseScale = ctx.disableBaseScale ? 1.0 : 1.85; 
      scale = (daegeumBaseScale + intensity * 0.5) * (1.0 - progress * 0.1);
      transformStr = `scale(${scale})`;
    } else if (instrument === "Piri" || instrument === "Haegeum") {
      const piriScale = instrument === "Piri" ? 1.4 : baseScale;
      transformStr = `scale(${piriScale})`;
      // elapsedFade로 단순 페이드 아웃 (endProgress 기반 로직은 onended 후 currentTime 리셋 시 회복 불가)
      opacity = Math.max(0, 1.0 - elapsedFade);
    } else if (instrument === "Saenghwang") {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const saenghwangBaseScale = isMobile ? 1.70 : 1.50;
      scale = saenghwangBaseScale * (1.0 + elapsedFade * 0.1);
      transformStr = `scale(${scale})`;
    } else if (instrument === "Pyeonjong" || instrument === "Pyeongyeong") {
      const referenceTime = ctx.frozenTime !== undefined ? ctx.frozenTime : audio.currentTime;
      const duration = audio.duration || 2.5;
      const progress = Math.min(1.0, referenceTime / duration);
      
      const pyeonjongScale = (0.7 + intensity * 0.5) * (1.0 - elapsedFade * 0.2);
      const isStrikePeak = referenceTime < 0.35;
      
      let shakeX = 0;
      let shakeY = 0;
      
      if (isStrikePeak) {
        shakeX = (Math.random() - 0.5) * intensity * 25 * (1.0 - elapsedFade);
        shakeY = (Math.random() - 0.5) * intensity * 25 * (1.0 - elapsedFade);
      } else {
        const vibrationSpeed = 0.01 + 0.07 * (1.0 - progress);
        const baseVibration = 10.0 * (1.0 - progress);
        const currentAmp = (Math.max(0, baseVibration) + intensity * 15) * (1.0 - elapsedFade);
        shakeX = Math.sin(time * vibrationSpeed) * currentAmp;
        shakeY = (Math.random() - 0.5) * intensity * 2 * (1.0 - elapsedFade);
      }
      
      transformStr = `scale(${pyeonjongScale}) translate(${shakeX}px, ${shakeY}px)`;
    } else if (instrument === "Jwago") {
      // 페이드 아웃: mainImg 웨곡 즉시 해제, 래퍼 투명도만 감소
      if (refs?.mainImg) {
        refs.mainImg.style.transform = "scale(1, 1)";
        refs.mainImg.style.transformOrigin = "center center";
      }
      if (refs?.rippleLeft) refs.rippleLeft.style.opacity = "0.0";
      if (refs?.rippleRight) refs.rippleRight.style.opacity = "0.0";
      transformStr = "scale(1.0)";
    } else if (instrument === "Eo") {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      scale = baseScale * (isMobile ? 1.5 : 2);
      transformStr = `scale(${scale})`;
    } else {
      scale = (baseScale + intensity * maxMultiplier) * (1.0 + elapsedFade * 0.1);
      transformStr = `scale(${scale})`;
    }
  } else {
    if (instrument === "Hun") {
      const durationProgress = audio.currentTime / (audio.duration || 4.0);
      const growthFactor = 1.0 + durationProgress * 1.5;
      scale = baseScale * growthFactor;
      transformStr = `scale(${scale})`;
      if (refs?.mainImg) {
        // hun01.png is underneath. mainImg is hun.png, which expands from the center after 0.8s.
        if (audio.currentTime <= 0.8) {
          refs.mainImg.style.maskImage = "radial-gradient(circle, transparent 0%, transparent 100%)";
          refs.mainImg.style.setProperty("-webkit-mask-image", "radial-gradient(circle, transparent 0%, transparent 100%)");
          refs.mainImg.style.clipPath = "none";
          refs.mainImg.style.setProperty("-webkit-clip-path", "none");
          refs.mainImg.style.opacity = "1";
        } else {
          // Slow circular reveal over 2.0 seconds with extremely soft/blurry edges
          const fadeDuration = 2.0;
          const elapsed = audio.currentTime - 0.8;
          const progress = Math.min(1.0, elapsed / fadeDuration);
          
          const solidRadius = Math.max(0, progress * 150 - 50);
          const transparentRadius = progress * 150 + 30;
          
          const maskStr = `radial-gradient(circle, black ${solidRadius}%, transparent ${transparentRadius}%)`;
          refs.mainImg.style.maskImage = maskStr;
          refs.mainImg.style.setProperty("-webkit-mask-image", maskStr);
          refs.mainImg.style.clipPath = "none";
          refs.mainImg.style.setProperty("-webkit-clip-path", "none");
          refs.mainImg.style.opacity = "1";
        }
      }
    }

    if (instrument === "Saenghwang") {
      // Entire instrument visual starts showing after 0.5s
      if (audio.currentTime <= 0.5) {
        opacity = 0;
      } else {
        opacity = 1.0;
      }
      
      const duration = audio.duration || 3.0;
      const progress = Math.min(1.0, audio.currentTime / duration);
      
      // 시간이 지남에 따라 15% 성장하고, 주파수 증폭(intensity) 시 20px가량 더 팽창하도록 계수 상향(0.8 -> 1.5)
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const saenghwangBaseScale = isMobile ? 1.55 : 1.35;
      scale = saenghwangBaseScale + (progress * 0.15) + (intensity * 1.5);
      transformStr = `scale(${scale})`;

      if (refs?.mainImg) {
        // saenghwang01.png is underneath. mainImg is saenghwang.png, which fades in after 1.3s.
        if (audio.currentTime <= 1.3) {
          refs.mainImg.style.maskImage = "none";
          refs.mainImg.style.setProperty("-webkit-mask-image", "none");
          refs.mainImg.style.opacity = "0";
        } else {
          // Fades in over 1.0 second (fully opaque at 2.3s)
          const fadeDuration = 1.0;
          const elapsed = audio.currentTime - 1.3;
          const overlayOpacity = Math.min(1.0, elapsed / fadeDuration);
          refs.mainImg.style.maskImage = "none";
          refs.mainImg.style.setProperty("-webkit-mask-image", "none");
          refs.mainImg.style.opacity = String(overlayOpacity);
        }
      }
    }

    if (instrument === "Daegeum") {
      const duration = audio.duration || 3.5;
      const progress = Math.min(1.0, audio.currentTime / duration);
      const daegeumBaseScale = ctx.disableBaseScale ? 1.0 : 1.85; 
      scale = (daegeumBaseScale + intensity * 0.5) * (1.0 - progress * 0.1);
      transformStr = `scale(${scale})`;
      if (!ctx.disableProgressFade) {
        opacity = 1.0 - Math.pow(progress, 1.5);
      }
    }

    if (instrument === "Piri") {
      const duration = audio.duration || 3.0;
      const progress = Math.min(1.0, audio.currentTime / duration);
      const piriBaseScale = 1.4;
      scale = (piriBaseScale + intensity * 0.5) * (1.0 - progress * 0.1);
      transformStr = `scale(${scale})`;
      
      if (progress > 0.5 && !ctx.disableProgressFade) {
        const fadeProgress = (progress - 0.5) * 2.0;
        opacity = 1.0 - Math.pow(fadeProgress, 1.2); 
      } else {
        opacity = 1.0;
      }
    }

    if (instrument === "Haegeum") {
      const duration = audio.duration || 3.0;
      const progress = Math.min(1.0, audio.currentTime / duration);
      // 진행도 0.8 이후 페이드 (80%이후 서서히 사라짐)
      if (progress > 0.8 && !ctx.disableProgressFade) {
        const fadeProgress = (progress - 0.8) * 5.0;
        opacity = 1.0 - Math.pow(fadeProgress, 1.2);
      } else {
        opacity = 1.0; // 일반 재생 중 항상 완전 비형 유지
      }
      // intensity에 반응하는 미세한 스케일 (활로 켜는 느낙)
      const haegeumScale = 1.0 + smoothedIntensity * 1.2;
      transformStr = `scale(${haegeumScale})`;
    }

    if (instrument === "Pyeonjong" || instrument === "Pyeongyeong") {
      const duration = audio.duration || 2.5;
      const progress = Math.min(1.0, audio.currentTime / duration);
      
      const pyeonjongScale = 0.7 + intensity * 0.5;
      const isStrikePeak = audio.currentTime < 0.35;
      
      let shakeX = 0;
      let shakeY = 0;
      
      if (isStrikePeak) {
        shakeX = (Math.random() - 0.5) * intensity * 25;
        shakeY = (Math.random() - 0.5) * intensity * 25;
      } else {
        // 진동 속도(진동수)도 시간이 갈수록 점차 줄어들도록 설정 (vibrationSpeed 감쇠)
        const vibrationSpeed = 0.01 + 0.07 * (1.0 - progress);
        const baseVibration = 10.0 * (1.0 - progress);
        const currentAmp = Math.max(0, baseVibration) + intensity * 15;
        shakeX = Math.sin(time * vibrationSpeed) * currentAmp;
        shakeY = (Math.random() - 0.5) * intensity * 2;
      }
      
      transformStr = `scale(${pyeonjongScale}) translate(${shakeX}px, ${shakeY}px)`;
      if (!ctx.disableProgressFade) {
        opacity = 1.0 - Math.pow(progress, 1.5);
      }
    }

    if (instrument === "Janggu") {
      if (audio.src.includes("Janggu01")) {
        if (refs?.wrapper) refs.wrapper.style.transformOrigin = "left center";
        const scaleX = 1.0 + smoothedIntensity * 1.5;
        const scaleY = 1.0 + smoothedIntensity * 0.4;
        transformStr = `scale(${scaleX}, ${scaleY})`;
      } else if (audio.src.includes("Janggu02") || audio.src.includes("Janggu03")) {
        if (refs?.wrapper) refs.wrapper.style.transformOrigin = "center center";
        const scaleX = 1.0 + smoothedIntensity * 2.0; 
        const scaleY = 1.0 + smoothedIntensity * 0.4; 
        transformStr = `scale(${scaleX}, ${scaleY})`;
      } else {
        if (refs?.wrapper) refs.wrapper.style.transformOrigin = "center center";
        const janggu4Scale = 1.0 + smoothedIntensity * 1.5;
        transformStr = `scale(${janggu4Scale})`;
      }
    }

    if (instrument === "Eo") {
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      scale = baseScale * (isMobile ? 1.5 : 2);
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

    if (instrument === "Bak") {
      // 박은 양손을 펼쳐 치는 타악기 — 타격 시 좌우로 퍼지는 느낌을 강조
      const shakeAmount = intensity * 18;
      const shakeX = (Math.random() - 0.5) * shakeAmount;
      const shakeY = (Math.random() - 0.5) * intensity * 8;
      const rotateAmount = (Math.random() - 0.5) * intensity * 6;
      const bakScale = 1.0 + intensity * 8.0;
      transformStr = `scale(${bakScale}) translate(${shakeX}px, ${shakeY}px) rotate(${rotateAmount}deg)`;
    }

    if (instrument === "Buk") {
      const shakeAmount = intensity * 10;
      const shakeX = (Math.random() - 0.5) * shakeAmount;
      const shakeY = (Math.random() - 0.5) * shakeAmount;
      const rotateAmount = (Math.random() - 0.5) * intensity * 3;
      transformStr = `scale(${scale}) translate(${shakeX}px, ${shakeY}px) rotate(${rotateAmount}deg)`;
    }

    if (instrument === "Jwago") {
      const dt = jwagoState ? Math.max(0, (time - jwagoState.beatCooldown) / 1000) : 0;
      // 쫀득한 탄성 감쇄 진동을 위해 사인파와 지수 감쇄 적용 (주파수 14Hz, 감쇄계수 8)
      const wobble = Math.sin(dt * Math.PI * 14) * Math.exp(-8.0 * dt);

      // 1. 래퍼: 미세한 스케일 + 탄성 바운스 효과
      const wrapperScale = 1.0 + (smoothedIntensity * 0.35) + wobble * 0.06;
      transformStr = `scale(${wrapperScale})`;

      // 2. 비트 감지 및 방향 결정 (refs 조건과 분리하여 항상 실행)
      // 동작 패턴: 비트 1=왼쪽, 2=오른쪽, 3=왼쪽, 4=오른쪽 (홀수=왼쪽 / 짝수=오른쪽)
      if (jwagoState) {
        const currentInt = smoothedIntensity;
        const lastInt = jwagoState.lastIntensity;
        if (currentInt > 0.08 && currentInt > lastInt + 0.03 && time - jwagoState.beatCooldown > 250) {
          const newBeatCount = jwagoState.beatCount + 1;
          // 홀수 번째 비트 = 왼쪽(-1), 짝수 번째 비트 = 오른쪽(1)
          const newDir = (newBeatCount % 2 === 1) ? -1 : 1;
          jwagoState.updateState(newDir, time, newBeatCount);
          // getter 덕분에 jwagoState.direction이 즉시 새 값을 반환하므로 같은 프레임에서 새 방향 적용 가능
        }
      }

      // 3. 이미지 자체 왜곡: 타격 방향으로 좌우 팽창 및 탄성 흔들림 추가
      if (refs?.mainImg && jwagoState) {
        const direction = jwagoState.direction;
        // 타격 시점의 물리 효과를 시뮬레이션하여 더욱 쫀득하고 젤리 같은 느낌 부여
        const stretchX = Math.min(1.6, 1.0 + (intensity * 2.5) + wobble * 0.3);
        const squishY = Math.max(0.78, 1.0 - (intensity * 0.15) - wobble * 0.12);

        if (direction < 0) {
          // 왼쪽으로 늘어나기: 오른쪽 끝 고정 → 왼쪽으로 팽창
          refs.mainImg.style.transformOrigin = "right center";
        } else {
          // 오른쪽으로 늘어나기: 왼쪽 끝 고정 → 오른쪽으로 팽창
          refs.mainImg.style.transformOrigin = "left center";
        }
        refs.mainImg.style.transform = `scale(${stretchX}, ${squishY})`;
      }

      // 4. 리플 이펙트: ripple refs가 유효할 때 추가 연출
      if (refs?.rippleLeft && refs?.rippleRight && jwagoState) {
        const direction = jwagoState.direction;
        const maxStretch = smoothedIntensity * 5.0;
        const stretchScale = 1.0 + maxStretch;
        const scaleY = 1.0 + smoothedIntensity * 0.4;
        const rippleOpacity = String(Math.min(0.65, 0.2 + smoothedIntensity * 0.5));

        if (direction < 0) {
          refs.rippleLeft.style.transform = `scale(${stretchScale}, ${scaleY})`;
          refs.rippleLeft.style.opacity = rippleOpacity;
          refs.rippleRight.style.transform = "scale(1, 1)";
          refs.rippleRight.style.opacity = "0.0";
        } else {
          refs.rippleRight.style.transform = `scale(${stretchScale}, ${scaleY})`;
          refs.rippleRight.style.opacity = rippleOpacity;
          refs.rippleLeft.style.transform = "scale(1, 1)";
          refs.rippleLeft.style.opacity = "0.0";
        }
      }
    } else {
      if (refs?.mainImg) refs.mainImg.style.transform = "none";
    }


    if (instrument === "Geomungo") {
      const bounceY = intensity * 75;
      const trembleX = (Math.random() - 0.5) * intensity * 30; 
      const trembleY = (Math.random() - 0.5) * intensity * 30;
      const gScale = ctx.disableBaseScale ? 1.0 : 1.7;
      transformStr = `scale(${baseScale * gScale}) translate(${trembleX}px, ${bounceY + trembleY}px)`;
    }

    
    if (instrument === "Taepyeongso") {
      const taepyeongsoMultiplier = 8;
      const taepScale = Math.min(3.0, 0.6 + intensity * taepyeongsoMultiplier); 
      transformStr = `scale(${taepScale})`;
    }
  }

  // Final wrapper transformations
  let finalTransform = transformStr;

  
  if (refs?.wrapper) {
    refs.wrapper.style.clipPath = "none";
    if (instrument !== "Janggu") {
      refs.wrapper.style.transformOrigin = "center center";
    }
  }

  if (!ctx.disablePositionalTranslation) {
    if (instrument === "Hun") {
      finalTransform = `translateY(-30px) ${transformStr}`;
    } else if (instrument === "Daegeum") {
      const duration = audio.duration || 3.5;
      const progress = Math.min(1.0, audio.currentTime / duration);
      const easeProgress = -(Math.cos(Math.PI * progress) - 1) / 2;
      const baseX = -30 + (easeProgress * 60); 
      const windShiver = Math.sin(time * 0.04) * intensity * 12;
      const xPosStr = `calc(${baseX}vw + ${windShiver}px)`;
      const yPos = -30 - Math.cos(progress * 2 * Math.PI) * 45;
      finalTransform = `translate(${xPosStr}, ${yPos}px) ${transformStr}`;
    } else if (instrument === "Piri") {
      const duration = audio.duration || 3.0;
      let progress = audio.currentTime / duration;
      if (isFadingOut) {
        progress += elapsedFade * 0.4; 
      }
      const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
      const startY = isMobile ? -50 : -35;
      const yPos = startY + (progress * (isMobile ? 85 : 70)); 
      const baseWaveWidth = 10;
      const dynamicWaveWidth = baseWaveWidth + smoothedIntensity * 40;
      const mainCurve = Math.sin(progress * Math.PI * 3.5);
      const frequencyVibration = Math.sin(time * 0.05) * (intensity * 1.5);
      const xPos = (mainCurve * dynamicWaveWidth) + frequencyVibration; 
      const xPosStr = `calc(${xPos}vw)`;
      const yPosStr = `calc(${yPos}vh)`;
      finalTransform = `translate(${xPosStr}, ${yPosStr}) ${transformStr}`;
    } else if (instrument === "Haegeum") {
      const duration = audio.duration || 3.0;
      let progress = audio.currentTime / duration;
      if (isFadingOut) {
        progress += elapsedFade * 0.4;
      }
      // opacity는 progress 기반 페이드 및 isFadingOut에서 관리 — intensity로 곡하지 않음
      const xPos = 35 - (progress * 70); 
      const linearY = -40 + (progress * 30);
      const sag = Math.sin(progress * Math.PI) * 20;
      const baseYPos = linearY + sag;
      const pitchOffset = (0.5 - smoothedPitch) * 40; 
      const yPos = baseYPos + pitchOffset; 
      const xPosStr = `calc(${xPos}vw)`;
      const yPosStr = `calc(${yPos}vh)`;
      finalTransform = `translate(${xPosStr}, ${yPosStr}) ${transformStr}`;
    } else if (instrument === "Pyeonjong") {
      const referenceTime = ctx.frozenTime !== undefined ? ctx.frozenTime : audio.currentTime;
      const duration = audio.duration || 2.5;
      let progress = referenceTime / duration;
      if (isFadingOut) {
        progress = Math.min(1.0, progress + elapsedFade * 0.4);
      }
      const easeProgress = 1 - Math.pow(1 - progress, 2.0);
      const yPos = -30 - (easeProgress * 80);
      finalTransform = `translateY(${yPos}px) ${transformStr}`;
    } else if (instrument === "Pyeongyeong") {
      const referenceTime = ctx.frozenTime !== undefined ? ctx.frozenTime : audio.currentTime;
      const duration = audio.duration || 2.5;
      let progress = referenceTime / duration;
      if (isFadingOut) {
        progress = Math.min(1.0, progress + elapsedFade * 0.4);
      }
      const easeProgress = 1 - Math.pow(1 - progress, 2.0);
      const yPos = -30 + (easeProgress * 80);
      finalTransform = `translateY(${yPos}px) ${transformStr}`;
    }
  } else {
    if (ctx.elementId) {
      const duration = audio.duration || 3.0;
      const progress = Math.min(1.0, audio.currentTime / duration);
      // 부드러운 감속을 위한 Easing
      const easeProgress = 1 - Math.pow(1 - progress, 2.5);
      const inverseProgress = 1.0 - easeProgress;

      let tx = 0; // vw
      let ty = 0; // vh
      // 포물선 효과를 위한 아치 계산 (시작 0 -> 중간 1 -> 끝 0)
      const arc = Math.sin(progress * Math.PI); 

      if (ctx.elementId === "daegeum-tl") {
        tx = 100 * inverseProgress; // 우측에서 좌측으로
        ty = arc * 30; // 궤적 동안 아래로 둥글게(30vh) 포물선
      } else if (ctx.elementId === "daegeum-mr") {
        tx = -100 * inverseProgress; // 좌측에서 우측으로
        ty = -arc * 40; // 궤적 동안 위로 둥글게(-40vh) 포물선
      } else if (ctx.elementId === "piri-tr") {
        ty = -100 * inverseProgress; // 위에서 아래로
        tx = -arc * 30; // 궤적 동안 왼쪽으로 둥글게(-30vw) 포물선
      } else if (ctx.elementId === "piri-bl") {
        ty = -100 * inverseProgress; // 위에서 아래로
        tx = arc * 30; // 궤적 동안 오른쪽으로 둥글게(30vw) 포물선
      } 
 
      if (tx !== 0 || ty !== 0) {
        finalTransform = `translate(${tx}vw, ${ty}vh) ${finalTransform}`;
      }
    }
  }

  return {
    transform: finalTransform,
    opacity,
    filter: "none"
  };
}
