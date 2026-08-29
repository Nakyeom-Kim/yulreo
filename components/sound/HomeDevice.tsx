"use client";

import { motion } from "framer-motion";

interface HomeDeviceProps {
  playingId: string | null;
  playSound: (id: string, url: string) => void;
}

export default function HomeDevice({ playingId, playSound }: HomeDeviceProps) {
  return (
    <svg 
      viewBox="177.15 50 1043.8 1030" 
      className="w-full h-full max-h-full object-contain pointer-events-auto"
    >
      {/* Shelves */}
      <rect stroke="rgba(76, 72, 59, 0.18)" strokeWidth={1.5} fill="rgba(255, 255, 255, 0.12)" x="248.85" y="555.77" width="934.43" height="15.54"/>
      <rect stroke="rgba(76, 72, 59, 0.18)" strokeWidth={1.5} fill="rgba(255, 255, 255, 0.12)" x="248.85" y="1007.45" width="934.43" height="15.54"/>

      {/* TV Stand Post & Details */}
      <g stroke="rgba(76, 72, 59, 0.18)" strokeWidth={1.5} fill="none">
        <rect fill="rgba(255, 255, 255, 0.12)" x="260.84" y="476.86" width="428.5" height="73.97"/>
        <rect x="269.16" y="484.24" width="200.55" height="59.21"/>
        <rect x="479.71" y="484.24" width="200.55" height="59.21"/>
        <line x1="368.51" y1="484.24" x2="368.51" y2="543.45"/>
        <line x1="370.36" y1="484.24" x2="370.36" y2="543.45"/>
        <line x1="579.06" y1="484.24" x2="579.06" y2="543.45"/>
        <line x1="580.91" y1="484.24" x2="580.91" y2="543.45"/>
      </g>

      {/* Laundry Basket */}
      <g stroke="rgba(76, 72, 59, 0.18)" strokeWidth={1.5} fill="none">
        <polygon points="732.33 858.08 862.33 858.08 847.86 999.1 746.8 999.1 732.33 858.08"/>
        <line x1="745.14" y1="982.92" x2="849.52" y2="982.92"/>
        <line x1="743.37" y1="965.65" x2="851.29" y2="965.65"/>
        <line x1="741.47" y1="947.16" x2="853.19" y2="947.16"/>
        <line x1="739.43" y1="927.33" x2="855.22" y2="927.33"/>
        <line x1="737.24" y1="905.99" x2="857.41" y2="905.99"/>
        <line x1="734.88" y1="882.98" x2="859.77" y2="882.98"/>
        <line x1="843.76" y1="858.08" x2="833.42" y2="999.1"/>
        <line x1="825.19" y1="858.08" x2="818.98" y2="999.1"/>
        <line x1="806.61" y1="858.08" x2="804.55" y2="999.1"/>
        <line x1="788.04" y1="858.08" x2="790.11" y2="999.1"/>
        <line x1="769.47" y1="858.08" x2="775.67" y2="999.1"/>
        <line x1="750.9" y1="858.08" x2="761.24" y2="999.1"/>
        <path stroke="rgba(76, 72, 59, 0.18)" strokeWidth={1.5} fill="rgba(255, 255, 255, 0.12)" d="M740.03,858.08l50.56-22.83c9.83-4.44,21.31-2.96,29.7,3.83l23.47,19h-103.73Z"/>
      </g>

      {/* Intercom Button */}
      <g transform="translate(268.4, 602.94)">
        {playingId === "intercom" ? (
          <g style={{ filter: "drop-shadow(0px 4px 14px rgba(76, 72, 59, 0.25))" }}>
            <rect fill="#4c483b" width="128.81" height="177.45" rx="4.9" ry="4.9"/>
            <rect fill="#ffffff" x="9.87" y="10.72" width="109.07" height="77.07" rx="2.47" ry="2.47"/>
            <circle fill="#ffffff" cx="64.41" cy="150.38" r="16.19"/>
            <circle fill="#4c483b" cx="64.41" cy="37.36" r="18.49"/>
            <path fill="#4c483b" d="M52.81,57.11h23.19c6.75,0,12.24,5.48,12.24,12.24v16.75h-47.66v-16.75c0-6.75,5.48-12.24,12.24-12.24Z"/>
          </g>
        ) : (
          <motion.g 
            onClick={() => playSound("intercom", "/sound/sound/home_ring.mp3")}
            className="cursor-pointer"
            style={{ transformOrigin: "64.4px 88.7px" }}
            initial={{ filter: "drop-shadow(0px 4px 14px rgba(76, 72, 59, 0.25))" }}
            whileHover={{ scale: 1.08, filter: "drop-shadow(0px 14px 28px rgba(76, 72, 59, 0.38))" }}
            whileTap={{ scale: 0.94, filter: "drop-shadow(0px 2px 6px rgba(76, 72, 59, 0.20))" }}
          >
            <rect fill="#ffffff" width="128.81" height="177.45" rx="4.9" ry="4.9"/>
            <rect fill="rgba(76, 72, 59, 0.08)" x="9.87" y="10.72" width="109.07" height="77.07" rx="2.47" ry="2.47"/>
            <circle fill="#4c483b" cx="64.41" cy="150.38" r="16.19"/>
          </motion.g>
        )}
      </g>

      {/* TV Button */}
      {playingId === "tv" ? (
        <motion.g 
          onClick={() => playSound("tv-off", "/sound/sound/home_tv_off.mp3")}
          className="cursor-pointer"
          style={{ transformOrigin: "475px 283px" }}
          initial={{ filter: "drop-shadow(0px 4px 14px rgba(76, 72, 59, 0.25))" }}
          whileHover={{ scale: 1.08, filter: "drop-shadow(0px 14px 28px rgba(76, 72, 59, 0.38))" }}
          whileTap={{ scale: 0.94, filter: "drop-shadow(0px 2px 6px rgba(76, 72, 59, 0.20))" }}
        >
          {/* TV 켜짐: 프레임 검정, 안쪽 화면 흰색 */}
          <rect fill="#4c483b" x="369.53" y="176.73" width="212.62" height="366.61" rx="5.47" ry="5.47" transform="translate(115.81 835.88) rotate(-90)"/>
          <rect fill="#ffffff" x="379.53" y="186.73" width="192.62" height="346.61" transform="translate(835.88 -115.81) rotate(90)"/>
        </motion.g>
      ) : (
        <motion.g 
          onClick={() => playSound("tv", "/sound/sound/home_tv_on.mp3")}
          className="cursor-pointer"
          style={{ transformOrigin: "475px 283px" }}
          initial={{ filter: "drop-shadow(0px 4px 14px rgba(76, 72, 59, 0.25))" }}
          whileHover={{ scale: 1.08, filter: "drop-shadow(0px 14px 28px rgba(76, 72, 59, 0.38))" }}
          whileTap={{ scale: 0.94, filter: "drop-shadow(0px 2px 6px rgba(76, 72, 59, 0.20))" }}
        >
          {/* TV 꺼짐: 프레임 흰색, 안쪽 화면 검정 */}
          <rect fill="#ffffff" x="369.53" y="176.73" width="212.62" height="366.61" rx="5.47" ry="5.47" transform="translate(115.81 835.88) rotate(-90)"/>
          <rect fill="#4c483b" x="379.53" y="186.73" width="192.62" height="346.61" transform="translate(835.88 -115.81) rotate(90)"/>
        </motion.g>
      )}

      {/* Washing Machine Button */}
      <g transform="translate(877.37, 661.33)">
        {playingId === "washer" ? (
          <g style={{ filter: "drop-shadow(0px 4px 14px rgba(76, 72, 59, 0.25))" }}>
            <rect fill="#4c483b" width="252.44" height="337.77" rx="5.72" ry="5.72"/>
            <circle fill="#ffffff" cx="126.22" cy="208.65" r="104.99"/>
            <line stroke="#ffffff" strokeLinecap="round" strokeMiterlimit={10} strokeWidth={1} x1="8.73" y1="38.64" x2="243.71" y2="38.64"/>
            <circle fill="#ffffff" cx="231.21" cy="19.19" r="11.14"/>
            <circle fill="#ffffff" cx="204.86" cy="19.19" r="4.74"/>
            <circle fill="#ffffff" cx="192.43" cy="19.19" r="4.74"/>
            <rect fill="#ffffff" x="8.73" y="42.87" width="18.94" height="11.33" rx=".72" ry=".72"/>
            
            <path fill="#ffffff" d="M105.53,272.31l35.34-41.11,57.94,24.75c8.88-13.6,14.04-29.84,14.04-47.29,0-47.84-38.78-86.63-86.63-86.63s-86.63,38.78-86.63,86.63c0,12.7,2.74,24.77,7.65,35.64l23.42-.22,34.87,28.23Z"/>
            <path fill="#ffffff" d="M91.87,288.2l13.66-15.89-34.87-28.23-23.42.22c8.87,19.62,24.84,35.34,44.63,43.9Z"/>
            <path fill="#ffffff" d="M140.87,231.19l-35.34,41.11-13.66,15.89c10.53,4.55,22.15,7.08,34.35,7.08,2.46,0,4.89-.11,7.3-.31,27.34-2.28,51.08-17.26,65.29-39.03l-57.94-24.75Z"/>
            <path fill="#4c483b" d="M91.73,287.75c-19.38-8.48-34.89-23.68-43.75-42.88,2.16-.24,9.05-.95,14.89-.95,3.58,0,6.15.26,7.62.77,9.7,3.38,31.43,24.87,34.35,27.79l-13.12,15.26Z"/>
            <path fill="#ffffff" d="M62.88,244.42c4.39,0,6.48.41,7.46.75,9.3,3.24,29.9,23.44,33.83,27.34l-12.57,14.63c-18.9-8.36-34.06-23.17-42.86-41.85,2.69-.28,8.86-.87,14.15-.87M62.88,244.42c-7.1,0-15.64,1.03-15.64,1.03,8.87,19.62,24.84,35.34,44.63,43.9l13.66-15.89s-24.28-24.54-34.87-28.23c-1.71-.6-4.6-.8-7.79-.8h0Z"/>
            <path fill="#4c483b" d="M126.22,294.94c-11.63,0-22.9-2.28-33.53-6.77l13.21-15.37c.27-.45,22.23-37.96,35.07-40.95.85-.2,1.82-.3,2.89-.3,15.93,0,50.08,21.98,54.24,24.7-14.67,22.2-38.2,36.18-64.64,38.39-2.44.2-4.88.31-7.26.31Z"/>
            <path fill="#ffffff" d="M143.87,232.04c15.34,0,47.92,20.69,53.55,24.35-6.94,10.35-16.2,19.22-26.85,25.68-11.37,6.9-23.86,10.96-37.13,12.07-2.43.2-4.86.31-7.22.31-11.33,0-22.32-2.18-32.7-6.47l12.77-14.85.06-.07.05-.08c.22-.38,22.07-37.7,34.7-40.64.81-.19,1.75-.29,2.77-.29M143.87,231.04c-1.09,0-2.09.1-3,.31-13.2,3.07-35.34,41.11-35.34,41.11l-13.66,15.89c10.53,4.55,22.15,7.08,34.35,7.08,2.46,0,4.89-.11,7.3-.31,27.34-2.28,51.08-17.26,65.29-39.03,0,0-37.7-25.06-54.94-25.06h0Z"/>
            <path fill="#4c483b" d="M118.49,176.58l14.71,22.63c1.63,2.51,4.42,4.03,7.42,4.03l36.44,6.1c1.77,0,3.5.53,4.96,1.52l1.22.83c5.54,3.75,13.08.23,13.76-6.42l1.26-12.33c.25-2.48-.55-4.95-2.21-6.81l-37.62-35.81c-2.83-3.15-7.5-3.86-11.13-1.69l-25.94,15.53c-4.3,2.57-5.61,8.21-2.88,12.41Z"/>
          </g>
        ) : (
          <motion.g 
            onClick={() => playSound("washer", "/sound/sound/home_washing_machine_daegeum.wav")}
            className="cursor-pointer"
            style={{ transformOrigin: "126.2px 168.9px" }}
            initial={{ filter: "drop-shadow(0px 4px 14px rgba(76, 72, 59, 0.25))" }}
            whileHover={{ scale: 1.08, filter: "drop-shadow(0px 14px 28px rgba(76, 72, 59, 0.38))" }}
            whileTap={{ scale: 0.94, filter: "drop-shadow(0px 2px 6px rgba(76, 72, 59, 0.20))" }}
          >
            <rect fill="#ffffff" width="252.44" height="337.77" rx="5.72" ry="5.72"/>
            <circle fill="rgba(76, 72, 59, 0.08)" cx="126.22" cy="208.65" r="104.99"/>
            <circle fill="#4c483b" cx="126.22" cy="208.65" r="86.63"/>
            <line stroke="rgba(76, 72, 59, 0.18)" strokeLinecap="round" strokeMiterlimit={10} strokeWidth={1.5} x1="8.73" y1="38.64" x2="243.71" y2="38.64"/>
            <circle fill="#4c483b" cx="231.21" cy="19.19" r="11.14"/>
            <circle fill="#4c483b" cx="204.86" cy="19.19" r="4.74"/>
            <circle fill="#4c483b" cx="192.43" cy="19.19" r="4.74"/>
            <rect fill="#4c483b" x="8.73" y="42.87" width="18.94" height="11.33" rx=".72" ry=".72"/>
          </motion.g>
        )}
      </g>
    </svg>
  );
}
