export default function Mountains({ variant = "mobile" }) {
  const isDesktop = variant === "desktop";
  return (
    <div className={`pw-mountains ${isDesktop ? "pw-mountains-desktop" : ""}`}>
      <svg
        viewBox={isDesktop ? "0 0 1200 200" : "0 0 430 260"}
        preserveAspectRatio="xMidYMax meet"
        style={{ width: "100%", height: "100%" }}
      >
        {isDesktop ? (
          <>
            <polygon points="0,200 80,120 160,160 240,90 340,140 440,70 540,130 640,60 740,110 840,50 940,100 1040,70 1140,120 1200,90 1200,200" fill="#E8D5A3" opacity="0.45" />
            <polygon points="0,200 120,140 220,180 340,100 440,160 560,90 660,140 780,70 880,120 980,60 1080,110 1200,80 1200,200" fill="#C9A84C" opacity="0.22" />
            <polygon points="0,200 140,170 260,200 400,140 540,180 680,130 820,160 960,110 1100,150 1200,130 1200,200" fill="#6B1A2A" opacity="0.10" />
          </>
        ) : (
          <>
            <polygon points="0,260 30,180 70,210 110,140 160,190 200,120 250,170 300,100 340,150 370,130 400,160 430,110 430,260" fill="#E8D5A3" opacity="0.45" />
            <polygon points="0,260 50,200 90,230 140,170 190,210 240,150 280,190 330,130 370,180 400,160 430,190 430,260" fill="#C9A84C" opacity="0.22" />
            <polygon points="0,260 60,230 120,240 180,210 240,230 300,200 350,220 430,190 430,260" fill="#6B1A2A" opacity="0.10" />
          </>
        )}
      </svg>
    </div>
  );
}
