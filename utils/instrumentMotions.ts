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
    updateState: (newDir: number, newCooldown: number) => void;
  };
  // DOM Refs for specific effects (like Jwago and Janggu)
  refs?: {
    wrapper?: HTMLDivElement | null;
    mainImg?: HTMLImageElement | null;
    rippleLeft?: HTMLImageElement | null;
    rippleRight?: HTMLImageElement | null;
  };
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


  const baseScale = 1;
  const maxMultiplier = 5;
  let opacity = 1.0;
  
  // 훈/생황 이외의 악기는 이전 인터랙션의 mask 및 opacity 잔여 스타일을 리셋 (DOM 재사용 방지)
  if (refs?.mainImg) {
    if (instrument !== "Hun" && instrument !== "Saenghwang") {
      refs.mainImg.style.maskImage = "";
      refs.mainImg.style.WebkitMaskImage = "";
      refs.mainImg.style.clipPath = "";
      refs.mainImg.style.WebkitClipPath = "";
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
      const growthFactor = 1.0 + (1.0 + elapsedFade * 0.4) * 1.5;
      scale = baseScale * growthFactor;
      transformStr = `scale(${scale})`;
    } else if (instrument === "Gayageum" || instrument === "Geomungo") {
      const gScale = ctx.disableBaseScale ? 1.0 : 1.7;
      transformStr = `scale(${baseScale * gScale})`;
    } else if (instrument === "Piri" || instrument === "Haegeum") {
      const piriScale = instrument === "Piri" ? 1.4 : baseScale;
      transformStr = `scale(${piriScale})`;
      const duration = audio.duration || 3.0;
      const endProgress = Math.min(1.0, audio.currentTime / duration);
      let baseOpacity = 1.0;
      if (endProgress > 0.5) {
        const fadeProgress = (endProgress - 0.5) * 2.0;
        baseOpacity = Math.max(0, 1.0 - Math.pow(fadeProgress, 1.2));
      }
      opacity = baseOpacity * Math.max(0, 1.0 - elapsedFade * 2.0);
    } else if (instrument === "Saenghwang") {
      const saenghwangBaseScale = 1.50;
      scale = saenghwangBaseScale * (1.0 + elapsedFade * 0.1);
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
          refs.mainImg.style.WebkitMaskImage = "radial-gradient(circle, transparent 0%, transparent 100%)";
          refs.mainImg.style.clipPath = "none";
          refs.mainImg.style.WebkitClipPath = "none";
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
          refs.mainImg.style.WebkitMaskImage = maskStr;
          refs.mainImg.style.clipPath = "none";
          refs.mainImg.style.WebkitClipPath = "none";
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
      const saenghwangBaseScale = 1.35;
      scale = saenghwangBaseScale + (progress * 0.15) + (intensity * 1.5);
      transformStr = `scale(${scale})`;

      if (refs?.mainImg) {
        // saenghwang01.png is underneath. mainImg is saenghwang.png, which fades in after 1.3s.
        if (audio.currentTime <= 1.3) {
          refs.mainImg.style.maskImage = "none";
          refs.mainImg.style.WebkitMaskImage = "none";
          refs.mainImg.style.opacity = "0";
        } else {
          // Fades in over 1.0 second (fully opaque at 2.3s)
          const fadeDuration = 1.0;
          const elapsed = audio.currentTime - 1.3;
          const overlayOpacity = Math.min(1.0, elapsed / fadeDuration);
          refs.mainImg.style.maskImage = "none";
          refs.mainImg.style.WebkitMaskImage = "none";
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
      if (progress > 0.8 && !ctx.disableProgressFade) {
        const fadeProgress = (progress - 0.8) * 5.0;
        opacity = 1.0 - Math.pow(fadeProgress, 1.2);
      }
    }

    if (instrument === "Pyeonjong" || instrument === "Pyeongyeong") {
      const duration = audio.duration || 2.5;
      const progress = Math.min(1.0, audio.currentTime / duration);
      
      const pyeonjongScale = 0.8 + intensity * 0.6;
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

    if (instrument === "Buk") {
      const shakeAmount = intensity * 10;
      const shakeX = (Math.random() - 0.5) * shakeAmount;
      const shakeY = (Math.random() - 0.5) * shakeAmount;
      const rotateAmount = (Math.random() - 0.5) * intensity * 3;
      transformStr = `scale(${scale}) translate(${shakeX}px, ${shakeY}px) rotate(${rotateAmount}deg)`;
    }

    if (instrument === "Jwago") {
      transformStr = `scale(${baseScale + intensity * 0.05})`;
      
      if (refs?.rippleLeft && refs?.rippleRight && refs?.mainImg && jwagoState) {
        const currentInt = smoothedIntensity;
        const lastInt = jwagoState.lastIntensity;
        
        if (currentInt > 0.15 && currentInt > lastInt + 0.05 && time - jwagoState.beatCooldown > 250) {
          jwagoState.updateState(jwagoState.direction * -1, time);
        }

        const direction = jwagoState.direction;
        const maxStretch = smoothedIntensity * 8.0; 
        const stretchScale = 1.0 + maxStretch;
        const baseRippleScale = 1.0;
        const scaleY = 1.0 + smoothedIntensity * 0.5;

        const mainStretchScale = 1.0 + smoothedIntensity * 1.8; 
        const mainScaleY = 1.0 + smoothedIntensity * 1.2;

        if (direction < 0) {
          refs.mainImg.style.transformOrigin = "right center";
          refs.mainImg.style.transform = `scale(${mainStretchScale}, ${mainScaleY})`;

          refs.rippleLeft.style.transform = `scale(${stretchScale}, ${scaleY})`;
          refs.rippleLeft.style.opacity = String(0.3 + smoothedIntensity * 0.4);
          refs.rippleRight.style.transform = `scale(${baseRippleScale}, ${baseRippleScale})`;
          refs.rippleRight.style.opacity = "0.0"; 
        } else {
          refs.mainImg.style.transformOrigin = "left center";
          refs.mainImg.style.transform = `scale(${mainStretchScale}, ${mainScaleY})`;

          refs.rippleRight.style.transform = `scale(${stretchScale}, ${scaleY})`;
          refs.rippleRight.style.opacity = String(0.3 + smoothedIntensity * 0.4);
          refs.rippleLeft.style.transform = `scale(${baseRippleScale}, ${baseRippleScale})`;
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

    if (instrument === "Gayageum") {
      // 거문고와 유사하지만 위로 튕기도록 -Y translation 적용
      const bounceY = -intensity * 75;
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
      const yPos = -35 + (progress * 70); 
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
      opacity = opacity * Math.min(1.0, smoothedIntensity * 50.0);
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
      const duration = audio.duration || 2.5;
      const progress = Math.min(1.0, audio.currentTime / duration);
      const easeProgress = 1 - Math.pow(1 - progress, 2.0);
      const yPos = -30 - (easeProgress * 80);
      finalTransform = `translateY(${yPos}px) ${transformStr}`;
    } else if (instrument === "Pyeongyeong") {
      const duration = audio.duration || 2.5;
      const progress = Math.min(1.0, audio.currentTime / duration);
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
      // 2번 트랙 (메시지 사운드) - 위치를 먼저 잡기 위해 진입 모션 임시 비활성화
      /*
      else if (ctx.elementId === "janggu-cb") {
        ty = 100 * inverseProgress; // 아래에서 위로
      } else if (ctx.elementId === "geomungo-t") {
        ty = -100 * inverseProgress; // 위에서 아래로
      } else if (ctx.elementId === "daegeum-ml") {
        tx = -100 * inverseProgress; // 좌에서 우로
        ty = -arc * 30; // 둥글게 위로 솟는 포물선
      } else if (ctx.elementId === "daegeum-tr2") {
        tx = 100 * inverseProgress; // 우에서 좌로
        ty = arc * 30; // 둥글게 아래로 꺼지는 포물선
      }
      */

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
