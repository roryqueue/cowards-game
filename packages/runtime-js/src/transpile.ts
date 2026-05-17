import * as ts from "typescript"

export const transpileStrategySource = (
  source: string,
): { ok: true; code: string } | { ok: false; message: string } => {
  const output = ts.transpileModule(source, {
    compilerOptions: {
      isolatedModules: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    reportDiagnostics: true,
  })

  const error = output.diagnostics?.find(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  )

  if (error !== undefined) {
    return {
      ok: false,
      message: ts.flattenDiagnosticMessageText(error.messageText, "\n"),
    }
  }

  return { ok: true, code: output.outputText }
}
