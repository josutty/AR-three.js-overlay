# Copilot Instructions

This is a React + Vite + Three.js project for AR CAD model overlay.

- Use functional React components with hooks only
- Use Tailwind CSS for all styling — no inline styles except Three.js canvas positioning
- Three.js overlay uses a plain `<canvas>` rendered imperatively (not via R3F) so it can be captured via `toDataURL`
- STL preview uses `@react-three/fiber` + `@react-three/drei`
- All processing is client-side; no backend
- Mobile-first: all touch targets should be at least 44×44px
