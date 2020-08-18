import * as ts from 'typescript'
import * as path from 'path'
import minimatch from 'minimatch'

type Options = {
  index: {
    [prefix: string]: string[]
  };
  replace: {
    [key: string]: string;
  };
}

const replaceName = (name: string, {index={}, replace={}}: Options) => {
  let item;
  if (name.startsWith('.')) {
    if (name.endsWith('/')) {
      return `${name}index.js`;
    } else {
      return `${name}.js`;
    }
  } else if (item = Object.entries(replace).find(([key]) =>
      key === name)) {
      return item[1];
  } else if (
    item = Object.entries(index)
      .find(([,ptns]) =>
        ptns.some((ptn) => minimatch(name, ptn))
      )
  ) {
    return `${item[0]}${name}/index.js`;
  } else {
    return name;
  }
}

const transformer = (_: ts.Program, opts: Options) => (transformationContext: ts.TransformationContext) => (sourceFile: ts.SourceFile) => {
  function visitNode(node: ts.Node): ts.VisitResult<ts.Node> {
    if (shouldMutateModuleSpecifier(node)) {

      const newModuleSpecifier = ts.createLiteral(replaceName(node.moduleSpecifier.text, opts));
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