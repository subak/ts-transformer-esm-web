import * as ts from 'typescript'
import * as path from 'path'

const replaceName = (name: string, prefix: string) => {
  if (name.startsWith('.')) {
    if (name.endsWith('/')) {
      return `${name}index.js`;
    } else {
      return `${name}.js`;
    }
  } else {
    return `${prefix}${name}/index.js`;
  }
}

const transformer = (_: ts.Program, {prefix = ""}: {prefix: string}) => (transformationContext: ts.TransformationContext) => (sourceFile: ts.SourceFile) => {
  function visitNode(node: ts.Node): ts.VisitResult<ts.Node> {
    if (shouldMutateModuleSpecifier(node)) {

      const newModuleSpecifier = ts.createLiteral(replaceName(node.moduleSpecifier.text, prefix));
      // const newModuleSpecifier = ts.createLiteral(`${node.moduleSpecifier.text}.js`);

      if (ts.isImportDeclaration(node)) {
        return ts.updateImportDeclaration(node, node.decorators, node.modifiers, node.importClause, newModuleSpecifier)
      } else if (ts.isExportDeclaration(node)) {
        return ts.updateExportDeclaration(node, node.decorators, node.modifiers, node.exportClause, newModuleSpecifier, false)
      }
    }

    return ts.visitEachChild(node, visitNode, transformationContext)
  }

  function shouldMutateModuleSpecifier(node: ts.Node): node is (ts.ImportDeclaration | ts.ExportDeclaration) & { moduleSpecifier: ts.StringLiteral } {
    if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) return false
    if (node.moduleSpecifier === undefined) return false
    // only when module specifier is valid
    if (!ts.isStringLiteral(node.moduleSpecifier)) return false
    // only when path is relative
    // if (!node.moduleSpecifier.text.startsWith('./') && !node.moduleSpecifier.text.startsWith('../')) return false
    // only when module specifier has no extension
    if (path.extname(node.moduleSpecifier.text) !== '') return false
    return true
  }

  return ts.visitNode(sourceFile, visitNode)
}

export default transformer