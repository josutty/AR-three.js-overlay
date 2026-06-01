import { useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

function WireframeModel({ geometry }) {
  const meshRef = useRef()

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.6
    }
  })

  return (
    <group ref={meshRef}>
      <mesh geometry={geometry}>
        <meshStandardMaterial color="#22c55e" wireframe />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[geometry]} />
        <lineBasicMaterial color="#4ade80" />
      </lineSegments>
    </group>
  )
}

export default function STLPreview({ geometry }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 50 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <Suspense fallback={null}>
        <WireframeModel geometry={geometry} />
      </Suspense>
    </Canvas>
  )
}
