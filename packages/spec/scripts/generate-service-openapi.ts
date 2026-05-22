#!/usr/bin/env -S pnpm exec tsx
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { z } from "zod"
import {
  SERVICE_API_ROUTES,
  SERVICE_API_VERSION,
  type ServiceRouteContract,
} from "@cowards/spec"

type JsonObject = Record<string, unknown>

const artifactPath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../artifacts/service-api-v1.8.openapi.json",
)

const staleMessage =
  "service-api-v1.8.openapi.json is stale; run pnpm --filter @cowards/spec contract:generate"

const isPlainObject = (value: unknown): value is JsonObject =>
  value !== null && typeof value === "object" && !Array.isArray(value)

const stableSort = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(stableSort)
  }
  if (!isPlainObject(value)) {
    return value
  }
  return Object.fromEntries(
    Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entryValue]) => [key, stableSort(entryValue)]),
  )
}

const stableStringify = (value: unknown): string =>
  JSON.stringify(stableSort(value), null, 2)

const rewriteLocalDefinitionRefs = (
  value: unknown,
  componentName: string,
): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => rewriteLocalDefinitionRefs(item, componentName))
  }
  if (!isPlainObject(value)) {
    return value
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => {
      if (
        key === "$ref" &&
        typeof entryValue === "string" &&
        entryValue.startsWith("#/$defs/")
      ) {
        return [
          key,
          `#/components/schemas/${componentName}/$defs/${entryValue.slice("#/$defs/".length)}`,
        ]
      }
      return [key, rewriteLocalDefinitionRefs(entryValue, componentName)]
    }),
  )
}

const jsonSchemaFor = (
  schema: z.ZodType,
  componentName?: string,
): JsonObject => {
  const jsonSchema = z.toJSONSchema(schema) as JsonObject
  return componentName
    ? (rewriteLocalDefinitionRefs(jsonSchema, componentName) as JsonObject)
    : jsonSchema
}

const schemaIsEmptyObject = (schema: z.ZodType): boolean => {
  const jsonSchema = jsonSchemaFor(schema)
  return (
    jsonSchema.type === "object" &&
    isPlainObject(jsonSchema.properties) &&
    Object.keys(jsonSchema.properties).length === 0
  )
}

const componentRef = (name: string): JsonObject => ({
  $ref: `#/components/schemas/${name}`,
})

const operationExamples = (route: ServiceRouteContract): JsonObject =>
  Object.fromEntries(
    route.fixtureRefs.map((fixtureRef, index) => [
      fixtureRef,
      {
        summary: fixtureRef,
        value: route.examples[index] ?? route.examples[0],
      },
    ]),
  )

const parametersFor = (
  schema: z.ZodType,
  location: "path" | "query",
): JsonObject[] => {
  const jsonSchema = jsonSchemaFor(schema)
  if (!isPlainObject(jsonSchema.properties)) {
    return []
  }
  const required = new Set(
    Array.isArray(jsonSchema.required) ? jsonSchema.required : [],
  )
  return Object.entries(jsonSchema.properties).map(
    ([name, propertySchema]) => ({
      in: location,
      name,
      required: location === "path" ? true : required.has(name),
      schema: propertySchema,
    }),
  )
}

const requestBodyFor = (
  route: ServiceRouteContract,
): JsonObject | undefined => {
  if (schemaIsEmptyObject(route.request.body)) {
    return undefined
  }
  return {
    required: true,
    content: {
      "application/json": {
        schema: jsonSchemaFor(route.request.body),
      },
    },
  }
}

const buildOpenApi = (): JsonObject => {
  const components: Record<string, JsonObject> = {
    ServiceErrorDto: jsonSchemaFor(
      SERVICE_API_ROUTES.health.error as z.ZodType,
      "ServiceErrorDto",
    ),
  }
  const paths: Record<string, Record<string, JsonObject>> = {}

  for (const route of Object.values(SERVICE_API_ROUTES)) {
    if (route.privacyClass !== "public") {
      continue
    }

    const responseSchemaName = `${route.id}Response`
    components[responseSchemaName] = jsonSchemaFor(
      route.response as z.ZodType,
      responseSchemaName,
    )

    const operation: JsonObject = {
      operationId: route.operationId,
      tags: [route.privacyClass],
      summary: route.id,
      parameters: [
        ...parametersFor(route.request.params as z.ZodType, "path"),
        ...parametersFor(route.request.query as z.ZodType, "query"),
      ],
      responses: {
        "200": {
          description: `${route.id} success response`,
          content: {
            "application/json": {
              schema: componentRef(responseSchemaName),
              examples: operationExamples(route),
            },
          },
        },
        default: {
          description: "Public-safe service error",
          content: {
            "application/json": {
              schema: componentRef("ServiceErrorDto"),
            },
          },
        },
        "400": {
          description: "Request validation failed",
          content: {
            "application/json": {
              schema: componentRef("ServiceErrorDto"),
            },
          },
        },
      },
      security:
        route.authScope === "public"
          ? []
          : [{ [`${route.authScope}Session`]: [] }],
      "x-route-id": route.id,
      "x-auth-scope": route.authScope,
      "x-privacy-class": route.privacyClass,
      "x-fixture-refs": [...route.fixtureRefs],
      "x-route-signature": route.signature,
    }

    const body = requestBodyFor(route)
    if (body) {
      operation.requestBody = body
    }

    paths[route.path] ??= {}
    paths[route.path][route.method.toLowerCase()] = operation
  }

  return {
    openapi: "3.1.0",
    info: {
      title: "Coward's Game Service API",
      version: SERVICE_API_VERSION,
      license: {
        identifier: "UNLICENSED",
        name: "UNLICENSED",
      },
    },
    servers: [{ url: "/" }],
    jsonSchemaDialect: "https://json-schema.org/draft/2020-12/schema",
    tags: [
      { name: "public", description: "Public-safe service routes." },
      { name: "owner", description: "Owner-authorized service routes." },
      { name: "internal", description: "Internal service routes." },
    ],
    components: {
      securitySchemes: {
        sessionSession: {
          type: "apiKey",
          in: "cookie",
          name: "cowards_session",
        },
        ownerSession: {
          type: "apiKey",
          in: "cookie",
          name: "cowards_session",
        },
        adminSession: {
          type: "apiKey",
          in: "cookie",
          name: "cowards_session",
        },
      },
      schemas: components,
    },
    paths,
  }
}

const run = async (): Promise<void> => {
  const checkMode = process.argv.includes("--check")
  const output = `${stableStringify(buildOpenApi())}\n`

  if (checkMode) {
    const existing = await readFile(artifactPath, "utf8").catch(() => "")
    if (existing !== output) {
      throw new Error(staleMessage)
    }
    return
  }

  await mkdir(dirname(artifactPath), { recursive: true })
  await writeFile(artifactPath, output, "utf8")
}

await run()
