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
  const { bounds } = model
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
        x: originX + (position.x - model.bounds.minX) * cellSize + cellSize / 2,
        y: originY + (position.y - model.bounds.minY) * cellSize + cellSize / 2,
      }
    },
  }
}

const drawGrid = (
  graphics: Graphics,
  model: ReplayBoardModel,
  width: number,
  height: number,
) => {
  const projection = createProjector(model, width, height)
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
  graphics.setStrokeStyle({ width: 1, color: colorValue(model.bounds.stroke) })

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

  graphics.setStrokeStyle({
    width: model.bounds.contractionActive ? 5 : 2,
    color: colorValue(model.bounds.contractionStroke),
  })
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

const drawSoldier = (
  layer: PixiContainer,
  soldier: BoardSoldierDescriptor,
  model: ReplayBoardModel,
  width: number,
  height: number,
  onSelectSoldier: (soldierId: string) => void,
) => {
  if (!soldier.position) {
    return
  }

  const projection = createProjector(model, width, height)
  const point = projection.point(soldier.position)
  const radius = projection.cellSize * 0.32
  const graphics = new Graphics()
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
  badge.anchor.set(0.5)
  badge.position.set(point.x, point.y)
  layer.addChild(badge)
}

const drawCallout = (
  graphics: Graphics,
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

  drawGrid(graphics, model, width, height)
  drawTerrain(graphics, model, width, height)
  root.addChild(graphics)

  const soldierLayer = new PixiContainer()
  for (const soldier of model.soldiers) {
    drawSoldier(soldierLayer, soldier, model, width, height, onSelectSoldier)
  }
  root.addChild(soldierLayer)

  const callout = new Graphics()
  drawCallout(callout, model.callout, model, width, height, progress)
  root.addChild(callout)

  app.stage.removeChildren()
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

  useEffect(() => {
    const host = hostRef.current
    if (!host) {
      return
    }

    let frame = 0
    let resizeObserver: ResizeObserver | null = null
    let destroyed = false
    const model = buildReplayBoardModel(
      data,
      selectedSequence,
      selectedSoldierId,
    )

    const start = performance.now()
    const duration = scrubbing ? 0 : animationDurationMs
    const app = new Application()

    const boot = async () => {
      await app.init({
        antialias: true,
        autoDensity: true,
        backgroundAlpha: 0,
        resizeTo: host,
      })
      if (destroyed) {
        app.destroy()
        return
      }
      host.replaceChildren(app.canvas)
      app.canvas.setAttribute("aria-label", "Replay board canvas")
      app.canvas.setAttribute("title", selectedEvent.label)

      const draw = () => {
        const elapsed = performance.now() - start
        const progress = duration === 0 ? 1 : Math.min(elapsed / duration, 1)
        renderBoard(app, model, onSelectSoldier, progress)
        if (progress < 1) {
          frame = window.requestAnimationFrame(draw)
        }
      }

      resizeObserver = new ResizeObserver(draw)
      resizeObserver.observe(host)
      draw()
    }

    void boot()

    return () => {
      destroyed = true
      window.cancelAnimationFrame(frame)
      resizeObserver?.disconnect()
      app.destroy()
    }
  }, [
    data,
    onSelectSoldier,
    scrubbing,
    selectedEvent.label,
    selectedSequence,
    selectedSoldierId,
  ])

  return (
    <div className="replay-board-host" ref={hostRef}>
      <p className="replay-board-status">
        Sequence {selectedSequence} · {selectedEvent.type}
      </p>
    </div>
  )
}
