'use strict';

var _ExportMap = require('../ExportMap');

var _ExportMap2 = _interopRequireDefault(_ExportMap);

var _docsUrl = require('../docsUrl');

var _docsUrl2 = _interopRequireDefault(_docsUrl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      url: (0, _docsUrl2.default)('default')
    }
  },

  create: function (context) {

    function checkDefault(specifierType, node) {

      // poor man's Array.find
      let defaultSpecifier;
      node.specifiers.some(n => {
        if (n.type === specifierType) {
          defaultSpecifier = n;
          return true;
        }
      });

      if (!defaultSpecifier) return;
      var imports = _ExportMap2.default.get(node.source.value, context);
      if (imports == null) return;

      if (imports.errors.length) {
        imports.reportErrors(context, node);
      } else if (imports.get('default') === undefined) {
        context.report(defaultSpecifier, 'No default export found in module.');
      }
    }

    return {
      'ImportDeclaration': checkDefault.bind(null, 'ImportDefaultSpecifier'),
      'ExportNamedDeclaration': checkDefault.bind(null, 'ExportDefaultSpecifier')
    };
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9kZWZhdWx0LmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydHMiLCJtZXRhIiwidHlwZSIsImRvY3MiLCJ1cmwiLCJjcmVhdGUiLCJjb250ZXh0IiwiY2hlY2tEZWZhdWx0Iiwic3BlY2lmaWVyVHlwZSIsIm5vZGUiLCJkZWZhdWx0U3BlY2lmaWVyIiwic3BlY2lmaWVycyIsInNvbWUiLCJuIiwiaW1wb3J0cyIsImdldCIsInNvdXJjZSIsInZhbHVlIiwiZXJyb3JzIiwibGVuZ3RoIiwicmVwb3J0RXJyb3JzIiwidW5kZWZpbmVkIiwicmVwb3J0IiwiYmluZCJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7OztBQUNBOzs7Ozs7QUFFQUEsT0FBT0MsT0FBUCxHQUFpQjtBQUNmQyxRQUFNO0FBQ0pDLFVBQU0sU0FERjtBQUVKQyxVQUFNO0FBQ0pDLFdBQUssdUJBQVEsU0FBUjtBQUREO0FBRkYsR0FEUzs7QUFRZkMsVUFBUSxVQUFVQyxPQUFWLEVBQW1COztBQUV6QixhQUFTQyxZQUFULENBQXNCQyxhQUF0QixFQUFxQ0MsSUFBckMsRUFBMkM7O0FBRXpDO0FBQ0EsVUFBSUMsZ0JBQUo7QUFDQUQsV0FBS0UsVUFBTCxDQUFnQkMsSUFBaEIsQ0FBc0JDLENBQUQsSUFBTztBQUMxQixZQUFJQSxFQUFFWCxJQUFGLEtBQVdNLGFBQWYsRUFBOEI7QUFDNUJFLDZCQUFtQkcsQ0FBbkI7QUFDQSxpQkFBTyxJQUFQO0FBQ0Q7QUFDRixPQUxEOztBQU9BLFVBQUksQ0FBQ0gsZ0JBQUwsRUFBdUI7QUFDdkIsVUFBSUksVUFBVSxvQkFBUUMsR0FBUixDQUFZTixLQUFLTyxNQUFMLENBQVlDLEtBQXhCLEVBQStCWCxPQUEvQixDQUFkO0FBQ0EsVUFBSVEsV0FBVyxJQUFmLEVBQXFCOztBQUVyQixVQUFJQSxRQUFRSSxNQUFSLENBQWVDLE1BQW5CLEVBQTJCO0FBQ3pCTCxnQkFBUU0sWUFBUixDQUFxQmQsT0FBckIsRUFBOEJHLElBQTlCO0FBQ0QsT0FGRCxNQUVPLElBQUlLLFFBQVFDLEdBQVIsQ0FBWSxTQUFaLE1BQTJCTSxTQUEvQixFQUEwQztBQUMvQ2YsZ0JBQVFnQixNQUFSLENBQWVaLGdCQUFmLEVBQWlDLG9DQUFqQztBQUNEO0FBQ0Y7O0FBRUQsV0FBTztBQUNMLDJCQUFxQkgsYUFBYWdCLElBQWIsQ0FBa0IsSUFBbEIsRUFBd0Isd0JBQXhCLENBRGhCO0FBRUwsZ0NBQTBCaEIsYUFBYWdCLElBQWIsQ0FBa0IsSUFBbEIsRUFBd0Isd0JBQXhCO0FBRnJCLEtBQVA7QUFJRDtBQXBDYyxDQUFqQiIsImZpbGUiOiJkZWZhdWx0LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IEV4cG9ydHMgZnJvbSAnLi4vRXhwb3J0TWFwJ1xuaW1wb3J0IGRvY3NVcmwgZnJvbSAnLi4vZG9jc1VybCdcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gIG1ldGE6IHtcbiAgICB0eXBlOiAncHJvYmxlbScsXG4gICAgZG9jczoge1xuICAgICAgdXJsOiBkb2NzVXJsKCdkZWZhdWx0JyksXG4gICAgfSxcbiAgfSxcblxuICBjcmVhdGU6IGZ1bmN0aW9uIChjb250ZXh0KSB7XG5cbiAgICBmdW5jdGlvbiBjaGVja0RlZmF1bHQoc3BlY2lmaWVyVHlwZSwgbm9kZSkge1xuXG4gICAgICAvLyBwb29yIG1hbidzIEFycmF5LmZpbmRcbiAgICAgIGxldCBkZWZhdWx0U3BlY2lmaWVyXG4gICAgICBub2RlLnNwZWNpZmllcnMuc29tZSgobikgPT4ge1xuICAgICAgICBpZiAobi50eXBlID09PSBzcGVjaWZpZXJUeXBlKSB7XG4gICAgICAgICAgZGVmYXVsdFNwZWNpZmllciA9IG5cbiAgICAgICAgICByZXR1cm4gdHJ1ZVxuICAgICAgICB9XG4gICAgICB9KVxuXG4gICAgICBpZiAoIWRlZmF1bHRTcGVjaWZpZXIpIHJldHVyblxuICAgICAgdmFyIGltcG9ydHMgPSBFeHBvcnRzLmdldChub2RlLnNvdXJjZS52YWx1ZSwgY29udGV4dClcbiAgICAgIGlmIChpbXBvcnRzID09IG51bGwpIHJldHVyblxuXG4gICAgICBpZiAoaW1wb3J0cy5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgIGltcG9ydHMucmVwb3J0RXJyb3JzKGNvbnRleHQsIG5vZGUpXG4gICAgICB9IGVsc2UgaWYgKGltcG9ydHMuZ2V0KCdkZWZhdWx0JykgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBjb250ZXh0LnJlcG9ydChkZWZhdWx0U3BlY2lmaWVyLCAnTm8gZGVmYXVsdCBleHBvcnQgZm91bmQgaW4gbW9kdWxlLicpXG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgICdJbXBvcnREZWNsYXJhdGlvbic6IGNoZWNrRGVmYXVsdC5iaW5kKG51bGwsICdJbXBvcnREZWZhdWx0U3BlY2lmaWVyJyksXG4gICAgICAnRXhwb3J0TmFtZWREZWNsYXJhdGlvbic6IGNoZWNrRGVmYXVsdC5iaW5kKG51bGwsICdFeHBvcnREZWZhdWx0U3BlY2lmaWVyJyksXG4gICAgfVxuICB9LFxufVxuIl19