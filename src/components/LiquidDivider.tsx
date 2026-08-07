const CONTOUR_CURVES = `
  C45 24 72 16 118 20 C162 24 175 39 207 36 C242 33 244 22 274 24
  C307 27 311 103 335 116 C347 123 360 116 364 102 C372 77 359 30 390 25
  C433 18 456 29 499 25 C537 22 553 13 590 18 C624 23 624 48 649 55
  C676 63 690 52 698 37 C707 20 734 22 763 24 C804 27 829 17 868 21
  C902 24 915 32 939 28 C971 22 981 31 985 63 C990 99 1007 121 1024 114
  C1046 105 1027 50 1047 32 C1064 16 1094 28 1128 25 C1170 21 1192 15 1238 21
  C1285 28 1289 45 1317 51 C1343 56 1355 42 1364 29 C1375 14 1403 24 1435 24
  C1474 24 1495 17 1533 20 C1560 22 1582 28 1600 23
`.trim()

const CONTOUR_PATH = `M0 24 ${CONTOUR_CURVES}`
const BODY_PATH = `M0 0 V24 ${CONTOUR_CURVES} V0 Z`

export default function LiquidDivider() {
  return (
    <div className="liquid-divider" aria-hidden="true">
      <svg
        className="liquid-divider__graphic"
        viewBox="0 0 1600 150"
        preserveAspectRatio="none"
        focusable="false"
      >
        <defs>
          <linearGradient id="concentrate-fill" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--formula-edge-start)" />
            <stop offset="0.5" stopColor="var(--formula-edge-mid)" />
            <stop offset="1" stopColor="var(--formula-edge-end)" />
          </linearGradient>
          <linearGradient id="concentrate-rim" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--ruby)" />
            <stop offset="0.3" stopColor="var(--mango)" />
            <stop offset="0.57" stopColor="var(--pink)" />
            <stop offset="0.8" stopColor="var(--leaf)" />
            <stop offset="1" stopColor="var(--berry)" />
          </linearGradient>
        </defs>
        <path className="liquid-divider__body" d={BODY_PATH} fill="url(#concentrate-fill)" />
        <path className="liquid-divider__rim" d={CONTOUR_PATH} fill="none" stroke="url(#concentrate-rim)" />
        <path className="liquid-divider__glint" d={CONTOUR_PATH} fill="none" />
        <ellipse className="liquid-divider__drop liquid-divider__drop--one" cx="348" cy="139" rx="7" ry="9" />
        <ellipse className="liquid-divider__drop liquid-divider__drop--two" cx="1031" cy="137" rx="5" ry="7" />
      </svg>
    </div>
  )
}
