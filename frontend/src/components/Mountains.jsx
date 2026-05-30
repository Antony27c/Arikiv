export default function Mountains() {
  return (
    <div style={{
      position: "fixed",
      bottom: 0,
      left: 0,
      right: 0,
      height: 260,
      maxWidth: 430,
      margin: "0 auto",
      pointerEvents: "none",
      zIndex: 0,
      overflow: "hidden",
    }}>
      <svg
        viewBox="0 0 430 260"
        preserveAspectRatio="xMidYMax meet"
        style={{ width: "100%", height: "100%" }}
      >
        <polygon
          points="0,260 30,180 70,210 110,140 160,190 200,120 250,170 300,100 340,150 370,130 400,160 430,110 430,260"
          fill="#E8D5A3"
          opacity="0.45"
        />
        <polygon
          points="0,260 50,200 90,230 140,170 190,210 240,150 280,190 330,130 370,180 400,160 430,190 430,260"
          fill="#C9A84C"
          opacity="0.22"
        />
        <polygon
          points="0,260 60,230 120,240 180,210 240,230 300,200 350,220 430,190 430,260"
          fill="#6B1A2A"
          opacity="0.10"
        />
      </svg>
    </div>
  );
}
