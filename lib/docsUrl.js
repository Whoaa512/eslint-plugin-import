'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = docsUrl;

var _package = require('../package.json');

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const repoUrl = 'https://github.com/benmosher/eslint-plugin-import';

function docsUrl(ruleName) {
  let commitish = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : `v${_package2.default.version}`;

  return `${repoUrl}/blob/${commitish}/docs/rules/${ruleName}.md`;
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9kb2NzVXJsLmpzIl0sIm5hbWVzIjpbImRvY3NVcmwiLCJyZXBvVXJsIiwicnVsZU5hbWUiLCJjb21taXRpc2giLCJ2ZXJzaW9uIl0sIm1hcHBpbmdzIjoiOzs7OztrQkFJd0JBLE87O0FBSnhCOzs7Ozs7QUFFQSxNQUFNQyxVQUFVLG1EQUFoQjs7QUFFZSxTQUFTRCxPQUFULENBQWlCRSxRQUFqQixFQUEwRDtBQUFBLE1BQS9CQyxTQUErQix1RUFBbEIsSUFBRyxrQkFBSUMsT0FBUSxFQUFHOztBQUN2RSxTQUFRLEdBQUVILE9BQVEsU0FBUUUsU0FBVSxlQUFjRCxRQUFTLEtBQTNEO0FBQ0QiLCJmaWxlIjoiZG9jc1VybC5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwa2cgZnJvbSAnLi4vcGFja2FnZS5qc29uJ1xuXG5jb25zdCByZXBvVXJsID0gJ2h0dHBzOi8vZ2l0aHViLmNvbS9iZW5tb3NoZXIvZXNsaW50LXBsdWdpbi1pbXBvcnQnXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGRvY3NVcmwocnVsZU5hbWUsIGNvbW1pdGlzaCA9IGB2JHtwa2cudmVyc2lvbn1gKSB7XG4gIHJldHVybiBgJHtyZXBvVXJsfS9ibG9iLyR7Y29tbWl0aXNofS9kb2NzL3J1bGVzLyR7cnVsZU5hbWV9Lm1kYFxufVxuIl19