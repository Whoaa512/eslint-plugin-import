'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _ExportMap = require('../ExportMap');

var _ExportMap2 = _interopRequireDefault(_ExportMap);

var _docsUrl = require('../docsUrl');

var _docsUrl2 = _interopRequireDefault(_docsUrl);

var _arrayIncludes = require('array-includes');

var _arrayIncludes2 = _interopRequireDefault(_arrayIncludes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/*
Notes on Typescript namespaces aka TSModuleDeclaration:

There are two forms:
- active namespaces: namespace Foo {} / module Foo {}
- ambient modules; declare module "eslint-plugin-import" {}

active namespaces:
- cannot contain a default export
- cannot contain an export all
- cannot contain a multi name export (export { a, b })
- can have active namespaces nested within them

ambient namespaces:
- can only be defined in .d.ts files
- cannot be nested within active namespaces
- have no other restrictions
*/

const rootProgram = 'root';
const tsTypePrefix = 'type:';

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      url: (0, _docsUrl2.default)('export')
    }
  },

  create: function (context) {
    const namespace = new Map([[rootProgram, new Map()]]);

    function addNamed(name, node, parent, isType) {
      if (!namespace.has(parent)) {
        namespace.set(parent, new Map());
      }
      const named = namespace.get(parent);

      const key = isType ? `${tsTypePrefix}${name}` : name;
      let nodes = named.get(key);

      if (nodes == null) {
        nodes = new Set();
        named.set(key, nodes);
      }

      nodes.add(node);
    }

    function getParent(node) {
      if (node.parent && node.parent.type === 'TSModuleBlock') {
        return node.parent.parent;
      }

      // just in case somehow a non-ts namespace export declaration isn't directly
      // parented to the root Program node
      return rootProgram;
    }

    return {
      'ExportDefaultDeclaration': node => addNamed('default', node, getParent(node)),

      'ExportSpecifier': node => addNamed(node.exported.name, node.exported, getParent(node)),

      'ExportNamedDeclaration': function (node) {
        if (node.declaration == null) return;

        const parent = getParent(node);
        // support for old typescript versions
        const isTypeVariableDecl = node.declaration.kind === 'type';

        if (node.declaration.id != null) {
          if ((0, _arrayIncludes2.default)(['TSTypeAliasDeclaration', 'TSInterfaceDeclaration'], node.declaration.type)) {
            addNamed(node.declaration.id.name, node.declaration.id, parent, true);
          } else {
            addNamed(node.declaration.id.name, node.declaration.id, parent, isTypeVariableDecl);
          }
        }

        if (node.declaration.declarations != null) {
          for (let declaration of node.declaration.declarations) {
            (0, _ExportMap.recursivePatternCapture)(declaration.id, v => addNamed(v.name, v, parent, isTypeVariableDecl));
          }
        }
      },

      'ExportAllDeclaration': function (node) {
        if (node.source == null) return; // not sure if this is ever true

        const remoteExports = _ExportMap2.default.get(node.source.value, context);
        if (remoteExports == null) return;

        if (remoteExports.errors.length) {
          remoteExports.reportErrors(context, node);
          return;
        }

        const parent = getParent(node);

        let any = false;
        remoteExports.forEach((v, name) => name !== 'default' && (any = true) && // poor man's filter
        addNamed(name, node, parent));

        if (!any) {
          context.report(node.source, `No named exports found in module '${node.source.value}'.`);
        }
      },

      'Program:exit': function () {
        for (let _ref of namespace) {
          var _ref2 = _slicedToArray(_ref, 2);

          let named = _ref2[1];

          for (let _ref3 of named) {
            var _ref4 = _slicedToArray(_ref3, 2);

            let name = _ref4[0];
            let nodes = _ref4[1];

            if (nodes.size <= 1) continue;

            for (let node of nodes) {
              if (name === 'default') {
                context.report(node, 'Multiple default exports.');
              } else {
                context.report(node, `Multiple exports of name '${name.replace(tsTypePrefix, '')}'.`);
              }
            }
          }
        }
      }
    };
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9leHBvcnQuanMiXSwibmFtZXMiOlsicm9vdFByb2dyYW0iLCJ0c1R5cGVQcmVmaXgiLCJtb2R1bGUiLCJleHBvcnRzIiwibWV0YSIsInR5cGUiLCJkb2NzIiwidXJsIiwiY3JlYXRlIiwiY29udGV4dCIsIm5hbWVzcGFjZSIsIk1hcCIsImFkZE5hbWVkIiwibmFtZSIsIm5vZGUiLCJwYXJlbnQiLCJpc1R5cGUiLCJoYXMiLCJzZXQiLCJuYW1lZCIsImdldCIsImtleSIsIm5vZGVzIiwiU2V0IiwiYWRkIiwiZ2V0UGFyZW50IiwiZXhwb3J0ZWQiLCJkZWNsYXJhdGlvbiIsImlzVHlwZVZhcmlhYmxlRGVjbCIsImtpbmQiLCJpZCIsImRlY2xhcmF0aW9ucyIsInYiLCJzb3VyY2UiLCJyZW1vdGVFeHBvcnRzIiwidmFsdWUiLCJlcnJvcnMiLCJsZW5ndGgiLCJyZXBvcnRFcnJvcnMiLCJhbnkiLCJmb3JFYWNoIiwicmVwb3J0Iiwic2l6ZSIsInJlcGxhY2UiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBbUJBLE1BQU1BLGNBQWMsTUFBcEI7QUFDQSxNQUFNQyxlQUFlLE9BQXJCOztBQUVBQyxPQUFPQyxPQUFQLEdBQWlCO0FBQ2ZDLFFBQU07QUFDSkMsVUFBTSxTQURGO0FBRUpDLFVBQU07QUFDSkMsV0FBSyx1QkFBUSxRQUFSO0FBREQ7QUFGRixHQURTOztBQVFmQyxVQUFRLFVBQVVDLE9BQVYsRUFBbUI7QUFDekIsVUFBTUMsWUFBWSxJQUFJQyxHQUFKLENBQVEsQ0FBQyxDQUFDWCxXQUFELEVBQWMsSUFBSVcsR0FBSixFQUFkLENBQUQsQ0FBUixDQUFsQjs7QUFFQSxhQUFTQyxRQUFULENBQWtCQyxJQUFsQixFQUF3QkMsSUFBeEIsRUFBOEJDLE1BQTlCLEVBQXNDQyxNQUF0QyxFQUE4QztBQUM1QyxVQUFJLENBQUNOLFVBQVVPLEdBQVYsQ0FBY0Ys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cEM7QUFDQTtBQUNEOztBQUVELGNBQU1DLFNBQVNVLFVBQVVYLElBQVYsQ0FBZjs7QUFFQSxZQUFJeUIsTUFBTSxLQUFWO0FBQ0FMLHNCQUFjTSxPQUFkLENBQXNCLENBQUNSLENBQUQsRUFBSW5CLElBQUosS0FDcEJBLFNBQVMsU0FBVCxLQUNDMEIsTUFBTSxJQURQLEtBQ2dCO0FBQ2hCM0IsaUJBQVNDLElBQVQsRUFBZUMsSUFBZixFQUFxQkMsTUFBckIsQ0FIRjs7QUFLQSxZQUFJLENBQUN3QixHQUFMLEVBQVU7QUFDUjlCLGtCQUFRZ0MsTUFBUixDQUFlM0IsS0FBS21CLE1BQXBCLEVBQ0cscUNBQW9DbkIsS0FBS21CLE1BQUwsQ0FBWUUsS0FBTSxJQUR6RDtBQUVEO0FBQ0YsT0F0REk7O0FBd0RMLHNCQUFnQixZQUFZO0FBQzFCLHlCQUFzQnpCLFNBQXRCLEVBQWlDO0FBQUE7O0FBQUEsY0FBckJTLEtBQXFCOztBQUMvQiw0QkFBMEJBLEtBQTFCLEVBQWlDO0FBQUE7O0FBQUEsZ0JBQXZCTixJQUF1QjtBQUFBLGdCQUFqQlMsS0FBaUI7O0FBQy9CLGdCQUFJQSxNQUFNb0IsSUFBTixJQUFjLENBQWxCLEVBQXFCOztBQUVyQixpQkFBSyxJQUFJNUIsSUFBVCxJQUFpQlEsS0FBakIsRUFBd0I7QUFDdEIsa0JBQUlULFNBQVMsU0FBYixFQUF3QjtBQUN0Qkosd0JBQVFnQyxNQUFSLENBQWUzQixJQUFmLEVBQXFCLDJCQUFyQjtBQUNELGVBRkQsTUFFTztBQUNMTCx3QkFBUWdDLE1BQVIsQ0FDRTNCLElBREYsRUFFRyw2QkFBNEJELEtBQUs4QixPQUFMLENBQWExQyxZQUFiLEVBQTJCLEVBQTNCLENBQStCLElBRjlEO0FBSUQ7QUFDRjtBQUNGO0FBQ0Y7QUFDRjtBQXpFSSxLQUFQO0FBMkVEO0FBakhjLENBQWpCIiwiZmlsZSI6ImV4cG9ydC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBFeHBvcnRNYXAsIHsgcmVjdXJzaXZlUGF0dGVybkNhcHR1cmUgfSBmcm9tICcuLi9FeHBvcnRNYXAnXG5pbXBvcnQgZG9jc1VybCBmcm9tICcuLi9kb2NzVXJsJ1xuaW1wb3J0IGluY2x1ZGVzIGZyb20gJ2FycmF5LWluY2x1ZGVzJ1xuXG4vKlxuTm90ZXMgb24gVHlwZXNjcmlwdCBuYW1lc3BhY2VzIGFrYSBUU01vZHVsZURlY2xhcmF0aW9uOlxuXG5UaGVyZSBhcmUgdHdvIGZvcm1zOlxuLSBhY3RpdmUgbmFtZXNwYWNlczogbmFtZXNwYWNlIEZvbyB7fSAvIG1vZHVsZSBGb28ge31cbi0gYW1iaWVudCBtb2R1bGVzOyBkZWNsYXJlIG1vZHVsZSBcImVzbGludC1wbHVnaW4taW1wb3J0XCIge31cblxuYWN0aXZlIG5hbWVzcGFjZXM6XG4tIGNhbm5vdCBjb250YWluIGEgZGVmYXVsdCBleHBvcnRcbi0gY2Fubm90IGNvbnRhaW4gYW4gZXhwb3J0IGFsbFxuLSBjYW5ub3QgY29udGFpbiBhIG11bHRpIG5hbWUgZXhwb3J0IChleHBvcnQgeyBhLCBiIH0pXG4tIGNhbiBoYXZlIGFjdGl2ZSBuYW1lc3BhY2VzIG5lc3RlZCB3aXRoaW4gdGhlbVxuXG5hbWJpZW50IG5hbWVzcGFjZXM6XG4tIGNhbiBvbmx5IGJlIGRlZmluZWQgaW4gLmQudHMgZmlsZXNcbi0gY2Fubm90IGJlIG5lc3RlZCB3aXRoaW4gYWN0aXZlIG5hbWVzcGFjZXNcbi0gaGF2ZSBubyBvdGhlciByZXN0cmljdGlvbnNcbiovXG5cbmNvbnN0IHJvb3RQcm9ncmFtID0gJ3Jvb3QnXG5jb25zdCB0c1R5cGVQcmVmaXggPSAndHlwZTonXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhOiB7XG4gICAgdHlwZTogJ3Byb2JsZW0nLFxuICAgIGRvY3M6IHtcbiAgICAgIHVybDogZG9jc1VybCgnZXhwb3J0JyksXG4gICAgfSxcbiAgfSxcblxuICBjcmVhdGU6IGZ1bmN0aW9uIChjb250ZXh0KSB7XG4gICAgY29uc3QgbmFtZXNwYWNlID0gbmV3IE1hcChbW3Jvb3RQcm9ncmFtLCBuZXcgTWFwKCldXSlcblxuICAgIGZ1bmN0aW9uIGFkZE5hbWVkKG5hbWUsIG5vZGUsIHBhcmVudCwgaXNUeXBlKSB7XG4gICAgICBpZiAoIW5hbWVzcGFjZS5oYXMocGFyZW50KSkge1xuICAgICAgICBuYW1lc3BhY2Uuc2V0KHBhcmVudCwgbmV3IE1hcCgpKVxuICAgICAgfVxuICAgICAgY29uc3QgbmFtZWQgPSBuYW1lc3BhY2UuZ2V0KHBhcmVudClcblxuICAgICAgY29uc3Qga2V5ID0gaXNUeXBlID8gYCR7dHNUeXBlUHJlZml4fSR7bmFtZX1gIDogbmFtZVxuICAgICAgbGV0IG5vZGVzID0gbmFtZWQuZ2V0KGtleSlcblxuICAgICAgaWYgKG5vZGVzID09IG51bGwpIHtcbiAgICAgICAgbm9kZXMgPSBuZXcgU2V0KClcbiAgICAgICAgbmFtZWQuc2V0KGtleSwgbm9kZXMpXG4gICAgICB9XG5cbiAgICAgIG5vZGVzLmFkZChub2RlKVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldFBhcmVudChub2RlKSB7XG4gICAgICBpZiAobm9kZS5wYXJlbnQgJiYgbm9kZS5wYXJlbnQudHlwZSA9PT0gJ1RTTW9kdWxlQmxvY2snKSB7XG4gICAgICAgIHJldHVybiBub2RlLnBhcmVudC5wYXJlbnRcbiAgICAgIH1cblxuICAgICAgLy8ganVzdCBpbiBjYXNlIHNvbWVob3cgYSBub24tdHMgbmFtZXNwYWNlIGV4cG9ydCBkZWNsYXJhdGlvbiBpc24ndCBkaXJlY3RseVxuICAgICAgLy8gcGFyZW50ZWQgdG8gdGhlIHJvb3QgUHJvZ3JhbSBub2RlXG4gICAgICByZXR1cm4gcm9vdFByb2dyYW1cbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgJ0V4cG9ydERlZmF1bHREZWNsYXJhdGlvbic6IChub2RlKSA9PiBhZGROYW1lZCgnZGVmYXVsdCcsIG5vZGUsIGdldFBhcmVudChub2RlKSksXG5cbiAgICAgICdFeHBvcnRTcGVjaWZpZXInOiAobm9kZSkgPT4gYWRkTmFtZWQobm9kZS5leHBvcnRlZC5uYW1lLCBub2RlLmV4cG9ydGVkLCBnZXRQYXJlbnQobm9kZSkpLFxuXG4gICAgICAnRXhwb3J0TmFtZWREZWNsYXJhdGlvbic6IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIGlmIChub2RlLmRlY2xhcmF0aW9uID09IG51bGwpIHJldHVyblxuXG4gICAgICAgIGNvbnN0IHBhcmVudCA9IGdldFBhcmVudChub2RlKVxuICAgICAgICAvLyBzdXBwb3J0IGZvciBvbGQgdHlwZXNjcmlwdCB2ZXJzaW9uc1xuICAgICAgICBjb25zdCBpc1R5cGVWYXJpYWJsZURlY2wgPSBub2RlLmRlY2xhcmF0aW9uLmtpbmQgPT09ICd0eXBlJ1xuXG4gICAgICAgIGlmIChub2RlLmRlY2xhcmF0aW9uLmlkICE9IG51bGwpIHtcbiAgICAgICAgICBpZiAoaW5jbHVkZXMoW1xuICAgICAgICAgICAgJ1RTVHlwZUFsaWFzRGVjbGFyYXRpb24nLFxuICAgICAgICAgICAgJ1RTSW50ZXJmYWNlRGVjbGFyYXRpb24nLFxuICAgICAgICAgIF0sIG5vZGUuZGVjbGFyYXRpb24udHlwZSkpIHtcbiAgICAgICAgICAgIGFkZE5hbWVkKG5vZGUuZGVjbGFyYXRpb24uaWQubmFtZSwgbm9kZS5kZWNsYXJhdGlvbi5pZCwgcGFyZW50LCB0cnVlKVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhZGROYW1lZChub2RlLmRlY2xhcmF0aW9uLmlkLm5hbWUsIG5vZGUuZGVjbGFyYXRpb24uaWQsIHBhcmVudCwgaXNUeXBlVmFyaWFibGVEZWNsKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChub2RlLmRlY2xhcmF0aW9uLmRlY2xhcmF0aW9ucyAhPSBudWxsKSB7XG4gICAgICAgICAgZm9yIChsZXQgZGVjbGFyYXRpb24gb2Ygbm9kZS5kZWNsYXJhdGlvbi5kZWNsYXJhdGlvbnMpIHtcbiAgICAgICAgICAgIHJlY3Vyc2l2ZVBhdHRlcm5DYXB0dXJlKGRlY2xhcmF0aW9uLmlkLCB2ID0+XG4gICAgICAgICAgICAgIGFkZE5hbWVkKHYubmFtZSwgdiwgcGFyZW50LCBpc1R5cGVWYXJpYWJsZURlY2wpKVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgJ0V4cG9ydEFsbERlY2xhcmF0aW9uJzogZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgaWYgKG5vZGUuc291cmNlID09IG51bGwpIHJldHVybiAvLyBub3Qgc3VyZSBpZiB0aGlzIGlzIGV2ZXIgdHJ1ZVxuXG4gICAgICAgIGNvbnN0IHJlbW90ZUV4cG9ydHMgPSBFeHBvcnRNYXAuZ2V0KG5vZGUuc291cmNlLnZhbHVlLCBjb250ZXh0KVxuICAgICAgICBpZiAocmVtb3RlRXhwb3J0cyA9PSBudWxsKSByZXR1cm5cblxuICAgICAgICBpZiAocmVtb3RlRXhwb3J0cy5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgICAgcmVtb3RlRXhwb3J0cy5yZXBvcnRFcnJvcnMoY29udGV4dCwgbm9kZSlcbiAgICAgICAgICByZXR1cm5cbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IHBhcmVudCA9IGdldFBhcmVudChub2RlKVxuXG4gICAgICAgIGxldCBhbnkgPSBmYWxzZVxuICAgICAgICByZW1vdGVFeHBvcnRzLmZvckVhY2goKHYsIG5hbWUpID0+XG4gICAgICAgICAgbmFtZSAhPT0gJ2RlZmF1bHQnICYmXG4gICAgICAgICAgKGFueSA9IHRydWUpICYmIC8vIHBvb3IgbWFuJ3MgZmlsdGVyXG4gICAgICAgICAgYWRkTmFtZWQobmFtZSwgbm9kZSwgcGFyZW50KSlcblxuICAgICAgICBpZiAoIWFueSkge1xuICAgICAgICAgIGNvbnRleHQucmVwb3J0KG5vZGUuc291cmNlLFxuICAgICAgICAgICAgYE5vIG5hbWVkIGV4cG9ydHMgZm91bmQgaW4gbW9kdWxlICcke25vZGUuc291cmNlLnZhbHVlfScuYClcbiAgICAgICAgfVxuICAgICAgfSxcblxuICAgICAgJ1Byb2dyYW06ZXhpdCc6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZm9yIChsZXQgWywgbmFtZWRdIG9mIG5hbWVzcGFjZSkge1xuICAgICAgICAgIGZvciAobGV0IFtuYW1lLCBub2Rlc10gb2YgbmFtZWQpIHtcbiAgICAgICAgICAgIGlmIChub2Rlcy5zaXplIDw9IDEpIGNvbnRpbnVlXG5cbiAgICAgICAgICAgIGZvciAobGV0IG5vZGUgb2Ygbm9kZXMpIHtcbiAgICAgICAgICAgICAgaWYgKG5hbWUgPT09ICdkZWZhdWx0Jykge1xuICAgICAgICAgICAgICAgIGNvbnRleHQucmVwb3J0KG5vZGUsICdNdWx0aXBsZSBkZWZhdWx0IGV4cG9ydHMuJylcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb250ZXh0LnJlcG9ydChcbiAgICAgICAgICAgICAgICAgIG5vZGUsXG4gICAgICAgICAgICAgICAgICBgTXVsdGlwbGUgZXhwb3J0cyBvZiBuYW1lICcke25hbWUucmVwbGFjZSh0c1R5cGVQcmVmaXgsICcnKX0nLmBcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgfVxuICB9LFxufVxuIl19