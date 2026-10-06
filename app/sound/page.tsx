"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";

// 사운드 아이템 타입 및 메타데이터 정의
export interface SoundItem {
  id: string;
  name: string;
  audio: string;
  title: string;
  instrument: string;
  description: string;
  brandColor100: string; // 100% 선명한 고유 브랜드 색상
  glowColor: string;     // 은은한 배경 발광 그림자 색상
}

export const SOUND_ITEMS: SoundItem[] = [
  {
    id: "message",
    name: "문자 알림",
    audio: "/sound/sound/mobile_message.mp3",
    title: "문자\n알림",
    instrument: "좌고",
    description: "새로운 메시지가 도착했습니다",
    brandColor100: "#D09C9C", // 가죽색 (Leather)
    glowColor: "rgba(208, 156, 156, 0.50)",
  },
  {
    id: "call",
    name: "전화 벨소리",
    audio: "/sound/sound/mobile_ringtone.mp3",
    title: "전화\n벨소리",
    instrument: "장구 • 거문고 • 대금",
    description: "전화 왔어요, 받아보세요",
    brandColor100: "#ECC850", // 노란색 (Silk)
    glowColor: "rgba(236, 200, 80, 0.50)",
  },
  {
    id: "alarm",
    name: "기상 알람",
    audio: "/sound/sound/mobile_notification.mp3",
    title: "기상\n알람",
    instrument: "가야금 • 해금 • 대금",
    description: "오늘 하루를 시작할 시간입니다",
    brandColor100: "#A9B08C", // 초록색 (Bamboo)
    glowColor: "rgba(169, 176, 140, 0.50)",
  },
  {
    id: "emergency",
    name: "재난문자",
    audio: "/sound/sound/mobile_emergency_alert.mp3",
    title: "재난\n문자",
    instrument: "북 • 박",
    description: "긴급 재난 상황을 알려드립니다",
    brandColor100: "#AA8657", // 나무색 (Wood)
    glowColor: "rgba(170, 134, 87, 0.50)",
  },
  {
    id: "intercom",
    name: "현관 초인종",
    audio: "/sound/sound/home_ring.mp3",
    title: "현관\n초인종",
    instrument: "편경",
    description: "딩동, 손님이 찾아왔습니다",
    brandColor100: "#8F93A9", // 편경색 (Rock)
    glowColor: "rgba(143, 147, 169, 0.50)",
  },
  {
    id: "card",
    name: "교통카드",
    audio: "/sound/sound/transit_card.mp3",
    title: "교통카드\n태그",
    instrument: "편종",
    description: "승차/하차가 처리되었습니다",
    brandColor100: "#BDCCD2", // 편종색 (Metal)
    glowColor: "rgba(189, 204, 210, 0.55)",
  },
  {
    id: "stop",
    name: "버스 하차벨",
    audio: "/sound/sound/traffic_stop_bell.mp3",
    title: "버스\n하차벨",
    instrument: "피리",
    description: "기사님 저 내릴게요",
    brandColor100: "#A9B08C", // 초록색 (Bamboo)
    glowColor: "rgba(169, 176, 140, 0.50)",
  },
  {
    id: "blinker",
    name: "보행자 신호등",
    audio: "/sound/sound/traffic_crosswalk_signal.mp3",
    title: "보행자\n신호음",
    instrument: "가야금",
    description: "초록불이 켜졌습니다",
    brandColor100: "#ECC850", // 노란색 (Silk)
    glowColor: "rgba(236, 200, 80, 0.50)",
  },
  {
    id: "tv",
    name: "TV",
    audio: "/sound/sound/home_tv_on.mp3",
    title: "TV 켜짐\n소리",
    instrument: "거문고",
    description: "텔레비전 전원이 켜졌습니다",
    brandColor100: "#ECC850", // 노란색 (Silk)
    glowColor: "rgba(236, 200, 80, 0.50)",
  },
  {
    id: "washing",
    name: "세탁기",
    audio: "/sound/sound/home_washing_machine.mp3",
    title: "세탁 완료\n알림음",
    instrument: "대금 • 가야금",
    description: "세탁 코스가 모두 완료되었습니다",
    brandColor100: "#A9B08C", // 초록색 (Bamboo)
    glowColor: "rgba(169, 176, 140, 0.50)",
  },
];

// 각 아이콘별 SVG 렌더러 컴포넌트 (메모이제이션 적용)
const DynamicSoundIcon = memo(function DynamicSoundIcon({
  id,
  isSelected,
  brandColor100,
}: {
  id: string;
  isSelected: boolean;
  brandColor100: string;
}) {
  const fill = isSelected ? brandColor100 : "#3f3a2e";

  switch (id) {
    case "message":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect fill={fill} x="10" y="10" width="80" height="80" rx="20" ry="20" />
          <path fill="#fff" d="M30 32h40c3.3 0 6 2.7 6 6v22c0 3.3-2.7 6-6 6H44l-12 10V66h-2c-3.3 0-6-2.7-6-6V38c0-3.3 2.7-6 6-6z" />
        </svg>
      );
    case "call":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect fill={fill} x="10" y="10" width="80" height="80" rx="20" ry="20" />
          <path
            fill="#fff"
            d="M60.5 54.5c-2.3 0-4.5-.4-6.6-1.1-1.3-.4-2.7-.1-3.7.9l-4 4c-5.4-2.8-9.8-7.2-12.6-12.6l4-4c1-.9 1.3-2.4.9-3.7-.7-2.1-1.1-4.3-1.1-6.6 0-1.7-1.4-3-3-3h-7.6c-1.7 0-3 1.4-3 3 0 21.8 17.7 39.5 39.5 39.5 1.7 0 3-1.4 3-3v-7.4c0-1.7-1.3-3-2.9-3z"
          />
        </svg>
      );
    case "alarm":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect fill={fill} x="10" y="10" width="80" height="80" rx="20" ry="20" />
          <path fill="#fff" d="M50 28c-1.7 0-3 1.3-3 3v1.1C41.3 33.6 37 38.8 37 45v11l-4 4v3h34v-3l-4-4V45c0-6.2-4.3-11.4-10-12.9V31c0-1.7-1.3-3-3-3zm-6 38c0 3.3 2.7 6 6 6s6-2.7 6-6h-12z" />
        </svg>
      );
    case "emergency":
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <rect fill={fill} x="10" y="10" width="80" height="80" rx="20" ry="20" />
          <path fill="#fff" d="M30 32h40c3.3 0 6 2.7 6 6v22c0 3.3-2.7 6-6 6H44l-12 10V66h-2c-3.3 0-6-2.7-6-6V38c0-3.3 2.7-6 6-6z" />
          <path fill={fill} d="M50 40c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2s2-.9 2-2v-8c0-1.1-.9-2-2-2zm0 15c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      );
    case "intercom":
      return (
        <svg viewBox="0 0 128.81 177.45" className="w-full h-full">
          <rect fill={fill} width="128.81" height="177.45" rx="4.9" ry="4.9" />
          <rect fill="#fff" x="9.87" y="10.72" width="109.07" height="77.07" rx="2.47" ry="2.47" />
          <circle fill="#fff" cx="64.41" cy="150.38" r="16.19" />
        </svg>
      );
    case "card":
      return (
        <svg viewBox="0 0 159.71 121.86" className="w-full h-full">
          <path fill={fill} d="M144.84,0H14.87C6.66,0,0,6.66,0,14.87v63.35c0,8.21,6.66,14.87,14.87,14.87h49.62v28.78h30.74v-28.78h49.62c8.21,0,14.87-6.66,14.87-14.87V14.87c0-8.21-6.66-14.87-14.87-14.87ZM152.71,78.22c0,4.34-3.53,7.87-7.87,7.87H14.87c-4.34,0-7.87-3.53-7.87-7.87V14.87c0-4.34,3.53-7.87,7.87-7.87h129.97c4.34,0,7.87,3.53,7.87,7.87v63.35Z" />
          <path fill={fill} d="M102.39,30.37l-.71-2.74c-.45-1.71-2.19-2.74-3.9-2.29l-43.74,11.4c-1.71.45-2.74,2.19-2.29,3.9l.71,2.74,49.93-13.01Z" />
          <path fill={fill} d="M53.82,48.6l4.22,16.2c.45,1.71,2.19,2.74,3.9,2.29l43.74-11.4c1.71-.45,2.74-2.19,2.29-3.9l-4.22-16.2-49.93,13.01Z" />
        </svg>
      );
    case "stop":
      return (
        <svg viewBox="0 0 487.94 493.04" className="w-full h-full">
          <circle fill={fill} cx="243.97" cy="246.52" r="189.87" />
          <g>
            <path fill="#fff" d="M164.94,297.58c-19.96,0-23.11-13.67-23.11-30.35h13.95c0,10.25.41,19.69,9.02,19.69,6.84,0,9.16-5.33,9.16-13.94,0-4.92-1.09-9.43-6.84-14.9l-12.71-12.03c-9.57-9.02-11.62-15.18-11.62-26.8,0-15.72,8.61-23.79,22.97-23.79,18.73,0,22.15,12.85,22.15,28.3h-13.67c0-12.03-1.78-17.64-8.75-17.64-6.56,0-9.02,4.65-9.02,13.12,0,6.15,1.37,10.39,7.79,16.82l15.45,15.31c6.43,6.29,8.2,12.58,8.2,21.74,0,14.63-5.74,24.47-22.97,24.47Z"/>
            <path fill="#fff" d="M220.59,208.58v87.36h-13.67v-87.36h-16.41v-11.48h46.48v11.48h-16.41Z"/>
            <path fill="#fff" d="M263.93,297.58c-24.47,0-24.47-19.41-24.47-51.54,0-26.93.27-50.58,24.75-50.58s24.2,20.37,24.2,50.58c0,32.26,0,51.54-24.47,51.54ZM263.93,206.12c-10.25,0-10.25,16.13-10.25,39.92,0,28.57,0,40.88,10.25,40.88s10.25-14.77,10.25-40.88-.14-39.92-10.25-39.92Z"/>
            <path fill="#fff" d="M322.99,252.88h-10.53v43.06h-13.67v-98.84h24.06c16.27,0,23.24,6.56,23.24,28.16s-5.74,27.62-23.11,27.62ZM321.49,208.58h-9.02v32.81h9.16c7.93,0,10.53-4.38,10.53-16.13,0-13.94-3.56-16.68-10.67-16.68Z"/>
          </g>
        </svg>
      );
    case "blinker":
      return (
        <svg viewBox="0 0 144.79 289.59" className="w-full h-full">
          <path fill={fill} d="M144.79,135.48V9.31c0-5.14-4.17-9.31-9.31-9.31H9.31C4.17,0,0,4.17,0,9.31v126.18c0,5.14,4.17,9.31,9.31,9.31-5.14,0-9.31,4.17-9.31,9.31v126.18c0,5.14,4.17,9.31,9.31,9.31h126.18c5.14,0,9.31-4.17,9.31-9.31v-126.18c0-5.14-4.17-9.31-9.31-9.31,5.14,0,9.31-4.17,9.31-9.31Z" />
          <path fill={fill} stroke="#fff" strokeMiterlimit="10" d="M24.6,8.8h100.8c7.33,0,13.28,5.95,13.28,13.28v95.42c0,8.63-7.01,15.63-15.63,15.63H26.95c-8.63,0-15.63-7.01-15.63-15.63V22.09c0-7.33,5.95-13.28,13.28-13.28Z" />
          <path fill="#fff" d="M119.33,14.19H30.67c-4.83,0-8.84,3.71-9.22,8.51l-7.55,96.15c-.6,7.71,5.5,14.29,13.24,14.29h95.71c7.74,0,13.85-6.59,13.24-14.29l-7.55-96.15c-.38-4.8-4.39-8.51-9.22-8.51Z" />
          <path fill={fill} stroke="#fff" strokeMiterlimit="10" d="M24.6,153.45h100.8c7.33,0,13.28,5.95,13.28,13.28v95.42c0,8.63-7.01,15.63-15.63,15.63H26.95c-8.63,0-15.63-7.01-15.63-15.63v-95.42c0-7.33,5.95-13.28,13.28-13.28Z" />
          <path fill="#fff" d="M119.33,158.84H30.67c-4.83,0-8.84,3.71-9.22,8.51l-7.55,96.15c-.6,7.71,5.5,14.29,13.24,14.29h95.71c7.74,0,13.85-6.59,13.24-14.29l-7.55-96.15c-.38-4.8-4.39-8.51-9.22-8.51Z" />
          <path fill={fill} d="M86.16,76.03l1-26.16c0-2.51-2.03-4.54-4.54-4.54h-15.24c-2.51,0-4.54,2.03-4.54,4.54l1,26.16-3.19,44.01h8.74l5.62-37.5,5.62,37.5h8.74l-3.19-44.01Z" />
          <circle fill={fill} cx="75" cy="33.03" r="9.98" />
        </svg>
      );
    case "tv":
      return (
        <svg viewBox="0 0 366.61 212.62" className="w-full h-full">
          <rect fill={fill} x="76.99" y="-76.99" width="212.62" height="366.61" rx="5.47" ry="5.47" transform="translate(76.99 289.62) rotate(-90)" />
          <rect fill={fill} stroke="#fff" strokeWidth="6" strokeMiterlimit="10" x="86.99" y="-66.99" width="192.62" height="346.61" transform="translate(289.62 -76.99) rotate(90)" />
        </svg>
      );
    case "washing":
      return (
        <svg viewBox="0 0 252.44 337.77" className="w-full h-full">
          <rect fill={fill} width="252.44" height="337.77" rx="5.72" ry="5.72" />
          <circle fill={fill} stroke="#fff" strokeWidth="4" strokeMiterlimit="10" cx="126.22" cy="208.65" r="104.99" />
          <circle fill="#fff" cx="126.22" cy="208.65" r="86.63" />
          <line stroke="#fff" strokeWidth="3" strokeMiterlimit="10" strokeLinecap="round" x1="8.73" y1="38.64" x2="243.71" y2="38.64" />
          <circle fill="#fff" cx="231.21" cy="19.19" r="11.14" />
          <circle fill="#fff" cx="204.86" cy="19.19" r="4.74" />
          <circle fill="#fff" cx="192.43" cy="19.19" r="4.74" />
          <rect fill="#fff" x="8.73" y="42.87" width="18.94" height="11.33" rx=".72" ry=".72" />
        </svg>
      );
    default:
      return null;
  }
});

// 무한 루프 스크롤을 위한 5벌 복제 배열 생성
const REPEAT_COUNT = 5;
const INFINITE_SOUND_ITEMS = Array.from({ length: REPEAT_COUNT }, (_, setIndex) =>
  SOUND_ITEMS.map((item, itemIndex) => ({
    ...item,
    uniqueKey: `${item.id}-${setIndex}-${itemIndex}`,
    originalIndex: itemIndex,
  }))
).flat();

export default function SoundPage() {
  // 기본 선택 아이템: 버스 하차벨
  const [selectedId, setSelectedId] = useState<string>("stop");
  const selectedItem = SOUND_ITEMS.find((item) => item.id === selectedId) || SOUND_ITEMS[6];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // 사운드 재생 및 중앙 정렬 스크롤 핸들러
  const handleSelect = useCallback((item: SoundItem, elementKey?: string) => {
    setSelectedId(item.id);

    // 사운드 재생
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = item.audio;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }

    // 대상 요소 중앙 스크롤
    const targetKey = elementKey || `${item.id}-2-${SOUND_ITEMS.findIndex((i) => i.id === item.id)}`;
    const targetEl = itemRefs.current.get(targetKey);
    const container = scrollContainerRef.current;

    if (targetEl && container) {
      const containerWidth = container.offsetWidth;
      const targetLeft = targetEl.offsetLeft;
      const targetWidth = targetEl.offsetWidth;
      const scrollPos = targetLeft - containerWidth / 2 + targetWidth / 2;

      container.scrollTo({
        left: scrollPos,
        behavior: "smooth",
      });
    }
  }, []);

  // Audio 객체 초기화 및 정리
  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, []);

  // 초기 마운트 시 중앙 세트의 기본 선택 아이템을 화면 정중앙에 위치
  useEffect(() => {
    const timer = setTimeout(() => {
      const targetKey = `stop-2-6`;
      const targetEl = itemRefs.current.get(targetKey);
      const container = scrollContainerRef.current;
      if (targetEl && container) {
        const containerWidth = container.offsetWidth;
        const targetLeft = targetEl.offsetLeft;
        const targetWidth = targetEl.offsetWidth;
        container.scrollLeft = targetLeft - containerWidth / 2 + targetWidth / 2;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // 무한 루프 스크롤 경계 보정
  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const singleSetWidth = container.scrollWidth / REPEAT_COUNT;
    const currentScrollLeft = container.scrollLeft;

    if (currentScrollLeft < singleSetWidth * 0.8) {
      container.scrollLeft = currentScrollLeft + singleSetWidth * 2;
    } else if (currentScrollLeft > singleSetWidth * 3.2) {
      container.scrollLeft = currentScrollLeft - singleSetWidth * 2;
    }
  }, []);

  return (
    <div className="flex flex-col min-h-[100dvh] pt-14 md:pt-18 lg:pt-20 pb-4 dynamic-bottom-padding px-4 md:px-8 lg:px-12 bg-background relative overflow-hidden select-none justify-between">
      
      {/* 상단 메인 콘텐츠 영역: [왼쪽 4:3 사각형 (2)] : [오른쪽 설명 구역 (1)] */}
      <div className="flex-grow flex flex-col items-center justify-center w-full max-w-[1180px] mx-auto py-2">
        <div className="w-full flex flex-col md:flex-row items-stretch justify-center gap-[3%]">
          
          {/* 왼쪽 검은 사각형 (2 비율, 4:3 종횡비) */}
          <div className="flex-[2] aspect-[4/3] bg-[#37332b] shrink-0 rounded-none shadow-sm relative overflow-hidden">
            {/* 가로형 이미지는 추후 전달 시 삽입 */}
          </div>

          {/* 오른쪽 텍스트 및 선 영역 (1 비율, 콤팩트한 단정 세로 간격) */}
          <div className="flex-[1] flex flex-col justify-between min-w-[240px] mt-4 md:mt-0">
            <div className="flex flex-col">
              {/* 1번 선 */}
              <div className="w-full bg-[#37332b]/40" style={{ height: "0.3px" }} />

              {/* 제목 + 서브카피 */}
              <div className="w-full flex justify-between items-start pt-[14px] pb-[14px] md:pt-[18px] md:pb-[18px]">
                <AnimatePresence mode="wait">
                  <motion.h2 
                    key={selectedItem.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-[clamp(24px,2.4vw,34px)] font-black text-[#37332b] leading-[1.10] whitespace-pre-line tracking-tight"
                    style={{ 
                      fontFamily: "'onul-heukdan', 'Batang', 'Nanum Myeongjo', serif",
                      fontWeight: 900,
                      WebkitTextStroke: "0.4px #37332b"
                    }}
                  >
                    {selectedItem.title}
                  </motion.h2>
                </AnimatePresence>

                <span 
                  className="text-[clamp(10px,0.85vw,12px)] font-medium text-[#37332b] tracking-tight pt-[2px] whitespace-nowrap pl-2 font-sans"
                >
                  일상의 소리를 국악으로
                </span>
              </div>

              {/* 2번 선 */}
              <div className="w-full bg-[#37332b]/40" style={{ height: "0.3px" }} />

              {/* 악기 이름 */}
              <div className="w-full h-[36px] md:h-[40px] flex items-center">
                <AnimatePresence mode="wait">
                  <motion.span 
                    key={selectedItem.id}
                    initial={{ opacity: 0, x: 4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-[clamp(11px,0.9vw,13px)] text-[#37332b] tracking-tight font-semibold font-sans"
                  >
                    {selectedItem.instrument}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* 3번 선 */}
              <div className="w-full bg-[#37332b]/40" style={{ height: "0.3px" }} />

              {/* 본문 설명 */}
              <div className="w-full h-[36px] md:h-[40px] flex items-center">
                <AnimatePresence mode="wait">
                  <motion.span 
                    key={selectedItem.id}
                    initial={{ opacity: 0, x: 4 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -4 }}
                    transition={{ duration: 0.2 }}
                    className="text-[clamp(11px,0.9vw,13px)] text-[#37332b]/85 tracking-tight font-light font-sans"
                  >
                    {selectedItem.description}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* 4번 선 */}
              <div className="w-full bg-[#37332b]/40" style={{ height: "0.3px" }} />
            </div>

            {/* 하단 끝 얇은 선 (왼쪽 사각형 바닥 라인 정렬) */}
            <div className="w-full bg-[#37332b]/20 mt-auto" style={{ height: "0.3px" }} />
          </div>

        </div>
      </div>

      {/* 하단 아이콘 무한 스크롤 구역 */}
      <div className="w-full relative mt-auto" style={{ marginTop: "clamp(24px, 5vh, 60px)" }}>
        {/* 좌우 화이트 그라디언트 페이드 */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-16 sm:w-24 md:w-36 lg:w-48 bg-gradient-to-r from-background via-background/80 to-transparent z-40" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-16 sm:w-24 md:w-36 lg:w-48 bg-gradient-to-l from-background via-background/80 to-transparent z-40" />

        {/* 무한 가로 스크롤 컨테이너 */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="w-full min-h-[220px] md:min-h-[260px] overflow-x-auto overflow-y-visible py-16 md:py-20 flex items-center scrollbar-none"
          style={{
            gap: "80px",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {INFINITE_SOUND_ITEMS.map((item) => {
            const isSelected = selectedId === item.id;

            return (
              <button
                key={item.uniqueKey}
                ref={(el) => {
                  if (el) itemRefs.current.set(item.uniqueKey, el);
                  else itemRefs.current.delete(item.uniqueKey);
                }}
                onPointerDown={() => handleSelect(item, item.uniqueKey)}
                onClick={() => handleSelect(item, item.uniqueKey)}
                aria-label={item.name}
                className={cn(
                  "w-[100px] h-[100px] shrink-0 flex items-center justify-center relative cursor-pointer select-none bg-transparent border-none outline-none transition-transform duration-300 ease-out",
                  isSelected
                    ? "scale-[2.0] opacity-100 z-30"
                    : "scale-100 opacity-20 hover:opacity-50 hover:scale-105 z-10"
                )}
              >
                {/* 4~8px 소프트 컬러 발광 그림자 */}
                <div 
                  className="relative w-[100px] h-[100px] flex items-center justify-center pointer-events-none transition-all duration-300"
                  style={{
                    filter: isSelected
                      ? `drop-shadow(0 0 4px ${item.glowColor}) drop-shadow(0 0 8px ${item.glowColor})`
                      : "none",
                  }}
                >
                  <DynamicSoundIcon
                    id={item.id}
                    isSelected={isSelected}
                    brandColor100={item.brandColor100}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
