"use client";

import { useRef, useEffect, useState } from "react";
import { motion, MotionValue, animate, useTransform, AnimatePresence } from "framer-motion";
import { Bell, MessageSquare, Phone, AlertTriangle } from "lucide-react";

interface MobileDeviceProps {
  playingId: string | null;
  playSound: (id: string, url: string) => void;
  stopSound: () => void;
  callDragX: MotionValue<number>;
  alarmDragX: MotionValue<number>;
}

const BUTTONS = [
  { id: "emergency", label: "재난문자", url: "/sound/sound/mobile_emergency_alert.mp3", delay: 0, Icon: AlertTriangle },
  { id: "alarm", label: "알람", url: "/sound/sound/mobile_notification.mp3", delay: 0.2, Icon: Bell },
  { id: "message", label: "문자", url: "/sound/sound/mobile_message.mp3", delay: 0.4, Icon: MessageSquare },
  { id: "call", label: "전화", url: "/sound/sound/mobile_ringtone.mp3", delay: 0.6, Icon: Phone },
] as const;

const HANDLE_SIZE = 52;

export default function MobileDevice({
  playingId,
  playSound,
  stopSound,
  callDragX,
  alarmDragX,
}: MobileDeviceProps) {
  const [trackWidth, setTrackWidth] = useState(180);
  const callTrackRef = useRef<HTMLDivElement>(null);
  const alarmTrackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const measure = () => {
      const el = callTrackRef.current ?? alarmTrackRef.current;
      if (el) {
        const w = el.getBoundingClientRect().width;
        if (w > 0) setTrackWidth(w);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [playingId]);

  const maxDrag = Math.max(0, trackWidth - HANDLE_SIZE - 16);

  const callTextOpacity = useTransform(callDragX, [0, maxDrag * 0.6], [1, 0]);
  const alarmTextOpacity = useTransform(alarmDragX, [0, maxDrag * 0.6], [1, 0]);

  const handleSliderEnd = (val: MotionValue<number>) => {
    if (val.get() > maxDrag * 0.75) {
      animate(val, maxDrag, { type: "spring", stiffness: 300, damping: 30 }).then(() => {
        stopSound();
      });
    } else {
      animate(val, 0, { type: "spring", stiffness: 300, damping: 30 });
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      {/* Phone Shell */}
      <div
        className="relative overflow-hidden"
        style={{
          width: "min(300px, 85%)",
          aspectRatio: "9 / 18",
          borderRadius: "36px",
          background: "rgba(255,255,255,0.12)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1.5px solid rgba(76,72,59,0.18)",
          boxShadow: "0 8px 40px rgba(76,72,59,0.10)",
        }}
      >
        {/* Notch - halved height */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 z-10"
          style={{
            width: "38%",
            height: "16px",
            borderRadius: "0 0 12px 12px",
            background: "var(--background, #f5f3ef)",
            borderBottom: "1.5px solid rgba(76,72,59,0.12)",
            borderLeft: "1.5px solid rgba(76,72,59,0.12)",
            borderRight: "1.5px solid rgba(76,72,59,0.12)",
          }}
        />

        {/* Screen content */}
        <div className="absolute inset-0 pt-7 px-3.5 pb-4 flex flex-col">
          {/* 4 App Buttons */}
          <div className="grid grid-cols-4" style={{ gap: "8px", paddingTop: "38px" }}>
            {BUTTONS.map(({ id, label, url, delay, Icon }) => {
              const isActive = playingId === id;
              return (
                <motion.div
                  key={id}
                  onClick={() => playSound(id, url)}
                  className="flex flex-col items-center cursor-pointer"
                  style={{ gap: "6px" }}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                >
                  {/* Icon tile — matches instrument page button style */}
                  <div
                    className="w-full aspect-square flex items-center justify-center"
                    style={{
                      borderRadius: "26%",
                      transition: "background 0.5s, box-shadow 0.5s",
                      backdropFilter: isActive ? undefined : "blur(8px)",
                      WebkitBackdropFilter: isActive ? undefined : "blur(8px)",
                      background: isActive
                        ? "rgba(0, 0, 0, 0.3)"
                        : "rgba(255, 255, 255, 0.30)",
                      boxShadow: isActive
                        ? "inset 0 6px 10px rgba(255,255,255,1.0), inset 0 2px 4px rgba(255,255,255,0.8), inset 0 -3px 8px rgba(255,255,255,0.65), 0 0 16px rgba(0,0,0,0.7)"
                        : "0 4px 12px rgba(76,72,59,0.22)",
                    }}
                  >
                    <Icon size={24} color={isActive ? "white" : "#4c483b"} strokeWidth={1.8} />
                  </div>
                  {/* Label */}
                  <span
                    style={{
                      fontSize: "clamp(7px, 1.9vw, 10px)",
                      color: "#4c483b",
                      fontFamily: "Pretendard, sans-serif",
                      fontWeight: 400,
                      textAlign: "center",
                      lineHeight: 1,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* === OVERLAYS === */}

        {/* Call overlay */}
        <AnimatePresence>
          {playingId === "call" && (
            <motion.div
              key="call-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-between"
              style={{
                padding: "50px 8% 8%",
                background: "#4c483b",
              }}
            >
              <p style={{ color: "white", fontSize: "clamp(16px, 4.5vw, 26px)", fontFamily: "Pretendard, sans-serif", fontWeight: 500 }}>
                율려
              </p>
              {/* Slide-to-answer track */}
              <div
                ref={callTrackRef}
                className="relative w-full flex items-center"
                style={{ height: `${HANDLE_SIZE + 8}px`, borderRadius: "999px", background: "rgba(255,255,255,0.28)", padding: "4px" }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <motion.div
                  drag="x"
                  dragConstraints={{ left: 0, right: maxDrag }}
                  dragElastic={0}
                  dragMomentum={false}
                  style={{ x: callDragX, width: `${HANDLE_SIZE}px`, height: `${HANDLE_SIZE}px`, borderRadius: "50%", background: "#4c483b", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, touchAction: "none" }}
                  onDragEnd={() => handleSliderEnd(callDragX)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <Phone size={18} color="white" fill="white" strokeWidth={0} />
                </motion.div>
                <motion.span
                  className="absolute left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap"
                  style={{ opacity: callTextOpacity, color: "rgba(76,72,59,0.85)", fontSize: "clamp(9px, 2.5vw, 13px)", fontFamily: "Pretendard, sans-serif", fontWeight: 500 }}
                >
                  밀어서 통화하기
                </motion.span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Alarm overlay */}
        <AnimatePresence>
          {playingId === "alarm" && (
            <motion.div
              key="alarm-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col items-center justify-between"
              style={{
                padding: "50px 8% 8%",
                background: "#4c483b",
              }}
            >
              <p style={{ color: "white", fontSize: "clamp(16px, 4.5vw, 26px)", fontFamily: "Pretendard, sans-serif", fontWeight: 500 }}>
                율려
              </p>
              {/* Slide-to-stop track */}
              <div
                ref={alarmTrackRef}
                className="relative w-full flex items-center"
                style={{ height: `${HANDLE_SIZE + 8}px`, borderRadius: "999px", background: "rgba(76,72,59,0.35)", border: "1.5px solid rgba(255,255,255,0.22)", padding: "4px" }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <motion.div
                  drag="x"
                  dragConstraints={{ left: 0, right: maxDrag }}
                  dragElastic={0}
                  dragMomentum={false}
                  style={{ x: alarmDragX, width: `${HANDLE_SIZE}px`, height: `${HANDLE_SIZE}px`, borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, touchAction: "none" }}
                  onDragEnd={() => handleSliderEnd(alarmDragX)}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <div style={{ width: 14, height: 14, background: "#4c483b", borderRadius: 2 }} />
                </motion.div>
                <motion.span
                  className="absolute left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap"
                  style={{ opacity: alarmTextOpacity, color: "white", fontSize: "clamp(9px, 2.5vw, 13px)", fontFamily: "Pretendard, sans-serif", fontWeight: 500 }}
                >
                  밀어서 중단
                </motion.span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message banner */}
        <AnimatePresence>
          {playingId === "message" && (
            <motion.div
              key="message-banner"
              initial={{ y: -140, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -140, opacity: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              onClick={stopSound}
              className="absolute top-[20px] left-2 right-2 z-20 cursor-pointer"
              style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", borderRadius: "12px", padding: "7px 10px", boxShadow: "0 4px 20px rgba(76,72,59,0.15)" }}
            >
              <div className="flex items-center gap-2">
                <div style={{ width: 22, height: 22, borderRadius: 6, background: "rgba(76,72,59,0.85)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <MessageSquare size={11} color="white" strokeWidth={1.8} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: "#4c483b", fontFamily: "Pretendard, sans-serif" }}>율려</span>
              </div>
              <p style={{ fontSize: 9, color: "#4c483b", fontFamily: "Pretendard, sans-serif", lineHeight: 1.4, paddingLeft: "2px", marginTop: "3px" }}>
                새로운 메시지가 도착했습니다
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Emergency banner */}
        <AnimatePresence>
          {playingId === "emergency" && (
            <motion.div
              key="emergency-banner"
              initial={{ y: -140, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -140, opacity: 0 }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              onClick={stopSound}
              className="absolute top-[20px] left-2 right-2 z-20 cursor-pointer"
              style={{ background: "#4c483b", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", borderRadius: "12px", padding: "7px 10px", boxShadow: "0 4px 20px rgba(76,72,59,0.25)" }}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle size={12} color="white" strokeWidth={2} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "white", fontFamily: "Pretendard, sans-serif" }}>재난문자</span>
              </div>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.9)", fontFamily: "Pretendard, sans-serif", lineHeight: 1.4, paddingLeft: "2px", marginTop: "3px" }}>
                [안전안내문자] 율려 재난 알림
              </p>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
