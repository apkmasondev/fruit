import { useEffect, useRef, useState } from 'react'
import LiquidDivider from './components/LiquidDivider'

const VIDEO_ONE = `${import.meta.env.BASE_URL}video/01-hand-energy-reveal-gop1.mp4`
const VIDEO_TWO = `${import.meta.env.BASE_URL}video/02-apkmason-beauty-shot-gop1.mp4`
const HERO_FRUIT_FRAME = `${import.meta.env.BASE_URL}hero-fruit-frame.webp`
const HERO_PRODUCT = `${import.meta.env.BASE_URL}apkmason-can.webp`
const FRUIT_ORBIT = `${import.meta.env.BASE_URL}fruit-orbit.png`

type Beat = {
  eyebrow: string
  lineOne: string
  lineTwo: string
  start: number
  end: number
  align: 'left' | 'right' | 'center'
}

const beats: Beat[] = [
  { eyebrow: '01 / IGNITION', lineOne: 'RAW', lineTwo: 'ENERGY', start: 0.02, end: 0.24, align: 'left' },
  { eyebrow: '02 / CURRENT', lineOne: 'SHAPED', lineTwo: 'BY COLOR', start: 0.22, end: 0.46, align: 'right' },
  { eyebrow: '03 / FORM', lineOne: 'FLAVOR', lineTwo: 'TAKES FORM', start: 0.49, end: 0.72, align: 'left' },
  { eyebrow: '04 / RELEASE', lineOne: 'FRUIT', lineTwo: 'ENERGY', start: 0.75, end: 0.99, align: 'center' },
]

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value))

function beatVisibility(progress: number, start: number, end: number) {
  const fade = Math.min(0.055, (end - start) * 0.28)
  return clamp(Math.min((progress - start) / fade, (end - progress) / fade))
}

function App() {
  const storyRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const videoOneRef = useRef<HTMLVideoElement>(null)
  const videoTwoRef = useRef<HTMLVideoElement>(null)
  const beatRefs = useRef<Array<HTMLDivElement | null>>([])
  const progressRef = useRef<HTMLDivElement>(null)
  const chapterRef = useRef<HTMLSpanElement>(null)
  const [metadataReady, setMetadataReady] = useState(0)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => setReducedMotion(motionQuery.matches)
    updateMotionPreference()
    motionQuery.addEventListener('change', updateMotionPreference)
    return () => motionQuery.removeEventListener('change', updateMotionPreference)
  }, [])

  useEffect(() => {
    const finalVideo = videoTwoRef.current
    if (reducedMotion && finalVideo?.duration && Number.isFinite(finalVideo.duration)) {
      finalVideo.currentTime = Math.max(finalVideo.duration * 0.92, 0.01)
    }
  }, [reducedMotion, metadataReady])

  useEffect(() => {
    if (reducedMotion) return

    let frame = 0
    let lastProgress = -1

    const update = () => {
      frame = 0
      const story = storyRef.current
      const stage = stageRef.current
      if (!story || !stage) return

      const rect = story.getBoundingClientRect()
      const scrollableDistance = Math.max(story.offsetHeight - window.innerHeight, 1)
      const progress = clamp(-rect.top / scrollableDistance)

      if (Math.abs(progress - lastProgress) < 0.0001) return
      lastProgress = progress
      stage.style.setProperty('--story-progress', progress.toFixed(4))

      const firstVideoProgress = clamp(progress / 0.51)
      const secondVideoProgress = clamp((progress - 0.46) / 0.47)
      const firstVideo = videoOneRef.current
      const secondVideo = videoTwoRef.current

      if (firstVideo?.duration && Number.isFinite(firstVideo.duration)) {
        const targetTime = firstVideoProgress * Math.max(firstVideo.duration - 0.04, 0)
        if (Math.abs(firstVideo.currentTime - targetTime) > 0.035) firstVideo.currentTime = targetTime
      }

      if (secondVideo?.duration && Number.isFinite(secondVideo.duration)) {
        const targetTime = secondVideoProgress * Math.max(secondVideo.duration - 0.04, 0)
        if (Math.abs(secondVideo.currentTime - targetTime) > 0.035) secondVideo.currentTime = targetTime
      }

      const crossfade = clamp((progress - 0.455) / 0.1)
      if (firstVideo) firstVideo.style.opacity = String(1 - crossfade)
      if (secondVideo) secondVideo.style.opacity = String(crossfade)

      beatRefs.current.forEach((beat, index) => {
        if (!beat) return
        const visibility = beatVisibility(progress, beats[index].start, beats[index].end)
        beat.style.opacity = visibility.toFixed(3)
        beat.style.setProperty('--beat-y', `${(1 - visibility) * 26}px`)
        beat.style.filter = `blur(${(1 - visibility) * 8}px)`
        beat.style.pointerEvents = visibility > 0.5 ? 'auto' : 'none'
      })

      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`
      if (chapterRef.current) chapterRef.current.textContent = `${String(Math.min(4, Math.floor(progress * 4) + 1)).padStart(2, '0')} / 04`
    }

    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)
    return () => {
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [reducedMotion, metadataReady])

  const handleMetadata = (event: React.SyntheticEvent<HTMLVideoElement>, finalFrame = false) => {
    const video = event.currentTarget
    video.currentTime = reducedMotion && finalFrame ? Math.max(video.duration * 0.92, 0.01) : 0.01
    setMetadataReady((count) => count + 1)
  }

  return (
    <>
      <a className="skip-link" href="#formula">Skip to the formula</a>

      <header className="site-header" aria-label="Site header">
        <a className="wordmark" href="#top" aria-label="APKMASON — back to top">
          APKMASON
        </a>
        <p>330 ML / ENERGY DRINK</p>
        <p className="header-location">SPECTRUM / 01</p>
      </header>

      <main>
        <section className="hero" id="top" aria-labelledby="hero-title">
          <div className="hero-layout">
            <div className="hero-copy">
              <p className="hero-kicker">A fictional drink. A real current.</p>
              <h1 id="hero-title">
                <span>FRUIT</span>
                <span>ENERGY</span>
              </h1>
              <div className="hero-flavor-lockup">
                <strong>Ruby Mango</strong>
                <span>05 fruit blend / lightly sparkling</span>
              </div>
            </div>
            <div className="hero-visual" aria-hidden="true">
              <img
                className="hero-product"
                src={HERO_PRODUCT}
                alt=""
                decoding="async"
                fetchPriority="high"
              />
              <div className="hero-fruit-field">
                <img
                  className="hero-fruit-frame"
                  src={HERO_FRUIT_FRAME}
                  alt=""
                  decoding="async"
                  fetchPriority="high"
                />
              </div>
            </div>
            <a href="#story" className="scroll-cue hero-scroll">
              <span>Scroll to release</span>
              <span className="scroll-line" aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className={`story${reducedMotion ? ' is-reduced' : ''}`} id="story" ref={storyRef} aria-label="Fruit Energy product reveal">
          <div className="stage" ref={stageRef}>
            <div className="stage-glow" aria-hidden="true" />
            <div className={`film-loading${metadataReady >= 2 ? ' is-ready' : ''}`} aria-hidden="true">
              <span />
              <p>CHARGING COLOR</p>
            </div>

            <video
              ref={videoOneRef}
              className="story-video story-video-one"
              src={VIDEO_ONE}
              preload="metadata"
              muted
              playsInline
              tabIndex={-1}
              aria-hidden="true"
              onLoadedMetadata={(event) => handleMetadata(event)}
            />
            <video
              ref={videoTwoRef}
              className="story-video story-video-two"
              src={VIDEO_TWO}
              preload="metadata"
              muted
              playsInline
              tabIndex={-1}
              aria-hidden="true"
              onLoadedMetadata={(event) => handleMetadata(event, true)}
            />

            <div className="stage-vignette" aria-hidden="true" />
            <div className="stage-grain" aria-hidden="true" />

            <div className="stage-chrome stage-chrome-top" aria-hidden="true">
              <span ref={chapterRef}>01 / 04</span>
              <span>FLAVOR IN MOTION</span>
            </div>

            <div className="beats" aria-hidden="true">
              {beats.map((beat, index) => (
                <div
                  className={`beat beat-${beat.align}`}
                  key={beat.eyebrow}
                  ref={(element) => { beatRefs.current[index] = element }}
                >
                  <p>{beat.eyebrow}</p>
                  <h2><span>{beat.lineOne}</span><span>{beat.lineTwo}</span></h2>
                  {index === beats.length - 1 && <small>CHARGED BY NATURE. DIRECTED BY COLOR.</small>}
                </div>
              ))}
            </div>

            <div className="stage-chrome stage-chrome-bottom" aria-hidden="true">
              <span>APKMASON® / SPECTRUM 01</span>
              <span>RUBY MANGO / SERVE ICE COLD</span>
            </div>
            <div className="story-progress" aria-hidden="true"><div ref={progressRef} /></div>
          </div>
        </section>

        <section className="concept" id="formula" aria-labelledby="concept-title">
          <div className="concept-surface-bridge" aria-hidden="true" />
          <div className="section-label">
            <span>001</span>
            <p>THE FORMULA <b>SPECTRUM 01 / RUBY MANGO</b></p>
          </div>
          <div className="concept-copy">
            <h2 id="concept-title">FROM RAW FRUIT<br />TO <em>RITUAL.</em></h2>
            <div className="concept-body">
              <div className="concept-note-label">
                <span>Tasting note</span>
                <span>01—05</span>
              </div>
              <p className="lead">Ruby grapefruit meets ripe mango, dragon fruit, lime and red berry in one <em>bright, lightly sparkling charge.</em></p>
              <p>Crisp on the first sip, tropical through the middle and dry on the finish. APKMASON Fruit Energy is imagined with zero added sugar and 32 mg of caffeine per 100 ml. Best served ice cold.</p>
              <small>FICTIONAL PRODUCT SPECIFICATION</small>
            </div>
          </div>
          <ol className="flavor-spectrum" aria-label="Five-fruit flavor spectrum">
            <li><span>01</span><strong>Ruby grapefruit</strong></li>
            <li><span>02</span><strong>Ripe mango</strong></li>
            <li><span>03</span><strong>Dragon fruit</strong></li>
            <li><span>04</span><strong>Lime</strong></li>
            <li><span>05</span><strong>Red berry</strong></li>
          </ol>
          <div className="concept-stats" aria-label="Fictional drink facts">
            <article><i className="stat-mark stat-mark-slice" aria-hidden="true" /><strong>330<small>ML</small></strong><span>Full-charge can</span></article>
            <article><i className="stat-mark stat-mark-blend" aria-hidden="true" /><strong>05</strong><span>Fruit blend</span></article>
            <article><i className="stat-mark stat-mark-seed" aria-hidden="true" /><strong>32<small>MG</small></strong><span>Caffeine / 100 ml</span></article>
          </div>
        </section>

        <section className="craft" aria-labelledby="craft-title">
          <LiquidDivider />
          <div className="section-label section-label-dark">
            <span>002</span>
            <p>THE TASTE</p>
          </div>
          <h2 id="craft-title">BUILT TO<br /><span>MOVE.</span></h2>
          <div className="craft-grid">
            <article>
              <span>01</span>
              <h3>First note</h3>
              <p>Ruby grapefruit lands bright and tart, sharpened by a clean twist of lime.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Heart</h3>
              <p>Mango and dragon fruit bring a round tropical body with a vivid pink edge.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Finish</h3>
              <p>Red berry cuts through the sweetness for a crisp, lightly sparkling finish.</p>
            </article>
          </div>
          <p className="craft-note">RUBY GRAPEFRUIT / MANGO / DRAGON FRUIT / LIME / RED BERRY</p>
        </section>

        <section className="closing" aria-labelledby="closing-title">
          <img
            className="closing-fruit-orbit"
            src={FRUIT_ORBIT}
            alt=""
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            aria-hidden="true"
          />
          <p>ONE MORE SIP?</p>
          <h2 id="closing-title">TASTE<br />THE <span>FUTURE.</span></h2>
          <div className="closing-links">
            <a href="#formula">Explore the blend <span aria-hidden="true">↑</span></a>
            <a href="#top">Replay reveal <span aria-hidden="true">↑</span></a>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-brand">
          <a className="wordmark footer-wordmark" href="#top">APKMASON</a>
          <p>SPECTRUM 01 / FICTIONAL BEVERAGE</p>
        </div>
        <a className="footer-contact" href="mailto:apkmason.dev@gmail.com" aria-label="Email APKMASON at apkmason.dev@gmail.com">
          <span>Contact</span>
          <strong>APKMASON.DEV@GMAIL.COM</strong>
          <i aria-hidden="true">↗</i>
        </a>
        <p className="footer-year">© 2026</p>
      </footer>
    </>
  )
}

export default App
