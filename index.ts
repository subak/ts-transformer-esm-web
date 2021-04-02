import * as ts from 'typescript'
import * as path from 'path'
import minimatch from 'minimatch'

type Options = {
  resolve: {
    prefix: string;
    suffix: string;
    modules: string[]
  }[],
  replace: {
    [key: string]: string;
  };
  endsWithReplace: {
    [key: string]: string;
  }
}

const replaceName = (name: string, {resolve=[], replace={}, endsWithReplace={}}: Options) => {
  let item;

  if (
    item = Object.entries(replace)
      .find(([key]) => key === name)
  ) {
    return item[1];
  } else if (
    item = Object.entries(endsWithReplace)
      .find(([ptn]) => name.endsWith(ptn))
  ) {
    return item[1];
  } else if (name.startsWith('.')) {
    if (name.endsWith('/')) {
      return `${name}index.js`;
    } else {
      return `${name}.js`;
    }
  } else if (
    item = resolve.find(({modules}) =>
      modules.some((pattern) => minimatch(name, pattern)))
  ) {
    if (/\.(js|cjs|mjs)$/.test(name)) {
      return `${item.prefix}${name}`;
    } else {
      return `${item.prefix}${name}${item.suffix}`;
    }
  } else {
    return name;
  }
}

const transformer = (_: ts.Program, opts: Options) => (transformationContext: ts.TransformationContext) => (sourceFile: ts.SourceFile) => {
  function visitNode(node: ts.Node): ts.VisitResult<ts.Node> {
    if (shouldMutateModuleSpecifier(node)) {
      const newModuleSpecifier = ts.createLiteral(replaceName(node.moduleSpecifier.text, opts));

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
    if ( node.moduleSpecifier.text.startsWith('.') && (path.extname(node.moduleSpecifier.text) !== '') ) return false
    return true
  }

  return ts.visitNode(sourceFile, visitNode)
}

export default transformer