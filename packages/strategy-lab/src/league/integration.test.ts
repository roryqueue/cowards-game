import { mkdtempSync, readdirSync, realpathSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"
import {
  LEAGUE_EVALUATION_FIXTURES,
  createLeagueRepository,
  reopenLeagueEvidence,
} from "../index.js"

const directories: string[] = []
afterEach(() => directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true })))

describe("injected league integration boundary", () => {
  it("keeps the retained/reopen seam private, read-only, and nonempirical", () => {
    const directory = realpathSync(mkdtempSync(join(tmpdir(), "league-integration-source-only-")))
    directories.push(directory)
    const repository = createLeagueRepository(directory)

    expect(LEAGUE_EVALUATION_FIXTURES).toHaveLength(16)
    expect(reopenLeagueEvidence(repository, { maxBytes: 64 * 1024, maxRecords: 8 })).toMatchObject({
      issued: false,
      records: [],
      remnants: [],
    })
    expect(readdirSync(directory)).toEqual([])
    expect(LEAGUE_EVALUATION_FIXTURES.every((fixture) => fixture.empiricalRequirementsComplete === false)).toBe(true)
  })
})
