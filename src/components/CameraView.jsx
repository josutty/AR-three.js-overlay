import { useEffect, useRef, useState, useCallback } from 'react'
import OverlayCanvas from './OverlayCanvas'
 
export default function CameraView({ geometry, modelFileName, onCapture, onBack }) {
  const videoRef = useRef(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight })
 
  // Transform state for the CAD overlay
  const [transform, setTransform] = useState({
    position: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    scale: 1,
    rotation: { x: 0, y: 0, z: 0 },
  })
 
  const [rotateMode, setRotateMode] = useState(false) // false = drag mode, true = rotate mode
  const [isTracking, setIsTracking] = useState(false)
  const [captureCount, setCaptureCount] = useState(0)
  const overlayCanvasRef = useRef(null)
  const overlayRenderRef = useRef(null)
  const trackingIntervalRef = useRef(null)
  const capturesRef = useRef([]) // accumulate all captures while tracking
  const transformRef = useRef(transform) // mirror transform for use inside interval
 
  // Start camera
  useEffect(() => {
    let stream = null
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play()
            setCameraReady(true)
          }
        }
      } catch (err) {
        setCameraError('Camera access denied. Please allow camera permissions and refresh.')
      }
    }
    startCamera()
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop())
    }
  }, [])
 
  // Handle resize
  useEffect(() => {
    const onResize = () => setDimensions({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])
 
  // Keep transformRef in sync so interval callback always reads latest value
  useEffect(() => {
    transformRef.current = transform
  }, [transform])
 
  // ─── Pointer / Touch Interaction ───────────────────────────────────────────
  const gestureState = useRef({
    active: false,
    type: null, // 'drag' | 'pinch' | 'rotate'
    prevPointers: [],
  })
 
  const getPointers = (e) => Array.from(e.touches || [e]).map((p) => ({ x: p.clientX, y: p.clientY, id: p.identifier ?? 0 }))
 
  const handlePointerDown = useCallback((e) => {
    e.preventDefault()
    const ptrs = getPointers(e)
    gestureState.current = { active: true, prevPointers: ptrs, type: ptrs.length === 1 ? 'single' : 'multi' }
  }, [])
 
  const handlePointerMove = useCallback((e) => {
    e.preventDefault()
    const gs = gestureState.current
    if (!gs.active) return
    const ptrs = getPointers(e)
 
    if (ptrs.length === 1 && gs.prevPointers.length === 1) {
      const dx = ptrs[0].x - gs.prevPointers[0].x
      const dy = ptrs[0].y - gs.prevPointers[0].y
 
      if (!rotateMode) {
        // Drag to reposition
        setTransform((t) => ({
          ...t,
          position: { x: t.position.x + dx, y: t.position.y + dy },
        }))
      } else {
        // Single-finger rotate in XY
        setTransform((t) => ({
          ...t,
          rotation: {
            ...t.rotation,
            y: t.rotation.y + dx * 0.01,
            x: t.rotation.x + dy * 0.01,
          },
        }))
      }
    } else if (ptrs.length === 2 && gs.prevPointers.length === 2) {
      const prev = gs.prevPointers
      const prevDist = Math.hypot(prev[1].x - prev[0].x, prev[1].y - prev[0].y)
      const currDist = Math.hypot(ptrs[1].x - ptrs[0].x, ptrs[1].y - ptrs[0].y)
      const scaleFactor = currDist / (prevDist || 1)
 
      // Pinch-to-scale
      setTransform((t) => ({
        ...t,
        scale: Math.max(0.1, Math.min(10, t.scale * scaleFactor)),
      }))
 
      // Two-finger rotate (Z axis) based on angle delta
      const prevAngle = Math.atan2(prev[1].y - prev[0].y, prev[1].x - prev[0].x)
      const currAngle = Math.atan2(ptrs[1].y - ptrs[0].y, ptrs[1].x - ptrs[0].x)
      const dAngle = currAngle - prevAngle
      setTransform((t) => ({
        ...t,
        rotation: { ...t.rotation, z: t.rotation.z + dAngle },
      }))
    }
 
    gs.prevPointers = ptrs
  }, [rotateMode])
 
  const handlePointerUp = useCallback(() => {
    gestureState.current.active = false
  }, [])
 
  // ─── Mouse (desktop) interactions ──────────────────────────────────────────
  const mouseState = useRef({ down: false, button: 0, lastX: 0, lastY: 0 })
 
  const handleMouseDown = useCallback((e) => {
    mouseState.current = { down: true, button: e.button, lastX: e.clientX, lastY: e.clientY }
  }, [])
 
  const handleMouseMove = useCallback((e) => {
    const ms = mouseState.current
    if (!ms.down) return
    const dx = e.clientX - ms.lastX
    const dy = e.clientY - ms.lastY
 
    if (ms.button === 0 && !rotateMode) {
      setTransform((t) => ({ ...t, position: { x: t.position.x + dx, y: t.position.y + dy } }))
    } else if (ms.button === 2 || (ms.button === 0 && rotateMode)) {
      setTransform((t) => ({
        ...t,
        rotation: { ...t.rotation, y: t.rotation.y + dx * 0.01, x: t.rotation.x + dy * 0.01 },
      }))
    }
    ms.lastX = e.clientX
    ms.lastY = e.clientY
  }, [rotateMode])
 
  const handleMouseUp = useCallback(() => {
    mouseState.current.down = false
  }, [])
 
  const handleWheel = useCallback((e) => {
    e.preventDefault()
    const factor = e.deltaY > 0 ? 0.95 : 1.05
    setTransform((t) => ({ ...t, scale: Math.max(0.1, Math.min(10, t.scale * factor)) }))
  }, [])
 
  // ─── Capture a single frame ────────────────────────────────────────────────
  const captureFrame = useCallback(() => {
    const t = transformRef.current
    const captureCanvas = document.createElement('canvas')
    captureCanvas.width = dimensions.width
    captureCanvas.height = dimensions.height
    const ctx = captureCanvas.getContext('2d')
 
    // Draw camera video frame
    ctx.drawImage(videoRef.current, 0, 0, dimensions.width, dimensions.height)
 
    // Force a fresh WebGL render right before reading pixels (critical on mobile)
    overlayRenderRef.current?.forceRender()
 
    // Draw the overlay — always specify dest dimensions so DPR scaling is corrected
    if (overlayCanvasRef.current) {
      ctx.drawImage(
        overlayCanvasRef.current,
        0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height, // src: full intrinsic pixels
        0, 0, dimensions.width, dimensions.height,                              // dst: CSS pixel size
      )
    }
 
    const imageBase64 = captureCanvas.toDataURL('image/png')
    const entry = {
      timestamp: new Date().toISOString(),
      model_file: modelFileName,
      position: { x: Math.round(t.position.x), y: Math.round(t.position.y) },
      scale: parseFloat(t.scale.toFixed(4)),
      rotation: {
        x: parseFloat(t.rotation.x.toFixed(4)),
        y: parseFloat(t.rotation.y.toFixed(4)),
        z: parseFloat(t.rotation.z.toFixed(4)),
      },
      image_base64: imageBase64,
    }
    capturesRef.current.push(entry)
    setCaptureCount((c) => c + 1)
    return entry
  }, [dimensions, modelFileName])
 
  // ─── Start Tracking ─────────────────────────────────────────────────────────
  const handleStartTracking = useCallback(() => {
    capturesRef.current = []
    setCaptureCount(0)
    setIsTracking(true)
 
    // First capture immediately
    captureFrame()
 
    // Then every 2 seconds
    trackingIntervalRef.current = setInterval(() => {
      captureFrame()
    }, 2000)
  }, [captureFrame])
 
  // ─── Stop Tracking ──────────────────────────────────────────────────────────
  const handleStopTracking = useCallback(() => {
    clearInterval(trackingIntervalRef.current)
    trackingIntervalRef.current = null
    setIsTracking(false)
 
    const allCaptures = capturesRef.current
    if (allCaptures.length === 0) return
 
    // Pass entire captures array to success screen
    onCapture({ captures: allCaptures, totalCaptures: allCaptures.length })
  }, [onCapture])
 
  // Cleanup interval on unmount
  useEffect(() => {
    return () => clearInterval(trackingIntervalRef.current)
  }, [])
 
  const handleReset = () => {
    setTransform({
      position: { x: dimensions.width / 2, y: dimensions.height / 2 },
      scale: 1,
      rotation: { x: 0, y: 0, z: 0 },
    })
  }
 
  return (
    <div
      className="relative w-full h-full overflow-hidden bg-black select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {/* Camera error */}
      {cameraError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-gray-950 text-center px-8 gap-4">
          <p className="text-red-400 text-base">{cameraError}</p>
          <button onClick={onBack} className="px-6 py-3 rounded-xl bg-gray-800 text-white">← Go Back</button>
        </div>
      )}
 
      {/* Video feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />
 
      {/* Loading indicator */}
      {!cameraReady && !cameraError && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/70">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-white text-sm">Starting camera…</p>
          </div>
        </div>
      )}
 
      {/* Three.js Overlay Canvas */}
      {cameraReady && (
        <div
          className="absolute inset-0 w-full h-full"
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onWheel={handleWheel}
          style={{ touchAction: 'none' }}
        >
          <OverlayCanvas
            geometry={geometry}
            transform={transform}
            width={dimensions.width}
            height={dimensions.height}
            canvasRef={overlayCanvasRef}
            renderRef={overlayRenderRef}
          />
        </div>
      )}
 
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 pt-safe-top pt-4 pb-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <button
          onClick={onBack}
          disabled={isTracking}
          className="pointer-events-auto w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center text-white disabled:opacity-30"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
        </button>
        <div className="bg-black/50 backdrop-blur rounded-full px-3 py-1">
          <p className="text-white text-xs font-medium truncate max-w-[160px]">{modelFileName}</p>
        </div>
        {/* Recording indicator */}
        {isTracking ? (
          <div className="pointer-events-none flex items-center gap-1.5 bg-red-600/80 backdrop-blur rounded-full px-3 py-1.5">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="text-white text-xs font-bold">{captureCount}</span>
          </div>
        ) : (
          <div className="w-10" />
        )}
      </div>
 
      {/* Control hints */}
      <div className="absolute top-20 right-3 z-20 bg-black/50 backdrop-blur rounded-xl p-2 flex flex-col gap-1 pointer-events-none">
        <HintRow icon="✋" label={rotateMode ? 'Rotate' : 'Drag'} />
        <HintRow icon="🤏" label="Pinch scale" />
        <HintRow icon="🔄" label="2-finger rotate" />
        <HintRow icon="🖱️" label="Scroll zoom" />
      </div>
 
      {/* Bottom toolbar */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pb-safe-bottom pb-6 px-4">
        <div className="bg-black/60 backdrop-blur-md rounded-2xl px-4 py-3 flex items-center justify-between gap-3 max-w-lg mx-auto">
          {/* Reset */}
          <button
            onClick={handleReset}
            disabled={isTracking}
            className="flex flex-col items-center gap-1 text-gray-300 hover:text-white active:scale-95 transition-all min-w-[52px] disabled:opacity-30"
          >
            <div className="w-11 h-11 rounded-xl bg-gray-700/80 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
              </svg>
            </div>
            <span className="text-xs">Reset</span>
          </button>
 
          {/* Start / Stop Tracking */}
          {!isTracking ? (
            <button
              onClick={handleStartTracking}
              className="flex-1 py-3 rounded-xl bg-green-500 hover:bg-green-400 active:scale-95 text-white font-bold text-base tracking-wide transition-all shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
              </svg>
              Start Tracking
            </button>
          ) : (
            <button
              onClick={handleStopTracking}
              className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-400 active:scale-95 text-white font-bold text-base tracking-wide transition-all shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
            >
              <span className="w-3 h-3 rounded-sm bg-white" />
              Stop Tracking
              <span className="ml-1 bg-red-700 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {captureCount}
              </span>
            </button>
          )}
 
          {/* Rotate Mode Toggle */}
          <button
            onClick={() => setRotateMode((v) => !v)}
            disabled={isTracking}
            className="flex flex-col items-center gap-1 text-gray-300 hover:text-white active:scale-95 transition-all min-w-[52px] disabled:opacity-30"
          >
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${rotateMode ? 'bg-green-600' : 'bg-gray-700/80'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V10.5" />
              </svg>
            </div>
            <span className="text-xs">{rotateMode ? 'Rotate' : 'Drag'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
 
function HintRow({ icon, label }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-base leading-none">{icon}</span>
      <span className="text-gray-300 text-xs whitespace-nowrap">{label}</span>
    </div>
  )
}
 
 