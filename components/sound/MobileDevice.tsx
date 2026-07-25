"use client";

import { useRef, useEffect } from "react";
import { motion, MotionValue, animate, useTransform } from "framer-motion";

interface MobileDeviceProps {
  playingId: string | null;
  playSound: (id: string, url: string) => void;
  stopSound: () => void;
  callDragX: MotionValue<number>;
  alarmDragX: MotionValue<number>;
}

export default function MobileDevice({
  playingId,
  playSound,
  stopSound,
  callDragX,
  alarmDragX,
}: MobileDeviceProps) {
  // Smoothly fade out text as drag starts (complete fade-out by 100px of drag)
  const callTextOpacityLocal = useTransform(callDragX, [0, 100], [1, 0]);
  const alarmTextOpacityLocal = useTransform(alarmDragX, [0, 100], [1, 0]);

  // Refs for draggable handles to bind native capture phase listeners and prevent parent drag hijacking
  const callHandleRef = useRef<SVGGElement | null>(null);
  const alarmHandleRef = useRef<SVGGElement | null>(null);

  // Track refs to calculate client width for scale conversion
  const callTrackRef = useRef<SVGRectElement | null>(null);
  const alarmTrackRef = useRef<SVGRectElement | null>(null);

  useEffect(() => {
    const callEl = callHandleRef.current;
    const alarmEl = alarmHandleRef.current;

    let startX = 0;
    let startDragX = 0;
    let isDraggingCall = false;
    let isDraggingAlarm = false;

    const onPointerDownCall = (e: PointerEvent) => {
      e.stopPropagation();
      callEl?.setPointerCapture(e.pointerId);
      startX = e.clientX;
      startDragX = callDragX.get();
      isDraggingCall = true;
    };

    const onPointerMoveCall = (e: PointerEvent) => {
      if (!isDraggingCall) return;
      e.stopPropagation();
      const trackWidthScreen = callTrackRef.current ? callTrackRef.current.getBoundingClientRect().width : 300;
      const ratio = 668.51 / trackWidthScreen;
      const deltaXScreen = e.clientX - startX;
      const deltaXSvg = deltaXScreen * ratio;
      const newX = Math.max(0, Math.min(536.19, startDragX + deltaXSvg));
      callDragX.set(newX);
    };

    const onPointerUpCall = (e: PointerEvent) => {
      if (!isDraggingCall) return;
      isDraggingCall = false;
      callEl?.releasePointerCapture(e.pointerId);
      
      // If dragged past ~75% of track (approx 400 viewBox units), animate to end and stop the sound
      if (callDragX.get() > 400) {
        animate(callDragX, 536.19, { type: "spring", stiffness: 300, damping: 30 }).then(() => {
          stopSound();
        });
      } else {
        animate(callDragX, 0, { type: "spring", stiffness: 300, damping: 30 });
      }
    };

    const onPointerDownAlarm = (e: PointerEvent) => {
      e.stopPropagation();
      alarmEl?.setPointerCapture(e.pointerId);
      startX = e.clientX;
      startDragX = alarmDragX.get();
      isDraggingAlarm = true;
    };

    const onPointerMoveAlarm = (e: PointerEvent) => {
      if (!isDraggingAlarm) return;
      e.stopPropagation();
      const trackWidthScreen = alarmTrackRef.current ? alarmTrackRef.current.getBoundingClientRect().width : 300;
      const ratio = 668.51 / trackWidthScreen;
      const deltaXScreen = e.clientX - startX;
      const deltaXSvg = deltaXScreen * ratio;
      const newX = Math.max(0, Math.min(536.19, startDragX + deltaXSvg));
      alarmDragX.set(newX);
    };

    const onPointerUpAlarm = (e: PointerEvent) => {
      if (!isDraggingAlarm) return;
      isDraggingAlarm = false;
      alarmEl?.releasePointerCapture(e.pointerId);
      
      // If dragged past ~75% of track (approx 400 viewBox units), animate to end and stop the sound
      if (alarmDragX.get() > 400) {
        animate(alarmDragX, 536.19, { type: "spring", stiffness: 300, damping: 30 }).then(() => {
          stopSound();
        });
      } else {
        animate(alarmDragX, 0, { type: "spring", stiffness: 300, damping: 30 });
      }
    };

    if (callEl) {
      callEl.addEventListener("pointerdown", onPointerDownCall, { capture: true });
      callEl.addEventListener("pointermove", onPointerMoveCall, { capture: true });
      callEl.addEventListener("pointerup", onPointerUpCall, { capture: true });
      callEl.addEventListener("pointercancel", onPointerUpCall, { capture: true });
    }

    if (alarmEl) {
      alarmEl.addEventListener("pointerdown", onPointerDownAlarm, { capture: true });
      alarmEl.addEventListener("pointermove", onPointerMoveAlarm, { capture: true });
      alarmEl.addEventListener("pointerup", onPointerUpAlarm, { capture: true });
      alarmEl.addEventListener("pointercancel", onPointerUpAlarm, { capture: true });
    }

    return () => {
      if (callEl) {
        callEl.removeEventListener("pointerdown", onPointerDownCall, { capture: true });
        callEl.removeEventListener("pointermove", onPointerMoveCall, { capture: true });
        callEl.removeEventListener("pointerup", onPointerUpCall, { capture: true });
        callEl.removeEventListener("pointercancel", onPointerUpCall, { capture: true });
      }
      if (alarmEl) {
        alarmEl.removeEventListener("pointerdown", onPointerDownAlarm, { capture: true });
        alarmEl.removeEventListener("pointermove", onPointerMoveAlarm, { capture: true });
        alarmEl.removeEventListener("pointerup", onPointerUpAlarm, { capture: true });
        alarmEl.removeEventListener("pointercancel", onPointerUpAlarm, { capture: true });
      }
    };
  }, [playingId]);

  return (
    <svg 
      viewBox="298 74 941.97 1006.42" 
      className="w-full h-full max-h-full object-contain pointer-events-auto"
    >
      <defs>
        <clipPath id="screen-clip">
          <path d="M1100.71,1141.5H320V207.03c0-61.2,49.62-110.82,110.82-110.82h90.83c6.41,0,12.55,2.87,16.43,7.97,2.48,3.26,4.52,7.12,7.03,11.6,12.11,21.58,28.91,28.91,66.08,28.91h198.34c37.17,0,53.97-7.33,66.08-28.91,2.51-4.48,4.55-8.34,7.03-11.6,3.88-5.1,10.02-7.97,16.43-7.97h90.83c61.2,0,110.82,49.62,110.82,110.82v934.47Z"/>
        </clipPath>
      </defs>

      {/* Phone Outer & Inner Borders */}
      <path 
        className="stroke-[#4c483b] fill-none" 
        strokeWidth={1.5}
        strokeMiterlimit={10} 
        d="M997.45,76.58H423.26c-67.87,0-122.9,55.02-122.9,122.9v961.67h819.98V199.47c0-67.87-55.02-122.9-122.9-122.9ZM1100.71,1141.5H320V207.03c0-61.2,49.62-110.82,110.82-110.82h90.83c6.41,0,12.55,2.87,16.43,7.97,2.48,3.26,4.52,7.12,7.03,11.6,12.11,21.58,28.91,28.91,66.08,28.91h198.34c37.17,0,53.97-7.33,66.08-28.91,2.51-4.48,4.55-8.34,7.03-11.6,3.88-5.1,10.02-7.97,16.43-7.97h90.83c61.2,0,110.82,49.62,110.82,110.82v934.47Z"
      />
      


      {/* Interactive Buttons */}
      {/* 재난문자 */}
      <motion.g 
        onClick={() => playSound("emergency", "/sound/sound/mobile_emergency_alert.mp3")}
        className="cursor-pointer"
        style={{ transformOrigin: "439.56px 293.45px" }}
        animate={{ y: [0, -5, 0] }}
        transition={{ 
          repeat: Infinity, 
          duration: 2.5, 
          ease: "easeInOut",
          delay: 0 
        }}
        whileHover={{ scale: 1.08, y: -8 }}
        whileTap={{ scale: 0.94, y: 1 }}
      >
        <image 
          href="/sound-img/sound-mobile-emergency-1.png" 
          x="375.66" 
          y="229.55" 
          width="127.8" 
          height="127.8" 
          filter="drop-shadow(0px 6px 10px rgba(76, 72, 59, 0.15))"
        />
        <text className="fill-[#4c483b] font-medium" style={{ fontFamily: "Pretendard, sans-serif", fontSize: "22px" }} transform="translate(401.51 388.72)">재난문자</text>
      </motion.g>

      {/* 알람 */}
      <motion.g 
        onClick={() => playSound("alarm", "/sound/sound/mobile_notification.mp3")}
        className="cursor-pointer"
        style={{ transformOrigin: "619.8px 293.45px" }}
        animate={{ y: [0, -5, 0] }}
        transition={{ 
          repeat: Infinity, 
          duration: 2.5, 
          ease: "easeInOut",
          delay: 0.2 
        }}
        whileHover={{ scale: 1.08, y: -8 }}
        whileTap={{ scale: 0.94, y: 1 }}
      >
        <image 
          href="/sound-img/sound-mobile-alarm-1.png" 
          x="555.9" 
          y="229.55" 
          width="127.8" 
          height="127.8" 
          filter="drop-shadow(0px 6px 10px rgba(76, 72, 59, 0.15))"
        />
        <text className="fill-[#4c483b] font-medium" style={{ fontFamily: "Pretendard, sans-serif", fontSize: "22px" }} transform="translate(600.77 388.72)">알람</text>
      </motion.g>

      {/* 문자 */}
      <motion.g 
        onClick={() => playSound("message", "/sound/sound/mobile_message.mp3")}
        className="cursor-pointer"
        style={{ transformOrigin: "800.03px 293.45px" }}
        animate={{ y: [0, -5, 0] }}
        transition={{ 
          repeat: Infinity, 
          duration: 2.5, 
          ease: "easeInOut",
          delay: 0.4 
        }}
        whileHover={{ scale: 1.08, y: -8 }}
        whileTap={{ scale: 0.94, y: 1 }}
      >
        <image 
          href="/sound-img/sound-mobile-message-1.png" 
          x="736.13" 
          y="229.55" 
          width="127.8" 
          height="127.8" 
          filter="drop-shadow(0px 6px 10px rgba(76, 72, 59, 0.15))"
        />
        <text className="fill-[#4c483b] font-medium" style={{ fontFamily: "Pretendard, sans-serif", fontSize: "22px" }} transform="translate(780.86 388.72)">문자</text>
      </motion.g>

      {/* 전화 */}
      <motion.g 
        onClick={() => playSound("call", "/sound/sound/mobile_ringtone.mp3")}
        className="cursor-pointer"
        style={{ transformOrigin: "980.27px 293.45px" }}
        animate={{ y: [0, -5, 0] }}
        transition={{ 
          repeat: Infinity, 
          duration: 2.5, 
          ease: "easeInOut",
          delay: 0.6 
        }}
        whileHover={{ scale: 1.08, y: -8 }}
        whileTap={{ scale: 0.94, y: 1 }}
      >
        <image 
          href="/sound-img/sound-mobile-call-1.png" 
          x="916.37" 
          y="229.55" 
          width="127.8" 
          height="127.8" 
          filter="drop-shadow(0px 6px 10px rgba(76, 72, 59, 0.15))"
        />
        <text className="fill-[#4c483b] font-medium" style={{ fontFamily: "Pretendard, sans-serif", fontSize: "22px" }} transform="translate(961.1 388.72)">전화</text>
      </motion.g>

      {/* Overlays when active */}
      {/* Call Screen Overlay */}
      {playingId === "call" && (
        <g>
          <path className="fill-[#4c483b]" d="M1100.71,1141.5H320V207.03c0-61.2,49.62-110.82,110.82-110.82h90.83c6.41,0,12.55,2.87,16.43,7.97,2.48,3.26,4.52,7.12,7.03,11.6,12.11,21.58,28.91,28.91,66.08,28.91h198.34c37.17,0,53.97-7.33,66.08-28.91,2.51-4.48,4.55-8.34,7.03-11.6,3.88-5.1,10.02-7.97,16.43-7.97h90.83c61.2,0,110.82,49.62,110.82,110.82v934.47Z"/>
          <text className="fill-[#FFF] font-medium" style={{ fontFamily: "Pretendard, sans-serif", fontSize: "65px" }} transform="translate(654.72 348.62)">율려</text>
          
          <g transform="translate(375.66, 858.56)">
            <rect ref={callTrackRef} fill="#FFF" x="0" y="0" width="668.51" height="132.32" rx="66.16" ry="66.16" />
            <motion.text 
              className="fill-[#4c483b] font-medium" 
              style={{ fontFamily: "Pretendard, sans-serif", fontSize: "42.87px", opacity: callTextOpacityLocal }} 
              transform="translate(224.38 84.03)"
            >
              밀어서 통화하기
            </motion.text>
            
            {/* Interactive Draggable Handle - Capture pointer event to prevent carousel swipe */}
            <motion.g
              ref={callHandleRef}
              style={{ x: callDragX }}
              className="cursor-grab active:cursor-grabbing"
            >
              <path fill="#4c483b" d="M66.16,122.32c-30.97,0-56.16-25.19-56.16-56.16S35.19,10,66.16,10h1.82c30.97,0,56.16,25.19,56.16,56.16s-25.19,56.16-56.16,56.16h-1.82Z" />
              <path fill="#FFF" d="M97.21,89.84c-1.49,1.51-2.77,3.04-4.37,4.27-3.62,2.78-8.24,3.53-12.79,3.04-8.88-.97-17.17-6.86-23.69-12.77-8.89-8.06-19.87-20.93-20.33-33.18-.15-4.01.65-8.05,3.18-11.19,1.19-1.47,2.61-2.73,3.97-4.05,1.44-1.39,3.8-1.13,5.18.24l11.92,11.92c1.21,1.27,1.68,3.51.39,4.83l-5.16,5.28c3.94,8.56,10.65,15.79,19.41,19.37l5.38-5.25c1.26-1.23,3.49-.62,4.68.45l12.03,12.04c1.33,1.33,1.6,3.6.21,5.01Z" />
            </motion.g>
          </g>
        </g>
      )}

      {/* Alarm Stop Slider Overlay */}
      {playingId === "alarm" && (
        <g>
          {/* Static full screen dark brown overlay */}
          <path className="fill-[#4c483b]" d="M1100.71,1141.5H320V207.03c0-61.2,49.62-110.82,110.82-110.82h90.83c6.41,0,12.55,2.87,16.43,7.97,2.48,3.26,4.52,7.12,7.03,11.6,12.11,21.58,28.91,28.91,66.08,28.91h198.34c37.17,0,53.97-7.33,66.08-28.91,2.51-4.48,4.55-8.34,7.03-11.6,3.88-5.1,10.02-7.97,16.43-7.97h90.83c61.2,0,110.82,49.62,110.82,110.82v934.47Z"/>
          <text className="fill-[#FFF] font-medium" style={{ fontFamily: "Pretendard, sans-serif", fontSize: "65px" }} transform="translate(654.72 348.62)">율려</text>
          
          <g transform="translate(375.66, 858.56)">
            <rect ref={alarmTrackRef} fill="#4c483b" stroke="#FFF" strokeWidth="2px" x="0" y="0" width="668.51" height="132.32" rx="66.16" ry="66.16" />
            <motion.text 
              className="fill-[#FFF] font-medium" 
              style={{ fontFamily: "Pretendard, sans-serif", fontSize: "42.87px", opacity: alarmTextOpacityLocal }} 
              transform="translate(261.08 84.03)"
            >
              밀어서 중단
            </motion.text>
            
            {/* Interactive Draggable Handle - Capture pointer event to prevent carousel swipe */}
            <motion.g
              ref={alarmHandleRef}
              style={{ x: alarmDragX }}
              className="cursor-grab active:cursor-grabbing"
            >
              <path fill="#FFF" d="M66.16,122.32c-30.97,0-56.16-25.19-56.16-56.16S35.19,10,66.16,10h1.82c30.97,0,56.16,25.19,56.16,56.16s-25.19,56.16-56.16,56.16h-1.82Z" />
              <rect fill="#4c483b" x="45.5" y="44.59" width="43.13" height="43.13" rx="1" ry="1" />
            </motion.g>
          </g>
        </g>
      )}

      {/* Message Notification Banner Overlay */}
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

      {/* Emergency Alert Notification Banner Overlay */}
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
  );
}
