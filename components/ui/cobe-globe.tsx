"use client"

import { useEffect, useRef, useState } from "react"
import createGlobe, { COBEOptions } from "cobe"
import { useMotionValue, useSpring } from "motion/react"

import { cn } from "@/lib/utils"

const MOVEMENT_DAMPING = 1400
const AUTO_ROTATION_SPEED = 0.003

const DEFAULT_GLOBE_CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 0,
  diffuse: 0.4,
  mapSamples: 16000,
  mapBrightness: 1.2,
  baseColor: [1, 1, 1],
  markerColor: [251 / 255, 100 / 255, 21 / 255],
  glowColor: [1, 1, 1],
  markers: [],
}

type MarkerData = {
  location: [number, number]
  size: number
  name?: string
}

export function Globe({
  className,
  config,
  markers,
}: {
  className?: string
  config?: COBEOptions
  markers?: Array<MarkerData>
}) {
  let phi = 0
  let width = 0
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef<number | null>(null)
  const pointerInteractionMovement = useRef(0)
  const [hoveredMarker, setHoveredMarker] = useState<MarkerData | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  const r = useMotionValue(0)
  const rs = useSpring(r, {
    mass: 1,
    damping: 30,
    stiffness: 100,
  })

  const updatePointerInteraction = (value: number | null) => {
    pointerInteracting.current = value
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab"
    }
  }

  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current
      pointerInteractionMovement.current = delta
      r.set(r.get() + delta / MOVEMENT_DAMPING)
    }
  }

  const currentPhiRef = useRef(0)

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !markers) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const scale = Math.min(centerX, centerY)

    let foundMarker: MarkerData | null = null
    let minDistance = Infinity
    const hoverThreshold = 25 // pixels

    markers.forEach((marker) => {
      const lat = marker.location[0]
      const lng = marker.location[1]
      
      // Convert lat/lng to radians
      const phi = (lat * Math.PI) / 180
      const theta = (lng * Math.PI) / 180
      
      // Get current rotation
      const rotation = currentPhiRef.current + rs.get()
      
      // Calculate 3D position on sphere
      const cosPhi = Math.cos(phi)
      const x3d = cosPhi * Math.sin(theta + rotation)
      const y3d = Math.sin(phi)
      const z3d = cosPhi * Math.cos(theta + rotation)
      
      // Only consider markers on the front face of the globe
      if (z3d > 0) {
        // Project to 2D screen coordinates
        const x2d = centerX + x3d * scale * 0.85
        const y2d = centerY - y3d * scale * 0.85
        
        // Calculate distance to mouse
        const distance = Math.sqrt(Math.pow(x - x2d, 2) + Math.pow(y - y2d, 2))
        
        if (distance < hoverThreshold && distance < minDistance) {
          foundMarker = marker
          minDistance = distance
        }
      }
    })

    if (foundMarker) {
      setHoveredMarker(foundMarker)
      setTooltipPos({ x: e.clientX, y: e.clientY })
      if (canvasRef.current) {
        canvasRef.current.style.cursor = "pointer"
      }
    } else {
      setHoveredMarker(null)
      if (canvasRef.current && !pointerInteracting.current) {
        canvasRef.current.style.cursor = "grab"
      }
    }
  }

  useEffect(() => {
    const onResize = () => {
      if (canvasRef.current) {
        width = canvasRef.current.offsetWidth
      }
    }

    window.addEventListener("resize", onResize)
    onResize()

    const globeConfig: COBEOptions = {
      ...DEFAULT_GLOBE_CONFIG,
      ...config,
      markers: markers || DEFAULT_GLOBE_CONFIG.markers,
    }

    const globe = createGlobe(canvasRef.current!, {
      ...globeConfig,
      width: width * 2,
      height: width * 2,
      onRender: (state) => {
        // Always rotate the globe
        phi += AUTO_ROTATION_SPEED
        currentPhiRef.current = phi
        state.phi = phi + rs.get()
        state.width = width * 2
        state.height = width * 2
      },
    })

    setTimeout(() => (canvasRef.current!.style.opacity = "1"), 0)
    return () => {
      globe.destroy()
      window.removeEventListener("resize", onResize)
    }
  }, [rs, config, markers])

  return (
    <>
      <div
        className={cn(
          "absolute inset-0 mx-auto aspect-[1/1] w-full max-w-[600px]",
          className
        )}
      >
        <canvas
          className={cn(
            "size-full opacity-0 transition-opacity duration-500 [contain:layout_paint_size]"
          )}
          ref={canvasRef}
          onPointerDown={(e) => {
            pointerInteracting.current = e.clientX
            updatePointerInteraction(e.clientX)
          }}
          onPointerUp={() => updatePointerInteraction(null)}
          onPointerOut={() => {
            updatePointerInteraction(null)
            setHoveredMarker(null)
          }}
          onMouseMove={(e) => {
            updateMovement(e.clientX)
            handleMouseMove(e)
          }}
          onTouchMove={(e) =>
            e.touches[0] && updateMovement(e.touches[0].clientX)
          }
        />
      </div>
      
      {hoveredMarker && hoveredMarker.name && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${tooltipPos.x + 15}px`,
            top: `${tooltipPos.y + 15}px`,
          }}
        >
          <div className="bg-popover text-popover-foreground px-3 py-2 rounded-md shadow-md border text-sm font-medium">
            {hoveredMarker.name}
          </div>
        </div>
      )}
    </>
  )
}
