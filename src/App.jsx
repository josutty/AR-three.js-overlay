import { useState } from 'react'
import UploadScreen from './components/UploadScreen'
import CameraView from './components/CameraView'
import SuccessScreen from './components/SuccessScreen'

export default function App() {
  const [step, setStep] = useState('upload') // 'upload' | 'camera' | 'success'
  const [stlGeometry, setStlGeometry] = useState(null)
  const [modelFileName, setModelFileName] = useState('')
  const [captureData, setCaptureData] = useState(null)

  const handleUploadSuccess = (geometry, fileName) => {
    setStlGeometry(geometry)
    setModelFileName(fileName)
    setStep('camera')
  }

  const handleCapture = (data) => {
    setCaptureData(data)
    setStep('success')
  }

  const handleReset = () => {
    setStlGeometry(null)
    setModelFileName('')
    setCaptureData(null)
    setStep('upload')
  }

  return (
    <div className="w-full h-full">
      {step === 'upload' && (
        <UploadScreen onUploadSuccess={handleUploadSuccess} />
      )}
      {step === 'camera' && stlGeometry && (
        <CameraView
          geometry={stlGeometry}
          modelFileName={modelFileName}
          onCapture={handleCapture}
          onBack={handleReset}
        />
      )}
      {step === 'success' && captureData && (
        <SuccessScreen data={captureData} onReset={handleReset} />
      )}
    </div>
  )
}
