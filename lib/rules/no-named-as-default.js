'use strict';

var _ExportMap = require('../ExportMap');

var _ExportMap2 = _interopRequireDefault(_ExportMap);

var _importDeclaration = require('../importDeclaration');

var _importDeclaration2 = _interopRequireDefault(_importDeclaration);

var _docsUrl = require('../docsUrl');

var _docsUrl2 = _interopRequireDefault(_docsUrl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = {
  meta: {
    type: 'problem',
    docs: {
      url: (0, _docsUrl2.default)('no-named-as-default')
    }
  },

  create: function (context) {
    function checkDefault(nameKey, defaultSpecifier) {
      // #566: default is a valid specifier
      if (defaultSpecifier[nameKey].name === 'default') return;

      var declaration = (0, _importDeclaration2.default)(context);

      var imports = _ExportMap2.default.get(declaration.source.value, context);
      if (imports == null) return;

      if (imports.errors.length) {
        imports.reportErrors(context, declaration);
        return;
      }

      if (imports.has('default') && imports.has(defaultSpecifier[nameKey].name)) {

        context.report(defaultSpecifier, 'Using exported name \'' + defaultSpecifier[nameKey].name + '\' as identifier for default export.');
      }
    }
    return {
      'ImportDefaultSpecifier': checkDefault.bind(null, 'local'),
      'ExportDefaultSpecifier': checkDefault.bind(null, 'exported')
    };
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby1uYW1lZC1hcy1kZWZhdWx0LmpzIl0sIm5hbWVzIjpbIm1vZHVsZSIsImV4cG9ydHMiLCJtZXRhIiwidHlwZSIsImRvY3MiLCJ1cmwiLCJjcmVhdGUiLCJjb250ZXh0IiwiY2hlY2tEZWZhdWx0IiwibmFtZUtleSIsImRlZmF1bHRTcGVjaWZpZXIiLCJuYW1lIiwiZGVjbGFyYXRpb24iLCJpbXBvcnRzIiwiZ2V0Iiwic291cmNlIiwidmFsdWUiLCJlcnJvcnMiLCJsZW5ndGgiLCJyZXBvcnRFcnJvcnMiLCJoYXMiLCJyZXBvcnQiLCJiaW5kIl0sIm1hcHBpbmdzIjoiOztBQUFBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBRUFBLE9BQU9DLE9BQVAsR0FBaUI7QUFDZkMsUUFBTTtBQUNKQyxVQUFNLFNBREY7QUFFSkMsVUFBTTtBQUNKQyxXQUFLLHVCQUFRLHFCQUFSO0FBREQ7QUFGRixHQURTOztBQVFmQyxVQUFRLFVBQVVDLE9BQVYsRUFBbUI7QUFDekIsYUFBU0MsWUFBVCxDQUFzQkMsT0FBdEIsRUFBK0JDLGdCQUEvQixFQUFpRDtBQUMvQztBQUNBLFVBQUlBLGlCQUFpQkQsT0FBakIsRUFBMEJFLElBQTFCLEtBQW1DLFNBQXZDLEVBQWtEOztBQUVsRCxVQUFJQyxjQUFjLGlDQUFrQkwsT0FBbEIsQ0FBbEI7O0FBRUEsVUFBSU0sVUFBVSxvQkFBUUMsR0FBUixDQUFZRixZQUFZRyxNQUFaLENBQW1CQyxLQUEvQixFQUFzQ1QsT0FBdEMsQ0FBZDtBQUNBLFVBQUlNLFdBQVcsSUFBZixFQUFxQjs7QUFFckIsVUFBSUEsUUFBUUksTUFBUixDQUFlQyxNQUFuQixFQUEyQjtBQUN6QkwsZ0JBQVFNLFlBQVIsQ0FBcUJaLE9BQXJCLEVBQThCSyxXQUE5QjtBQUNBO0FBQ0Q7O0FBRUQsVUFBSUMsUUFBUU8sR0FBUixDQUFZLFNBQVosS0FDQVAsUUFBUU8sR0FBUixDQUFZVixpQkFBaUJELE9BQWpCLEVBQTBCRSxJQUF0QyxDQURKLEVBQ2lEOztBQUUvQ0osZ0JBQVFjLE1BQVIsQ0FBZVgsZ0JBQWYsRUFDRSwyQkFBMkJBLGlCQUFpQkQsT0FBakIsRUFBMEJFLElBQXJELEdBQ0Esc0NBRkY7QUFJRDtBQUNGO0FBQ0QsV0FBTztBQUNMLGdDQUEwQkgsYUFBYWMsSUFBYixDQUFrQixJQUFsQixFQUF3QixPQUF4QixDQURyQjtBQUVMLGdDQUEwQmQsYUFBYWMsSUFBYixDQUFrQixJQUFsQixFQUF3QixVQUF4QjtBQUZyQixLQUFQO0FBSUQ7QUFwQ2MsQ0FBakIiLCJmaWxlIjoibm8tbmFtZWQtYXMtZGVmYXVsdC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBFeHBvcnRzIGZyb20gJy4uL0V4cG9ydE1hcCdcbmltcG9ydCBpbXBvcnREZWNsYXJhdGlvbiBmcm9tICcuLi9pbXBvcnREZWNsYXJhdGlvbidcbmltcG9ydCBkb2NzVXJsIGZyb20gJy4uL2RvY3NVcmwnXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBtZXRhOiB7XG4gICAgdHlwZTogJ3Byb2JsZW0nLFxuICAgIGRvY3M6IHtcbiAgICAgIHVybDogZG9jc1VybCgnbm8tbmFtZWQtYXMtZGVmYXVsdCcpLFxuICAgIH0sXG4gIH0sXG5cbiAgY3JlYXRlOiBmdW5jdGlvbiAoY29udGV4dCkge1xuICAgIGZ1bmN0aW9uIGNoZWNrRGVmYXVsdChuYW1lS2V5LCBkZWZhdWx0U3BlY2lmaWVyKSB7XG4gICAgICAvLyAjNTY2OiBkZWZhdWx0IGlzIGEgdmFsaWQgc3BlY2lmaWVyXG4gICAgICBpZiAoZGVmYXVsdFNwZWNpZmllcltuYW1lS2V5XS5uYW1lID09PSAnZGVmYXVsdCcpIHJldHVyblxuXG4gICAgICB2YXIgZGVjbGFyYXRpb24gPSBpbXBvcnREZWNsYXJhdGlvbihjb250ZXh0KVxuXG4gICAgICB2YXIgaW1wb3J0cyA9IEV4cG9ydHMuZ2V0KGRlY2xhcmF0aW9uLnNvdXJjZS52YWx1ZSwgY29udGV4dClcbiAgICAgIGlmIChpbXBvcnRzID09IG51bGwpIHJldHVyblxuXG4gICAgICBpZiAoaW1wb3J0cy5lcnJvcnMubGVuZ3RoKSB7XG4gICAgICAgIGltcG9ydHMucmVwb3J0RXJyb3JzKGNvbnRleHQsIGRlY2xhcmF0aW9uKVxuICAgICAgICByZXR1cm5cbiAgICAgIH1cblxuICAgICAgaWYgKGltcG9ydHMuaGFzKCdkZWZhdWx0JykgJiZcbiAgICAgICAgICBpbXBvcnRzLmhhcyhkZWZhdWx0U3BlY2lmaWVyW25hbWVLZXldLm5hbWUpKSB7XG5cbiAgICAgICAgY29udGV4dC5yZXBvcnQoZGVmYXVsdFNwZWNpZmllcixcbiAgICAgICAgICAnVXNpbmcgZXhwb3J0ZWQgbmFtZSBcXCcnICsgZGVmYXVsdFNwZWNpZmllcltuYW1lS2V5XS5uYW1lICtcbiAgICAgICAgICAnXFwnIGFzIGlkZW50aWZpZXIgZm9yIGRlZmF1bHQgZXhwb3J0LicpXG5cbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICdJbXBvcnREZWZhdWx0U3BlY2lmaWVyJzogY2hlY2tEZWZhdWx0LmJpbmQobnVsbCwgJ2xvY2FsJyksXG4gICAgICAnRXhwb3J0RGVmYXVsdFNwZWNpZmllcic6IGNoZWNrRGVmYXVsdC5iaW5kKG51bGwsICdleHBvcnRlZCcpLFxuICAgIH1cbiAgfSxcbn1cbiJdfQ==