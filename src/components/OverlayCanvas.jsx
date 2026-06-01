import { useRef, useEffect, useMemo } from 'react'
import * as THREE from 'three'
 
/**
 * OverlayCanvas renders the STL model as a red/green wireframe outline
 * directly onto a plain <canvas> using Three.js (no React Three Fiber),
 * so the canvas element can be captured with toDataURL for the snapshot.
 */
export default function OverlayCanvas({ geometry, transform, width, height, canvasRef }) {
  const containerRef = useRef(null)
  const internalRef = useRef(null)
 
  // Three.js objects kept in a ref so they survive re-renders
  const threeRef = useRef({})
 
  // ── Bootstrap Three.js scene once ─────────────────────────────────────────
  useEffect(() => {
    const canvas = internalRef.current
    if (!canvas) return
 
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setClearColor(0x000000, 0)
 
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 1000)
    camera.position.set(0, 0, 5)
 
    // Ambient + directional lights (for the filled mesh, not used for wireframe but kept)
    scene.add(new THREE.AmbientLight(0xffffff, 0.5))
    const dLight = new THREE.DirectionalLight(0xffffff, 1)
    dLight.position.set(5, 5, 5)
    scene.add(dLight)
 
    // Build the wireframe model group
    const group = new THREE.Group()
    scene.add(group)
 
    // Edges geometry – sharp outline
    const edgesGeo = new THREE.EdgesGeometry(geometry, 15)
    const lineMat = new THREE.LineBasicMaterial({ color: 0x00ff44, linewidth: 2 })
    const lineSegments = new THREE.LineSegments(edgesGeo, lineMat)
    group.add(lineSegments)
 
    // Transparent mesh so the model occludes itself properly
    const meshMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.0, side: THREE.FrontSide })
    const mesh = new THREE.Mesh(geometry, meshMat)
    group.add(mesh)
 
    // Axis helper
    const axisHelper = new THREE.AxesHelper(1)
    group.add(axisHelper)
 
    threeRef.current = { renderer, scene, camera, group }
 
    renderer.setSize(width, height)
 
    return () => {
      renderer.dispose()
      edgesGeo.dispose()
      lineMat.dispose()
      meshMat.dispose()
    }
  }, [geometry]) // re-init if geometry changes
 
  // ── Resize ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const { renderer, camera } = threeRef.current
    if (!renderer || !camera) return
    renderer.setSize(width, height)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }, [width, height])
 
  // ── Render loop: apply transform and render ────────────────────────────────
  useEffect(() => {
    const { renderer, scene, camera, group } = threeRef.current
    if (!renderer || !group) return
 
    // Convert screen position → NDC → world position on a plane at z=0
    // We map the 2D screen position to the 3D group's X/Y in camera space.
    const ndcX = (transform.position.x / width) * 2 - 1
    const ndcY = -((transform.position.y / height) * 2 - 1)
 
    // Project onto the z=0 plane at a given depth
    const depth = 5 // camera.position.z
    const fovRad = (camera.fov * Math.PI) / 180
    const halfH = Math.tan(fovRad / 2) * depth
    const halfW = halfH * camera.aspect
 
    group.position.set(ndcX * halfW, ndcY * halfH, 0)
    group.scale.setScalar(transform.scale)
    group.rotation.set(transform.rotation.x, transform.rotation.y, transform.rotation.z)
 
    renderer.render(scene, camera)
  }, [transform, width, height])
 
  // Expose the underlying canvas element via canvasRef
  useEffect(() => {
    if (canvasRef) {
      canvasRef.current = internalRef.current
    }
  }, [canvasRef])
 
  return (
    <canvas
      ref={internalRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width,
        height,
        pointerEvents: 'none',
      }}
    />
  )
}
 
 