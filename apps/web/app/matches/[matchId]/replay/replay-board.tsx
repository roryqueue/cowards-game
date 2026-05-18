"use client"

import { useEffect, useRef } from "react"
import {
  Application,
  Container as PixiContainer,
  Graphics,
  Text,
  TextStyle,
} from "pixi.js"
import type { Position } from "@cowards/spec"
import type { ReplayReadyDto, ReplayTimelineEntryDto } from "../../types.js"
import {
  buildReplayBoardModel,
  type BoardEventCalloutDescriptor,
  type BoardSoldierDescriptor,
  type ReplayBoardModel,
} from "./replay-board-model.js"

export interface ReplayBoardProps {
  data: ReplayReadyDto
  selectedSequence: number
  selectedSoldierId: string | null
  selectedEvent: ReplayTimelineEntryDto
  scrubbing: boolean
  onSelectSoldier: (soldierId: string) => void
}

const animationDurationMs = 240
const boardPadding = 24

const colorValue = (color: string): number =>
  Number.parseInt(color.slice(1), 16)

const boardDimensions = (model: ReplayBoardModel) => {
  const { arenaBounds: bounds } = model
  return {
    columns: bounds.maxX - bounds.minX + 1,
    rows: bounds.maxY - bounds.minY + 1,
  }
}

const createProjector = (
  model: ReplayBoardModel,
  width: number,
  height: number,
) => {
  const dimensions = boardDimensions(model)
  const cellSize = Math.max(
    12,
    Math.min(
      (width - boardPadding * 2) / dimensions.columns,
      (height - boardPadding * 2) / dimensions.rows,
    ),
  )
  const boardWidth = cellSize * dimensions.columns
  const boardHeight = cellSize * dimensions.rows
  const originX = (width - boardWidth) / 2
  const originY = (height - boardHeight) / 2

  return {
    cellSize,
    originX,
    originY,
    boardWidth,
    boardHeight,
    point(position: Position) {
      return {
        x:
          originX +
          (position.x - model.arenaBounds.minX) * cellSize +
          cellSize / 2,
        y:
          originY +
          (position.y - model.arenaBounds.minY) * cellSize +
          cellSize / 2,
      }
    },
  }
}

const lerp = (from: number, to: number, progress: number): number =>
  from + (to - from) * progress

const interpolatePosition = (
  from: Position,
  to: Position,
  progress: number,
): Position => ({
  x: lerp(from.x, to.x, progress),
  y: lerp(from.y, to.y, progress),
})

const interpolatePlayableBounds = (
  model: ReplayBoardModel,
  progress: number,
) => ({
  minX: lerp(model.bounds.previousMinX, model.bounds.minX, progress),
  maxX: lerp(model.bounds.previousMaxX, model.bounds.maxX, progress),
  minY: lerp(model.bounds.previousMinY, model.bounds.minY, progress),
  maxY: lerp(model.bounds.previousMaxY, model.bounds.maxY, progress),
})

const drawBoundsRect = (
  graphics: Graphics,
  model: ReplayBoardModel,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  width: number,
  height: number,
  radius = 8,
) => {
  const projection = createProjector(model, width, height)
  const left =
    projection.originX +
    (bounds.minX - model.arenaBounds.minX) * projection.cellSize
  const top =
    projection.originY +
    (bounds.minY - model.arenaBounds.minY) * projection.cellSize
  const rectWidth = (bounds.maxX - bounds.minX + 1) * projection.cellSize
  const rectHeight = (bounds.maxY - bounds.minY + 1) * projection.cellSize

  graphics.roundRect(left, top, rectWidth, rectHeight, radius)
}

const drawGrid = (
  graphics: Graphics,
  model: ReplayBoardModel,
  width: number,
  height: number,
  progress: number,
) => {
  const projection = createProjector(model, width, height)
  const playableBounds = interpolatePlayableBounds(model, progress)
  graphics.clear()
  graphics.setFillStyle({ color: 0xe8ece6 })
  graphics.roundRect(
    projection.originX,
    projection.originY,
    projection.boardWidth,
    projection.boardHeight,
    8,
  )
  graphics.fill()
  graphics.setStrokeStyle({
    width: 1,
    color: colorValue(model.bounds.stroke),
    alpha: 0.72,
  })

  for (let column = 0; column <= boardDimensions(model).columns; column += 1) {
    const x = projection.originX + column * projection.cellSize
    graphics.moveTo(x, projection.originY)
    graphics.lineTo(x, projection.originY + projection.boardHeight)
  }
  for (let row = 0; row <= boardDimensions(model).rows; row += 1) {
    const y = projection.originY + row * projection.cellSize
    graphics.moveTo(projection.originX, y)
    graphics.lineTo(projection.originX + projection.boardWidth, y)
  }
  graphics.stroke()

  graphics.setFillStyle({ color: 0x17201a, alpha: 0.16 })
  const left =
    projection.originX +
    (playableBounds.minX - model.arenaBounds.minX) * projection.cellSize
  const right =
    projection.originX +
    (playableBounds.maxX - model.arenaBounds.minX + 1) * projection.cellSize
  const top =
    projection.originY +
    (playableBounds.minY - model.arenaBounds.minY) * projection.cellSize
  const bottom =
    projection.originY +
    (playableBounds.maxY - model.arenaBounds.minY + 1) * projection.cellSize

  graphics.rect(
    projection.originX,
    projection.originY,
    projection.boardWidth,
    Math.max(0, top - projection.originY),
  )
  graphics.rect(
    projection.originX,
    bottom,
    projection.boardWidth,
    Math.max(0, projection.originY + projection.boardHeight - bottom),
  )
  graphics.rect(
    projection.originX,
    top,
    Math.max(0, left - projection.originX),
    Math.max(0, bottom - top),
  )
  graphics.rect(
    right,
    top,
    Math.max(0, projection.originX + projection.boardWidth - right),
    Math.max(0, bottom - top),
  )
  graphics.fill()

  graphics.setStrokeStyle({
    width: model.bounds.contractionActive ? 5 : 2,
    color: colorValue(model.bounds.contractionStroke),
  })
  drawBoundsRect(graphics, model, playableBounds, width, height)
  graphics.stroke()

  graphics.setStrokeStyle({ width: 2, color: 0xffffff, alpha: 0.66 })
  graphics.roundRect(
    projection.originX,
    projection.originY,
    projection.boardWidth,
    projection.boardHeight,
    8,
  )
  graphics.stroke()
}

const drawTerrain = (
  graphics: Graphics,
  model: ReplayBoardModel,
  width: number,
  height: number,
) => {
  const projection = createProjector(model, width, height)
  for (const terrain of model.terrain) {
    const point = projection.point(terrain.position)
    const size = projection.cellSize * 0.72
    graphics.setFillStyle({ color: colorValue(terrain.fill), alpha: 0.88 })
    graphics.rect(point.x - size / 2, point.y - size / 2, size, size)
    graphics.fill()
    graphics.setStrokeStyle({ width: 2, color: 0xffffff, alpha: 0.52 })
    graphics.moveTo(point.x - size / 2, point.y + size / 2)
    graphics.lineTo(point.x + size / 2, point.y - size / 2)
    graphics.stroke()
  }
}

const drawFacing = (
  graphics: Graphics,
  soldier: BoardSoldierDescriptor,
  center: Position,
  radius: number,
) => {
  if (!soldier.facing) {
    return
  }
  const offsets = {
    UP: { x: 0, y: -radius },
    DOWN: { x: 0, y: radius },
    LEFT: { x: -radius, y: 0 },
    RIGHT: { x: radius, y: 0 },
  }
  const target = offsets[soldier.facing]
  graphics.setStrokeStyle({ width: 3, color: 0xffffff })
  graphics.moveTo(center.x, center.y)
  graphics.lineTo(center.x + target.x, center.y + target.y)
  graphics.stroke()
}

const fallTarget = (model: ReplayBoardModel, position: Position): Position => {
  const centerX = (model.arenaBounds.minX + model.arenaBounds.maxX) / 2
  const centerY = (model.arenaBounds.minY + model.arenaBounds.maxY) / 2
  const dx = Math.abs(position.x - centerX)
  const dy = Math.abs(position.y - centerY)

  if (dx > dy) {
    return {
      x:
        position.x < centerX
          ? model.arenaBounds.minX - 0.8
          : model.arenaBounds.maxX + 0.8,
      y: position.y,
    }
  }

  return {
    x: position.x,
    y:
      position.y < centerY
        ? model.arenaBounds.minY - 0.8
        : model.arenaBounds.maxY + 0.8,
  }
}

const renderSoldierPosition = (
  soldier: BoardSoldierDescriptor,
  model: ReplayBoardModel,
  progress: number,
): Position | null => {
  if (soldier.position && soldier.previousPosition) {
    if (
      soldier.transition === "move" ||
      soldier.transition === "pushed" ||
      soldier.transition === "stone" ||
      soldier.transition === "backstab"
    ) {
      return interpolatePosition(
        soldier.previousPosition,
        soldier.position,
        progress,
      )
    }
    return soldier.position
  }

  if (
    soldier.transition === "fall" &&
    soldier.previousPosition &&
    !soldier.position
  ) {
    return interpolatePosition(
      soldier.previousPosition,
      fallTarget(model, soldier.previousPosition),
      progress,
    )
  }

  return soldier.position
}

const drawSoldier = (
  layer: PixiContainer,
  soldier: BoardSoldierDescriptor,
  model: ReplayBoardModel,
  width: number,
  height: number,
  onSelectSoldier: (soldierId: string) => void,
  progress: number,
) => {
  const renderPosition = renderSoldierPosition(soldier, model, progress)
  if (!renderPosition) {
    return
  }

  const projection = createProjector(model, width, height)
  const point = projection.point(renderPosition)
  const radius =
    projection.cellSize *
    (soldier.transition === "stone"
      ? lerp(0.32, 0.38, progress)
      : soldier.transition === "fall"
        ? lerp(0.32, 0.2, progress)
        : 0.32)
  const graphics = new Graphics()
  const alpha =
    soldier.transition === "fall" && soldier.status === "FALLEN"
      ? lerp(1, 0.18, progress)
      : 1
  graphics.alpha = alpha
  graphics.eventMode = "static"
  graphics.cursor = "pointer"
  graphics.on("pointertap", () => onSelectSoldier(soldier.id))
  graphics.setFillStyle({ color: colorValue(soldier.fill) })

  if (soldier.shape === "stone-diamond") {
    graphics.moveTo(point.x, point.y - radius)
    graphics.lineTo(point.x + radius, point.y)
    graphics.lineTo(point.x, point.y + radius)
    graphics.lineTo(point.x - radius, point.y)
    graphics.closePath()
    graphics.fill()
  } else {
    graphics.circle(point.x, point.y, radius)
    graphics.fill()
  }

  if (soldier.selected) {
    graphics.setStrokeStyle({ width: 4, color: 0xffffff })
    graphics.circle(point.x, point.y, radius + 5)
    graphics.stroke()
  }

  if (soldier.texture === "cracked") {
    graphics.setStrokeStyle({ width: 2, color: 0xffffff, alpha: 0.64 })
    graphics.moveTo(point.x - radius * 0.5, point.y - radius * 0.4)
    graphics.lineTo(point.x + radius * 0.4, point.y + radius * 0.3)
    graphics.moveTo(point.x + radius * 0.3, point.y - radius * 0.5)
    graphics.lineTo(point.x - radius * 0.2, point.y + radius * 0.5)
    graphics.stroke()
  }

  drawFacing(graphics, soldier, point, radius)
  layer.addChild(graphics)

  const badge = new Text({
    text: soldier.shortLabel,
    style: new TextStyle({
      fill: "#ffffff",
      fontFamily: "Arial",
      fontSize: Math.max(11, projection.cellSize * 0.22),
      fontWeight: "700",
    }),
  })
  badge.alpha = alpha
  badge.anchor.set(0.5)
  badge.position.set(point.x, point.y)
  layer.addChild(badge)

  if (soldier.transition === "fall" && progress > 0.72) {
    const marker = new Graphics()
    marker.setStrokeStyle({ width: 3, color: 0x6e5acb, alpha: 0.8 })
    marker.moveTo(point.x - radius, point.y - radius)
    marker.lineTo(point.x + radius, point.y + radius)
    marker.moveTo(point.x + radius, point.y - radius)
    marker.lineTo(point.x - radius, point.y + radius)
    marker.stroke()
    layer.addChild(marker)
  }
}

const drawCallout = (
  layer: PixiContainer,
  callout: BoardEventCalloutDescriptor | null,
  model: ReplayBoardModel,
  width: number,
  height: number,
  progress: number,
) => {
  if (!callout) {
    return
  }

  const projection = createProjector(model, width, height)
  const graphics = new Graphics()
  const center = {
    x: projection.originX + projection.boardWidth / 2,
    y: projection.originY + projection.boardHeight / 2,
  }
  const from = callout.from ? projection.point(callout.from) : center
  const to = callout.to ? projection.point(callout.to) : center
  const color = colorValue(callout.color)
  const pulse = 1 + progress * 0.24

  graphics.setStrokeStyle({ width: 6, color, alpha: 0.78 })
  if (callout.variant === "backstab" || callout.variant === "push") {
    graphics.moveTo(from.x, from.y)
    graphics.lineTo(to.x, to.y)
    graphics.stroke()
  } else {
    graphics.circle(to.x, to.y, projection.cellSize * pulse)
    graphics.stroke()
  }

  graphics.setFillStyle({ color, alpha: 0.9 })
  graphics.roundRect(to.x - 52, to.y - 18, 104, 28, 6)
  graphics.fill()

  const label = new Text({
    text: callout.label,
    style: new TextStyle({
      fill: "#ffffff",
      fontFamily: "Arial",
      fontSize: Math.max(12, projection.cellSize * 0.22),
      fontWeight: "700",
    }),
  })
  label.anchor.set(0.5)
  label.position.set(to.x, to.y - 4)
  layer.addChild(graphics)
  layer.addChild(label)
}

const renderBoard = (
  app: Application,
  model: ReplayBoardModel,
  onSelectSoldier: (soldierId: string) => void,
  progress: number,
) => {
  const width = app.renderer.width
  const height = app.renderer.height
  const root = new PixiContainer()
  const graphics = new Graphics()

  drawGrid(graphics, model, width, height, progress)
  drawTerrain(graphics, model, width, height)
  root.addChild(graphics)

  const soldierLayer = new PixiContainer()
  for (const soldier of model.soldiers) {
    drawSoldier(
      soldierLayer,
      soldier,
      model,
      width,
      height,
      onSelectSoldier,
      progress,
    )
  }
  root.addChild(soldierLayer)

  const callout = new PixiContainer()
  drawCallout(callout, model.callout, model, width, height, progress)
  root.addChild(callout)

  for (const child of app.stage.removeChildren()) {
    child.destroy({ children: true })
  }
  app.stage.addChild(root)
}

export function ReplayBoard({
  data,
  selectedSequence,
  selectedSoldierId,
  selectedEvent,
  scrubbing,
  onSelectSoldier,
}: ReplayBoardProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const appRef = useRef<Application | null>(null)
  const frameRef = useRef(0)
  const renderLatestRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const host = hostRef.current
    const canvas = canvasRef.current
    if (!host || !canvas) {
      return
    }

    let destroyed = false
    const app = new Application()
    const redraw = () => renderLatestRef.current?.()

    const boot = async () => {
      await app.init({
        antialias: true,
        autoDensity: true,
        backgroundAlpha: 0,
        canvas,
        resizeTo: host,
      })
      if (destroyed) {
        app.destroy({ removeView: false }, { children: true })
        return
      }
      appRef.current = app
      app.canvas.setAttribute("aria-label", "Replay board canvas")
      window.addEventListener("resize", redraw)
      redraw()
    }

    void boot()

    return () => {
      destroyed = true
      window.cancelAnimationFrame(frameRef.current)
      window.removeEventListener("resize", redraw)
      if (appRef.current === app) {
        appRef.current = null
      }
      renderLatestRef.current = null
      app.destroy({ removeView: false }, { children: true })
    }
  }, [])

  useEffect(() => {
    const model = buildReplayBoardModel(
      data,
      selectedSequence,
      selectedSoldierId,
    )
    const start = window.performance.now()
    const duration = scrubbing ? 0 : animationDurationMs

    const draw = () => {
      const app = appRef.current
      if (!app) {
        return
      }
      const elapsed = window.performance.now() - start
      const progress = duration === 0 ? 1 : Math.min(elapsed / duration, 1)
      app.canvas.setAttribute("title", selectedEvent.label)
      renderBoard(app, model, onSelectSoldier, progress)
      if (progress < 1) {
        frameRef.current = window.requestAnimationFrame(draw)
      }
    }

    renderLatestRef.current = draw
    window.cancelAnimationFrame(frameRef.current)
    draw()

    return () => window.cancelAnimationFrame(frameRef.current)
  }, [
    data,
    onSelectSoldier,
    scrubbing,
    selectedEvent.label,
    selectedSequence,
    selectedSoldierId,
  ])

  return (
    <div
      aria-label={`Replay board at sequence ${selectedSequence}, ${selectedEvent.type}`}
      className="replay-board-host"
      ref={hostRef}
      role="img"
      title={selectedEvent.label}
    >
      <canvas
        aria-label="Replay board canvas"
        ref={canvasRef}
        title={selectedEvent.label}
      />
      <p aria-live="polite" className="replay-board-status">
        Sequence {selectedSequence} · {selectedEvent.type}
      </p>
    </div>
  )
}
