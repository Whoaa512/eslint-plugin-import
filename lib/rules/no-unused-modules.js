'use strict';

var _ExportMap = require('../ExportMap');

var _ExportMap2 = _interopRequireDefault(_ExportMap);

var _resolve = require('eslint-module-utils/resolve');

var _resolve2 = _interopRequireDefault(_resolve);

var _docsUrl = require('../docsUrl');

var _docsUrl2 = _interopRequireDefault(_docsUrl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } } /**
                                                                                                                                                                                                 * @fileOverview Ensures that modules contain exports and/or all
                                                                                                                                                                                                 * modules are consumed within other modules.
                                                                                                                                                                                                 * @author René Fermann
                                                                                                                                                                                                 */

// eslint/lib/util/glob-util has been moved to eslint/lib/util/glob-utils with version 5.3
// and has been moved to eslint/lib/cli-engine/file-enumerator in version 6
let listFilesToProcess;
try {
  var FileEnumerator = require('eslint/lib/cli-engine/file-enumerator').FileEnumerator;
  listFilesToProcess = function (src) {
    var e = new FileEnumerator();
    return Array.from(e.iterateFiles(src), (_ref) => {
      let filePath = _ref.filePath,
          ignored = _ref.ignored;
      return {
        ignored,
        filename: filePath
      };
    });
  };
} catch (e1) {
  try {
    listFilesToProcess = require('eslint/lib/util/glob-utils').listFilesToProcess;
  } catch (e2) {
    listFilesToProcess = require('eslint/lib/util/glob-util').listFilesToProcess;
  }
}

const EXPORT_DEFAULT_DECLARATION = 'ExportDefaultDeclaration';
const EXPORT_NAMED_DECLARATION = 'ExportNamedDeclaration';
const EXPORT_ALL_DECLARATION = 'ExportAllDeclaration';
const IMPORT_DECLARATION = 'ImportDeclaration';
const IMPORT_NAMESPACE_SPECIFIER = 'ImportNamespaceSpecifier';
const IMPORT_DEFAULT_SPECIFIER = 'ImportDefaultSpecifier';
const VARIABLE_DECLARATION = 'VariableDeclaration';
const FUNCTION_DECLARATION = 'FunctionDeclaration';
const CLASS_DECLARATION = 'ClassDeclaration';
const DEFAULT = 'default';

let preparationDone = false;
const importList = new Map();
const exportList = new Map();
const ignoredFiles = new Set();

const isNodeModule = path => {
  return (/\/(node_modules)\//.test(path)
  );
};

/**
 * read all files matching the patterns in src and ignoreExports
 *
 * return all files matching src pattern, which are not matching the ignoreExports pattern
 */
const resolveFiles = (src, ignoreExports) => {
  const srcFiles = new Set();
  const srcFileList = listFilesToProcess(src);

  // prepare list of ignored files
  const ignoredFilesList = listFilesToProcess(ignoreExports);
  ignoredFilesList.forEach((_ref2) => {
    let filename = _ref2.filename;
    return ignoredFiles.add(filename);
  });

  // prepare list of source files, don't consider files from node_modules
  srcFileList.filter((_ref3) => {
    let filename = _ref3.filename;
    return !isNodeModule(filename);
  }).forEach((_ref4) => {
    let filename = _ref4.filename;

    srcFiles.add(filename);
  });
  return srcFiles;
};

/**
 * parse all source files and build up 2 maps containing the existing imports and exports
 */
const prepareImportsAndExports = (srcFiles, context) => {
  const exportAll = new Map();
  srcFiles.forEach(file => {
    const exports = new Map();
    const imports = new Map();
    const currentExports = _ExportMap2.default.get(file, context);
    if (currentExports) {
      const dependencies = currentExports.dependencies,
            reexports = currentExports.reexports,
            localImportList = currentExports.imports,
            namespace = currentExports.namespace;

      // dependencies === export * from 

      const currentExportAll = new Set();
      dependencies.forEach(value => {
        currentExportAll.add(value().path);
      });
      exportAll.set(file, currentExportAll);

      reexports.forEach((value, key) => {
        if (key === DEFAULT) {
          exports.set(IMPORT_DEFAULT_SPECIFIER, { whereUsed: new Set() });
        } else {
          exports.set(key, { whereUsed: new Set() });
        }
        const reexport = value.getImport();
        if (!reexport) {
          return;
        }
        let localImport = imports.get(reexport.path);
        let currentValue;
        if (value.local === DEFAULT) {
          currentValue = IMPORT_DEFAULT_SPECIFIER;
        } else {
          currentValue = value.local;
        }
        if (typeof localImport !== 'undefined') {
          localImport = new Set([].concat(_toConsumableArray(localImport), [currentValue]));
        } else {
          localImport = new Set([currentValue]);
        }
        imports.set(reexport.path, localImport);
      });

      localImportList.forEach((value, key) => {
        if (isNodeModule(key)) {
          return;
        }
        imports.set(key, value.importedSpecifiers);
      });
      importList.set(file, imports);

      // build up export list only, if file is not ignored
      if (ignoredFiles.has(file)) {
        return;
      }
      namespace.forEach((value, key) => {
        if (key === DEFAULT) {
          exports.set(IMPORT_DEFAULT_SPECIFIER, { whereUsed: new Set() });
        } else {
          exports.set(key, { whereUsed: new Set() });
        }
      });
    }
    exports.set(EXPORT_ALL_DECLARATION, { whereUsed: new Set() });
    exports.set(IMPORT_NAMESPACE_SPECIFIER, { whereUsed: new Set() });
    exportList.set(file, exports);
  });
  exportAll.forEach((value, key) => {
    value.forEach(val => {
      const currentExports = exportList.get(val);
      const currentExport = currentExports.get(EXPORT_ALL_DECLARATION);
      currentExport.whereUsed.add(key);
    });
  });
};

/**
 * traverse through all imports and add the respective path to the whereUsed-list 
 * of the corresponding export
 */
const determineUsage = () => {
  importList.forEach((listValue, listKey) => {
    listValue.forEach((value, key) => {
      const exports = exportList.get(key);
      if (typeof exports !== 'undefined') {
        value.forEach(currentImport => {
          let specifier;
          if (currentImport === IMPORT_NAMESPACE_SPECIFIER) {
            specifier = IMPORT_NAMESPACE_SPECIFIER;
          } else if (currentImport === IMPORT_DEFAULT_SPECIFIER) {
            specifier = IMPORT_DEFAULT_SPECIFIER;
          } else {
            specifier = currentImport;
          }
          if (typeof specifier !== 'undefined') {
            const exportStatement = exports.get(specifier);
            if (typeof exportStatement !== 'undefined') {
              const whereUsed = exportStatement.whereUsed;

              whereUsed.add(listKey);
              exports.set(specifier, { whereUsed });
            }
          }
        });
      }
    });
  });
};

const getSrc = src => {
  if (src) {
    return src;
  }
  return [process.cwd()];
};

/**
 * prepare the lists of existing imports and exports - should only be executed once at
 * the start of a new eslint run
 */
const doPreparation = (src, ignoreExports, context) => {
  const srcFiles = resolveFiles(getSrc(src), ignoreExports);
  prepareImportsAndExports(srcFiles, context);
  determineUsage();
  preparationDone = true;
};

const newNamespaceImportExists = specifiers => specifiers.some((_ref5) => {
  let type = _ref5.type;
  return type === IMPORT_NAMESPACE_SPECIFIER;
});

const newDefaultImportExists = specifiers => specifiers.some((_ref6) => {
  let type = _ref6.type;
  return type === IMPORT_DEFAULT_SPECIFIER;
});

module.exports = {
  meta: {
    docs: { url: (0, _docsUrl2.default)('no-unused-modules') },
    schema: [{
      properties: {
        src: {
          description: 'files/paths to be analyzed (only for unused exports)',
          type: 'array',
          minItems: 1,
          items: {
            type: 'string',
            minLength: 1
          }
        },
        ignoreExports: {
          description: 'files/paths for which unused exports will not be reported (e.g module entry points)',
          type: 'array',
          minItems: 1,
          items: {
            type: 'string',
            minLength: 1
          }
        },
        missingExports: {
          description: 'report modules without any exports',
          type: 'boolean'
        },
        unusedExports: {
          description: 'report exports without any usage',
          type: 'boolean'
        }
      },
      not: {
        properties: {
          unusedExports: { enum: [false] },
          missingExports: { enum: [false] }
        }
      },
      anyOf: [{
        not: {
          properties: {
            unusedExports: { enum: [true] }
          }
        },
        required: ['missingExports']
      }, {
        not: {
          properties: {
            missingExports: { enum: [true] }
          }
        },
        required: ['unusedExports']
      }, {
        properties: {
          unusedExports: { enum: [true] }
        },
        required: ['unusedExports']
      }, {
        properties: {
          missingExports: { enum: [true] }
        },
        required: ['missingExports']
      }]
    }]
  },

  create: context => {
    var _ref7 = context.options[0] || {};

    const src = _ref7.src;
    var _ref7$ignoreExports = _ref7.ignoreExports;
    const ignoreExports = _ref7$ignoreExports === undefined ? [] : _ref7$ignoreExports,
          missingExports = _ref7.missingExports,
          unusedExports = _ref7.unusedExports;


    if (unusedExports && !preparationDone) {
      doPreparation(src, ignoreExports, context);
    }

    const file = context.getFilename();

    const checkExportPresence = node => {
      if (!missingExports) {
        return;
      }

      if (ignoredFiles.has(file)) {
        return;
      }

      const exportCount = exportList.get(file);
      const exportAll = exportCount.get(EXPORT_ALL_DECLARATION);
      const namespaceImports = exportCount.get(IMPORT_NAMESPACE_SPECIFIER);

      exportCount.delete(EXPORT_ALL_DECLARATION);
      exportCount.delete(IMPORT_NAMESPACE_SPECIFIER);
      if (missingExports && exportCount.size < 1) {
        // node.body[0] === 'undefined' only happens, if everything is commented out in the file
        // being linted
        context.report(node.body[0] ? node.body[0] : node, 'No exports found');
      }
      exportCount.set(EXPORT_ALL_DECLARATION, exportAll);
      exportCount.set(IMPORT_NAMESPACE_SPECIFIER, namespaceImports);
    };

    const checkUsage = (node, exportedValue) => {
      if (!unusedExports) {
        return;
      }

      if (ignoredFiles.has(file)) {
        return;
      }

      // refresh list of source files
      const srcFiles = resolveFiles(getSrc(src), ignoreExports);

      // make sure file to be linted is included in source files
      if (!srcFiles.has(file)) {
        return;
      }

      exports = exportList.get(file);

      // special case: export * from 
      const exportAll = exports.get(EXPORT_ALL_DECLARATION);
      if (typeof exportAll !== 'undefined' && exportedValue !== IMPORT_DEFAULT_SPECIFIER) {
        if (exportAll.whereUsed.size > 0) {
          return;
        }
      }

      // special case: namespace import
      const namespaceImports = exports.get(IMPORT_NAMESPACE_SPECIFIER);
      if (typeof namespaceImports !== 'undefined') {
        if (namespaceImports.whereUsed.size > 0) {
          return;
        }
      }

      const exportStatement = exports.get(exportedValue);

      const value = exportedValue === IMPORT_DEFAULT_SPECIFIER ? DEFAULT : exportedValue;

      if (typeof exportStatement !== 'undefined') {
        if (exportStatement.whereUsed.size < 1) {
          context.report(node, `exported declaration '${value}' not used within other modules`);
        }
      } else {
        context.report(node, `exported declaration '${value}' not used within other modules`);
      }
    };

    /**
     * only useful for tools like vscode-eslint
     * 
     * update lists of existing exports during runtime
     */
    const updateExportUsage = node => {
      if (ignoredFiles.has(file)) {
        return;
      }

      let exports = exportList.get(file);

      // new module has been created during runtime
      // include it in further processing
      if (typeof exports === 'undefined') {
        exports = new Map();
      }

      const newExports = new Map();
      const newExportIdentifiers = new Set();

      node.body.forEach((_ref8) => {
        let type = _ref8.type,
            declaration = _ref8.declaration,
            specifiers = _ref8.specifiers;

        if (type === EXPORT_DEFAULT_DECLARATION) {
          newExportIdentifiers.add(IMPORT_DEFAULT_SPECIFIER);
        }
        if (type === EXPORT_NAMED_DECLARATION) {
          if (specifiers.length > 0) {
            specifiers.forEach(specifier => {
              if (specifier.exported) {
                newExportIdentifiers.add(specifier.exported.name);
              }
            });
          }
          if (declaration) {
            if (declaration.type === FUNCTION_DECLARATION || declaration.type === CLASS_DECLARATION) {
              newExportIdentifiers.add(declaration.id.name);
            }
            if (declaration.type === VARIABLE_DECLARATION) {
              declaration.declarations.forEach((_ref9) => {
                let id = _ref9.id;

                newExportIdentifiers.add(id.name);
              });
            }
          }
        }
      });

      // old exports exist within list of new exports identifiers: add to map of new exports
      exports.forEach((value, key) => {
        if (newExportIdentifiers.has(key)) {
          newExports.set(key, value);
        }
      });

      // new export identifiers added: add to map of new exports
      newExportIdentifiers.forEach(key => {
        if (!exports.has(key)) {
          newExports.set(key, { whereUsed: new Set() });
        }
      });

      // preserve information about namespace imports
      let exportAll = exports.get(EXPORT_ALL_DECLARATION);
      let namespaceImports = exports.get(IMPORT_NAMESPACE_SPECIFIER);

      if (typeof namespaceImports === 'undefined') {
        namespaceImports = { whereUsed: new Set() };
      }

      newExports.set(EXPORT_ALL_DECLARATION, exportAll);
      newExports.set(IMPORT_NAMESPACE_SPECIFIER, namespaceImports);
      exportList.set(file, newExports);
    };

    /**
     * only useful for tools like vscode-eslint
     * 
     * update lists of existing imports during runtime
     */
    const updateImportUsage = node => {
      if (!unusedExports) {
        return;
      }

      let oldImportPaths = importList.get(file);
      if (typeof oldImportPaths === 'undefined') {
        oldImportPaths = new Map();
      }

      const oldNamespaceImports = new Set();
      const newNamespaceImports = new Set();

      const oldExportAll = new Set();
      const newExportAll = new Set();

      const oldDefaultImports = new Set();
      const newDefaultImports = new Set();

      const oldImports = new Map();
      const newImports = new Map();
      oldImportPaths.forEach((value, key) => {
        if (value.has(EXPORT_ALL_DECLARATION)) {
          oldExportAll.add(key);
        }
        if (value.has(IMPORT_NAMESPACE_SPECIFIER)) {
          oldNamespaceImports.add(key);
        }
        if (value.has(IMPORT_DEFAULT_SPECIFIER)) {
          oldDefaultImports.add(key);
        }
        value.forEach(val => {
          if (val !== IMPORT_NAMESPACE_SPECIFIER && val !== IMPORT_DEFAULT_SPECIFIER) {
            oldImports.set(val, key);
          }
        });
      });

      node.body.forEach(astNode => {
        let resolvedPath;

        // support for export { value } from 'module'
        if (astNode.type === EXPORT_NAMED_DECLARATION) {
          if (astNode.source) {
            resolvedPath = (0, _resolve2.default)(astNode.source.raw.replace(/('|")/g, ''), context);
            astNode.specifiers.forEach(specifier => {
              let name;
              if (specifier.exported.name === DEFAULT) {
                name = IMPORT_DEFAULT_SPECIFIER;
              } else {
                name = specifier.local.name;
              }
              newImports.set(name, resolvedPath);
            });
          }
        }

        if (astNode.type === EXPORT_ALL_DECLARATION) {
          resolvedPath = (0, _resolve2.default)(astNode.source.raw.replace(/('|")/g, ''), context);
          newExportAll.add(resolvedPath);
        }

        if (astNode.type === IMPORT_DECLARATION) {
          resolvedPath = (0, _resolve2.default)(astNode.source.raw.replace(/('|")/g, ''), context);
          if (!resolvedPath) {
            return;
          }

          if (isNodeModule(resolvedPath)) {
            return;
          }

          if (newNamespaceImportExists(astNode.specifiers)) {
            newNamespaceImports.add(resolvedPath);
          }

          if (newDefaultImportExists(astNode.specifiers)) {
            newDefaultImports.add(resolvedPath);
          }

          astNode.specifiers.forEach(specifier => {
            if (specifier.type === IMPORT_DEFAULT_SPECIFIER || specifier.type === IMPORT_NAMESPACE_SPECIFIER) {
              return;
            }
            newImports.set(specifier.imported.name, resolvedPath);
          });
        }
      });

      newExportAll.forEach(value => {
        if (!oldExportAll.has(value)) {
          let imports = oldImportPaths.get(value);
          if (typeof imports === 'undefined') {
            imports = new Set();
          }
          imports.add(EXPORT_ALL_DECLARATION);
          oldImportPaths.set(value, imports);

          let exports = exportList.get(value);
          let currentExport;
          if (typeof exports !== 'undefined') {
            currentExport = exports.get(EXPORT_ALL_DECLARATION);
          } else {
            exports = new Map();
            exportList.set(value, exports);
          }

          if (typeof currentExport !== 'undefined') {
            currentExport.whereUsed.add(file);
          } else {
            const whereUsed = new Set();
            whereUsed.add(file);
            exports.set(EXPORT_ALL_DECLARATION, { whereUsed });
          }
        }
      });

      oldExportAll.forEach(value => {
        if (!newExportAll.has(value)) {
          const imports = oldImportPaths.get(value);
          imports.delete(EXPORT_ALL_DECLARATION);

          const exports = exportList.get(value);
          if (typeof exports !== 'undefined') {
            const currentExport = exports.get(EXPORT_ALL_DECLARATION);
            if (typeof currentExport !== 'undefined') {
              currentExport.whereUsed.delete(file);
            }
          }
        }
      });

      newDefaultImports.forEach(value => {
        if (!oldDefaultImports.has(value)) {
          let imports = oldImportPaths.get(value);
          if (typeof imports === 'undefined') {
            imports = new Set();
          }
          imports.add(IMPORT_DEFAULT_SPECIFIER);
          oldImportPaths.set(value, imports);

          let exports = exportList.get(value);
          let currentExport;
          if (typeof exports !== 'undefined') {
            currentExport = exports.get(IMPORT_DEFAULT_SPECIFIER);
          } else {
            exports = new Map();
            exportList.set(value, exports);
          }

          if (typeof currentExport !== 'undefined') {
            currentExport.whereUsed.add(file);
          } else {
            const whereUsed = new Set();
            whereUsed.add(file);
            exports.set(IMPORT_DEFAULT_SPECIFIER, { whereUsed });
          }
        }
      });

      oldDefaultImports.forEach(value => {
        if (!newDefaultImports.has(value)) {
          const imports = oldImportPaths.get(value);
          imports.delete(IMPORT_DEFAULT_SPECIFIER);

          const exports = exportList.get(value);
          if (typeof exports !== 'undefined') {
            const currentExport = exports.get(IMPORT_DEFAULT_SPECIFIER);
            if (typeof currentExport !== 'undefined') {
              currentExport.whereUsed.delete(file);
            }
          }
        }
      });

      newNamespaceImports.forEach(value => {
        if (!oldNamespaceImports.has(value)) {
          let imports = oldImportPaths.get(value);
          if (typeof imports === 'undefined') {
            imports = new Set();
          }
          imports.add(IMPORT_NAMESPACE_SPECIFIER);
          oldImportPaths.set(value, imports);

          let exports = exportList.get(value);
          let currentExport;
          if (typeof exports !== 'undefined') {
            currentExport = exports.get(IMPORT_NAMESPACE_SPECIFIER);
          } else {
            exports = new Map();
            exportList.set(value, exports);
          }

          if (typeof currentExport !== 'undefined') {
            currentExport.whereUsed.add(file);
          } else {
            const whereUsed = new Set();
            whereUsed.add(file);
            exports.set(IMPORT_NAMESPACE_SPECIFIER, { whereUsed });
          }
        }
      });

      oldNamespaceImports.forEach(value => {
        if (!newNamespaceImports.has(value)) {
          const imports = oldImportPaths.get(value);
          imports.delete(IMPORT_NAMESPACE_SPECIFIER);

          const exports = exportList.get(value);
          if (typeof exports !== 'undefined') {
            const currentExport = exports.get(IMPORT_NAMESPACE_SPECIFIER);
            if (typeof currentExport !== 'undefined') {
              currentExport.whereUsed.delete(file);
            }
          }
        }
      });

      newImports.forEach((value, key) => {
        if (!oldImports.has(key)) {
          let imports = oldImportPaths.get(value);
          if (typeof imports === 'undefined') {
            imports = new Set();
          }
          imports.add(key);
          oldImportPaths.set(value, imports);

          let exports = exportList.get(value);
          let currentExport;
          if (typeof exports !== 'undefined') {
            currentExport = exports.get(key);
          } else {
            exports = new Map();
            exportList.set(value, exports);
          }

          if (typeof currentExport !== 'undefined') {
            currentExport.whereUsed.add(file);
          } else {
            const whereUsed = new Set();
            whereUsed.add(file);
            exports.set(key, { whereUsed });
          }
        }
      });

      oldImports.forEach((value, key) => {
        if (!newImports.has(key)) {
          const imports = oldImportPaths.get(value);
          imports.delete(key);

          const exports = exportList.get(value);
          if (typeof exports !== 'undefined') {
            const currentExport = exports.get(key);
            if (typeof currentExport !== 'undefined') {
              currentExport.whereUsed.delete(file);
            }
          }
        }
      });
    };

    return {
      'Program:exit': node => {
        updateExportUsage(node);
        updateImportUsage(node);
        checkExportPresence(node);
      },
      'ExportDefaultDeclaration': node => {
        checkUsage(node, IMPORT_DEFAULT_SPECIFIER);
      },
      'ExportNamedDeclaration': node => {
        node.specifiers.forEach(specifier => {
          checkUsage(node, specifier.exported.name);
        });
        if (node.declaration) {
          if (node.declaration.type === FUNCTION_DECLARATION || node.declaration.type === CLASS_DECLARATION) {
            checkUsage(node, node.declaration.id.name);
          }
          if (node.declaration.type === VARIABLE_DECLARATION) {
            node.declaration.declarations.forEach(declaration => {
              checkUsage(node, declaration.id.name);
            });
          }
        }
      }
    };
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby11bnVzZWQtbW9kdWxlcy5qcyJdLCJuYW1lcyI6WyJsaXN0RmlsZXNUb1Byb2Nlc3MiLCJGaWxlRW51bWVyYXRvciIsInJlcXVpcmUiLCJzcmMiLCJlIiwiQXJyYXkiLCJmcm9tIiwiaXRlcmF0ZUZpbGVzIiwiZmlsZVBhdGgiLCJpZ25vcmVkIiwiZmlsZW5hbWUiLCJlMSIsImUyIiwiRVhQT1JUX0RFRkFVTFRfREVDTEFSQVRJT04iLCJFWFBPUlRfTkFNRURfREVDTEFSQVRJT04iLCJFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OIiwiSU1QT1JUX0RFQ0xBUkFUSU9OIiwiSU1QT1JUX05BTUVTUEFDRV9TUEVDSUZJRVIiLCJJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVIiLCJWQVJJQUJMRV9ERUNMQVJBVElPTiIsIkZVTkNUSU9OX0RFQ0xBUkFUSU9OIiwiQ0xBU1NfREVDTEFSQVRJT04iLCJERUZBVUxUIiwicHJlcGFyYXRpb25Eb25lIiwiaW1wb3J0TGlzdCIsIk1hcCIsImV4cG9ydExpc3QiLCJpZ25vcmVkRmlsZXMiLCJTZXQiLCJpc05vZGVNb2R1bGUiLCJwYXRoIiwidGVzdCIsInJlc29sdmVGaWxlcyIsImlnbm9yZUV4cG9ydHMiLCJzcmNGaWxlcyIsInNyY0ZpbGVMaXN0IiwiaWdub3JlZEZpbGVzTGlzdCIsImZvckVhY2giLCJhZGQiLCJmaWx0ZXIiLCJwcmVwYXJlSW1wb3J0c0FuZEV4cG9ydHMiLCJjb250ZXh0IiwiZXhwb3J0QWxsIiwiZmlsZSIsImV4cG9ydHMiLCJpbXBvcnRzIiwiY3VycmVudEV4cG9ydHMiLCJnZXQiLCJkZXBlbmRlbmNpZXMiLCJyZWV4cG9ydHMiLCJsb2NhbEltcG9ydExpc3QiLCJuYW1lc3BhY2UiLCJjdXJyZW50RXhwb3J0QWxsIiwidmFsdWUiLCJzZXQiLCJrZXkiLCJ3aGVyZVVzZWQiLCJyZWV4cG9ydCIsImdldEltcG9ydCIsImxvY2FsSW1wb3J0IiwiY3VycmVudFZhbHVlIiwibG9jYWwiLCJpbXBvcnRlZFNwZWNpZmllcnMiLCJoYXMiLCJ2YWwiLCJjdXJyZW50RXhwb3J0IiwiZGV0ZXJtaW5lVXNhZ2UiLCJsaXN0VmFsdWUiLCJsaXN0S2V5IiwiY3VycmVudEltcG9ydCIsInNwZWNpZmllciIsImV4cG9ydFN0YXRlbWVudCIsImdldFNyYyIsInByb2Nlc3MiLCJjd2QiLCJkb1ByZXBhcmF0aW9uIiwibmV3TmFtZXNwYWNlSW1wb3J0RXhpc3RzIiwic3BlY2lmaWVycyIsInNvbWUiLCJ0eXBlIiwibmV3RGVmYXVsdEltcG9ydEV4aXN0cyIsIm1vZHVsZSIsIm1ldGEiLCJkb2NzIiwidXJsIiwic2NoZW1hIiwicHJvcGVydGllcyIsImRlc2NyaXB0aW9uIiwibWluSXRlbXMiLCJpdGVtcyIsIm1pbkxlbmd0aCIsIm1pc3NpbmdFeHBvcnRzIiwidW51c2VkRXhwb3J0cyIsIm5vdCIsImVudW0iLCJhbnlPZiIsInJlcXVpcmVkIiwiY3JlYXRlIiwib3B0aW9ucyIsImdldEZpbGVuYW1lIiwiY2hlY2tFeHBvcnRQcmVzZW5jZSIsIm5vZGUiLCJleHBvcnRDb3VudCIsIm5hbWVzcGFjZUltcG9ydHMiLCJkZWxldGUiLCJzaXplIiwicmVwb3J0IiwiYm9keSIsImNoZWNrVXNhZ2UiLCJleHBvcnRlZFZhbHVlIiwidXBkYXRlRXhwb3J0VXNhZ2UiLCJuZXdFeHBvcnRzIiwibmV3RXhwb3J0SWRlbnRpZmllcnMiLCJkZWNsYXJhdGlvbiIsImxlbmd0aCIsImV4cG9ydGVkIiwibmFtZSIsImlkIiwiZGVjbGFyYXRpb25zIiwidXBkYXRlSW1wb3J0VXNhZ2UiLCJvbGRJbXBvcnRQYXRocyIsIm9sZE5hbWVzcGFjZUltcG9ydHMiLCJuZXdOYW1lc3BhY2VJbXBvcnRzIiwib2xkRXhwb3J0QWxsIiwibmV3RXhwb3J0QWxsIiwib2xkRGVmYXVsdEltcG9ydHMiLCJuZXdEZWZhdWx0SW1wb3J0cyIsIm9sZEltcG9ydHMiLCJuZXdJbXBvcnRzIiwiYXN0Tm9kZSIsInJlc29sdmVkUGF0aCIsInNvdXJj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RUFBMEM7QUFDeENBLDRCQUFjVCxTQUFkLENBQXdCZ0QsTUFBeEIsQ0FBK0I3RCxJQUEvQjtBQUNEO0FBQ0Y7QUFDRjtBQUNGLE9BYkQ7QUFjRCxLQXRRRDs7QUF3UUEsV0FBTztBQUNMLHNCQUFnQjBELFFBQVE7QUFDdEJTLDBCQUFrQlQsSUFBbEI7QUFDQWtCLDBCQUFrQmxCLElBQWxCO0FBQ0FELDRCQUFvQkMsSUFBcEI7QUFDRCxPQUxJO0FBTUwsa0NBQTRCQSxRQUFRO0FBQ2xDTyxtQkFBV1AsSUFBWCxFQUFpQm5GLHdCQUFqQjtBQUNELE9BUkk7QUFTTCxnQ0FBMEJtRixRQUFRO0FBQ2hDQSxhQUFLeEIsVUFBTCxDQUFnQnhDLE9BQWhCLENBQXdCaUMsYUFBYTtBQUNqQ3NDLHFCQUFXUCxJQUFYLEVBQWlCL0IsVUFBVTZDLFFBQVYsQ0FBbUJDLElBQXBDO0FBQ0gsU0FGRDtBQUdBLFlBQUlmLEtBQUtZLFdBQVQsRUFBc0I7QUFDcEIsY0FDRVosS0FBS1ksV0FBTCxDQUFpQmxDLElBQWpCLEtBQTBCM0Qsb0JBQTFCLElBQ0FpRixLQUFLWSxXQUFMLENBQWlCbEMsSUFBakIsS0FBMEIxRCxpQkFGNUIsRUFHRTtBQUNBdUYsdUJBQVdQLElBQVgsRUFBaUJBLEtBQUtZLFdBQUwsQ0FBaUJJLEVBQWpCLENBQW9CRCxJQUFyQztBQUNEO0FBQ0QsY0FBSWYsS0FBS1ksV0FBTCxDQUFpQmxDLElBQWpCLEtBQTBCNUQsb0JBQTlCLEVBQW9EO0FBQ2xEa0YsaUJBQUtZLFdBQUwsQ0FBaUJLLFlBQWpCLENBQThCakYsT0FBOUIsQ0FBc0M0RSxlQUFlO0FBQ25ETCx5QkFBV1AsSUFBWCxFQUFpQlksWUFBWUksRUFBWixDQUFlRCxJQUFoQztBQUNELGFBRkQ7QUFHRDtBQUNGO0FBQ0Y7QUExQkksS0FBUDtBQTRCRDtBQXBoQmMsQ0FBakIiLCJmaWxlIjoibm8tdW51c2VkLW1vZHVsZXMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBmaWxlT3ZlcnZpZXcgRW5zdXJlcyB0aGF0IG1vZHVsZXMgY29udGFpbiBleHBvcnRzIGFuZC9vciBhbGxcbiAqIG1vZHVsZXMgYXJlIGNvbnN1bWVkIHdpdGhpbiBvdGhlciBtb2R1bGVzLlxuICogQGF1dGhvciBSZW7DqSBGZXJtYW5uXG4gKi9cblxuaW1wb3J0IEV4cG9ydHMgZnJvbSAnLi4vRXhwb3J0TWFwJ1xuaW1wb3J0IHJlc29sdmUgZnJvbSAnZXNsaW50LW1vZHVsZS11dGlscy9yZXNvbHZlJ1xuaW1wb3J0IGRvY3NVcmwgZnJvbSAnLi4vZG9jc1VybCdcblxuLy8gZXNsaW50L2xpYi91dGlsL2dsb2ItdXRpbCBoYXMgYmVlbiBtb3ZlZCB0byBlc2xpbnQvbGliL3V0aWwvZ2xvYi11dGlscyB3aXRoIHZlcnNpb24gNS4zXG4vLyBhbmQgaGFzIGJlZW4gbW92ZWQgdG8gZXNsaW50L2xpYi9jbGktZW5naW5lL2ZpbGUtZW51bWVyYXRvciBpbiB2ZXJzaW9uIDZcbmxldCBsaXN0RmlsZXNUb1Byb2Nlc3NcbnRyeSB7XG4gIHZhciBGaWxlRW51bWVyYXRvciA9IHJlcXVpcmUoJ2VzbGludC9saWIvY2xpLWVuZ2luZS9maWxlLWVudW1lcmF0b3InKS5GaWxlRW51bWVyYXRvclxuICBsaXN0RmlsZXNUb1Byb2Nlc3MgPSBmdW5jdGlvbiAoc3JjKSB7XG4gICAgdmFyIGUgPSBuZXcgRmlsZUVudW1lcmF0b3IoKVxuICAgIHJldHVybiBBcnJheS5mcm9tKGUuaXRlcmF0ZUZpbGVzKHNyYyksICh7IGZpbGVQYXRoLCBpZ25vcmVkIH0pID0+ICh7XG4gICAgICBpZ25vcmVkLFxuICAgICAgZmlsZW5hbWU6IGZpbGVQYXRoLFxuICAgIH0pKVxuICB9XG59IGNhdGNoIChlMSkge1xuICB0cnkge1xuICAgIGxpc3RGaWxlc1RvUHJvY2VzcyA9IHJlcXVpcmUoJ2VzbGludC9saWIvdXRpbC9nbG9iLXV0aWxzJykubGlzdEZpbGVzVG9Qcm9jZXNzXG4gIH0gY2F0Y2ggKGUyKSB7XG4gICAgbGlzdEZpbGVzVG9Qcm9jZXNzID0gcmVxdWlyZSgnZXNsaW50L2xpYi91dGlsL2dsb2ItdXRpbCcpLmxpc3RGaWxlc1RvUHJvY2Vzc1xuICB9XG59XG5cbmNvbnN0IEVYUE9SVF9ERUZBVUxUX0RFQ0xBUkFUSU9OID0gJ0V4cG9ydERlZmF1bHREZWNsYXJhdGlvbidcbmNvbnN0IEVYUE9SVF9OQU1FRF9ERUNMQVJBVElPTiA9ICdFeHBvcnROYW1lZERlY2xhcmF0aW9uJ1xuY29uc3QgRVhQT1JUX0FMTF9ERUNMQVJBVElPTiA9ICdFeHBvcnRBbGxEZWNsYXJhdGlvbidcbmNvbnN0IElNUE9SVF9ERUNMQVJBVElPTiA9ICdJbXBvcnREZWNsYXJhdGlvbidcbmNvbnN0IElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSID0gJ0ltcG9ydE5hbWVzcGFjZVNwZWNpZmllcidcbmNvbnN0IElNUE9SVF9ERUZBVUxUX1NQRUNJRklFUiA9ICdJbXBvcnREZWZhdWx0U3BlY2lmaWVyJ1xuY29uc3QgVkFSSUFCTEVfREVDTEFSQVRJT04gPSAnVmFyaWFibGVEZWNsYXJhdGlvbidcbmNvbnN0IEZVTkNUSU9OX0RFQ0xBUkFUSU9OID0gJ0Z1bmN0aW9uRGVjbGFyYXRpb24nXG5jb25zdCBDTEFTU19ERUNMQVJBVElPTiA9ICdDbGFzc0RlY2xhcmF0aW9uJ1xuY29uc3QgREVGQVVMVCA9ICdkZWZhdWx0J1xuXG5sZXQgcHJlcGFyYXRpb25Eb25lID0gZmFsc2VcbmNvbnN0IGltcG9ydExpc3QgPSBuZXcgTWFwKClcbmNvbnN0IGV4cG9ydExpc3QgPSBuZXcgTWFwKClcbmNvbnN0IGlnbm9yZWRGaWxlcyA9IG5ldyBTZXQoKVxuXG5jb25zdCBpc05vZGVNb2R1bGUgPSBwYXRoID0+IHtcbiAgcmV0dXJuIC9cXC8obm9kZV9tb2R1bGVzKVxcLy8udGVzdChwYXRoKVxufVxuXG4vKipcbiAqIHJlYWQgYWxsIGZpbGVzIG1hdGNoaW5nIHRoZSBwYXR0ZXJucyBpbiBzcmMgYW5kIGlnbm9yZUV4cG9ydHNcbiAqXG4gKiByZXR1cm4gYWxsIGZpbGVzIG1hdGNoaW5nIHNyYyBwYXR0ZXJuLCB3aGljaCBhcmUgbm90IG1hdGNoaW5nIHRoZSBpZ25vcmVFeHBvcnRzIHBhdHRlcm5cbiAqL1xuY29uc3QgcmVzb2x2ZUZpbGVzID0gKHNyYywgaWdub3JlRXhwb3J0cykgPT4ge1xuICBjb25zdCBzcmNGaWxlcyA9IG5ldyBTZXQoKVxuICBjb25zdCBzcmNGaWxlTGlzdCA9IGxpc3RGaWxlc1RvUHJvY2VzcyhzcmMpXG5cbiAgLy8gcHJlcGFyZSBsaXN0IG9mIGlnbm9yZWQgZmlsZXNcbiAgY29uc3QgaWdub3JlZEZpbGVzTGlzdCA9ICBsaXN0RmlsZXNUb1Byb2Nlc3MoaWdub3JlRXhwb3J0cylcbiAgaWdub3JlZEZpbGVzTGlzdC5mb3JFYWNoKCh7IGZpbGVuYW1lIH0pID0+IGlnbm9yZWRGaWxlcy5hZGQoZmlsZW5hbWUpKVxuXG4gIC8vIHByZXBhcmUgbGlzdCBvZiBzb3VyY2UgZmlsZXMsIGRvbid0IGNvbnNpZGVyIGZpbGVzIGZyb20gbm9kZV9tb2R1bGVzXG4gIHNyY0ZpbGVMaXN0LmZpbHRlcigoeyBmaWxlbmFtZSB9KSA9PiAhaXNOb2RlTW9kdWxlKGZpbGVuYW1lKSkuZm9yRWFjaCgoeyBmaWxlbmFtZSB9KSA9PiB7XG4gICAgc3JjRmlsZXMuYWRkKGZpbGVuYW1lKVxuICB9KVxuICByZXR1cm4gc3JjRmlsZXNcbn1cblxuLyoqXG4gKiBwYXJzZSBhbGwgc291cmNlIGZpbGVzIGFuZCBidWlsZCB1cCAyIG1hcHMgY29udGFpbmluZyB0aGUgZXhpc3RpbmcgaW1wb3J0cyBhbmQgZXhwb3J0c1xuICovXG5jb25zdCBwcmVwYXJlSW1wb3J0c0FuZEV4cG9ydHMgPSAoc3JjRmlsZXMsIGNvbnRleHQpID0+IHtcbiAgY29uc3QgZXhwb3J0QWxsID0gbmV3IE1hcCgpXG4gIHNyY0ZpbGVzLmZvckVhY2goZmlsZSA9PiB7XG4gICAgY29uc3QgZXhwb3J0cyA9IG5ldyBNYXAoKVxuICAgIGNvbnN0IGltcG9ydHMgPSBuZXcgTWFwKClcbiAgICBjb25zdCBjdXJyZW50RXhwb3J0cyA9IEV4cG9ydHMuZ2V0KGZpbGUsIGNvbnRleHQpXG4gICAgaWYgKGN1cnJlbnRFeHBvcnRzKSB7XG4gICAgICBjb25zdCB7IGRlcGVuZGVuY2llcywgcmVleHBvcnRzLCBpbXBvcnRzOiBsb2NhbEltcG9ydExpc3QsIG5hbWVzcGFjZSAgfSA9IGN1cnJlbnRFeHBvcnRzXG5cbiAgICAgIC8vIGRlcGVuZGVuY2llcyA9PT0gZXhwb3J0ICogZnJvbSBcbiAgICAgIGNvbnN0IGN1cnJlbnRFeHBvcnRBbGwgPSBuZXcgU2V0KClcbiAgICAgIGRlcGVuZGVuY2llcy5mb3JFYWNoKHZhbHVlID0+IHtcbiAgICAgICAgY3VycmVudEV4cG9ydEFsbC5hZGQodmFsdWUoKS5wYXRoKVxuICAgICAgfSlcbiAgICAgIGV4cG9ydEFsbC5zZXQoZmlsZSwgY3VycmVudEV4cG9ydEFsbClcblxuICAgICAgcmVleHBvcnRzLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgaWYgKGtleSA9PT0gREVGQVVMVCkge1xuICAgICAgICAgIGV4cG9ydHMuc2V0KElNUE9SVF9ERUZBVUxUX1NQRUNJRklFUiwgeyB3aGVyZVVzZWQ6IG5ldyBTZXQoKSB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGV4cG9ydHMuc2V0KGtleSwgeyB3aGVyZVVzZWQ6IG5ldyBTZXQoKSB9KVxuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHJlZXhwb3J0ID0gIHZhbHVlLmdldEltcG9ydCgpXG4gICAgICAgIGlmICghcmVleHBvcnQpIHtcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgICBsZXQgbG9jYWxJbXBvcnQgPSBpbXBvcnRzLmdldChyZWV4cG9ydC5wYXRoKVxuICAgICAgICBsZXQgY3VycmVudFZhbHVlXG4gICAgICAgIGlmICh2YWx1ZS5sb2NhbCA9PT0gREVGQVVMVCkge1xuICAgICAgICAgIGN1cnJlbnRWYWx1ZSA9IElNUE9SVF9ERUZBVUxUX1NQRUNJRklFUlxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGN1cnJlbnRWYWx1ZSA9IHZhbHVlLmxvY2FsXG4gICAgICAgIH1cbiAgICAgICAgaWYgKHR5cGVvZiBsb2NhbEltcG9ydCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICBsb2NhbEltcG9ydCA9IG5ldyBTZXQoWy4uLmxvY2FsSW1wb3J0LCBjdXJyZW50VmFsdWVdKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGxvY2FsSW1wb3J0ID0gbmV3IFNldChbY3VycmVudFZhbHVlXSlcbiAgICAgICAgfVxuICAgICAgICBpbXBvcnRzLnNldChyZWV4cG9ydC5wYXRoLCBsb2NhbEltcG9ydClcbiAgICAgIH0pXG5cbiAgICAgIGxvY2FsSW1wb3J0TGlzdC5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICAgIGlmIChpc05vZGVNb2R1bGUoa2V5KSkge1xuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICAgIGltcG9ydHMuc2V0KGtleSwgdmFsdWUuaW1wb3J0ZWRTcGVjaWZpZXJzKVxuICAgICAgfSlcbiAgICAgIGltcG9ydExpc3Quc2V0KGZpbGUsIGltcG9ydHMpXG5cbiAgICAgIC8vIGJ1aWxkIHVwIGV4cG9ydCBsaXN0IG9ubHksIGlmIGZpbGUgaXMgbm90IGlnbm9yZWRcbiAgICAgIGlmIChpZ25vcmVkRmlsZXMuaGFzKGZpbGUpKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuICAgICAgbmFtZXNwYWNlLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgaWYgKGtleSA9PT0gREVGQVVMVCkge1xuICAgICAgICAgIGV4cG9ydHMuc2V0KElNUE9SVF9ERUZBVUxUX1NQRUNJRklFUiwgeyB3aGVyZVVzZWQ6IG5ldyBTZXQoKSB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGV4cG9ydHMuc2V0KGtleSwgeyB3aGVyZVVzZWQ6IG5ldyBTZXQoKSB9KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgICBleHBvcnRzLnNldChFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OLCB7IHdoZXJlVXNlZDogbmV3IFNldCgpIH0pXG4gICAgZXhwb3J0cy5zZXQoSU1QT1JUX05BTUVTUEFDRV9TUEVDSUZJRVIsIHsgd2hlcmVVc2VkOiBuZXcgU2V0KCkgfSlcbiAgICBleHBvcnRMaXN0LnNldChmaWxlLCBleHBvcnRzKVxuICB9KVxuICBleHBvcnRBbGwuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4ge1xuICAgIHZhbHVlLmZvckVhY2godmFsID0+IHtcbiAgICAgIGNvbnN0IGN1cnJlbnRFeHBvcnRzID0gZXhwb3J0TGlzdC5nZXQodmFsKVxuICAgICAgY29uc3QgY3VycmVudEV4cG9ydCA9IGN1cnJlbnRFeHBvcnRzLmdldChFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OKVxuICAgICAgY3VycmVudEV4cG9ydC53aGVyZVVzZWQuYWRkKGtleSlcbiAgICB9KVxuICB9KVxufVxuXG4vKipcbiAqIHRyYXZlcnNlIHRocm91Z2ggYWxsIGltcG9ydHMgYW5kIGFkZCB0aGUgcmVzcGVjdGl2ZSBwYXRoIHRvIHRoZSB3aGVyZVVzZWQtbGlzdCBcbiAqIG9mIHRoZSBjb3JyZXNwb25kaW5nIGV4cG9ydFxuICovXG5jb25zdCBkZXRlcm1pbmVVc2FnZSA9ICgpID0+IHtcbiAgaW1wb3J0TGlzdC5mb3JFYWNoKChsaXN0VmFsdWUsIGxpc3RLZXkpID0+IHtcbiAgICBsaXN0VmFsdWUuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4ge1xuICAgICAgY29uc3QgZXhwb3J0cyA9IGV4cG9ydExpc3QuZ2V0KGtleSlcbiAgICAgIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdmFsdWUuZm9yRWFjaChjdXJyZW50SW1wb3J0ID0+IHtcbiAgICAgICAgICBsZXQgc3BlY2lmaWVyXG4gICAgICAgICAgaWYgKGN1cnJlbnRJbXBvcnQgPT09IElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKSB7XG4gICAgICAgICAgICBzcGVjaWZpZXIgPSBJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUlxuICAgICAgICAgIH0gZWxzZSBpZiAoY3VycmVudEltcG9ydCA9PT0gSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSKSB7XG4gICAgICAgICAgICBzcGVjaWZpZXIgPSBJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVJcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc3BlY2lmaWVyID0gY3VycmVudEltcG9ydFxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAodHlwZW9mIHNwZWNpZmllciAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGNvbnN0IGV4cG9ydFN0YXRlbWVudCA9IGV4cG9ydHMuZ2V0KHNwZWNpZmllcilcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZXhwb3J0U3RhdGVtZW50ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICBjb25zdCB7IHdoZXJlVXNlZCB9ID0gZXhwb3J0U3RhdGVtZW50XG4gICAgICAgICAgICAgIHdoZXJlVXNlZC5hZGQobGlzdEtleSlcbiAgICAgICAgICAgICAgZXhwb3J0cy5zZXQoc3BlY2lmaWVyLCB7IHdoZXJlVXNlZCB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICAgIH1cbiAgICB9KVxuICB9KVxufVxuXG5jb25zdCBnZXRTcmMgPSBzcmMgPT4ge1xuICBpZiAoc3JjKSB7XG4gICAgcmV0dXJuIHNyY1xuICB9XG4gIHJldHVybiBbcHJvY2Vzcy5jd2QoKV1cbn1cblxuLyoqXG4gKiBwcmVwYXJlIHRoZSBsaXN0cyBvZiBleGlzdGluZyBpbXBvcnRzIGFuZCBleHBvcnRzIC0gc2hvdWxkIG9ubHkgYmUgZXhlY3V0ZWQgb25jZSBhdFxuICogdGhlIHN0YXJ0IG9mIGEgbmV3IGVzbGludCBydW5cbiAqL1xuY29uc3QgZG9QcmVwYXJhdGlvbiA9IChzcmMsIGlnbm9yZUV4cG9ydHMsIGNvbnRleHQpID0+IHtcbiAgY29uc3Qgc3JjRmlsZXMgPSByZXNvbHZlRmlsZXMoZ2V0U3JjKHNyYyksIGlnbm9yZUV4cG9ydHMpXG4gIHByZXBhcmVJbXBvcnRzQW5kRXhwb3J0cyhzcmNGaWxlcywgY29udGV4dClcbiAgZGV0ZXJtaW5lVXNhZ2UoKVxuICBwcmVwYXJhdGlvbkRvbmUgPSB0cnVlXG59XG5cbmNvbnN0IG5ld05hbWVzcGFjZUltcG9ydEV4aXN0cyA9IHNwZWNpZmllcnMgPT5cbiAgc3BlY2lmaWVycy5zb21lKCh7IHR5cGUgfSkgPT4gdHlwZSA9PT0gSU1QT1JUX05BTUVTUEFDRV9TUEVDSUZJRVIpXG5cbmNvbnN0IG5ld0RlZmF1bHRJbXBvcnRFeGlzdHMgPSBzcGVjaWZpZXJzID0+XG4gIHNwZWNpZmllcnMuc29tZSgoeyB0eXBlIH0pID0+IHR5cGUgPT09IElNUE9SVF9ERUZBVUxUX1NQRUNJRklFUilcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1ldGE6IHtcbiAgICBkb2NzOiB7IHVybDogZG9jc1VybCgnbm8tdW51c2VkLW1vZHVsZXMnKSB9LFxuICAgIHNjaGVtYTogW3tcbiAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgc3JjOiB7XG4gICAgICAgICAgZGVzY3JpcHRpb246ICdmaWxlcy9wYXRocyB0byBiZSBhbmFseXplZCAob25seSBmb3IgdW51c2VkIGV4cG9ydHMpJyxcbiAgICAgICAgICB0eXBlOiAnYXJyYXknLFxuICAgICAgICAgIG1pbkl0ZW1zOiAxLFxuICAgICAgICAgIGl0ZW1zOiB7XG4gICAgICAgICAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIG1pbkxlbmd0aDogMSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICBpZ25vcmVFeHBvcnRzOiB7XG4gICAgICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICAgICAnZmlsZXMvcGF0aHMgZm9yIHdoaWNoIHVudXNlZCBleHBvcnRzIHdpbGwgbm90IGJlIHJlcG9ydGVkIChlLmcgbW9kdWxlIGVudHJ5IHBvaW50cyknLFxuICAgICAgICAgIHR5cGU6ICdhcnJheScsXG4gICAgICAgICAgbWluSXRlbXM6IDEsXG4gICAgICAgICAgaXRlbXM6IHtcbiAgICAgICAgICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgICAgICAgICAgbWluTGVuZ3RoOiAxLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIG1pc3NpbmdFeHBvcnRzOiB7XG4gICAgICAgICAgZGVzY3JpcHRpb246ICdyZXBvcnQgbW9kdWxlcyB3aXRob3V0IGFueSBleHBvcnRzJyxcbiAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIH0sXG4gICAgICAgIHVudXNlZEV4cG9ydHM6IHtcbiAgICAgICAgICBkZXNjcmlwdGlvbjogJ3JlcG9ydCBleHBvcnRzIHdpdGhvdXQgYW55IHVzYWdlJyxcbiAgICAgICAgICB0eXBlOiAnYm9vbGVhbicsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgbm90OiB7XG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICB1bnVzZWRFeHBvcnRzOiB7IGVudW06IFtmYWxzZV0gfSxcbiAgICAgICAgICBtaXNzaW5nRXhwb3J0czogeyBlbnVtOiBbZmFsc2VdIH0sXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgYW55T2Y6W3tcbiAgICAgICAgbm90OiB7XG4gICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgdW51c2VkRXhwb3J0czogeyBlbnVtOiBbdHJ1ZV0gfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWydtaXNzaW5nRXhwb3J0cyddLFxuICAgICAgfSwge1xuICAgICAgICBub3Q6IHtcbiAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICBtaXNzaW5nRXhwb3J0czogeyBlbnVtOiBbdHJ1ZV0gfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWyd1bnVzZWRFeHBvcnRzJ10sXG4gICAgICB9LCB7XG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICB1bnVzZWRFeHBvcnRzOiB7IGVudW06IFt0cnVlXSB9LFxuICAgICAgICB9LFxuICAgICAgICByZXF1aXJlZDogWyd1bnVzZWRFeHBvcnRzJ10sXG4gICAgICB9LCB7XG4gICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICBtaXNzaW5nRXhwb3J0czogeyBlbnVtOiBbdHJ1ZV0gfSxcbiAgICAgICAgfSxcbiAgICAgICAgcmVxdWlyZWQ6IFsnbWlzc2luZ0V4cG9ydHMnXSxcbiAgICAgIH1dLFxuICAgIH1dLFxuICB9LFxuXG4gIGNyZWF0ZTogY29udGV4dCA9PiB7XG4gICAgY29uc3Qge1xuICAgICAgc3JjLFxuICAgICAgaWdub3JlRXhwb3J0cyA9IFtdLFxuICAgICAgbWlzc2luZ0V4cG9ydHMsXG4gICAgICB1bnVzZWRFeHBvcnRzLFxuICAgIH0gPSBjb250ZXh0Lm9wdGlvbnNbMF0gfHwge31cblxuICAgIGlmICh1bnVzZWRFeHBvcnRzICYmICFwcmVwYXJhdGlvbkRvbmUpIHtcbiAgICAgIGRvUHJlcGFyYXRpb24oc3JjLCBpZ25vcmVFeHBvcnRzLCBjb250ZXh0KVxuICAgIH1cblxuICAgIGNvbnN0IGZpbGUgPSBjb250ZXh0LmdldEZpbGVuYW1lKClcblxuICAgIGNvbnN0IGNoZWNrRXhwb3J0UHJlc2VuY2UgPSBub2RlID0+IHtcbiAgICAgIGlmICghbWlzc2luZ0V4cG9ydHMpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGlmIChpZ25vcmVkRmlsZXMuaGFzKGZpbGUpKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBjb25zdCBleHBvcnRDb3VudCA9IGV4cG9ydExpc3QuZ2V0KGZpbGUpXG4gICAgICBjb25zdCBleHBvcnRBbGwgPSBleHBvcnRDb3VudC5nZXQoRVhQT1JUX0FMTF9ERUNMQVJBVElPTilcbiAgICAgIGNvbnN0IG5hbWVzcGFjZUltcG9ydHMgPSBleHBvcnRDb3VudC5nZXQoSU1QT1JUX05BTUVTUEFDRV9TUEVDSUZJRVIpXG5cbiAgICAgIGV4cG9ydENvdW50LmRlbGV0ZShFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OKVxuICAgICAgZXhwb3J0Q291bnQuZGVsZXRlKElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKVxuICAgICAgaWYgKG1pc3NpbmdFeHBvcnRzICYmIGV4cG9ydENvdW50LnNpemUgPCAxKSB7XG4gICAgICAgIC8vIG5vZGUuYm9keVswXSA9PT0gJ3VuZGVmaW5lZCcgb25seSBoYXBwZW5zLCBpZiBldmVyeXRoaW5nIGlzIGNvbW1lbnRlZCBvdXQgaW4gdGhlIGZpbGVcbiAgICAgICAgLy8gYmVpbmcgbGludGVkXG4gICAgICAgIGNvbnRleHQucmVwb3J0KG5vZGUuYm9keVswXSA/IG5vZGUuYm9keVswXSA6IG5vZGUsICdObyBleHBvcnRzIGZvdW5kJylcbiAgICAgIH1cbiAgICAgIGV4cG9ydENvdW50LnNldChFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OLCBleHBvcnRBbGwpXG4gICAgICBleHBvcnRDb3VudC5zZXQoSU1QT1JUX05BTUVTUEFDRV9TUEVDSUZJRVIsIG5hbWVzcGFjZUltcG9ydHMpXG4gICAgfVxuXG4gICAgY29uc3QgY2hlY2tVc2FnZSA9IChub2RlLCBleHBvcnRlZFZhbHVlKSA9PiB7XG4gICAgICBpZiAoIXVudXNlZEV4cG9ydHMpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGlmIChpZ25vcmVkRmlsZXMuaGFzKGZpbGUpKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICAvLyByZWZyZXNoIGxpc3Qgb2Ygc291cmNlIGZpbGVzXG4gICAgICBjb25zdCBzcmNGaWxlcyA9IHJlc29sdmVGaWxlcyhnZXRTcmMoc3JjKSwgaWdub3JlRXhwb3J0cylcblxuICAgICAgLy8gbWFrZSBzdXJlIGZpbGUgdG8gYmUgbGludGVkIGlzIGluY2x1ZGVkIGluIHNvdXJjZSBmaWxlc1xuICAgICAgaWYgKCFzcmNGaWxlcy5oYXMoZmlsZSkpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGV4cG9ydHMgPSBleHBvcnRMaXN0LmdldChmaWxlKVxuXG4gICAgICAvLyBzcGVjaWFsIGNhc2U6IGV4cG9ydCAqIGZyb20gXG4gICAgICBjb25zdCBleHBvcnRBbGwgPSBleHBvcnRzLmdldChFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OKVxuICAgICAgaWYgKHR5cGVvZiBleHBvcnRBbGwgIT09ICd1bmRlZmluZWQnICYmIGV4cG9ydGVkVmFsdWUgIT09IElNUE9SVF9ERUZBVUxUX1NQRUNJRklFUikge1xuICAgICAgICBpZiAoZXhwb3J0QWxsLndoZXJlVXNlZC5zaXplID4gMCkge1xuICAgICAgICAgIHJldHVyblxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIHNwZWNpYWwgY2FzZTogbmFtZXNwYWNlIGltcG9ydFxuICAgICAgY29uc3QgbmFtZXNwYWNlSW1wb3J0cyA9IGV4cG9ydHMuZ2V0KElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKVxuICAgICAgaWYgKHR5cGVvZiBuYW1lc3BhY2VJbXBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICBpZiAobmFtZXNwYWNlSW1wb3J0cy53aGVyZVVzZWQuc2l6ZSA+IDApIHtcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdCBleHBvcnRTdGF0ZW1lbnQgPSBleHBvcnRzLmdldChleHBvcnRlZFZhbHVlKVxuXG4gICAgICBjb25zdCB2YWx1ZSA9IGV4cG9ydGVkVmFsdWUgPT09IElNUE9SVF9ERUZBVUxUX1NQRUNJRklFUiA/IERFRkFVTFQgOiBleHBvcnRlZFZhbHVlXG5cbiAgICAgIGlmICh0eXBlb2YgZXhwb3J0U3RhdGVtZW50ICE9PSAndW5kZWZpbmVkJyl7XG4gICAgICAgIGlmIChleHBvcnRTdGF0ZW1lbnQud2hlcmVVc2VkLnNpemUgPCAxKSB7XG4gICAgICAgICAgY29udGV4dC5yZXBvcnQoXG4gICAgICAgICAgICBub2RlLFxuICAgICAgICAgICAgYGV4cG9ydGVkIGRlY2xhcmF0aW9uICcke3ZhbHVlfScgbm90IHVzZWQgd2l0aGluIG90aGVyIG1vZHVsZXNgXG4gICAgICAgICAgKVxuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb250ZXh0LnJlcG9ydChcbiAgICAgICAgICBub2RlLFxuICAgICAgICAgIGBleHBvcnRlZCBkZWNsYXJhdGlvbiAnJHt2YWx1ZX0nIG5vdCB1c2VkIHdpdGhpbiBvdGhlciBtb2R1bGVzYFxuICAgICAgICApXG4gICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogb25seSB1c2VmdWwgZm9yIHRvb2xzIGxpa2UgdnNjb2RlLWVzbGludFxuICAgICAqIFxuICAgICAqIHVwZGF0ZSBsaXN0cyBvZiBleGlzdGluZyBleHBvcnRzIGR1cmluZyBydW50aW1lXG4gICAgICovXG4gICAgY29uc3QgdXBkYXRlRXhwb3J0VXNhZ2UgPSBub2RlID0+IHtcbiAgICAgIGlmIChpZ25vcmVkRmlsZXMuaGFzKGZpbGUpKSB7XG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBsZXQgZXhwb3J0cyA9IGV4cG9ydExpc3QuZ2V0KGZpbGUpXG5cbiAgICAgIC8vIG5ldyBtb2R1bGUgaGFzIGJlZW4gY3JlYXRlZCBkdXJpbmcgcnVudGltZVxuICAgICAgLy8gaW5jbHVkZSBpdCBpbiBmdXJ0aGVyIHByb2Nlc3NpbmdcbiAgICAgIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgZXhwb3J0cyA9IG5ldyBNYXAoKVxuICAgICAgfVxuXG4gICAgICBjb25zdCBuZXdFeHBvcnRzID0gbmV3IE1hcCgpXG4gICAgICBjb25zdCBuZXdFeHBvcnRJZGVudGlmaWVycyA9IG5ldyBTZXQoKVxuXG4gICAgICBub2RlLmJvZHkuZm9yRWFjaCgoeyB0eXBlLCBkZWNsYXJhdGlvbiwgc3BlY2lmaWVycyB9KSA9PiB7XG4gICAgICAgIGlmICh0eXBlID09PSBFWFBPUlRfREVGQVVMVF9ERUNMQVJBVElPTikge1xuICAgICAgICAgIG5ld0V4cG9ydElkZW50aWZpZXJzLmFkZChJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVIpXG4gICAgICAgIH0gXG4gICAgICAgIGlmICh0eXBlID09PSBFWFBPUlRfTkFNRURfREVDTEFSQVRJT04pIHtcbiAgICAgICAgICBpZiAoc3BlY2lmaWVycy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBzcGVjaWZpZXJzLmZvckVhY2goc3BlY2lmaWVyID0+IHtcbiAgICAgICAgICAgICAgaWYgKHNwZWNpZmllci5leHBvcnRlZCkge1xuICAgICAgICAgICAgICAgIG5ld0V4cG9ydElkZW50aWZpZXJzLmFkZChzcGVjaWZpZXIuZXhwb3J0ZWQubmFtZSlcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGRlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIGRlY2xhcmF0aW9uLnR5cGUgPT09IEZVTkNUSU9OX0RFQ0xBUkFUSU9OIHx8XG4gICAgICAgICAgICAgIGRlY2xhcmF0aW9uLnR5cGUgPT09IENMQVNTX0RFQ0xBUkFUSU9OXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgbmV3RXhwb3J0SWRlbnRpZmllcnMuYWRkKGRlY2xhcmF0aW9uLmlkLm5hbWUpXG4gICAgICAgICAgICB9ICAgXG4gICAgICAgICAgICBpZiAoZGVjbGFyYXRpb24udHlwZSA9PT0gVkFSSUFCTEVfREVDTEFSQVRJT04pIHtcbiAgICAgICAgICAgICAgZGVjbGFyYXRpb24uZGVjbGFyYXRpb25zLmZvckVhY2goKHsgaWQgfSkgPT4ge1xuICAgICAgICAgICAgICAgIG5ld0V4cG9ydElkZW50aWZpZXJzLmFkZChpZC5uYW1lKVxuICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgLy8gb2xkIGV4cG9ydHMgZXhpc3Qgd2l0aGluIGxpc3Qgb2YgbmV3IGV4cG9ydHMgaWRlbnRpZmllcnM6IGFkZCB0byBtYXAgb2YgbmV3IGV4cG9ydHNcbiAgICAgIGV4cG9ydHMuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4ge1xuICAgICAgICBpZiAobmV3RXhwb3J0SWRlbnRpZmllcnMuaGFzKGtleSkpIHtcbiAgICAgICAgICBuZXdFeHBvcnRzLnNldChrZXksIHZhbHVlKVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICAvLyBuZXcgZXhwb3J0IGlkZW50aWZpZXJzIGFkZGVkOiBhZGQgdG8gbWFwIG9mIG5ldyBleHBvcnRzXG4gICAgICBuZXdFeHBvcnRJZGVudGlmaWVycy5mb3JFYWNoKGtleSA9PiB7XG4gICAgICAgIGlmICghZXhwb3J0cy5oYXMoa2V5KSkge1xuICAgICAgICAgIG5ld0V4cG9ydHMuc2V0KGtleSwgeyB3aGVyZVVzZWQ6IG5ldyBTZXQoKSB9KVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICAvLyBwcmVzZXJ2ZSBpbmZvcm1hdGlvbiBhYm91dCBuYW1lc3BhY2UgaW1wb3J0c1xuICAgICAgbGV0IGV4cG9ydEFsbCA9IGV4cG9ydHMuZ2V0KEVYUE9SVF9BTExfREVDTEFSQVRJT04pXG4gICAgICBsZXQgbmFtZXNwYWNlSW1wb3J0cyA9IGV4cG9ydHMuZ2V0KElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKVxuXG4gICAgICBpZiAodHlwZW9mIG5hbWVzcGFjZUltcG9ydHMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIG5hbWVzcGFjZUltcG9ydHMgPSB7IHdoZXJlVXNlZDogbmV3IFNldCgpIH1cbiAgICAgIH1cblxuICAgICAgbmV3RXhwb3J0cy5zZXQoRVhQT1JUX0FMTF9ERUNMQVJBVElPTiwgZXhwb3J0QWxsKVxuICAgICAgbmV3RXhwb3J0cy5zZXQoSU1QT1JUX05BTUVTUEFDRV9TUEVDSUZJRVIsIG5hbWVzcGFjZUltcG9ydHMpXG4gICAgICBleHBvcnRMaXN0LnNldChmaWxlLCBuZXdFeHBvcnRzKVxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIG9ubHkgdXNlZnVsIGZvciB0b29scyBsaWtlIHZzY29kZS1lc2xpbnRcbiAgICAgKiBcbiAgICAgKiB1cGRhdGUgbGlzdHMgb2YgZXhpc3RpbmcgaW1wb3J0cyBkdXJpbmcgcnVudGltZVxuICAgICAqL1xuICAgIGNvbnN0IHVwZGF0ZUltcG9ydFVzYWdlID0gbm9kZSA9PiB7XG4gICAgICBpZiAoIXVudXNlZEV4cG9ydHMpIHtcbiAgICAgICAgcmV0dXJuXG4gICAgICB9XG5cbiAgICAgIGxldCBvbGRJbXBvcnRQYXRocyA9IGltcG9ydExpc3QuZ2V0KGZpbGUpXG4gICAgICBpZiAodHlwZW9mIG9sZEltcG9ydFBhdGhzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICBvbGRJbXBvcnRQYXRocyA9IG5ldyBNYXAoKVxuICAgICAgfVxuXG4gICAgICBjb25zdCBvbGROYW1lc3BhY2VJbXBvcnRzID0gbmV3IFNldCgpXG4gICAgICBjb25zdCBuZXdOYW1lc3BhY2VJbXBvcnRzID0gbmV3IFNldCgpXG5cbiAgICAgIGNvbnN0IG9sZEV4cG9ydEFsbCA9IG5ldyBTZXQoKVxuICAgICAgY29uc3QgbmV3RXhwb3J0QWxsID0gbmV3IFNldCgpXG5cbiAgICAgIGNvbnN0IG9sZERlZmF1bHRJbXBvcnRzID0gbmV3IFNldCgpXG4gICAgICBjb25zdCBuZXdEZWZhdWx0SW1wb3J0cyA9IG5ldyBTZXQoKVxuXG4gICAgICBjb25zdCBvbGRJbXBvcnRzID0gbmV3IE1hcCgpXG4gICAgICBjb25zdCBuZXdJbXBvcnRzID0gbmV3IE1hcCgpXG4gICAgICBvbGRJbXBvcnRQYXRocy5mb3JFYWNoKCh2YWx1ZSwga2V5KSA9PiB7XG4gICAgICAgIGlmICh2YWx1ZS5oYXMoRVhQT1JUX0FMTF9ERUNMQVJBVElPTikpIHtcbiAgICAgICAgICBvbGRFeHBvcnRBbGwuYWRkKGtleSlcbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsdWUuaGFzKElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKSkge1xuICAgICAgICAgIG9sZE5hbWVzcGFjZUltcG9ydHMuYWRkKGtleSlcbiAgICAgICAgfVxuICAgICAgICBpZiAodmFsdWUuaGFzKElNUE9SVF9ERUZBVUxUX1NQRUNJRklFUikpIHtcbiAgICAgICAgICBvbGREZWZhdWx0SW1wb3J0cy5hZGQoa2V5KVxuICAgICAgICB9XG4gICAgICAgIHZhbHVlLmZvckVhY2godmFsID0+IHtcbiAgICAgICAgICBpZiAodmFsICE9PSBJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUiAmJlxuICAgICAgICAgICAgICB2YWwgIT09IElNUE9SVF9ERUZBVUxUX1NQRUNJRklFUikge1xuICAgICAgICAgICAgICAgb2xkSW1wb3J0cy5zZXQodmFsLCBrZXkpXG4gICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfSlcblxuICAgICAgbm9kZS5ib2R5LmZvckVhY2goYXN0Tm9kZSA9PiB7XG4gICAgICAgIGxldCByZXNvbHZlZFBhdGhcblxuICAgICAgICAvLyBzdXBwb3J0IGZvciBleHBvcnQgeyB2YWx1ZSB9IGZyb20gJ21vZHVsZSdcbiAgICAgICAgaWYgKGFzdE5vZGUudHlwZSA9PT0gRVhQT1JUX05BTUVEX0RFQ0xBUkFUSU9OKSB7XG4gICAgICAgICAgaWYgKGFzdE5vZGUuc291cmNlKSB7XG4gICAgICAgICAgICByZXNvbHZlZFBhdGggPSByZXNvbHZlKGFzdE5vZGUuc291cmNlLnJhdy5yZXBsYWNlKC8oJ3xcIikvZywgJycpLCBjb250ZXh0KVxuICAgICAgICAgICAgYXN0Tm9kZS5zcGVjaWZpZXJzLmZvckVhY2goc3BlY2lmaWVyID0+IHtcbiAgICAgICAgICAgICAgbGV0IG5hbWVcbiAgICAgICAgICAgICAgaWYgKHNwZWNpZmllci5leHBvcnRlZC5uYW1lID09PSBERUZBVUxUKSB7XG4gICAgICAgICAgICAgICAgbmFtZSA9IElNUE9SVF9ERUZBVUxUX1NQRUNJRklFUlxuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG5hbWUgPSBzcGVjaWZpZXIubG9jYWwubmFtZVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIG5ld0ltcG9ydHMuc2V0KG5hbWUsIHJlc29sdmVkUGF0aClcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFzdE5vZGUudHlwZSA9PT0gRVhQT1JUX0FMTF9ERUNMQVJBVElPTikge1xuICAgICAgICAgIHJlc29sdmVkUGF0aCA9IHJlc29sdmUoYXN0Tm9kZS5zb3VyY2UucmF3LnJlcGxhY2UoLygnfFwiKS9nLCAnJyksIGNvbnRleHQpXG4gICAgICAgICAgbmV3RXhwb3J0QWxsLmFkZChyZXNvbHZlZFBhdGgpXG4gICAgICAgIH1cblxuICAgICAgICBpZiAoYXN0Tm9kZS50eXBlID09PSBJTVBPUlRfREVDTEFSQVRJT04pIHtcbiAgICAgICAgICByZXNvbHZlZFBhdGggPSByZXNvbHZlKGFzdE5vZGUuc291cmNlLnJhdy5yZXBsYWNlKC8oJ3xcIikvZywgJycpLCBjb250ZXh0KVxuICAgICAgICAgIGlmICghcmVzb2x2ZWRQYXRoKSB7XG4gICAgICAgICAgICByZXR1cm5cbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoaXNOb2RlTW9kdWxlKHJlc29sdmVkUGF0aCkpIHtcbiAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChuZXdOYW1lc3BhY2VJbXBvcnRFeGlzdHMoYXN0Tm9kZS5zcGVjaWZpZXJzKSkge1xuICAgICAgICAgICAgbmV3TmFtZXNwYWNlSW1wb3J0cy5hZGQocmVzb2x2ZWRQYXRoKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChuZXdEZWZhdWx0SW1wb3J0RXhpc3RzKGFzdE5vZGUuc3BlY2lmaWVycykpIHtcbiAgICAgICAgICAgIG5ld0RlZmF1bHRJbXBvcnRzLmFkZChyZXNvbHZlZFBhdGgpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYXN0Tm9kZS5zcGVjaWZpZXJzLmZvckVhY2goc3BlY2lmaWVyID0+IHtcbiAgICAgICAgICAgIGlmIChzcGVjaWZpZXIudHlwZSA9PT0gSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSIHx8XG4gICAgICAgICAgICAgICAgc3BlY2lmaWVyLnR5cGUgPT09IElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKSB7XG4gICAgICAgICAgICAgIHJldHVyblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbmV3SW1wb3J0cy5zZXQoc3BlY2lmaWVyLmltcG9ydGVkLm5hbWUsIHJlc29sdmVkUGF0aClcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICBuZXdFeHBvcnRBbGwuZm9yRWFjaCh2YWx1ZSA9PiB7XG4gICAgICAgIGlmICghb2xkRXhwb3J0QWxsLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICBsZXQgaW1wb3J0cyA9IG9sZEltcG9ydFBhdGhzLmdldCh2YWx1ZSlcbiAgICAgICAgICBpZiAodHlwZW9mIGltcG9ydHMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpbXBvcnRzID0gbmV3IFNldCgpXG4gICAgICAgICAgfVxuICAgICAgICAgIGltcG9ydHMuYWRkKEVYUE9SVF9BTExfREVDTEFSQVRJT04pXG4gICAgICAgICAgb2xkSW1wb3J0UGF0aHMuc2V0KHZhbHVlLCBpbXBvcnRzKVxuXG4gICAgICAgICAgbGV0IGV4cG9ydHMgPSBleHBvcnRMaXN0LmdldCh2YWx1ZSlcbiAgICAgICAgICBsZXQgY3VycmVudEV4cG9ydFxuICAgICAgICAgIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGN1cnJlbnRFeHBvcnQgPSBleHBvcnRzLmdldChFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBleHBvcnRzID0gbmV3IE1hcCgpXG4gICAgICAgICAgICBleHBvcnRMaXN0LnNldCh2YWx1ZSwgZXhwb3J0cylcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAodHlwZW9mIGN1cnJlbnRFeHBvcnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjdXJyZW50RXhwb3J0LndoZXJlVXNlZC5hZGQoZmlsZSlcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY29uc3Qgd2hlcmVVc2VkID0gbmV3IFNldCgpXG4gICAgICAgICAgICB3aGVyZVVzZWQuYWRkKGZpbGUpXG4gICAgICAgICAgICBleHBvcnRzLnNldChFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OLCB7IHdoZXJlVXNlZCB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgb2xkRXhwb3J0QWxsLmZvckVhY2godmFsdWUgPT4ge1xuICAgICAgICBpZiAoIW5ld0V4cG9ydEFsbC5oYXModmFsdWUpKSB7XG4gICAgICAgICAgY29uc3QgaW1wb3J0cyA9IG9sZEltcG9ydFBhdGhzLmdldCh2YWx1ZSlcbiAgICAgICAgICBpbXBvcnRzLmRlbGV0ZShFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OKVxuXG4gICAgICAgICAgY29uc3QgZXhwb3J0cyA9IGV4cG9ydExpc3QuZ2V0KHZhbHVlKVxuICAgICAgICAgIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRFeHBvcnQgPSBleHBvcnRzLmdldChFWFBPUlRfQUxMX0RFQ0xBUkFUSU9OKVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBjdXJyZW50RXhwb3J0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICBjdXJyZW50RXhwb3J0LndoZXJlVXNlZC5kZWxldGUoZmlsZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIG5ld0RlZmF1bHRJbXBvcnRzLmZvckVhY2godmFsdWUgPT4ge1xuICAgICAgICBpZiAoIW9sZERlZmF1bHRJbXBvcnRzLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICBsZXQgaW1wb3J0cyA9IG9sZEltcG9ydFBhdGhzLmdldCh2YWx1ZSlcbiAgICAgICAgICBpZiAodHlwZW9mIGltcG9ydHMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpbXBvcnRzID0gbmV3IFNldCgpXG4gICAgICAgICAgfVxuICAgICAgICAgIGltcG9ydHMuYWRkKElNUE9SVF9ERUZBVUxUX1NQRUNJRklFUilcbiAgICAgICAgICBvbGRJbXBvcnRQYXRocy5zZXQodmFsdWUsIGltcG9ydHMpXG5cbiAgICAgICAgICBsZXQgZXhwb3J0cyA9IGV4cG9ydExpc3QuZ2V0KHZhbHVlKVxuICAgICAgICAgIGxldCBjdXJyZW50RXhwb3J0XG4gICAgICAgICAgaWYgKHR5cGVvZiBleHBvcnRzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgY3VycmVudEV4cG9ydCA9IGV4cG9ydHMuZ2V0KElNUE9SVF9ERUZBVUxUX1NQRUNJRklFUilcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZXhwb3J0cyA9IG5ldyBNYXAoKVxuICAgICAgICAgICAgZXhwb3J0TGlzdC5zZXQodmFsdWUsIGV4cG9ydHMpXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKHR5cGVvZiBjdXJyZW50RXhwb3J0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgY3VycmVudEV4cG9ydC53aGVyZVVzZWQuYWRkKGZpbGUpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGNvbnN0IHdoZXJlVXNlZCA9IG5ldyBTZXQoKVxuICAgICAgICAgICAgd2hlcmVVc2VkLmFkZChmaWxlKVxuICAgICAgICAgICAgZXhwb3J0cy5zZXQoSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSLCB7IHdoZXJlVXNlZCB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgb2xkRGVmYXVsdEltcG9ydHMuZm9yRWFjaCh2YWx1ZSA9PiB7XG4gICAgICAgIGlmICghbmV3RGVmYXVsdEltcG9ydHMuaGFzKHZhbHVlKSkge1xuICAgICAgICAgIGNvbnN0IGltcG9ydHMgPSBvbGRJbXBvcnRQYXRocy5nZXQodmFsdWUpXG4gICAgICAgICAgaW1wb3J0cy5kZWxldGUoSU1QT1JUX0RFRkFVTFRfU1BFQ0lGSUVSKVxuXG4gICAgICAgICAgY29uc3QgZXhwb3J0cyA9IGV4cG9ydExpc3QuZ2V0KHZhbHVlKVxuICAgICAgICAgIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRFeHBvcnQgPSBleHBvcnRzLmdldChJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVIpXG4gICAgICAgICAgICBpZiAodHlwZW9mIGN1cnJlbnRFeHBvcnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgIGN1cnJlbnRFeHBvcnQud2hlcmVVc2VkLmRlbGV0ZShmaWxlKVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgbmV3TmFtZXNwYWNlSW1wb3J0cy5mb3JFYWNoKHZhbHVlID0+IHtcbiAgICAgICAgaWYgKCFvbGROYW1lc3BhY2VJbXBvcnRzLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICBsZXQgaW1wb3J0cyA9IG9sZEltcG9ydFBhdGhzLmdldCh2YWx1ZSlcbiAgICAgICAgICBpZiAodHlwZW9mIGltcG9ydHMgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBpbXBvcnRzID0gbmV3IFNldCgpXG4gICAgICAgICAgfVxuICAgICAgICAgIGltcG9ydHMuYWRkKElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKVxuICAgICAgICAgIG9sZEltcG9ydFBhdGhzLnNldCh2YWx1ZSwgaW1wb3J0cylcblxuICAgICAgICAgIGxldCBleHBvcnRzID0gZXhwb3J0TGlzdC5nZXQodmFsdWUpXG4gICAgICAgICAgbGV0IGN1cnJlbnRFeHBvcnRcbiAgICAgICAgICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjdXJyZW50RXhwb3J0ID0gZXhwb3J0cy5nZXQoSU1QT1JUX05BTUVTUEFDRV9TUEVDSUZJRVIpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV4cG9ydHMgPSBuZXcgTWFwKClcbiAgICAgICAgICAgIGV4cG9ydExpc3Quc2V0KHZhbHVlLCBleHBvcnRzKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0eXBlb2YgY3VycmVudEV4cG9ydCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGN1cnJlbnRFeHBvcnQud2hlcmVVc2VkLmFkZChmaWxlKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCB3aGVyZVVzZWQgPSBuZXcgU2V0KClcbiAgICAgICAgICAgIHdoZXJlVXNlZC5hZGQoZmlsZSlcbiAgICAgICAgICAgIGV4cG9ydHMuc2V0KElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSLCB7IHdoZXJlVXNlZCB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSlcblxuICAgICAgb2xkTmFtZXNwYWNlSW1wb3J0cy5mb3JFYWNoKHZhbHVlID0+IHtcbiAgICAgICAgaWYgKCFuZXdOYW1lc3BhY2VJbXBvcnRzLmhhcyh2YWx1ZSkpIHtcbiAgICAgICAgICBjb25zdCBpbXBvcnRzID0gb2xkSW1wb3J0UGF0aHMuZ2V0KHZhbHVlKVxuICAgICAgICAgIGltcG9ydHMuZGVsZXRlKElNUE9SVF9OQU1FU1BBQ0VfU1BFQ0lGSUVSKVxuXG4gICAgICAgICAgY29uc3QgZXhwb3J0cyA9IGV4cG9ydExpc3QuZ2V0KHZhbHVlKVxuICAgICAgICAgIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGNvbnN0IGN1cnJlbnRFeHBvcnQgPSBleHBvcnRzLmdldChJTVBPUlRfTkFNRVNQQUNFX1NQRUNJRklFUilcbiAgICAgICAgICAgIGlmICh0eXBlb2YgY3VycmVudEV4cG9ydCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgY3VycmVudEV4cG9ydC53aGVyZVVzZWQuZGVsZXRlKGZpbGUpXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICBuZXdJbXBvcnRzLmZvckVhY2goKHZhbHVlLCBrZXkpID0+IHtcbiAgICAgICAgaWYgKCFvbGRJbXBvcnRzLmhhcyhrZXkpKSB7XG4gICAgICAgICAgbGV0IGltcG9ydHMgPSBvbGRJbXBvcnRQYXRocy5nZXQodmFsdWUpXG4gICAgICAgICAgaWYgKHR5cGVvZiBpbXBvcnRzID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgaW1wb3J0cyA9IG5ldyBTZXQoKVxuICAgICAgICAgIH1cbiAgICAgICAgICBpbXBvcnRzLmFkZChrZXkpXG4gICAgICAgICAgb2xkSW1wb3J0UGF0aHMuc2V0KHZhbHVlLCBpbXBvcnRzKVxuXG4gICAgICAgICAgbGV0IGV4cG9ydHMgPSBleHBvcnRMaXN0LmdldCh2YWx1ZSlcbiAgICAgICAgICBsZXQgY3VycmVudEV4cG9ydFxuICAgICAgICAgIGlmICh0eXBlb2YgZXhwb3J0cyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGN1cnJlbnRFeHBvcnQgPSBleHBvcnRzLmdldChrZXkpXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGV4cG9ydHMgPSBuZXcgTWFwKClcbiAgICAgICAgICAgIGV4cG9ydExpc3Quc2V0KHZhbHVlLCBleHBvcnRzKVxuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0eXBlb2YgY3VycmVudEV4cG9ydCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGN1cnJlbnRFeHBvcnQud2hlcmVVc2VkLmFkZChmaWxlKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb25zdCB3aGVyZVVzZWQgPSBuZXcgU2V0KClcbiAgICAgICAgICAgIHdoZXJlVXNlZC5hZGQoZmlsZSlcbiAgICAgICAgICAgIGV4cG9ydHMuc2V0KGtleSwgeyB3aGVyZVVzZWQgfSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG5cbiAgICAgIG9sZEltcG9ydHMuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4ge1xuICAgICAgICBpZiAoIW5ld0ltcG9ydHMuaGFzKGtleSkpIHtcbiAgICAgICAgICBjb25zdCBpbXBvcnRzID0gb2xkSW1wb3J0UGF0aHMuZ2V0KHZhbHVlKVxuICAgICAgICAgIGltcG9ydHMuZGVsZXRlKGtleSlcblxuICAgICAgICAgIGNvbnN0IGV4cG9ydHMgPSBleHBvcnRMaXN0LmdldCh2YWx1ZSlcbiAgICAgICAgICBpZiAodHlwZW9mIGV4cG9ydHMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBjb25zdCBjdXJyZW50RXhwb3J0ID0gZXhwb3J0cy5nZXQoa2V5KVxuICAgICAgICAgICAgaWYgKHR5cGVvZiBjdXJyZW50RXhwb3J0ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICBjdXJyZW50RXhwb3J0LndoZXJlVXNlZC5kZWxldGUoZmlsZSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICdQcm9ncmFtOmV4aXQnOiBub2RlID0+IHtcbiAgICAgICAgdXBkYXRlRXhwb3J0VXNhZ2Uobm9kZSlcbiAgICAgICAgdXBkYXRlSW1wb3J0VXNhZ2Uobm9kZSlcbiAgICAgICAgY2hlY2tFeHBvcnRQcmVzZW5jZShub2RlKVxuICAgICAgfSxcbiAgICAgICdFeHBvcnREZWZhdWx0RGVjbGFyYXRpb24nOiBub2RlID0+IHtcbiAgICAgICAgY2hlY2tVc2FnZShub2RlLCBJTVBPUlRfREVGQVVMVF9TUEVDSUZJRVIpXG4gICAgICB9LFxuICAgICAgJ0V4cG9ydE5hbWVkRGVjbGFyYXRpb24nOiBub2RlID0+IHtcbiAgICAgICAgbm9kZS5zcGVjaWZpZXJzLmZvckVhY2goc3BlY2lmaWVyID0+IHtcbiAgICAgICAgICAgIGNoZWNrVXNhZ2Uobm9kZSwgc3BlY2lmaWVyLmV4cG9ydGVkLm5hbWUpXG4gICAgICAgIH0pXG4gICAgICAgIGlmIChub2RlLmRlY2xhcmF0aW9uKSB7XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgbm9kZS5kZWNsYXJhdGlvbi50eXBlID09PSBGVU5DVElPTl9ERUNMQVJBVElPTiB8fFxuICAgICAgICAgICAgbm9kZS5kZWNsYXJhdGlvbi50eXBlID09PSBDTEFTU19ERUNMQVJBVElPTlxuICAgICAgICAgICkge1xuICAgICAgICAgICAgY2hlY2tVc2FnZShub2RlLCBub2RlLmRlY2xhcmF0aW9uLmlkLm5hbWUpXG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChub2RlLmRlY2xhcmF0aW9uLnR5cGUgPT09IFZBUklBQkxFX0RFQ0xBUkFUSU9OKSB7XG4gICAgICAgICAgICBub2RlLmRlY2xhcmF0aW9uLmRlY2xhcmF0aW9ucy5mb3JFYWNoKGRlY2xhcmF0aW9uID0+IHtcbiAgICAgICAgICAgICAgY2hlY2tVc2FnZShub2RlLCBkZWNsYXJhdGlvbi5pZC5uYW1lKVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfVxuICB9LFxufVxuIl19