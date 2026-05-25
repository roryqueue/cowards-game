"use client"

import type { ComponentType, ReactNode } from "react"
import dynamic from "next/dynamic"

type Dynamic = <P = Record<string, never>>(
  loader: () => Promise<unknown>,
  options?: { ssr?: boolean; loading?: () => ReactNode },
) => ComponentType<P>

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

const browserDynamic = dynamic as unknown as Dynamic

const Editor = browserDynamic<MonacoEditorProps>(
  () => import("@monaco-editor/react"),
  {
    ssr: false,
    loading: () => <div className="editor-loading">Loading editor...</div>,
  },
)

export interface StrategySourceEditorProps {
  value: string
  onChange: (value: string) => void
  language?: "typescript" | "python" | "rust" | undefined
  disabled?: boolean | undefined
}

export function StrategySourceEditor({
  value,
  onChange,
  language = "typescript",
  disabled,
}: StrategySourceEditorProps) {
  return (
    <div className="editor-frame">
      <Editor
        height="100%"
        language={language}
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
