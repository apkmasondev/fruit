import { useCallback, useEffect, useRef, useState } from 'react'
import LiquidDivider from './components/LiquidDivider'

const FILM_DESKTOP = `${import.meta.env.BASE_URL}video/story-master-gop1.mp4`
const FILM_MOBILE = `${import.meta.env.BASE_URL}video/story-master-mobile-gop1.mp4`
const HERO_FRUIT_FRAME = `${import.meta.env.BASE_URL}hero-fruit-frame.webp`
const HERO_PRODUCT = `${import.meta.env.BASE_URL}apkmason-can.webp`
const FRUIT_ORBIT = `${import.meta.env.BASE_URL}fruit-orbit.webp`
const MOBILE_MEDIA_QUERY = '(max-width: 720px)'
const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)'
const MOBILE_SEEK_FRAME_RATE = 24
const DESKTOP_SEEK_THRESHOLD = 0.035
const MOBILE_SEEK_THRESHOLD = 1 / MOBILE_SEEK_FRAME_RATE - 0.002
const BEAT_BLUR_STEP = 2
const BEAT_BLUR_MAX = 8
const HERO_PARALLAX_RANGE = 15
/** The film runs out before the scroll does, so the closing frame holds while the last beat resolves. */
const FILM_SCROLL_END = 0.94

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

/**
 * Scrubbing a video by assigning `currentTime` on every scroll frame floods the
 * decoder: mobile Safari and Chrome drop or queue seeks while one is in flight,
 * which is what makes the film lag behind the scroll and then snap forward.
 * Instead we keep only the newest target and commit it once the decoder is idle.
 */
function createScrubber(video: HTMLVideoElement) {
  let pendingTime: number | null = null

  const commit = () => {
    if (pendingTime === null || video.seeking) return
    const target = pendingTime
    pendingTime = null
    if (Math.abs(video.currentTime - target) > 0.001) video.currentTime = target
  }

  video.addEventListener('seeked', commit)

  return {
    seek(progress: number, useMobileCadence: boolean) {
      const duration = video.duration
      if (!duration || !Number.isFinite(duration)) return

      const maxTime = Math.max(duration - 0.04, 0)
      const rawTargetTime = clamp(progress) * maxTime
      const targetTime = useMobileCadence
        ? Math.min(maxTime, Math.round(rawTargetTime * MOBILE_SEEK_FRAME_RATE) / MOBILE_SEEK_FRAME_RATE)
        : rawTargetTime
      const threshold = useMobileCadence ? MOBILE_SEEK_THRESHOLD : DESKTOP_SEEK_THRESHOLD

      if (Math.abs((pendingTime ?? video.currentTime) - targetTime) <= threshold) return
      pendingTime = targetTime
      commit()
    },
    dispose() {
      video.removeEventListener('seeked', commit)
    },
  }
}

function App() {
  const heroRef = useRef<HTMLElement>(null)
  const heroVisualRef = useRef<HTMLDivElement>(null)
  const closingRef = useRef<HTMLElement>(null)
  const storyRef = useRef<HTMLElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const beatRefs = useRef<Array<HTMLDivElement | null>>([])
  const progressRef = useRef<HTMLDivElement>(null)
  const chapterRef = useRef<HTMLSpanElement>(null)
  const syncRef = useRef<(() => void) | null>(null)
  const [filmStatus, setFilmStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const updateMotionPreference = () => setReducedMotion(motionQuery.matches)
    updateMotionPreference()
    motionQuery.addEventListener('change', updateMotionPreference)
    return () => motionQuery.removeEventListener('change', updateMotionPreference)
  }, [])

  useEffect(() => {
    const film = videoRef.current
    if (reducedMotion && film?.duration && Number.isFinite(film.duration)) {
      film.currentTime = Math.max(film.duration - 0.05, 0.01)
    }
  }, [reducedMotion, filmStatus])

  /** Pause decorative loops while their section is off-screen — they cost paint forever otherwise. */
  useEffect(() => {
    const sections = [heroRef.current, closingRef.current].filter((node): node is HTMLElement => Boolean(node))
    if (!sections.length || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) entry.target.classList.toggle('is-idle', !entry.isIntersecting)
      },
      { rootMargin: '15% 0px' },
    )
    for (const section of sections) observer.observe(section)
    return () => observer.disconnect()
  }, [])

  /** Pointer parallax on the hero product. Fine pointers only, scoped to the hero, transform-only. */
  useEffect(() => {
    const hero = heroRef.current
    const visual = heroVisualRef.current
    if (reducedMotion || !hero || !visual) return
    if (!window.matchMedia(FINE_POINTER_QUERY).matches) return

    let frame = 0
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0

    const tick = () => {
      currentX += (targetX - currentX) * 0.085
      currentY += (targetY - currentY) * 0.085
      visual.style.setProperty('--px', `${currentX.toFixed(2)}px`)
      visual.style.setProperty('--py', `${currentY.toFixed(2)}px`)
      frame = Math.abs(targetX - currentX) > 0.04 || Math.abs(targetY - currentY) > 0.04
        ? window.requestAnimationFrame(tick)
        : 0
    }

    const start = () => {
      if (!frame) frame = window.requestAnimationFrame(tick)
    }

    const handleMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return
      targetX = ((event.clientX / window.innerWidth) * 2 - 1) * HERO_PARALLAX_RANGE
      targetY = ((event.clientY / window.innerHeight) * 2 - 1) * HERO_PARALLAX_RANGE
      start()
    }

    const handleLeave = () => {
      targetX = 0
      targetY = 0
      start()
    }

    hero.addEventListener('pointermove', handleMove, { passive: true })
    hero.addEventListener('pointerleave', handleLeave)
    return () => {
      hero.removeEventListener('pointermove', handleMove)
      hero.removeEventListener('pointerleave', handleLeave)
      if (frame) window.cancelAnimationFrame(frame)
      visual.style.removeProperty('--px')
      visual.style.removeProperty('--py')
    }
  }, [reducedMotion])

  useEffect(() => {
    if (reducedMotion) return
    const story = storyRef.current
    const glow = glowRef.current
    if (!story || !glow) return

    const compactViewport = window.matchMedia(MOBILE_MEDIA_QUERY)
    const scrubber = videoRef.current ? createScrubber(videoRef.current) : null

    let frame = 0
    let lastProgress = -1
    let lastChapter = ''
    let storyTop = 0
    let scrollableDistance = 1
    const lastBeatOpacity = beats.map(() => -1)
    const lastBeatBlur = beats.map(() => -1)

    /** Layout reads happen here only — never inside the per-frame loop. */
    const measure = () => {
      storyTop = story.getBoundingClientRect().top + window.scrollY
      scrollableDistance = Math.max(story.offsetHeight - window.innerHeight, 1)
      lastProgress = -1
    }

    const update = () => {
      frame = 0
      const progress = clamp((window.scrollY - storyTop) / scrollableDistance)
      if (Math.abs(progress - lastProgress) < 0.0002) return
      lastProgress = progress

      glow.style.setProperty('--story-progress', progress.toFixed(4))

      scrubber?.seek(progress / FILM_SCROLL_END, compactViewport.matches)

      for (let index = 0; index < beats.length; index += 1) {
        const beat = beatRefs.current[index]
        if (!beat) continue
        const visibility = beatVisibility(progress, beats[index].start, beats[index].end)
        const opacity = Math.round(visibility * 1000) / 1000
        if (opacity !== lastBeatOpacity[index]) {
          lastBeatOpacity[index] = opacity
          beat.style.opacity = String(opacity)
          beat.style.setProperty('--beat-y', `${((1 - visibility) * 26).toFixed(2)}px`)
        }
        // Blur is a repaint, not a composite: quantize it so a beat repaints ~5x per pass, not 60x per second.
        const blur = Math.round(((1 - visibility) * BEAT_BLUR_MAX) / BEAT_BLUR_STEP) * BEAT_BLUR_STEP
        if (blur !== lastBeatBlur[index]) {
          lastBeatBlur[index] = blur
          beat.style.filter = blur ? `blur(${blur}px)` : ''
        }
      }

      if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress.toFixed(4)})`

      const chapter = `${String(Math.min(4, Math.floor(progress * 4) + 1)).padStart(2, '0')} / 04`
      if (chapter !== lastChapter) {
        lastChapter = chapter
        if (chapterRef.current) chapterRef.current.textContent = chapter
      }
    }

    const requestUpdate = () => {
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    const handleResize = () => {
      measure()
      requestUpdate()
    }

    measure()
    update()
    syncRef.current = requestUpdate

    // The story is sized in viewport units, so its height changes with the layout, not just the window.
    const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(handleResize)
    resizeObserver?.observe(story)
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', handleResize, { passive: true })
    window.addEventListener('orientationchange', handleResize)

    return () => {
      syncRef.current = null
      resizeObserver?.disconnect()
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      if (frame) window.cancelAnimationFrame(frame)
      scrubber?.dispose()
    }
  }, [reducedMotion])

  const handleMetadata = useCallback(
    (event: React.SyntheticEvent<HTMLVideoElement>) => {
      const video = event.currentTarget
      const duration = video.duration
      if (Number.isFinite(duration) && duration > 0) {
        video.currentTime = reducedMotion ? Math.max(duration - 0.05, 0.01) : 0.01
      }
      setFilmStatus('ready')
      syncRef.current?.()
    },
    [reducedMotion],
  )

  // Without this a failed video download leaves an opaque loader parked over the whole story.
  const handleVideoError = useCallback(() => setFilmStatus('error'), [])

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
        <section className="hero" id="top" ref={heroRef} aria-labelledby="hero-title">
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
            <div className="hero-visual" ref={heroVisualRef} aria-hidden="true">
              <div className="hero-product-halo" />
              <img
                className="hero-product"
                src={HERO_PRODUCT}
                alt=""
                width={708}
                height={1378}
                decoding="async"
                fetchPriority="high"
              />
              <div className="hero-fruit-field">
                <img
                  className="hero-fruit-frame"
                  src={HERO_FRUIT_FRAME}
                  alt=""
                  width={1254}
                  height={1254}
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
          <div className="stage">
            <div className="stage-glow" ref={glowRef} aria-hidden="true" />
            <div className={`film-loading${filmStatus === 'loading' ? '' : ' is-ready'}`} aria-hidden="true">
              <span />
              <p>CHARGING COLOR</p>
            </div>

            {/* One master film: the two shots are joined by a crossfade baked into the encode, so the
                page runs a single decoder and never blends two full-screen video layers at runtime. */}
            <video
              ref={videoRef}
              className="story-video"
              preload="metadata"
              muted
              playsInline
              disablePictureInPicture
              disableRemotePlayback
              tabIndex={-1}
              aria-hidden="true"
              onLoadedMetadata={handleMetadata}
              onError={handleVideoError}
            >
              <source src={FILM_MOBILE} type="video/mp4" media={MOBILE_MEDIA_QUERY} />
              <source src={FILM_DESKTOP} type="video/mp4" />
            </video>

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

        <section className="closing" ref={closingRef} aria-labelledby="closing-title">
          <img
            className="closing-fruit-orbit"
            src={FRUIT_ORBIT}
            alt=""
            width={1672}
            height={941}
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
