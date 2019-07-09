'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _minimatch = require('minimatch');

var _minimatch2 = _interopRequireDefault(_minimatch);

var _staticRequire = require('../core/staticRequire');

var _staticRequire2 = _interopRequireDefault(_staticRequire);

var _docsUrl = require('../docsUrl');

var _docsUrl2 = _interopRequireDefault(_docsUrl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function report(context, node) {
  context.report({
    node,
    message: 'Imported module should be assigned'
  });
}

function testIsAllow(globs, filename, source) {
  if (!Array.isArray(globs)) {
    return false; // default doesn't allow any patterns
  }

  let filePath;

  if (source[0] !== '.' && source[0] !== '/') {
    // a node module
    filePath = source;
  } else {
    filePath = _path2.default.resolve(_path2.default.dirname(filename), source); // get source absolute path
  }

  return globs.find(glob => (0, _minimatch2.default)(filePath, glob) || (0, _minimatch2.default)(filePath, _path2.default.join(process.cwd(), glob))) !== undefined;
}

function create(context) {
  const options = context.options[0] || {};
  const filename = context.getFilename();
  const isAllow = source => testIsAllow(options.allow, filename, source);

  return {
    ImportDeclaration(node) {
      if (node.specifiers.length === 0 && !isAllow(node.source.value)) {
        report(context, node);
      }
    },
    ExpressionStatement(node) {
      if (node.expression.type === 'CallExpression' && (0, _staticRequire2.default)(node.expression) && !isAllow(node.expression.arguments[0].value)) {
        report(context, node.expression);
      }
    }
  };
}

module.exports = {
  create,
  meta: {
    type: 'suggestion',
    docs: {
      url: (0, _docsUrl2.default)('no-unassigned-import')
    },
    schema: [{
      'type': 'object',
      'properties': {
        'devDependencies': { 'type': ['boolean', 'array'] },
        'optionalDependencies': { 'type': ['boolean', 'array'] },
        'peerDependencies': { 'type': ['boolean', 'array'] },
        'allow': {
          'type': 'array',
          'items': {
            'type': 'string'
          }
        }
      },
      'additionalProperties': false
    }]
  }
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ydWxlcy9uby11bmFzc2lnbmVkLWltcG9ydC5qcyJdLCJuYW1lcyI6WyJyZXBvcnQiLCJjb250ZXh0Iiwibm9kZSIsIm1lc3NhZ2UiLCJ0ZXN0SXNBbGxvdyIsImdsb2JzIiwiZmlsZW5hbWUiLCJzb3VyY2UiLCJBcnJheSIsImlzQXJyYXkiLCJmaWxlUGF0aCIsInJlc29sdmUiLCJkaXJuYW1lIiwiZmluZCIsImdsb2IiLCJqb2luIiwicHJvY2VzcyIsImN3ZCIsInVuZGVmaW5lZCIsImNyZWF0ZSIsIm9wdGlvbnMiLCJnZXRGaWxlbmFtZSIsImlzQWxsb3ciLCJhbGxvdyIsIkltcG9ydERlY2xhcmF0aW9uIiwic3BlY2lmaWVycyIsImxlbmd0aCIsInZhbHVlIiwiRXhwcmVzc2lvblN0YXRlbWVudCIsImV4cHJlc3Npb24iLCJ0eXBlIiwiYXJndW1lbnRzIiwibW9kdWxlIiwiZXhwb3J0cyIsIm1ldGEiLCJkb2NzIiwidXJsIiwic2NoZW1hIl0sIm1hcHBpbmdzIjoiOztBQUFBOzs7O0FBQ0E7Ozs7QUFFQTs7OztBQUNBOzs7Ozs7QUFFQSxTQUFTQSxNQUFULENBQWdCQyxPQUFoQixFQUF5QkMsSUFBekIsRUFBK0I7QUFDN0JELFVBQVFELE1BQVIsQ0FBZTtBQUNiRSxRQURhO0FBRWJDLGFBQVM7QUFGSSxHQUFmO0FBSUQ7O0FBRUQsU0FBU0MsV0FBVCxDQUFxQkMsS0FBckIsRUFBNEJDLFFBQTVCLEVBQXNDQyxNQUF0QyxFQUE4QztBQUM1QyxNQUFJLENBQUNDLE1BQU1DLE9BQU4sQ0FBY0osS0FBZCxDQUFMLEVBQTJCO0FBQ3pCLFdBQU8sS0FBUCxDQUR5QixDQUNaO0FBQ2Q7O0FBRUQsTUFBSUssUUFBSjs7QUFFQSxNQUFJSCxPQUFPLENBQVAsTUFBYyxHQUFkLElBQXFCQSxPQUFPLENBQVAsTUFBYyxHQUF2QyxFQUE0QztBQUFFO0FBQzVDRyxlQUFXSCxNQUFYO0FBQ0QsR0FGRCxNQUVPO0FBQ0xHLGVBQVcsZUFBS0MsT0FBTCxDQUFhLGVBQUtDLE9BQUwsQ0FBYU4sUUFBYixDQUFiLEVBQXFDQyxNQUFyQyxDQUFYLENBREssQ0FDbUQ7QUFDekQ7O0FBRUQsU0FBT0YsTUFBTVEsSUFBTixDQUFXQyxRQUNoQix5QkFBVUosUUFBVixFQUFvQkksSUFBcEIsS0FDQSx5QkFBVUosUUFBVixFQUFvQixlQUFLSyxJQUFMLENBQVVDLFFBQVFDLEdBQVIsRUFBVixFQUF5QkgsSUFBekIsQ0FBcEIsQ0FGSyxNQUdBSSxTQUhQO0FBSUQ7O0FBRUQsU0FBU0MsTUFBVCxDQUFnQmxCLE9BQWhCLEVBQXlCO0FBQ3ZCLFFBQU1tQixVQUFVbkIsUUFBUW1CLE9BQVIsQ0FBZ0IsQ0FBaEIsS0FBc0IsRUFBdEM7QUFDQSxRQUFNZCxXQUFXTCxRQUFRb0IsV0FBUixFQUFqQjtBQUNBLFFBQU1DLFVBQVVmLFVBQVVILFlBQVlnQixRQUFRRyxLQUFwQixFQUEyQmpCLFFBQTNCLEVBQXFDQyxNQUFyQyxDQUExQjs7QUFFQSxTQUFPO0FBQ0xpQixzQkFBa0J0QixJQUFsQixFQUF3QjtBQUN0QixVQUFJQSxLQUFLdUIsVUFBTCxDQUFnQkMsTUFBaEIsS0FBMkIsQ0FBM0IsSUFBZ0MsQ0FBQ0osUUFBUXBCLEtBQUtLLE1BQUwsQ0FBWW9CLEtBQXBCLENBQXJDLEVBQWlFO0FBQy9EM0IsZUFBT0MsT0FBUCxFQUFnQkMsSUFBaEI7QUFDRDtBQUNGLEtBTEk7QUFNTDBCLHdCQUFvQjFCLElBQXBCLEVBQTBCO0FBQ3hCLFVBQUlBLEtBQUsyQixVQUFMLENBQWdCQyxJQUFoQixLQUF5QixnQkFBekIsSUFDRiw2QkFBZ0I1QixLQUFLMkIsVUFBckIsQ0FERSxJQUVGLENBQUNQLFFBQVFwQixLQUFLMkIsVUFBTCxDQUFnQkUsU0FBaEIsQ0FBMEIsQ0FBMUIsRUFBNkJKLEtBQXJDLENBRkgsRUFFZ0Q7QUFDOUMzQixlQUFPQyxPQUFQLEVBQWdCQyxLQUFLMkIsVUFBckI7QUFDRDtBQUNGO0FBWkksR0FBUDtBQWNEOztBQUVERyxPQUFPQyxPQUFQLEdBQWlCO0FBQ2ZkLFFBRGU7QUFFZmUsUUFBTTtBQUNKSixVQUFNLFlBREY7QUFFSkssVUFBTTtBQUNKQyxXQUFLLHVCQUFRLHNCQUFSO0FBREQsS0FGRjtBQUtKQyxZQUFRLENBQ047QUFDRSxjQUFRLFFBRFY7QUFFRSxvQkFBYztBQUNaLDJCQUFtQixFQUFFLFFBQVEsQ0FBQyxTQUFELEVBQVksT0FBWixDQUFWLEVBRFA7QUFFWixnQ0FBd0IsRUFBRSxRQUFRLENBQUMsU0FBRCxFQUFZLE9BQVosQ0FBVixFQUZaO0FBR1osNEJBQW9CLEVBQUUsUUFBUSxDQUFDLFNBQUQsRUFBWSxPQUFaLENBQVYsRUFIUjtBQUlaLGlCQUFTO0FBQ1Asa0JBQVEsT0FERDtBQUVQLG1CQUFTO0FBQ1Asb0JBQVE7QUFERDtBQUZGO0FBSkcsT0FGaEI7QUFhRSw4QkFBd0I7QUFiMUIsS0FETTtBQUxKO0FBRlMsQ0FBakIiLCJmaWxlIjoibm8tdW5hc3NpZ25lZC1pbXBvcnQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IG1pbmltYXRjaCBmcm9tICdtaW5pbWF0Y2gnXG5cbmltcG9ydCBpc1N0YXRpY1JlcXVpcmUgZnJvbSAnLi4vY29yZS9zdGF0aWNSZXF1aXJlJ1xuaW1wb3J0IGRvY3NVcmwgZnJvbSAnLi4vZG9jc1VybCdcblxuZnVuY3Rpb24gcmVwb3J0KGNvbnRleHQsIG5vZGUpIHtcbiAgY29udGV4dC5yZXBvcnQoe1xuICAgIG5vZGUsXG4gICAgbWVzc2FnZTogJ0ltcG9ydGVkIG1vZHVsZSBzaG91bGQgYmUgYXNzaWduZWQnLFxuICB9KVxufVxuXG5mdW5jdGlvbiB0ZXN0SXNBbGxvdyhnbG9icywgZmlsZW5hbWUsIHNvdXJjZSkge1xuICBpZiAoIUFycmF5LmlzQXJyYXkoZ2xvYnMpKSB7XG4gICAgcmV0dXJuIGZhbHNlIC8vIGRlZmF1bHQgZG9lc24ndCBhbGxvdyBhbnkgcGF0dGVybnNcbiAgfVxuXG4gIGxldCBmaWxlUGF0aFxuXG4gIGlmIChzb3VyY2VbMF0gIT09ICcuJyAmJiBzb3VyY2VbMF0gIT09ICcvJykgeyAvLyBhIG5vZGUgbW9kdWxlXG4gICAgZmlsZVBhdGggPSBzb3VyY2VcbiAgfSBlbHNlIHtcbiAgICBmaWxlUGF0aCA9IHBhdGgucmVzb2x2ZShwYXRoLmRpcm5hbWUoZmlsZW5hbWUpLCBzb3VyY2UpIC8vIGdldCBzb3VyY2UgYWJzb2x1dGUgcGF0aFxuICB9XG5cbiAgcmV0dXJuIGdsb2JzLmZpbmQoZ2xvYiA9PiAoXG4gICAgbWluaW1hdGNoKGZpbGVQYXRoLCBnbG9iKSB8fFxuICAgIG1pbmltYXRjaChmaWxlUGF0aCwgcGF0aC5qb2luKHByb2Nlc3MuY3dkKCksIGdsb2IpKVxuICApKSAhPT0gdW5kZWZpbmVkXG59XG5cbmZ1bmN0aW9uIGNyZWF0ZShjb250ZXh0KSB7XG4gIGNvbnN0IG9wdGlvbnMgPSBjb250ZXh0Lm9wdGlvbnNbMF0gfHwge31cbiAgY29uc3QgZmlsZW5hbWUgPSBjb250ZXh0LmdldEZpbGVuYW1lKClcbiAgY29uc3QgaXNBbGxvdyA9IHNvdXJjZSA9PiB0ZXN0SXNBbGxvdyhvcHRpb25zLmFsbG93LCBmaWxlbmFtZSwgc291cmNlKVxuXG4gIHJldHVybiB7XG4gICAgSW1wb3J0RGVjbGFyYXRpb24obm9kZSkge1xuICAgICAgaWYgKG5vZGUuc3BlY2lmaWVycy5sZW5ndGggPT09IDAgJiYgIWlzQWxsb3cobm9kZS5zb3VyY2UudmFsdWUpKSB7XG4gICAgICAgIHJlcG9ydChjb250ZXh0LCBub2RlKVxuICAgICAgfVxuICAgIH0sXG4gICAgRXhwcmVzc2lvblN0YXRlbWVudChub2RlKSB7XG4gICAgICBpZiAobm9kZS5leHByZXNzaW9uLnR5cGUgPT09ICdDYWxsRXhwcmVzc2lvbicgJiZcbiAgICAgICAgaXNTdGF0aWNSZXF1aXJlKG5vZGUuZXhwcmVzc2lvbikgJiZcbiAgICAgICAgIWlzQWxsb3cobm9kZS5leHByZXNzaW9uLmFyZ3VtZW50c1swXS52YWx1ZSkpIHtcbiAgICAgICAgcmVwb3J0KGNvbnRleHQsIG5vZGUuZXhwcmVzc2lvbilcbiAgICAgIH1cbiAgICB9LFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBjcmVhdGUsXG4gIG1ldGE6IHtcbiAgICB0eXBlOiAnc3VnZ2VzdGlvbicsXG4gICAgZG9jczoge1xuICAgICAgdXJsOiBkb2NzVXJsKCduby11bmFzc2lnbmVkLWltcG9ydCcpLFxuICAgIH0sXG4gICAgc2NoZW1hOiBbXG4gICAgICB7XG4gICAgICAgICd0eXBlJzogJ29iamVjdCcsXG4gICAgICAgICdwcm9wZXJ0aWVzJzoge1xuICAgICAgICAgICdkZXZEZXBlbmRlbmNpZXMnOiB7ICd0eXBlJzogWydib29sZWFuJywgJ2FycmF5J10gfSxcbiAgICAgICAgICAnb3B0aW9uYWxEZXBlbmRlbmNpZXMnOiB7ICd0eXBlJzogWydib29sZWFuJywgJ2FycmF5J10gfSxcbiAgICAgICAgICAncGVlckRlcGVuZGVuY2llcyc6IHsgJ3R5cGUnOiBbJ2Jvb2xlYW4nLCAnYXJyYXknXSB9LFxuICAgICAgICAgICdhbGxvdyc6IHtcbiAgICAgICAgICAgICd0eXBlJzogJ2FycmF5JyxcbiAgICAgICAgICAgICdpdGVtcyc6IHtcbiAgICAgICAgICAgICAgJ3R5cGUnOiAnc3RyaW5nJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgJ2FkZGl0aW9uYWxQcm9wZXJ0aWVzJzogZmFsc2UsXG4gICAgICB9LFxuICAgIF0sXG4gIH0sXG59XG4iXX0=