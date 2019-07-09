'use strict';

var _ExportMap = require('../ExportMap');

var _ExportMap2 = _interopRequireDefault(_ExportMap);

var _importDeclaration = require('../importDeclaration');

var _importDeclaration2 = _interopRequireDefault(_importDeclaration);

var _docsUrl = require('../docsUrl');

var _docsUrl2 = _interopRequireDefault(_docsUrl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('no-named-as-default-member')
    }
  },

  create: function (context) {

    const fileImports = new Map();
    const allPropertyLookups = new Map();

    function handleImportDefault(node) {
      const declaration = (0, _importDeclaration2.default)(context);
      const exportMap = _ExportMap2.default.get(declaration.source.value, context);
      if (exportMap == null) return;

      if (exportMap.errors.length) {
        exportMap.reportErrors(context, declaration);
        return;
      }

      fileImports.set(node.local.name, {
        exportMap,
        sourcePath: declaration.source.value
      });
    }

    function storePropertyLookup(objectName, propName, node) {
      const lookups = allPropertyLookups.get(objectName) || [];
      lookups.push({ node, propName });
      allPropertyLookups.set(objectName, lookups);
    }

    function handlePropLookup(node) {
      const objectName = node.object.name;
      const propName = node.property.name;
      storePropertyLookup(objectName, propName, node);
    }

    function handleDestructuringAssignment(node) {
      const isDestructure = node.id.type === 'ObjectPattern' && node.init != null && node.init.type === 'Identifier';
      if (!isDestructure) return;

      const objectName = node.init.name;
      for (const _ref of node.id.properties) {
        const key = _ref.key;

        if (key == null) continue; // true for rest properties
        storePropertyLookup(objectName, key.name, key);
      }
    }

    function handleProgramExit() {
      allPropertyLookups.forEach((lookups, objectName) => {
        const fileImport = fileImports.get(objectName);
        if (fileImport == null) return;

        for (const _ref2 of lookups) {
          const propName = _ref2.propName;
          const node = _ref2.node;

          // the default import can have a "default" property
          if (propName === 'default') continue;
          if (!fileImport.exportMap.namespace.has(propName)) continue;

          context.report({
            node,
            message: `Caution: \`${objectName}\` also has a named export ` + `\`${propName}\`. Check if you meant to write ` + `\`import {${propName}} from '${fileImport.sourcePath}'\` ` + 'instead.'
          });
        }
      });
    }

    return {
      'ImportDefaultSpecifier': handleImportDefault,
      'MemberExpression': handlePropLookup,
      'VariableDeclarator': handleDestructuringAssignment,
      'Program:exit': handleProgramExit
    };
  }
}; /**
    * @fileoverview Rule to warn about potentially confused use of name exports
    * @author Desmond Brand
    * @copyright 2016 Desmond Brand. All rights reserved.
    * See LICENSE in root directory for full license.
    */
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1uYW1lZC1hcy1kZWZhdWx0LW1lbWJlci5qcyJdLCJuYW1lcyI6WyJtb2R1bGUiLCJleHBvcnRzIiwibWV0YSIsInR5cGUiLCJkb2NzIiwidXJsIiwiY3JlYXRlIiwiY29udGV4dCIsImZpbGVJbXBvcnRzIiwiTWFwIiwiYWxsUHJvcGVydHlMb29rdXBzIiwiaGFuZGxlSW1wb3J0RGVmYXVsdCIsIm5vZGUiLCJkZWNsYXJhdGlvbiIsImV4cG9ydE1hcCIsImdldCIsInNvdXJjZSIsInZhbHVlIiwiZXJyb3JzIiwibGVuZ3RoIiwicmVwb3J0RXJyb3JzIiwic2V0IiwibG9jYWwiLCJuYW1lIiwic291cmNlUGF0aCIsInN0b3JlUHJvcGVydHlMb29rdXAiLCJvYmplY3ROYW1lIiwicHJvcE5hbWUiLCJsb29rdXBzIiwicHVzaCIsImhhbmRsZVByb3BMb29rdXAiLCJvYmplY3QiLCJwcm9wZXJ0eSIsImhhbmRsZURlc3RydWN0dXJpbmdBc3NpZ25tZW50IiwiaXNEZXN0cnVjdHVyZSIsImlkIiwiaW5pdCIsInByb3BlcnRpZXMiLCJrZXkiLCJoYW5kbGVQcm9ncmFtRXhpdCIsImZvckVhY2giLCJmaWxlSW1wb3J0IiwibmFtZXNwYWNlIiwiaGFzIiwicmVwb3J0IiwibWVzc2FnZSJdLCJtYXBwaW5ncyI6Ijs7QUFNQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBO0FBQ0E7QUFDQTs7QUFFQUEsT0FBT0MsT0FBUCxHQUFpQjtBQUNmQyxRQUFNO0FBQ0pDLFVBQU0sWUFERjtBQUVKQyxVQUFNO0FBQ0pDLFdBQUssdUJBQVEsNEJBQVI7QUFERDtBQUZGLEdBRFM7O0FBUWZDLFVBQVEsVUFBU0MsT0FBVCxFQUFrQjs7QUFFeEIsVUFBTUMsY0FBYyxJQUFJQyxHQUFKLEVBQXBCO0FBQ0EsVUFBTUMscUJBQXFCLElBQUlELEdBQUosRUFBM0I7O0FBRUEsYUFBU0UsbUJBQVQsQ0FBNkJDLElBQTdCLEVBQW1DO0FBQ2pDLFlBQU1DLGNB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LEMsQ0FkQSIsImZpbGUiOiJuby1uYW1lZC1hcy1kZWZhdWx0LW1lbWJlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGZpbGVvdmVydmlldyBSdWxlIHRvIHdhcm4gYWJvdXQgcG90ZW50aWFsbHkgY29uZnVzZWQgdXNlIG9mIG5hbWUgZXhwb3J0c1xuICogQGF1dGhvciBEZXNtb25kIEJyYW5kXG4gKiBAY29weXJpZ2h0IDIwMTYgRGVzbW9uZCBCcmFuZC4gQWxsIHJpZ2h0cyByZXNlcnZlZC5cbiAqIFNlZSBMSUNFTlNFIGluIHJvb3QgZGlyZWN0b3J5IGZvciBmdWxsIGxpY2Vuc2UuXG4gKi9cbmltcG9ydCBFeHBvcnRzIGZyb20gJy4uL0V4cG9ydE1hcCdcbmltcG9ydCBpbXBvcnREZWNsYXJhdGlvbiBmcm9tICcuLi9pbXBvcnREZWNsYXJhdGlvbidcbmltcG9ydCBkb2NzVXJsIGZyb20gJy4uL2RvY3NVcmwnXG5cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4vLyBSdWxlIERlZmluaXRpb25cbi8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhOiB7XG4gICAgdHlwZTogJ3N1Z2dlc3Rpb24nLFxuICAgIGRvY3M6IHtcbiAgICAgIHVybDogZG9jc1VybCgnbm8tbmFtZWQtYXMtZGVmYXVsdC1tZW1iZXInKSxcbiAgICB9LFxuICB9LFxuXG4gIGNyZWF0ZTogZnVuY3Rpb24oY29udGV4dCkge1xuXG4gICAgY29uc3QgZmlsZUltcG9ydHMgPSBuZXcgTWFwKClcbiAgICBjb25zdCBhbGxQcm9wZXJ0eUxvb2t1cHMgPSBuZXcgTWFwKClcblxuICAgIGZ1bmN0aW9uIGhhbmRsZUltcG9ydERlZmF1bHQobm9kZSkge1xuICAgICAgY29uc3QgZGVjbGFyYXRpb24gPSBpbXBvcnREZWNsYXJhdGlvbihjb250ZXh0KVxuICAgICAgY29uc3QgZXhwb3J0TWFwID0gRXhwb3J0cy5nZXQoZGVjbGFyYXRpb24uc291cmNlLnZhbHVlLCBjb250ZXh0KVxuICAgICAgaWYgKGV4cG9ydE1hcCA9PSBudWxsKSByZXR1cm5cblxuICAgICAgaWYgKGV4cG9ydE1hcC5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgIGV4cG9ydE1hcC5yZXBvcnRFcnJvcnMoY29udGV4dCwgZGVjbGFyYXRpb24pXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBmaWxlSW1wb3J0cy5zZXQobm9kZS5sb2NhbC5uYW1lLCB7XG4gICAgICAgIGV4cG9ydE1hcCxcbiAgICAgICAgc291cmNlUGF0aDogZGVjbGFyYXRpb24uc291cmNlLnZhbHVlLFxuICAgICAgfSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdG9yZVByb3BlcnR5TG9va3VwKG9iamVjdE5hbWUsIHByb3BOYW1lLCBub2RlKSB7XG4gICAgICBjb25zdCBsb29rdXBzID0gYWxsUHJvcGVydHlMb29rdXBzLmdldChvYmplY3ROYW1lKSB8fCBbXVxuICAgICAgbG9va3Vwcy5wdXNoKHtub2RlLCBwcm9wTmFtZX0pXG4gICAgICBhbGxQcm9wZXJ0eUxvb2t1cHMuc2V0KG9iamVjdE5hbWUsIGxvb2t1cHMpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFuZGxlUHJvcExvb2t1cChub2RlKSB7XG4gICAgICBjb25zdCBvYmplY3ROYW1lID0gbm9kZS5vYmplY3QubmFtZVxuICAgICAgY29uc3QgcHJvcE5hbWUgPSBub2RlLnByb3BlcnR5Lm5hbWVcbiAgICAgIHN0b3JlUHJvcGVydHlMb29rdXAob2JqZWN0TmFtZSwgcHJvcE5hbWUsIG5vZGUpXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFuZGxlRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnQobm9kZSkge1xuICAgICAgY29uc3QgaXNEZXN0cnVjdHVyZSA9IChcbiAgICAgICAgbm9kZS5pZC50eXBlID09PSAnT2JqZWN0UGF0dGVybicgJiZcbiAgICAgICAgbm9kZS5pbml0ICE9IG51bGwgJiZcbiAgICAgICAgbm9kZS5pbml0LnR5cGUgPT09ICdJZGVudGlmaWVyJ1xuICAgICAgKVxuICAgICAgaWYgKCFpc0Rlc3RydWN0dXJlKSByZXR1cm5cblxuICAgICAgY29uc3Qgb2JqZWN0TmFtZSA9IG5vZGUuaW5pdC5uYW1lXG4gICAgICBmb3IgKGNvbnN0IHsga2V5IH0gb2Ygbm9kZS5pZC5wcm9wZXJ0aWVzKSB7XG4gICAgICAgIGlmIChrZXkgPT0gbnVsbCkgY29udGludWUgIC8vIHRydWUgZm9yIHJlc3QgcHJvcGVydGllc1xuICAgICAgICBzdG9yZVByb3BlcnR5TG9va3VwKG9iamVjdE5hbWUsIGtleS5uYW1lLCBrZXkpXG4gICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGFuZGxlUHJvZ3JhbUV4aXQoKSB7XG4gICAgICBhbGxQcm9wZXJ0eUxvb2t1cHMuZm9yRWFjaCgobG9va3Vwcywgb2JqZWN0TmFtZSkgPT4ge1xuICAgICAgICBjb25zdCBmaWxlSW1wb3J0ID0gZmlsZUltcG9ydHMuZ2V0KG9iamVjdE5hbWUpXG4gICAgICAgIGlmIChmaWxlSW1wb3J0ID09IG51bGwpIHJldHVyblxuXG4gICAgICAgIGZvciAoY29uc3Qge3Byb3BOYW1lLCBub2RlfSBvZiBsb29rdXBzKSB7XG4gICAgICAgICAgLy8gdGhlIGRlZmF1bHQgaW1wb3J0IGNhbiBoYXZlIGEgXCJkZWZhdWx0XCIgcHJvcGVydHlcbiAgICAgICAgICBpZiAocHJvcE5hbWUgPT09ICdkZWZhdWx0JykgY29udGludWVcbiAgICAgICAgICBpZiAoIWZpbGVJbXBvcnQuZXhwb3J0TWFwLm5hbWVzcGFjZS5oYXMocHJvcE5hbWUpKSBjb250aW51ZVxuXG4gICAgICAgICAgY29udGV4dC5yZXBvcnQoe1xuICAgICAgICAgICAgbm9kZSxcbiAgICAgICAgICAgIG1lc3NhZ2U6IChcbiAgICAgICAgICAgICAgYENhdXRpb246IFxcYCR7b2JqZWN0TmFtZX1cXGAgYWxzbyBoYXMgYSBuYW1lZCBleHBvcnQgYCArXG4gICAgICAgICAgICAgIGBcXGAke3Byb3BOYW1lfVxcYC4gQ2hlY2sgaWYgeW91IG1lYW50IHRvIHdyaXRlIGAgK1xuICAgICAgICAgICAgICBgXFxgaW1wb3J0IHske3Byb3BOYW1lfX0gZnJvbSAnJHtmaWxlSW1wb3J0LnNvdXJjZVBhdGh9J1xcYCBgICtcbiAgICAgICAgICAgICAgJ2luc3RlYWQuJ1xuICAgICAgICAgICAgKSxcbiAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICAnSW1wb3J0RGVmYXVsdFNwZWNpZmllcic6IGhhbmRsZUltcG9ydERlZmF1bHQsXG4gICAgICAnTWVtYmVyRXhwcmVzc2lvbic6IGhhbmRsZVByb3BMb29rdXAsXG4gICAgICAnVmFyaWFibGVEZWNsYXJhdG9yJzogaGFuZGxlRGVzdHJ1Y3R1cmluZ0Fzc2lnbm1lbnQsXG4gICAgICAnUHJvZ3JhbTpleGl0JzogaGFuZGxlUHJvZ3JhbUV4aXQsXG4gICAgfVxuICB9LFxufVxuIl19