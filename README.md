# AR — CAD Model Overlay & Object Tracking

A React + Three.js web app for overlaying STL CAD models onto a live camera feed with manual alignment and snapshot capture.

## Features
- STL file upload with 3D preview
- Full-screen camera feed with transparent Three.js overlay
- Green wireframe CAD model overlay
- Drag, pinch-scale, two-finger rotate (touch + mouse)
- "Start Tracking" captures snapshot + JSON transform data
- All client-side — no backend required

## Tech Stack
- React + Vite
- Three.js (direct, for overlay canvas)
- @react-three/fiber + @react-three/drei (for STL preview)
- Tailwind CSS

## Getting Started

```bash
npm install
npm run dev
```

Open on a mobile device (or use browser DevTools device simulation) for the best experience. Camera permissions are required.

## Usage
1. Upload an `.stl` file — a 3D wireframe preview will appear
2. Tap **Open Camera** — your device camera opens full-screen
3. Drag / pinch / rotate to align the green wireframe over the real object
4. Tap **Start Tracking** — saves a `.json` file and shows the captured snapshot
