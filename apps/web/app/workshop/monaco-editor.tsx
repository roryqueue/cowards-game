"use client"

import type { ComponentType, ReactNode } from "react"
import * as nextDynamic from "next/dist/shared/lib/dynamic.js"

// Browser-only wrapper for next/dynamic App Router usage.
type Dynamic = <P = Record<string, never>>(
  loader: () => Promise<unknown>,
  options?: { ssr?: boolean; loading?: () => ReactNode },
) => ComponentType<P>

const dynamic = (nextDynamic as unknown as { default: Dynamic }).default

interface MonacoEditorProps {
  height: string
  language: string
  theme: string
  value: string
  onChange: (value: string | undefined) => void
  options: {
    minimap: { enabled: boolean }
    readOnly?: boolean | undefined
    scrollBeyondLastLine: boolean
    wordWrap: "on"
  }
}

const Editor = dynamic<MonacoEditorProps>(
  () => import("@monaco-editor/react"),
  {
    ssr: false,
    loading: () => <div className="editor-loading">Loading editor...</div>,
  },
)

export interface StrategySourceEditorProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean | undefined
}

export function StrategySourceEditor({
  value,
  onChange,
  disabled,
}: StrategySourceEditorProps) {
  return (
    <div className="editor-frame">
      <Editor
        height="100%"
        language="typescript"
        theme="vs-dark"
        value={value}
        onChange={(nextValue: string | undefined) => onChange(nextValue ?? "")}
        options={{
          minimap: { enabled: false },
          readOnly: disabled,
          scrollBeyondLastLine: false,
          wordWrap: "on",
        }}
      />
    </div>
  )
}
