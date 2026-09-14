import * as ts from "typescript"
import { extractSourceStructureTokens, type ConcreteEdgeToken } from "../packages/strategy-lab/src/factory/numeric-calibration.js"
/** Conservative, data-only call/clone evidence. This does not prove semantic independence. */
export const auditFactorySource = (source: string): { dependencyEdges: ConcreteEdgeToken[]; functionBodies: string[]; forbiddenModuleCount: number } => {
  extractSourceStructureTokens(source)
  const ast = ts.createSourceFile("factory-source.ts", source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TS)
  const dependencyEdges: ConcreteEdgeToken[] = [], functionBodies: string[] = []
  let forbiddenModuleCount = 0
  const visit = (node: ts.Node, owner: string): void => {
    if (ts.isImportDeclaration(node) || ts.isImportEqualsDeclaration(node) || ts.isExportDeclaration(node) && node.moduleSpecifier || ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || ts.isIdentifier(node.expression) && node.expression.text === "require")) forbiddenModuleCount++
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node)) {
      owner = node.name?.getText(ast) ?? (ts.isVariableDeclaration(node.parent) ? node.parent.name.getText(ast) : owner)
      if (node.body) {
        const body = extractSourceStructureTokens(`function retained() ${ts.isBlock(node.body) ? node.body.getText(ast) : `{ return ${node.body.getText(ast)}; }`}`)
        // Small ABI delegation wrappers are not strategic-sharing findings.
        if (body.length >= 40) functionBodies.push(JSON.stringify(body))
      }
    }
    if (ts.isCallExpression(node) && node.expression.kind !== ts.SyntaxKind.ImportKeyword) {
      const to = ts.isIdentifier(node.expression) ? node.expression.text : ts.isPropertyAccessExpression(node.expression) ? node.expression.name.text : "computed-call"
      dependencyEdges.push({ label: "calls", from: owner, to })
    }
    ts.forEachChild(node, (child) => visit(child, owner))
  }
  visit(ast, "module")
  return { dependencyEdges, functionBodies: [...new Set(functionBodies)], forbiddenModuleCount }
}
