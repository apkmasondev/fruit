# Changelog

## [1.0.1] - 2026-08-02

### Optimized
- **Mobile Video Performance**: Encoded dedicated GOP=1 mobile videos (`01-hand-energy-reveal-mobile-gop1.mp4` and `02-apkmason-beauty-shot-mobile-gop1.mp4`) at 960x540 resolution.
- **Scroll Scrubbing Smoothness**: Eliminates keyframe snapping stutter on mobile hardware decoders by placing an I-frame on every single frame while keeping file sizes lightweight (~3.1 MB and ~4.0 MB).
- **Application Config**: Updated `src/App.tsx` to point mobile media queries to the new GOP=1 mobile videos.
