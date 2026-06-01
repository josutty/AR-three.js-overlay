import { useRef, useState, useCallback } from 'react'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js'
import * as THREE from 'three'
import STLPreview from './STLPreview'

export default function UploadScreen({ onUploadSuccess }) {
  const fileInputRef = useRef(null)
  const [geometry, setGeometry] = useState(null)
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)

  const parseSTL = useCallback((file) => {
    if (!file || !file.name.toLowerCase().endsWith('.stl')) {
      setError('Please upload a valid .stl file.')
      return
    }
    setError('')
    setLoading(true)
    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const loader = new STLLoader()
        const geo = loader.parse(e.target.result)
        geo.computeVertexNormals()
        geo.center()
        setGeometry(geo)
      } catch (err) {
        setError('Failed to parse STL file. Please try another file.')
      } finally {
        setLoading(false)
      }
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) parseSTL(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) parseSTL(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => setDragging(false)

  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-gray-950 text-white px-6 py-10">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/40">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">AR</h1>
        </div>
        <p className="text-gray-400 text-sm">CAD Model Overlay & Object Tracking</p>
      </div>

      {/* Upload Zone */}
      <div
        onClick={() => !geometry && fileInputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`w-full max-w-sm rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden
          ${geometry ? 'border-green-500 bg-gray-900 cursor-default' : dragging ? 'border-green-400 bg-green-950/30' : 'border-gray-600 bg-gray-900 hover:border-green-500 hover:bg-gray-800/60'}
        `}
        style={{ minHeight: 280 }}
      >
        {loading && (
          <div className="flex flex-col items-center justify-center h-72 gap-4">
            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-400 text-sm">Parsing STL file…</p>
          </div>
        )}

        {!loading && !geometry && (
          <div className="flex flex-col items-center justify-center h-72 gap-4 p-6">
            <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            </div>
            <div className="text-center">
              <p className="font-semibold text-white">Drop your STL file here</p>
              <p className="text-sm text-gray-400 mt-1">or tap to browse</p>
            </div>
            <span className="text-xs text-gray-500 bg-gray-800 px-3 py-1 rounded-full">.stl files only</span>
          </div>
        )}

        {!loading && geometry && (
          <div className="flex flex-col items-center">
            <div className="w-full" style={{ height: 240 }}>
              <STLPreview geometry={geometry} />
            </div>
            <div className="flex items-center gap-2 px-4 py-3 w-full border-t border-gray-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-gray-300 truncate flex-1">{fileName}</p>
              <button
                onClick={(e) => { e.stopPropagation(); setGeometry(null); setFileName('') }}
                className="text-xs text-gray-500 hover:text-red-400 transition-colors ml-2 flex-shrink-0"
              >
                Change
              </button>
            </div>
          </div>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept=".stl" className="hidden" onChange={handleFileChange} />

      {error && (
        <p className="mt-4 text-red-400 text-sm text-center">{error}</p>
      )}

      {/* Open Camera Button */}
      {geometry && (
        <button
          onClick={() => onUploadSuccess(geometry, fileName)}
          className="mt-6 w-full max-w-sm py-4 rounded-2xl bg-green-500 hover:bg-green-400 active:scale-95 text-white font-bold text-lg tracking-wide transition-all duration-150 shadow-lg shadow-green-500/30 flex items-center justify-center gap-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
          </svg>
          Open Camera
        </button>
      )}

      {!geometry && (
        <button
          onClick={() => fileInputRef.current.click()}
          className="mt-6 w-full max-w-sm py-4 rounded-2xl bg-gray-800 hover:bg-gray-700 active:scale-95 text-white font-semibold text-base transition-all duration-150 border border-gray-700"
        >
          Browse STL File
        </button>
      )}
    </div>
  )
}
