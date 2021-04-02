'use strict';

var ts = require('typescript');
var path = require('path');
var minimatch = require('minimatch');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var minimatch__default = /*#__PURE__*/_interopDefaultLegacy(minimatch);

const replaceName = (name, { resolve = [], replace = {}, endsWithReplace = {} }) => {
    let item;
    if (item = Object.entries(replace)
        .find(([key]) => key === name)) {
        return item[1];
    }
    else if (item = Object.entries(endsWithReplace)
        .find(([ptn]) => name.endsWith(ptn))) {
        return item[1];
    }
    else if (name.startsWith('.')) {
        if (name.endsWith('/')) {
            return `${name}index.js`;
        }
        else {
            return `${name}.js`;
        }
    }
    else if (item = resolve.find(({ modules }) => modules.some((pattern) => minimatch__default['default'](name, pattern)))) {
        return `${item.prefix}${name}${item.suffix}`;
    }
    else {
        return name;
    }
};
const transformer = (_, opts) => (transformationContext) => (sourceFile) => {
    function visitNode(node) {
        if (shouldMutateModuleSpecifier(node)) {
            const newModuleSpecifier = ts.createLiteral(replaceName(node.moduleSpecifier.text, opts));
            if (ts.isImportDeclaration(node)) {
                return ts.updateImportDeclaration(node, node.decorators, node.modifiers, node.importClause, newModuleSpecifier);
            }
            else if (ts.isExportDeclaration(node)) {
                return ts.updateExportDeclaration(node, node.decorators, node.modifiers, node.exportClause, newModuleSpecifier, false);
            }
        }
        return ts.visitEachChild(node, visitNode, transformationContext);
    }
    function shouldMutateModuleSpecifier(node) {
        if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node))
            return false;
        if (node.moduleSpecifier === undefined)
            return false;
        // only when module specifier is valid
        if (!ts.isStringLiteral(node.moduleSpecifier))
            return false;
        // only when path is relative
        // if (!node.moduleSpecifier.text.startsWith('./') && !node.moduleSpecifier.text.startsWith('../')) return false
        // only when module specifier has no extension
        if (node.moduleSpecifier.text.startsWith('.') && (path.extname(node.moduleSpecifier.text) !== ''))
            return false;
        return true;
    }
    return ts.visitNode(sourceFile, visitNode);
};

module.exports = transformer;
