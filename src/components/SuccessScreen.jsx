import { useState } from 'react'
 
export default function SuccessScreen({ data, onReset }) {
  // data = { captures: [...], totalCaptures: N }
  const captures = data.captures || []
  const [selected, setSelected] = useState(0)
  const current = captures[selected]
 
  const handleDownloadAllJSON = () => {
    // Strip image_base64 to keep JSON file small; images are downloaded separately
    const jsonCaptures = captures.map(({ image_base64, ...rest }) => rest)
    const blob = new Blob([JSON.stringify(jsonCaptures, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ar-tracking-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
 
  const handleDownloadAllImages = () => {
    captures.forEach((cap, i) => {
      const a = document.createElement('a')
      a.href = cap.image_base64
      a.download = `ar-snapshot-frame${i + 1}-of${captures.length}.png`
      setTimeout(() => a.click(), i * 350)
    })
  }
 
  const handleDownloadCurrentImage = () => {
    const a = document.createElement('a')
    a.href = current.image_base64
    a.download = `ar-snapshot-frame${selected + 1}.png`
    a.click()
  }
 
  return (
    <div className="flex flex-col w-full h-full bg-gray-950 text-white overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30 flex-shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold">Tracking Complete!</h2>
          <p className="text-xs text-gray-400">
            {captures.length} frame{captures.length !== 1 ? 's' : ''} captured • tap thumbnail to preview
          </p>
        </div>
      </div>
 
      {/* Main snapshot viewer */}
      {current && (
        <div className="px-5">
          <div className="relative rounded-2xl overflow-hidden border border-gray-800 shadow-xl bg-black">
            <img
              src={current.image_base64}
              alt={`Frame ${selected + 1}`}
              className="w-full object-cover"
            />
            {/* Frame counter badge */}
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur rounded-full px-2.5 py-1 text-xs text-white font-bold">
              {selected + 1} / {captures.length}
            </div>
            {/* Download current frame button */}
            <button
              onClick={handleDownloadCurrentImage}
              className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/70 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all"
              title="Download this frame"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </button>
          </div>
        </div>
      )}
 
      {/* Thumbnail strip — tap to switch frame */}
      {captures.length > 1 && (
        <div className="px-5 mt-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {captures.map((cap, i) => (
              <button
                key={i}
                onClick={() => setSelected(i)}
                className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all active:scale-95 ${
                  i === selected ? 'border-green-500 scale-105' : 'border-gray-700 opacity-60'
                }`}
              >
                <img src={cap.image_base64} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
 
      {/* Transform state for selected frame */}
      {current && (
        <div className="px-5 mt-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Transform — Frame {selected + 1}</h3>
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 overflow-x-auto">
            <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap break-all">
              {JSON.stringify(
                {
                  timestamp: current.timestamp,
                  model_file: current.model_file,
                  position: current.position,
                  scale: current.scale,
                  rotation: current.rotation,
                },
                null,
                2
              )}
            </pre>
          </div>
        </div>
      )}
 
      {/* Actions */}
      <div className="px-5 mt-5 mb-8 flex flex-col gap-3">
        <button
          onClick={handleDownloadAllImages}
          className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold transition-all flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Download All {captures.length} Snapshot{captures.length !== 1 ? 's' : ''} (PNG)
        </button>
        <button
          onClick={handleDownloadAllJSON}
          className="w-full py-4 rounded-xl bg-gray-700 hover:bg-gray-600 active:scale-95 text-white font-semibold transition-all flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
          </svg>
          Download All Transforms (JSON)
        </button>
        <button
          onClick={onReset}
          className="w-full py-4 rounded-xl border border-gray-700 hover:bg-gray-800 active:scale-95 text-gray-300 font-semibold transition-all flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Start Over
        </button>
      </div>
    </div>
  )
}
 
 