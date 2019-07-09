'use strict';

var _declaredScope = require('eslint-module-utils/declaredScope');

var _declaredScope2 = _interopRequireDefault(_declaredScope);

var _ExportMap = require('../ExportMap');

var _ExportMap2 = _interopRequireDefault(_ExportMap);

var _docsUrl = require('../docsUrl');

var _docsUrl2 = _interopRequireDefault(_docsUrl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function message(deprecation) {
  return 'Deprecated' + (deprecation.description ? ': ' + deprecation.description : '.');
}

function getDeprecation(metadata) {
  if (!metadata || !metadata.doc) return;

  let deprecation;
  if (metadata.doc.tags.some(t => t.title === 'deprecated' && (deprecation = t))) {
    return deprecation;
  }
}

module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('no-deprecated')
    }
  },

  create: function (context) {
    const deprecated = new Map(),
          namespaces = new Map();

    function checkSpecifiers(node) {
      if (node.type !== 'ImportDeclaration') return;
      if (node.source == null) return; // local export, ignore

      const imports = _ExportMap2.default.get(node.source.value, context);
      if (imports == null) return;

      let moduleDeprecation;
      if (imports.doc && imports.doc.tags.some(t => t.title === 'deprecated' && (moduleDeprecation = t))) {
        context.report({ node, message: message(moduleDeprecation) });
      }

      if (imports.errors.length) {
        imports.reportErrors(context, node);
        return;
      }

      node.specifiers.forEach(function (im) {
        let imported, local;
        switch (im.type) {

          case 'ImportNamespaceSpecifier':
            {
              if (!imports.size) return;
              namespaces.set(im.local.name, imports);
              return;
            }

          case 'ImportDefaultSpecifier':
            imported = 'default';
            local = im.local.name;
            break;

          case 'ImportSpecifier':
            imported = im.imported.name;
            local = im.local.name;
            break;

          default:
            return; // can't handle this one
        }

        // unknown thing can't be deprecated
        const exported = imports.get(imported);
        if (exported == null) return;

        // capture import of deep namespace
        if (exported.namespace) namespaces.set(local, exported.namespace);

        const deprecation = getDeprecation(imports.get(imported));
        if (!deprecation) return;

        context.report({ node: im, message: message(deprecation) });

        deprecated.set(local, deprecation);
      });
    }

    return {
      'Program': (_ref) => {
        let body = _ref.body;
        return body.forEach(checkSpecifiers);
      },

      'Identifier': function (node) {
        if (node.parent.type === 'MemberExpression' && node.parent.property === node) {
          return; // handled by MemberExpression
        }

        // ignore specifier identifiers
        if (node.parent.type.slice(0, 6) === 'Import') return;

        if (!deprecated.has(node.name)) return;

        if ((0, _declaredScope2.default)(context, node.name) !== 'module') return;
        context.report({
          node,
          message: message(deprecated.get(node.name))
        });
      },

      'MemberExpression': function (dereference) {
        if (dereference.object.type !== 'Identifier') return;
        if (!namespaces.has(dereference.object.name)) return;

        if ((0, _declaredScope2.default)(context, dereference.object.name) !== 'module') return;

        // go deep
        var namespace = namespaces.get(dereference.object.name);
        var namepath = [dereference.object.name];
        // while property is namespace and parent is member expression, keep validating
        while (namespace instanceof _ExportMap2.default && dereference.type === 'MemberExpression') {

          // ignore computed parts for now
          if (dereference.computed) return;

          const metadata = namespace.get(dereference.property.name);

          if (!metadata) break;
          const deprecation = getDeprecation(metadata);

          if (deprecation) {
            context.report({ node: dereference.property, message: message(deprecation) });
          }

          // stash and pop
          namepath.push(dereference.property.name);
          namespace = metadata.namespace;
          dereference = dereference.parent;
        }
      }
    };
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1kZXByZWNhdGVkLmpzIl0sIm5hbWVzIjpbIm1lc3NhZ2UiLCJkZXByZWNhdGlvbiIsImRlc2NyaXB0aW9uIiwiZ2V0RGVwcmVjYXRpb24iLCJtZXRhZGF0YSIsImRvYyIsInRhZ3MiLCJzb21lIiwidCIsInRpdGxlIiwibW9kdWxlIiwiZXhwb3J0cyIsIm1ldGEiLCJ0eXBlIiwiZG9jcyIsInVybCIsImNyZWF0ZSIsImNvbnRleHQiLCJkZXByZWNhdGVkIiwiTWFwIiwibmFtZXNwYWNlcyIsImNoZWNrU3BlY2lmaWVycyIsIm5vZGUiLCJzb3VyY2UiLCJpbXBvcnRzIiwiZ2V0IiwidmFsdWUiLCJtb2R1bGVEZXByZWNhdGlvbiIsInJlcG9ydCIsImVycm9ycyIsImxlbmd0aCIsInJlcG9ydEVycm9ycyIsInNwZWNpZmllcnMiLCJmb3JFYWNoIiwiaW0iLCJpbXBvcnRlZCIsImxvY2FsIiwic2l6ZSIsInNldCIsIm5hbWUiLCJleHBvcnRlZCIsIm5hbWVzcGFjZSIsImJvZHkiLCJwYXJlbnQiLCJwcm9wZXJ0eSIsInNsaWNlIiwiaGFzIiwiZGVyZWZlcmVuY2UiLCJvYmplY3QiLCJuYW1lcGF0aCIsImNvbXB1dGVkIiwicHVzaCJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBLFNBQVNBLE9BQVQsQ0FBaUJDLFdBQWpCLEVBQThCO0FBQzVCLFNBQU8sZ0JBQWdCQSxZQUFZQyxXQUFaLEdBQTBCLE9BQU9ELFlBQVlDLFdBQTdDLEdBQTJELEdBQTNFLENBQVA7QUFDRDs7QUFFRCxTQUFTQyxjQUFULENBQXdCQyxRQUF4QixFQUFrQztBQUNoQyxNQUFJLENBQUNBLFFBQUQsSUFBYSxDQUFDQSxTQUFTQyxHQUEzQixFQUFnQzs7QUFFaEMsTUFBSUosV0FBSjtBQUNBLE1BQUlHLFNBQVNDLEdBQVQsQ0FBYUMsSUFBYixDQUFrQkMsSUFBbEIsQ0FBdUJDLEtBQUtBLEVBQUVDLEtBQUYsS0FBWSxZ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QVdxQyxVQUFVaEIsR0FBVixDQUFjc0IsWUFBWUgsUUFBWixDQUFxQkwsSUFBbkMsQ0FBakI7O0FBRUEsY0FBSSxDQUFDbkMsUUFBTCxFQUFlO0FBQ2YsZ0JBQU1ILGNBQWNFLGVBQWVDLFFBQWYsQ0FBcEI7O0FBRUEsY0FBSUgsV0FBSixFQUFpQjtBQUNmZ0Isb0JBQVFXLE1BQVIsQ0FBZSxFQUFFTixNQUFNeUIsWUFBWUgsUUFBcEIsRUFBOEI1QyxTQUFTQSxRQUFRQyxXQUFSLENBQXZDLEVBQWY7QUFDRDs7QUFFRDtBQUNBZ0QsbUJBQVNFLElBQVQsQ0FBY0osWUFBWUgsUUFBWixDQUFxQkwsSUFBbkM7QUFDQUUsc0JBQVlyQyxTQUFTcUMsU0FBckI7QUFDQU0sd0JBQWNBLFlBQVlKLE1BQTFCO0FBQ0Q7QUFDRjtBQWxESSxLQUFQO0FBb0REO0FBM0hjLENBQWpCIiwiZmlsZSI6Im5vLWRlcHJlY2F0ZWQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgZGVjbGFyZWRTY29wZSBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL2RlY2xhcmVkU2NvcGUnXG5pbXBvcnQgRXhwb3J0cyBmcm9tICcuLi9FeHBvcnRNYXAnXG5pbXBvcnQgZG9jc1VybCBmcm9tICcuLi9kb2NzVXJsJ1xuXG5mdW5jdGlvbiBtZXNzYWdlKGRlcHJlY2F0aW9uKSB7XG4gIHJldHVybiAnRGVwcmVjYXRlZCcgKyAoZGVwcmVjYXRpb24uZGVzY3JpcHRpb24gPyAnOiAnICsgZGVwcmVjYXRpb24uZGVzY3JpcHRpb24gOiAnLicpXG59XG5cbmZ1bmN0aW9uIGdldERlcHJlY2F0aW9uKG1ldGFkYXRhKSB7XG4gIGlmICghbWV0YWRhdGEgfHwgIW1ldGFkYXRhLmRvYykgcmV0dXJuXG5cbiAgbGV0IGRlcHJlY2F0aW9uXG4gIGlmIChtZXRhZGF0YS5kb2MudGFncy5zb21lKHQgPT4gdC50aXRsZSA9PT0gJ2RlcHJlY2F0ZWQnICYmIChkZXByZWNhdGlvbiA9IHQpKSkge1xuICAgIHJldHVybiBkZXByZWNhdGlvblxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhOiB7XG4gICAgdHlwZTogJ3N1Z2dlc3Rpb24nLFxuICAgIGRvY3M6IHtcbiAgICAgIHVybDogZG9jc1VybCgnbm8tZGVwcmVjYXRlZCcpLFxuICAgIH0sXG4gIH0sXG5cbiAgY3JlYXRlOiBmdW5jdGlvbiAoY29udGV4dCkge1xuICAgIGNvbnN0IGRlcHJlY2F0ZWQgPSBuZXcgTWFwKClcbiAgICAgICAgLCBuYW1lc3BhY2VzID0gbmV3IE1hcCgpXG5cbiAgICBmdW5jdGlvbiBjaGVja1NwZWNpZmllcnMobm9kZSkge1xuICAgICAgaWYgKG5vZGUudHlwZSAhPT0gJ0ltcG9ydERlY2xhcmF0aW9uJykgcmV0dXJuXG4gICAgICBpZiAobm9kZS5zb3VyY2UgPT0gbnVsbCkgcmV0dXJuIC8vIGxvY2FsIGV4cG9ydCwgaWdub3JlXG5cbiAgICAgIGNvbnN0IGltcG9ydHMgPSBFeHBvcnRzLmdldChub2RlLnNvdXJjZS52YWx1ZSwgY29udGV4dClcbiAgICAgIGlmIChpbXBvcnRzID09IG51bGwpIHJldHVyblxuXG4gICAgICBsZXQgbW9kdWxlRGVwcmVjYXRpb25cbiAgICAgIGlmIChpbXBvcnRzLmRvYyAmJlxuICAgICAgICAgIGltcG9ydHMuZG9jLnRhZ3Muc29tZSh0ID0+IHQudGl0bGUgPT09ICdkZXByZWNhdGVkJyAmJiAobW9kdWxlRGVwcmVjYXRpb24gPSB0KSkpIHtcbiAgICAgICAgY29udGV4dC5yZXBvcnQoeyBub2RlLCBtZXNzYWdlOiBtZXNzYWdlKG1vZHVsZURlcHJlY2F0aW9uKSB9KVxuICAgICAgfVxuXG4gICAgICBpZiAoaW1wb3J0cy5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgIGltcG9ydHMucmVwb3J0RXJyb3JzKGNvbnRleHQsIG5vZGUpXG4gICAgICAgIHJldHVyblxuICAgICAgfVxuXG4gICAgICBub2RlLnNwZWNpZmllcnMuZm9yRWFjaChmdW5jdGlvbiAoaW0pIHtcbiAgICAgICAgbGV0IGltcG9ydGVkLCBsb2NhbFxuICAgICAgICBzd2l0Y2ggKGltLnR5cGUpIHtcblxuXG4gICAgICAgICAgY2FzZSAnSW1wb3J0TmFtZXNwYWNlU3BlY2lmaWVyJzp7XG4gICAgICAgICAgICBpZiAoIWltcG9ydHMuc2l6ZSkgcmV0dXJuXG4gICAgICAgICAgICBuYW1lc3BhY2VzLnNldChpbS5sb2NhbC5uYW1lLCBpbXBvcnRzKVxuICAgICAgICAgICAgcmV0dXJuXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY2FzZSAnSW1wb3J0RGVmYXVsdFNwZWNpZmllcic6XG4gICAgICAgICAgICBpbXBvcnRlZCA9ICdkZWZhdWx0J1xuICAgICAgICAgICAgbG9jYWwgPSBpbS5sb2NhbC5uYW1lXG4gICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgY2FzZSAnSW1wb3J0U3BlY2lmaWVyJzpcbiAgICAgICAgICAgIGltcG9ydGVkID0gaW0uaW1wb3J0ZWQubmFtZVxuICAgICAgICAgICAgbG9jYWwgPSBpbS5sb2NhbC5uYW1lXG4gICAgICAgICAgICBicmVha1xuXG4gICAgICAgICAgZGVmYXVsdDogcmV0dXJuIC8vIGNhbid0IGhhbmRsZSB0aGlzIG9uZVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gdW5rbm93biB0aGluZyBjYW4ndCBiZSBkZXByZWNhdGVkXG4gICAgICAgIGNvbnN0IGV4cG9ydGVkID0gaW1wb3J0cy5nZXQoaW1wb3J0ZWQpXG4gICAgICAgIGlmIChleHBvcnRlZCA9PSBudWxsKSByZXR1cm5cblxuICAgICAgICAvLyBjYXB0dXJlIGltcG9ydCBvZiBkZWVwIG5hbWVzcGFjZVxuICAgICAgICBpZiAoZXhwb3J0ZWQubmFtZXNwYWNlKSBuYW1lc3BhY2VzLnNldChsb2NhbCwgZXhwb3J0ZWQubmFtZXNwYWNlKVxuXG4gICAgICAgIGNvbnN0IGRlcHJlY2F0aW9uID0gZ2V0RGVwcmVjYXRpb24oaW1wb3J0cy5nZXQoaW1wb3J0ZWQpKVxuICAgICAgICBpZiAoIWRlcHJlY2F0aW9uKSByZXR1cm5cblxuICAgICAgICBjb250ZXh0LnJlcG9ydCh7IG5vZGU6IGltLCBtZXNzYWdlOiBtZXNzYWdlKGRlcHJlY2F0aW9uKSB9KVxuXG4gICAgICAgIGRlcHJlY2F0ZWQuc2V0KGxvY2FsLCBkZXByZWNhdGlvbilcblxuICAgICAgfSlcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgJ1Byb2dyYW0nOiAoeyBib2R5IH0pID0+IGJvZHkuZm9yRWFjaChjaGVja1NwZWNpZmllcnMpLFxuXG4gICAgICAnSWRlbnRpZmllcic6IGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgIGlmIChub2RlLnBhcmVudC50eXBlID09PSAnTWVtYmVyRXhwcmVzc2lvbicgJiYgbm9kZS5wYXJlbnQucHJvcGVydHkgPT09IG5vZGUpIHtcbiAgICAgICAgICByZXR1cm4gLy8gaGFuZGxlZCBieSBNZW1iZXJFeHByZXNzaW9uXG4gICAgICAgIH1cblxuICAgICAgICAvLyBpZ25vcmUgc3BlY2lmaWVyIGlkZW50aWZpZXJzXG4gICAgICAgIGlmIChub2RlLnBhcmVudC50eXBlLnNsaWNlKDAsIDYpID09PSAnSW1wb3J0JykgcmV0dXJuXG5cbiAgICAgICAgaWYgKCFkZXByZWNhdGVkLmhhcyhub2RlLm5hbWUpKSByZXR1cm5cblxuICAgICAgICBpZiAoZGVjbGFyZWRTY29wZShjb250ZXh0LCBub2RlLm5hbWUpICE9PSAnbW9kdWxlJykgcmV0dXJuXG4gICAgICAgIGNvbnRleHQucmVwb3J0KHtcbiAgICAgICAgICBub2RlLFxuICAgICAgICAgIG1lc3NhZ2U6IG1lc3NhZ2UoZGVwcmVjYXRlZC5nZXQobm9kZS5uYW1lKSksXG4gICAgICAgIH0pXG4gICAgICB9LFxuXG4gICAgICAnTWVtYmVyRXhwcmVzc2lvbic6IGZ1bmN0aW9uIChkZXJlZmVyZW5jZSkge1xuICAgICAgICBpZiAoZGVyZWZlcmVuY2Uub2JqZWN0LnR5cGUgIT09ICdJZGVudGlmaWVyJykgcmV0dXJuXG4gICAgICAgIGlmICghbmFtZXNwYWNlcy5oYXMoZGVyZWZlcmVuY2Uub2JqZWN0Lm5hbWUpKSByZXR1cm5cblxuICAgICAgICBpZiAoZGVjbGFyZWRTY29wZShjb250ZXh0LCBkZXJlZmVyZW5jZS5vYmplY3QubmFtZSkgIT09ICdtb2R1bGUnKSByZXR1cm5cblxuICAgICAgICAvLyBnbyBkZWVwXG4gICAgICAgIHZhciBuYW1lc3BhY2UgPSBuYW1lc3BhY2VzLmdldChkZXJlZmVyZW5jZS5vYmplY3QubmFtZSlcbiAgICAgICAgdmFyIG5hbWVwYXRoID0gW2RlcmVmZXJlbmNlLm9iamVjdC5uYW1lXVxuICAgICAgICAvLyB3aGlsZSBwcm9wZXJ0eSBpcyBuYW1lc3BhY2UgYW5kIHBhcmVudCBpcyBtZW1iZXIgZXhwcmVzc2lvbiwga2VlcCB2YWxpZGF0aW5nXG4gICAgICAgIHdoaWxlIChuYW1lc3BhY2UgaW5zdGFuY2VvZiBFeHBvcnRzICYmXG4gICAgICAgICAgICAgICBkZXJlZmVyZW5jZS50eXBlID09PSAnTWVtYmVyRXhwcmVzc2lvbicpIHtcblxuICAgICAgICAgIC8vIGlnbm9yZSBjb21wdXRlZCBwYXJ0cyBmb3Igbm93XG4gICAgICAgICAgaWYgKGRlcmVmZXJlbmNlLmNvbXB1dGVkKSByZXR1cm5cblxuICAgICAgICAgIGNvbnN0IG1ldGFkYXRhID0gbmFtZXNwYWNlLmdldChkZXJlZmVyZW5jZS5wcm9wZXJ0eS5uYW1lKVxuXG4gICAgICAgICAgaWYgKCFtZXRhZGF0YSkgYnJlYWtcbiAgICAgICAgICBjb25zdCBkZXByZWNhdGlvbiA9IGdldERlcHJlY2F0aW9uKG1ldGFkYXRhKVxuXG4gICAgICAgICAgaWYgKGRlcHJlY2F0aW9uKSB7XG4gICAgICAgICAgICBjb250ZXh0LnJlcG9ydCh7IG5vZGU6IGRlcmVmZXJlbmNlLnByb3BlcnR5LCBtZXNzYWdlOiBtZXNzYWdlKGRlcHJlY2F0aW9uKSB9KVxuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIHN0YXNoIGFuZCBwb3BcbiAgICAgICAgICBuYW1lcGF0aC5wdXNoKGRlcmVmZXJlbmNlLnByb3BlcnR5Lm5hbWUpXG4gICAgICAgICAgbmFtZXNwYWNlID0gbWV0YWRhdGEubmFtZXNwYWNlXG4gICAgICAgICAgZGVyZWZlcmVuY2UgPSBkZXJlZmVyZW5jZS5wYXJlbnRcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICB9XG4gIH0sXG59XG4iXX0=