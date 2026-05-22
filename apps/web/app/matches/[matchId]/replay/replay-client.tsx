"use client"

import { useEffect, useMemo, useState } from "react"
import type { ReplayReadyDto } from "../../types.js"
import {
  canShowOwnerDebug,
  formatTimelinePosition,
  getCurrentPositionSummary,
  getEventInspector,
  getInitialReplaySequence,
  getOwnerAwarenessGridInspection,
  getSoldierInactivityExplanation,
  getSoldierInspector,
  getTimelineEntryAt,
  groupTimelineEntries,
  stepReplayIndex,
} from "./replay-state.js"
import { ReplayBoard } from "./replay-board.js"
import {
  defaultReplaySpeed,
  getPlaybackIntervalMs,
  replaySpeedOptions,
  type ReplaySpeedValue,
} from "./replay-playback.js"

export interface ReplayClientProps {
  data: ReplayReadyDto
}

const shortId = (id: string): string =>
  id.length <= 18 ? id : `${id.slice(0, 10)}...${id.slice(-6)}`

const firstSoldierId = (data: ReplayReadyDto): string | null =>
  data.states[0]?.board.soldiers[0]?.id ?? null

export function ReplayClient({ data }: ReplayClientProps) {
  const initialIndex = data.timeline.findIndex(
    (entry) => entry.sequence === getInitialReplaySequence(data),
  )
  const [selectedIndex, setSelectedIndex] = useState(
    initialIndex >= 0 ? initialIndex : 0,
  )
  const [playing, setPlaying] = useState(false)
  const [selectedSoldierId, setSelectedSoldierId] = useState<string | null>(
    firstSoldierId(data),
  )
  const [scrubbing, setScrubbing] = useState(false)
  const [ownerDebugVisible, setOwnerDebugVisible] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] =
    useState<ReplaySpeedValue>(defaultReplaySpeed)

  const selectedEntry = getTimelineEntryAt(data, selectedIndex)
  const summary = getCurrentPositionSummary(data, selectedEntry)
  const eventInspector = getEventInspector(selectedEntry)
  const soldierInspector = getSoldierInspector(
    data,
    selectedSoldierId,
    selectedEntry.sequence,
  )
  const soldierInactivityExplanation = getSoldierInactivityExplanation(
    data,
    selectedSoldierId,
    selectedEntry.sequence,
  )
  const awarenessGrid = getOwnerAwarenessGridInspection(data, selectedEntry)
  const groups = useMemo(
    () => groupTimelineEntries(data.timeline),
    [data.timeline],
  )
  const timelineEntryBySequence = useMemo(
    () => new Map(data.timeline.map((entry) => [entry.sequence, entry])),
    [data.timeline],
  )
  const playbackIntervalMs = getPlaybackIntervalMs(playbackSpeed)
  const ownerDebugAvailable = canShowOwnerDebug(data)
  const statusLabel = data.mode === "owner" ? "Owner debug" : "Public view"

  useEffect(() => {
    if (!playing) {
      return
    }
    const interval = window.setInterval(() => {
      setSelectedIndex((current) => {
        const next = stepReplayIndex(current, 1, data.timeline.length)
        if (next === current) {
          window.clearInterval(interval)
          setPlaying(false)
        }
        return next
      })
    }, playbackIntervalMs)
    return () => window.clearInterval(interval)
  }, [data.timeline.length, playbackIntervalMs, playing])

  const step = (direction: -1 | 1) => {
    setPlaying(false)
    setSelectedIndex((current) =>
      stepReplayIndex(current, direction, data.timeline.length),
    )
  }

  return (
    <main className="replay-page">
      <header className="replay-header">
        <div>
          <p className="replay-product-label">Coward&apos;s Game</p>
          <h1>Replay</h1>
          <p className="replay-mono" title={data.metadata.matchId}>
            {shortId(data.metadata.matchId)}
          </p>
        </div>
        <span className="replay-status-chip">{statusLabel}</span>
      </header>

      <section className="replay-shell" aria-label="Match replay">
        <aside className="replay-rail" aria-label="Match metadata">
          <p className="replay-label">Match</p>
          <p className="replay-mono" title={data.metadata.matchId}>
            {shortId(data.metadata.matchId)}
          </p>
          <p className="replay-label">Outcome</p>
          <p>{summary.outcome}</p>
          <p className="replay-label">Events</p>
          <p>{data.metadata.eventCount}</p>
        </aside>

        <section className="replay-center" aria-label="Replay arena">
          {data.focus ? (
            <div
              className={`replay-focus-banner ${data.focus.fallback === "none" ? "" : "warning"}`}
              data-testid="replay-focus-banner"
            >
              <strong>{data.focus.label}</strong>
              <span>
                Sequence {data.focus.resolvedSequence}
                {data.focus.fallback === "none"
                  ? ""
                  : " · opened at Match start"}
              </span>
            </div>
          ) : null}

          <div className="replay-arena-placeholder" aria-label="Replay board">
            <ReplayBoard
              data={data}
              selectedSequence={selectedEntry.sequence}
              selectedSoldierId={selectedSoldierId}
              selectedEvent={selectedEntry}
              scrubbing={scrubbing}
              onSelectSoldier={setSelectedSoldierId}
            />
          </div>

          <div className="replay-position-panel">
            <p className="replay-label">Current position</p>
            <p className="replay-position">
              {formatTimelinePosition(selectedEntry)}
            </p>
            <p className="replay-muted">
              Sequence {selectedEntry.sequence} · {selectedEntry.type}
            </p>
          </div>

          <div className="replay-timeline" aria-label="Replay timeline panel">
            <label className="replay-label" htmlFor="replay-timeline">
              Replay timeline
            </label>
            <input
              id="replay-timeline"
              aria-label="Replay timeline"
              type="range"
              min={0}
              max={Math.max(data.timeline.length - 1, 0)}
              value={selectedIndex}
              onPointerDown={() => setScrubbing(true)}
              onPointerUp={() => setScrubbing(false)}
              onBlur={() => setScrubbing(false)}
              onChange={(event) => {
                setPlaying(false)
                setSelectedIndex(Number(event.currentTarget.value))
              }}
            />
            <div className="replay-playback-controls">
              <button
                type="button"
                aria-label="Step back"
                onClick={() => step(-1)}
              >
                Step back
              </button>
              <button
                type="button"
                aria-label={playing ? "Pause replay" : "Play replay"}
                onClick={() => setPlaying((current) => !current)}
              >
                {playing ? "Pause replay" : "Play replay"}
              </button>
              <button
                type="button"
                aria-label="Step forward"
                onClick={() => step(1)}
              >
                Step forward
              </button>
              <label
                className="replay-speed-control"
                htmlFor="replay-playback-speed"
              >
                <span className="replay-label">Speed</span>
                <select
                  id="replay-playback-speed"
                  aria-label="Replay speed"
                  value={playbackSpeed}
                  onChange={(event) =>
                    setPlaybackSpeed(
                      event.currentTarget.value as ReplaySpeedValue,
                    )
                  }
                >
                  {replaySpeedOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="replay-event-list" aria-label="Timeline events">
            {groups.map((round) => (
              <div key={round.label} className="replay-event-group">
                <p className="replay-label">{round.label}</p>
                {round.activations.map((activation) => (
                  <div key={`${round.label}:${activation.label}`}>
                    <p className="replay-muted">{activation.label}</p>
                    {activation.events.map((event) => {
                      const timelineEntry = timelineEntryBySequence.get(
                        event.sequence,
                      )
                      return (
                        <button
                          key={event.sequence}
                          type="button"
                          aria-label={`Timeline event ${event.sequence}: ${timelineEntry?.type ?? "UNKNOWN"}`}
                          aria-current={
                            event.sequence === selectedEntry.sequence
                              ? "step"
                              : undefined
                          }
                          className="replay-event-row"
                          onClick={() =>
                            setSelectedIndex(
                              data.timeline.findIndex(
                                (entry) => entry.sequence === event.sequence,
                              ),
                            )
                          }
                        >
                          <span>{event.label}</span>
                          <span>#{event.sequence}</span>
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        <aside className="replay-rail" aria-label="Replay inspector">
          <section>
            <p className="replay-label">Inspector</p>
            <dl className="replay-details-grid">
              <dt>Round</dt>
              <dd>{summary.round}</dd>
              <dt>Activation</dt>
              <dd>{summary.activation}</dd>
              <dt>Event</dt>
              <dd>{summary.currentEvent}</dd>
              <dt>Side</dt>
              <dd>{summary.activeSide}</dd>
            </dl>
          </section>

          {soldierInspector ? (
            <section>
              <p className="replay-label">
                Soldier {soldierInspector.shortLabel}
              </p>
              <dl className="replay-details-grid">
                <dt>ID</dt>
                <dd title={soldierInspector.fullId}>
                  {soldierInspector.fullId}
                </dd>
                <dt>Owner</dt>
                <dd>{soldierInspector.owner}</dd>
                <dt>Status</dt>
                <dd>{soldierInspector.status}</dd>
                <dt>Position</dt>
                <dd>{soldierInspector.position}</dd>
                <dt>Facing</dt>
                <dd>{soldierInspector.facing}</dd>
              </dl>
            </section>
          ) : null}

          {ownerDebugAvailable ? (
            <section>
              <label className="replay-debug-toggle">
                <input
                  data-testid="replay-owner-debug-toggle"
                  type="checkbox"
                  checked={ownerDebugVisible}
                  onChange={(event) =>
                    setOwnerDebugVisible(event.currentTarget.checked)
                  }
                />
                Owner debug
              </label>
              {ownerDebugVisible ? (
                <>
                  <div
                    className="replay-explanation-panel"
                    data-cause-code={
                      soldierInactivityExplanation?.causeCode ?? "NONE"
                    }
                    data-testid="replay-soldier-inactivity-explanation"
                  >
                    <p className="replay-label">Why this Soldier did nothing</p>
                    {soldierInactivityExplanation ? (
                      <dl className="replay-details-grid">
                        <dt>Cause</dt>
                        <dd>{soldierInactivityExplanation.label}</dd>
                        <dt>Code</dt>
                        <dd>{soldierInactivityExplanation.causeCode}</dd>
                        <dt>Next</dt>
                        <dd>{soldierInactivityExplanation.remediation}</dd>
                        <dt>Source event</dt>
                        <dd>
                          #{soldierInactivityExplanation.sourceEventSequence}
                        </dd>
                      </dl>
                    ) : (
                      <p className="replay-muted">
                        No inactivity explanation for this Soldier at this
                        position.
                      </p>
                    )}
                  </div>
                  {awarenessGrid ? (
                    <div
                      className="replay-awareness-grid"
                      aria-label="Awareness Grid"
                    >
                      <p className="replay-label">Awareness Grid</p>
                      <p className="replay-muted">
                        {awarenessGrid.soldierId} · Cycle{" "}
                        {awarenessGrid.cycle ?? "unknown"}
                      </p>
                      <div className="replay-awareness-cells">
                        {awarenessGrid.cells.map((cell) => (
                          <div
                            key={cell.key}
                            className="replay-awareness-cell"
                            title={`dx ${cell.dx}, dy ${cell.dy}`}
                          >
                            <span>{cell.contents}</span>
                            {cell.facing ? <small>{cell.facing}</small> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <pre className="replay-debug-panel">
                    {JSON.stringify(data.projection.ownerPrivate, null, 2)}
                  </pre>
                </>
              ) : null}
            </section>
          ) : null}

          <section>
            <p className="replay-label">Selected event</p>
            <dl className="replay-details-grid">
              <dt>Type</dt>
              <dd>{eventInspector.type}</dd>
              <dt>Sequence</dt>
              <dd>{eventInspector.sequence}</dd>
              <dt>Context</dt>
              <dd>{eventInspector.context}</dd>
              <dt>Privacy</dt>
              <dd>{eventInspector.privacyLabel}</dd>
            </dl>
          </section>

          <div className="replay-soldier-buttons" aria-label="Soldiers">
            {data.states[0]?.board.soldiers.map((soldier) => (
              <button
                key={soldier.id}
                type="button"
                aria-pressed={soldier.id === selectedSoldierId}
                onClick={() => setSelectedSoldierId(soldier.id)}
              >
                Soldier {soldier.ownerPlayerId}:{soldier.id.split(":").at(-1)}
              </button>
            ))}
          </div>
        </aside>
      </section>
    </main>
  )
}
