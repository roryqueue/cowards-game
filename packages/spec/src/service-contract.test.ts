import { describe, expect, it } from "vitest"
import { z } from "zod"
import serviceApiArtifact from "../artifacts/service-api-v1.8.openapi.json" with { type: "json" }
import {
  assertPublicServiceDtoLeakSafe,
  SERVICE_API_ROUTES,
} from "./service.js"
import {
  PublicMatchSetSummaryServiceDtoSchema,
  PublicPlayerPageServiceDtoSchema,
  PublicReplayMetadataServiceDtoSchema,
  PublicStrategyPageServiceDtoSchema,
} from "./schemas.js"
import { SERVICE_API_FIXTURES } from "./service-fixtures.js"

const forbiddenPublicPropertyNames = new Set([
  "source",
  "strategySource",
  "strategyMemory",
  "soldierMemory",
  "objective",
  "objectivePayload",
  "ownerDebug",
  "exactAwarenessGrid",
  "awarenessGrid",
  "rawRuntimeDetails",
  "privateRuntime",
  "privateDiagnostics",
  "stack",
  "stackTrace",
  "stderr",
  "session",
  "sessions",
  "token",
  "tokens",
  "hostPath",
  "hostPaths",
  "runtimeInternal",
  "runtimeInternals",
  "privateRuntimeInternal",
  "privateRuntimeInternals",
])

const findForbiddenSchemaProperty = (
  value: unknown,
  path = "$",
): string | null => {
  if (Array.isArray(value)) {
    for (const [index, item] of value.entries()) {
      const found = findForbiddenSchemaProperty(item, `${path}[${index}]`)
      if (found) {
        return found
      }
    }
    return null
  }
  if (value === null || typeof value !== "object") {
    return null
  }
  for (const [key, entryValue] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (key === "properties" && entryValue && typeof entryValue === "object") {
      for (const propertyName of Object.keys(
        entryValue as Record<string, unknown>,
      )) {
        if (forbiddenPublicPropertyNames.has(propertyName)) {
          return `${path}.properties.${propertyName}`
        }
      }
    }
    const found = findForbiddenSchemaProperty(entryValue, `${path}.${key}`)
    if (found) {
      return found
    }
  }
  return null
}

describe("service contract metadata", () => {
  it("commits the generated OpenAPI 3.1 service artifact", () => {
    expect(serviceApiArtifact.openapi).toBe("3.1.0")
    expect(serviceApiArtifact.info.version).toBe("service-api-v1.8")
  })

  it("declares complete route metadata and resolvable fixture refs", () => {
    for (const [routeId, route] of Object.entries(SERVICE_API_ROUTES)) {
      expect(route.id).toBe(routeId)
      expect(route.operationId).toMatch(/^[a-z][A-Za-z0-9]+$/)
      expect(["GET", "POST", "DELETE"]).toContain(route.method)
      expect(route.path).toMatch(/^\//)
      expect(route.authScope).toBeTruthy()
      expect(route.privacyClass).toBeTruthy()
      expect(route.request.params.parse).toBeTypeOf("function")
      expect(route.request.query.parse).toBeTypeOf("function")
      expect(route.request.body.parse).toBeTypeOf("function")
      expect(route.response.parse).toBeTypeOf("function")
      expect(route.error.parse).toBeTypeOf("function")
      expect(route.examples.length > 0).toBe(true)
      expect(route.fixtureRefs.length > 0).toBe(true)

      for (const fixtureRef of route.fixtureRefs) {
        expect(SERVICE_API_FIXTURES).toHaveProperty(fixtureRef)
      }
    }
  })

  it("parses every response example with the route response schema", () => {
    for (const route of Object.values(SERVICE_API_ROUTES)) {
      for (const example of route.examples) {
        expect(() => route.response.parse(example)).not.toThrow()
      }
    }
  })

  it("keeps public examples and public schemas free of private fields", () => {
    for (const route of Object.values(SERVICE_API_ROUTES)) {
      if (route.privacyClass !== "public") {
        continue
      }
      for (const example of route.examples) {
        expect(() => assertPublicServiceDtoLeakSafe(example)).not.toThrow()
      }
    }

    for (const schema of [
      PublicMatchSetSummaryServiceDtoSchema,
      PublicPlayerPageServiceDtoSchema,
      PublicReplayMetadataServiceDtoSchema,
      PublicStrategyPageServiceDtoSchema,
    ]) {
      const jsonSchema = z.toJSONSchema(schema)
      expect(findForbiddenSchemaProperty(jsonSchema)).toBeNull()
    }
  })

  it("only exposes public route examples as public artifact examples", () => {
    const publicExamples: unknown[] = Object.values(SERVICE_API_ROUTES).flatMap(
      (route) => (route.privacyClass === "public" ? [...route.examples] : []),
    )
    const nonPublicExamples: unknown[] = Object.values(
      SERVICE_API_ROUTES,
    ).flatMap((route) =>
      route.privacyClass === "public" ? [] : [...route.examples],
    )

    expect(publicExamples.length).toBeGreaterThan(0)
    for (const example of nonPublicExamples) {
      expect(publicExamples).not.toContain(example)
    }
  })
})
