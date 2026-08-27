# Changelog

## [1.2.0] - 2026-08-27

### Optimized
- **One master film instead of four clips**: the two shots are now joined by a 1.5 s crossfade baked into the encode, so the page mounts a single `<video>` and runs a single decoder. Previously two full-screen 1080p layers were mounted at once, and across the transition window *both* were being seeked and alpha-blended on every scroll frame — the most expensive moment of the whole story was also the one doing double work. The baked join also drops the 1.5 s of footage that used to exist twice (20 s of video → an 18.5 s master).
- **Desktop film 47.6 MB → 21.8 MB (−54 %)**: the old pair was encoded at CRF ≈18 (15.6 and 24.3 Mbps) to preserve a source that is itself only 5–6 Mbps, so most of those bits were spent re-encoding the source's own compression artifacts. Re-cut from the Google Flow originals at CRF 23 with `aq-mode=3`, which is indistinguishable from the source at 100 % crop on a film that ships behind a vignette, a grain layer and headline type.
- **Mobile film 7.1 MB → 6.2 MB** at slightly *higher* fidelity (SSIM 0.973 vs ≈0.971), for the same structural reason — one file, one decoder, no dual seek.
- **`faststart` on the desktop film**: the old desktop clips carried their `moov` atom *after* ~50 MB of `mdat`, so `preload="metadata"` could not report a duration until the browser had range-requested the tail of the file. Both masters now front-load `moov` (byte 36). The mobile clips already had this; the desktop ones never did.
- **Kept GOP=1**: measured against GOP 2/4/8 in Chrome over 300 seeks each. GOP=8 halves the file again but pushes p95 seek latency to 21–23 ms, past the 16.7 ms frame budget, which is the stutter this project already fixed once. All-intra stays at 9.6 ms mean / 13–15 ms p95.
- **Dead weight removed**: `public/fruit-orbit.png` (1.05 MB), superseded by the WebP in 1.1.0 and unreferenced since.

### Fixed
- **Preload was a 404 in dev**: `index.html` hard-coded `/fruit/…` into the hero preload, icon and manifest hrefs, and Vite's dev server prepends `base` to root-relative URLs — so the LCP preload resolved to `/fruit/fruit/apkmason-can.webp` and returned the 3.7 kB HTML fallback instead of the 168 kB image. Production was unaffected, but it meant the 1.1.0 LCP work could not be verified locally. The hrefs are now relative and resolve correctly under both dev and build. (`%BASE_URL%` does not help here — dev prepends `base` to its expansion too.)

### Changed
- **Reduced motion** parks the film on its true final frame rather than 92 % of the way through the second clip; the master's closing frame is the finished beauty shot.

## [1.1.0] - 2026-08-06

### Fixed
- **iOS sticky stage**: `body` uses `overflow-x: clip` instead of `hidden`, which no longer turns the body into a scroll container and breaks `position: sticky` on iOS Safari.
- **Dead ambient glow**: `.stage-glow` was painted behind two opaque-black `<video>` layers, so a 920 px conic gradient with a 150 px blur was rendered every frame and never seen. The videos lost their black background and the glow now reads through the letterbox.
- **Stuck film loader**: a failed video download left the opaque "CHARGING COLOR" overlay parked over the whole story forever. `onError` now clears it.
- **Loader fade cut short**: `transition: visibility 500ms` flipped the overlay hidden halfway through its own fade; the discrete flip is now delayed until the opacity transition ends.
- **NaN seek**: `handleMetadata` guards against a non-finite `duration` before assigning `currentTime`.
- **Hero can lost its shadow**: `hero-product-reveal` animates `filter`, and `animation-fill-mode: both` kept the last keyframe applied forever — so `drop-shadow()` from the base rule was overwritten for the life of the page. Both hero reveals now use `backwards` and hand the element back to its base styles; the same fill also pinned a pointless `blur(0)` filter pass on `.hero-fruit-field`.

### Optimized
- **Video scrubbing**: seeks are queued instead of fired per frame — only the newest target is kept and it is committed once the decoder reports `seeked`. Stops the flooding that made the film lag behind the scroll and snap forward on mobile.
- **Idle decoder**: the fully faded-out film stops being seeked and is dropped from the compositor with `visibility: hidden`.
- **No per-frame layout reads**: `offsetHeight` / `getBoundingClientRect` moved out of the scroll loop into a `measure()` pass driven by `ResizeObserver`, `resize` and `orientationchange`; the loop reads only `scrollY`.
- **Scoped style invalidation**: `--story-progress` is written to the leaf `.stage-glow` rather than `.stage` (42 descendants). Measured 0.32 ms → 0.03 ms per write.
- **Composited glow**: progress drives the independent `rotate` / `scale` / `opacity` properties. Previously `conic-gradient(from calc(var(...)))` forced a full repaint *and* a re-blur every frame.
- **Beat blur quantized** to 2 px steps (≈5 repaints per pass instead of 60/s) and removed from `will-change`; the beats' `drop-shadow()` became a static `text-shadow`.
- **Redundant DOM writes removed**: beat styles, video opacity, and the chapter counter are only written when their value actually changes; `pointerEvents` writes on decorative nodes dropped.
- **Idle animations paused**: an `IntersectionObserver` pauses the hero and closing loops while off-screen; the headline's `background-position` drift is disabled below 720 px.
- **Grain gated**: `mix-blend-mode: soft-light` over a scrubbing video forces a full-screen backdrop readback per decoded frame — now hidden below 720 px.
- **`fruit-orbit`**: re-encoded 1077 KB PNG → 132 KB WebP (0.2 % mean channel difference). `public/fruit-orbit.png` is now unused.
- **LCP 2136 ms → 1332 ms**: hero art is preloaded from `index.html` (now fetched at 30 ms and done at 68 ms, ahead of React). That left the entrance animation as the bottleneck — `.hero-fruit-frame` is the LCP element and its reveal animates `scale`, so Chrome kept re-reporting LCP until the animation finished. The two hero reveals were tightened (1.8 s → 1.05 s, 1.6 s → 0.95 s) keeping the same easing and stagger.
- **CLS 0**: measured over a cold load, zero layout-shift entries. Intrinsic `width`/`height` added to all `<img>`.

### Design
- Token system for the citrus palette, display font, spacing, radii, elevation/glow and easing.
- Pointer parallax on the hero: the can tracks the cursor and the fruit frame counter-moves, plus a soft citrus halo behind the can.
- Springy micro-interactions — flavor cells wash with their own fruit color, taste cards grow their accent rule, closing links sweep a citrus underline.

## [1.0.1] - 2026-08-02

### Optimized
- **Mobile Video Performance**: Encoded dedicated GOP=1 mobile videos (`01-hand-energy-reveal-mobile-gop1.mp4` and `02-apkmason-beauty-shot-mobile-gop1.mp4`) at 960x540 resolution.
- **Scroll Scrubbing Smoothness**: Eliminates keyframe snapping stutter on mobile hardware decoders by placing an I-frame on every single frame while keeping file sizes lightweight (~3.1 MB and ~4.0 MB).
- **Application Config**: Updated `src/App.tsx` to point mobile media queries to the new GOP=1 mobile videos.
