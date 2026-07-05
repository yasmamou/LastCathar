'use client'

import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import { PlaceEntry } from '@/types/places'
import { getCategoryColor, getCategoryIcon } from '@/lib/categories'

if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as Record<string, any>).CESIUM_BASE_URL = '/cesium'
  const token = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN
  if (token) Cesium.Ion.defaultAccessToken = token
}

interface EpicLine {
  placeSlugs: string[]
  color: string
}

interface GlobeViewProps {
  places: PlaceEntry[]
  selectedPlace: PlaceEntry | null
  flyToTrigger: number
  onPlaceSelect: (place: PlaceEntry) => void
  onCameraMove?: (lat: number, lng: number) => void
  epicLines?: EpicLine | null
  // Optional explicit fly target used when no place is selected (e.g. flying to
  // an epic's first place while showing the epic overview panel).
  flyToCoords?: { latitude: number; longitude: number } | null
}

export default function GlobeView({ places, selectedPlace, flyToTrigger, onPlaceSelect, onCameraMove, epicLines, flyToCoords }: GlobeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Cesium.Viewer | null>(null)
  const readyRef = useRef(false)
  const callbacksRef = useRef({ onPlaceSelect, selectedPlace, flyToTrigger, onCameraMove })
  callbacksRef.current = { onPlaceSelect, selectedPlace, flyToTrigger, onCameraMove }
  const highlightRef = useRef<Cesium.Entity | null>(null)
  const linesRef = useRef<Cesium.Entity[]>([])
  // Flips true once the async viewer init completes, so the marker/line effects
  // re-run and populate the globe even if `places` never changes identity after
  // mount (otherwise markers only appeared on a fortuitous later re-render).
  const [viewerReady, setViewerReady] = useState(false)

  // ─── Init viewer once ───
  useEffect(() => {
    if (!containerRef.current) return
    let destroyed = false

    ;(async () => {
      try {
        const imagery = await Cesium.TileMapServiceImageryProvider.fromUrl(
          '/cesium/Assets/Textures/NaturalEarthII',
        )
        if (destroyed) return

        const viewer = new Cesium.Viewer(containerRef.current!, {
          animation: false,
          baseLayerPicker: false,
          fullscreenButton: false,
          geocoder: false,
          homeButton: false,
          infoBox: false,
          sceneModePicker: false,
          selectionIndicator: false,
          timeline: false,
          navigationHelpButton: false,
          scene3DOnly: true,
          skyBox: false,
          requestRenderMode: false,
          baseLayer: new Cesium.ImageryLayer(imagery),
        })

        if (destroyed) { viewer.destroy(); return }
        viewerRef.current = viewer

        const scene = viewer.scene
        scene.backgroundColor = Cesium.Color.fromCssColorString('#05060d')
        scene.globe.baseColor = Cesium.Color.fromCssColorString('#0a0c1a')
        scene.globe.enableLighting = false
        scene.globe.showGroundAtmosphere = true
        scene.fog.enabled = true
        scene.fog.density = 0.0001

        if (scene.skyAtmosphere) {
          scene.skyAtmosphere.hueShift = -0.01
          scene.skyAtmosphere.saturationShift = -0.1
          scene.skyAtmosphere.brightnessShift = -0.1
        }

        // Try Bing Maps satellite via Ion — brighter for readability
        if (Cesium.Ion.defaultAccessToken) {
          try {
            const ion = await Cesium.IonImageryProvider.fromAssetId(2)
            const ionLayer = new Cesium.ImageryLayer(ion)
            ionLayer.brightness = 0.7
            ionLayer.contrast = 1.2
            ionLayer.saturation = 0.6
            scene.imageryLayers.removeAll()
            scene.imageryLayers.add(ionLayer)
          } catch { /* keep NaturalEarth fallback */ }
        }

        // Try Cesium World Terrain (3D relief)
        try {
          const terrain = await Cesium.CesiumTerrainProvider.fromIonAssetId(1)
          viewer.terrainProvider = terrain
        } catch { /* flat terrain */ }

        // Initial camera: cinematic arrival on Cité de Carcassonne
        viewer.camera.setView({
          destination: Cesium.Cartesian3.fromDegrees(2.3634, 43.2065, 800000),
          orientation: {
            heading: Cesium.Math.toRadians(10),
            pitch: Cesium.Math.toRadians(-45),
            roll: 0,
          },
        })

        // Cinematic fly-in toward Carcassonne — stay high enough for global view
        setTimeout(() => {
          if (viewer.isDestroyed()) return
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(2.3634, 43.2065, 350000),
            orientation: {
              heading: Cesium.Math.toRadians(-5),
              pitch: Cesium.Math.toRadians(-50),
              roll: 0,
            },
            duration: 4.0,
          })
        }, 3500)

        // Click handler
        const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        handler.setInputAction((evt: any) => {
          const picked = scene.pick(evt.position)
          if (Cesium.defined(picked) && picked.id && picked.id._placeData) {
            callbacksRef.current.onPlaceSelect(picked.id._placeData)
          }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

        // Camera-center lat/lng emitted on moveEnd (fires when panning/zoom settles)
        viewer.camera.moveEnd.addEventListener(() => {
          if (!callbacksRef.current.onCameraMove) return
          const canvas = scene.canvas
          const center = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2)
          const cartesian = viewer.camera.pickEllipsoid(center, scene.globe.ellipsoid)
          if (!cartesian) return
          const carto = Cesium.Cartographic.fromCartesian(cartesian)
          callbacksRef.current.onCameraMove(
            Cesium.Math.toDegrees(carto.latitude),
            Cesium.Math.toDegrees(carto.longitude),
          )
        })

        readyRef.current = true
        setViewerReady(true)

        // Execute any pending flyTo
        const pending = callbacksRef.current.selectedPlace
        if (pending && callbacksRef.current.flyToTrigger > 0) {
          viewer.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(pending.longitude, pending.latitude, 25000),
            orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90), roll: 0 },
            duration: 1.5,
          })
        }

      } catch (err) {
        console.error('[GlobeView] Init failed:', err)
      }
    })()

    return () => {
      destroyed = true
      readyRef.current = false
      setViewerReady(false)
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy()
        viewerRef.current = null
      }
    }
  }, [])

  // ─── Sync markers ───
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return

    viewer.entities.removeAll()
    highlightRef.current = null

    places.forEach((place) => {
      const color = getCategoryColor(place.categoryPrimary)
      const cc = Cesium.Color.fromCssColorString(color)
      const icon = getCategoryIcon(place.categoryPrimary)

      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(place.longitude, place.latitude),
        point: {
          pixelSize: place.isFeatured ? 14 : 9,
          color: cc.withAlpha(0.9),
          outlineColor: cc.withAlpha(0.3),
          outlineWidth: place.isFeatured ? 6 : 3,
          scaleByDistance: new Cesium.NearFarScalar(1e3, 1.8, 8e6, 0.4),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `${icon} ${place.title}`,
          font: place.isFeatured ? 'bold 13px Inter, sans-serif' : '12px Inter, sans-serif',
          fillColor: Cesium.Color.WHITE.withAlpha(0.95),
          outlineColor: Cesium.Color.BLACK.withAlpha(0.7),
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          horizontalOrigin: Cesium.HorizontalOrigin.CENTER,
          pixelOffset: new Cesium.Cartesian2(0, -18),
          scaleByDistance: new Cesium.NearFarScalar(1e3, 1, 4e6, 0),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 400000),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(entity as any)._placeData = place
    })
  }, [places, viewerReady])

  // ─── Fly to selected place (or an explicit epic target) ───
  useEffect(() => {
    if (flyToTrigger === 0) return
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return

    // Prefer the selected place; otherwise use the explicit fly target.
    const target = selectedPlace ?? flyToCoords
    if (!target) return

    // Remove previous highlight
    if (highlightRef.current) {
      viewer.entities.remove(highlightRef.current)
      highlightRef.current = null
    }

    // Add highlight circle only for an actual selected place
    if (selectedPlace) {
      const color = Cesium.Color.fromCssColorString(getCategoryColor(selectedPlace.categoryPrimary))
      highlightRef.current = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(selectedPlace.longitude, selectedPlace.latitude),
        ellipse: {
          semiMinorAxis: 2000,
          semiMajorAxis: 2000,
          material: color.withAlpha(0.2),
          outline: true,
          outlineColor: color.withAlpha(0.5),
          outlineWidth: 2,
        },
      })
    }

    // Fly directly above the point
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        target.longitude,
        target.latitude,
        25000,
      ),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-90),
        roll: 0,
      },
      duration: 1.5,
    })
  }, [flyToTrigger, selectedPlace, flyToCoords])

  // ─── Draw epic connection lines ───
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer || viewer.isDestroyed()) return

    // Remove previous lines
    linesRef.current.forEach(e => {
      if (!viewer.isDestroyed()) viewer.entities.remove(e)
    })
    linesRef.current = []

    if (!epicLines || !epicLines.placeSlugs.length) return

    // Find matching places in order
    const epicPlaces = epicLines.placeSlugs
      .map(slug => places.find(p => p.slug === slug))
      .filter((p): p is PlaceEntry => p !== undefined)

    if (epicPlaces.length < 2) return

    const lineColor = Cesium.Color.fromCssColorString(epicLines.color).withAlpha(0.6)

    // Draw lines between consecutive places
    for (let i = 0; i < epicPlaces.length - 1; i++) {
      const from = epicPlaces[i]
      const to = epicPlaces[i + 1]
      const entity = viewer.entities.add({
        polyline: {
          positions: Cesium.Cartesian3.fromDegreesArray([
            from.longitude, from.latitude,
            to.longitude, to.latitude,
          ]),
          width: 2,
          material: new Cesium.PolylineGlowMaterialProperty({
            glowPower: 0.3,
            color: lineColor,
          }),
          clampToGround: true,
        },
      })
      linesRef.current.push(entity)
    }
  }, [epicLines, places, viewerReady])

  return (
    <div ref={containerRef} className="w-full h-full" style={{ background: '#05060d' }} />
  )
}
