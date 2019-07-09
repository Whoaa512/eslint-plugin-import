'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.isAbsolute = isAbsolute;
exports.isBuiltIn = isBuiltIn;
exports.isExternalModuleMain = isExternalModuleMain;
exports.isScopedMain = isScopedMain;
exports.default = resolveImportType;

var _cond = require('lodash/cond');

var _cond2 = _interopRequireDefault(_cond);

var _core = require('resolve/lib/core');

var _core2 = _interopRequireDefault(_core);

var _path = require('path');

var _resolve = require('eslint-module-utils/resolve');

var _resolve2 = _interopRequireDefault(_resolve);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function constant(value) {
  return () => value;
}

function baseModule(name) {
  if (isScoped(name)) {
    var _name$split = name.split('/'),
        _name$split2 = _slicedToArray(_name$split, 2);

    const scope = _name$split2[0],
          pkg = _name$split2[1];

    return `${scope}/${pkg}`;
  }

  var _name$split3 = name.split('/'),
      _name$split4 = _slicedToArray(_name$split3, 1);

  const pkg = _name$split4[0];

  return pkg;
}

function isAbsolute(name) {
  return name.indexOf('/') === 0;
}

// path is defined only when a resolver resolves to a non-standard path
function isBuiltIn(name, settings, path) {
  if (path) return false;
  const base = baseModule(name);
  const extras = settings && settings['import/core-modules'] || [];
  return _core2.default[base] || extras.indexOf(base) > -1;
}

function isExternalPath(path, name, settings) {
  const folders = settings && settings['import/external-module-folders'] || ['node_modules'];

  // extract the part before the first / (redux-saga/effects => redux-saga)
  const packageName = name.match(/([^/]+)/)[0];

  return !path || folders.some(folder => -1 < path.indexOf((0, _path.join)(folder, packageName)));
}

const externalModuleRegExp = /^\w/;
function isExternalModule(name, settings, path) {
  return externalModuleRegExp.test(name) && isExternalPath(path, name, settings);
}

const externalModuleMainRegExp = /^[\w]((?!\/).)*$/;
function isExternalModuleMain(name, settings, path) {
  return externalModuleMainRegExp.test(name) && isExternalPath(path, name, settings);
}

const scopedRegExp = /^@[^/]+\/[^/]+/;
function isScoped(name) {
  return scopedRegExp.test(name);
}

const scopedMainRegExp = /^@[^/]+\/?[^/]+$/;
function isScopedMain(name) {
  return scopedMainRegExp.test(name);
}

function isInternalModule(name, settings, path) {
  const folders = settings && settings['import/internal-module-folders'];
  const customInternal = folders && folders.some(folder => name.startsWith(folder));
  const matchesScopedOrExternalRegExp = scopedRegExp.test(name) || externalModuleRegExp.test(name);
  return customInternal || matchesScopedOrExternalRegExp && !isExternalPath(path, name, settings);
}

function isRelativeToParent(name) {
  return (/^\.\.[\\/]/.test(name)
  );
}

const indexFiles = ['.', './', './index', './index.js'];
function isIndex(name) {
  return indexFiles.indexOf(name) !== -1;
}

function isRelativeToSibling(name) {
  return (/^\.[\\/]/.test(name)
  );
}

const typeTest = (0, _cond2.default)([[isAbsolute, constant('absolute')], [isBuiltIn, constant('builtin')], [isInternalModule, constant('internal')], [isExternalModule, constant('external')], [isScoped, constant('external')], [isRelativeToParent, constant('parent')], [isIndex, constant('index')], [isRelativeToSibling, constant('sibling')], [constant(true), constant('unknown')]]);

function resolveImportType(name, context) {
  return typeTest(name, context.settings, (0, _resolve2.default)(name, context));
}
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9jb3JlL2ltcG9ydFR5cGUuanMiXSwibmFtZXMiOlsiaXNBYnNvbHV0ZSIsImlzQnVpbHRJbiIsImlzRXh0ZXJuYWxNb2R1bGVNYWluIiwiaXNTY29wZWRNYWluIiwicmVzb2x2ZUltcG9ydFR5cGUiLCJjb25zdGFudCIsInZhbHVlIiwiYmFzZU1vZHVsZSIsIm5hbWUiLCJpc1Njb3BlZCIsInNwbGl0Iiwic2NvcGUiLCJwa2ciLCJpbmRleE9mIiwic2V0dGluZ3MiLCJwYXRoIiwiYmFzZSIsImV4dHJhcyIsImlzRXh0ZXJuYWxQYXRoIiwiZm9sZGVycyIsInBhY2thZ2VOYW1lIiwibWF0Y2giLCJzb21lIiwiZm9sZGVyIiwiZXh0ZXJuYWxNb2R1bGVSZWdFeHAiLCJpc0V4dGVybmFsTW9kdWxlIiwidGVzdCIsImV4dGVybmFsTW9kdWxlTWFpblJlZ0V4cCIsInNjb3BlZFJlZ0V4cCIsInNjb3BlZE1haW5SZWdFeHAiLCJpc0ludGVybmFsTW9kdWxlIiwiY3VzdG9tSW50ZXJuYWwiLCJzdGFydHNXaXRoIiwibWF0Y2hlc1Njb3BlZE9yRXh0ZXJuYWxSZWdFeHAiLCJpc1JlbGF0aXZlVG9QYXJlbnQiLCJpbmRleEZpbGVzIiwiaXNJbmRleCIsImlzUmVsYXRpdmVUb1NpYmxpbmciLCJ0eXBlVGVzdCIsImNvbnRleHQiXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O1FBbUJnQkEsVSxHQUFBQSxVO1FBS0FDLFMsR0FBQUEsUztRQXNCQUMsb0IsR0FBQUEsb0I7UUFVQUMsWSxHQUFBQSxZO2tCQW9DUUMsaUI7O0FBNUZ4Qjs7OztBQUNBOzs7O0FBQ0E7O0FBRUE7Ozs7OztBQUVBLFNBQVNDLFFBQVQsQ0FBa0JDLEtBQWxCLEVBQXlCO0FBQ3ZCLFNBQU8sTUFBTUEsS0FBYjtBQUNEOztBQUVELFNBQVNDLFVBQVQsQ0FBb0JDLElBQXBCLEVBQTBCO0FBQ3hCLE1BQUlDLFNBQVNELElBQVQsQ0FBSixFQUFvQjtBQUFBLHNCQUNHQSxLQUFLRSxLQUFMLENB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QWMrQixPQUFkLENBQWpDLENBQVA7QUFDRCIsImZpbGUiOiJpbXBvcnRUeXBlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGNvbmQgZnJvbSAnbG9kYXNoL2NvbmQnXG5pbXBvcnQgY29yZU1vZHVsZXMgZnJvbSAncmVzb2x2ZS9saWIvY29yZSdcbmltcG9ydCB7IGpvaW4gfSBmcm9tICdwYXRoJ1xuXG5pbXBvcnQgcmVzb2x2ZSBmcm9tICdlc2xpbnQtbW9kdWxlLXV0aWxzL3Jlc29sdmUnXG5cbmZ1bmN0aW9uIGNvbnN0YW50KHZhbHVlKSB7XG4gIHJldHVybiAoKSA9PiB2YWx1ZVxufVxuXG5mdW5jdGlvbiBiYXNlTW9kdWxlKG5hbWUpIHtcbiAgaWYgKGlzU2NvcGVkKG5hbWUpKSB7XG4gICAgY29uc3QgW3Njb3BlLCBwa2ddID0gbmFtZS5zcGxpdCgnLycpXG4gICAgcmV0dXJuIGAke3Njb3BlfS8ke3BrZ31gXG4gIH1cbiAgY29uc3QgW3BrZ10gPSBuYW1lLnNwbGl0KCcvJylcbiAgcmV0dXJuIHBrZ1xufVxuXG5leHBvcnQgZnVuY3Rpb24gaXNBYnNvbHV0ZShuYW1lKSB7XG4gIHJldHVybiBuYW1lLmluZGV4T2YoJy8nKSA9PT0gMFxufVxuXG4vLyBwYXRoIGlzIGRlZmluZWQgb25seSB3aGVuIGEgcmVzb2x2ZXIgcmVzb2x2ZXMgdG8gYSBub24tc3RhbmRhcmQgcGF0aFxuZXhwb3J0IGZ1bmN0aW9uIGlzQnVpbHRJbihuYW1lLCBzZXR0aW5ncywgcGF0aCkge1xuICBpZiAocGF0aCkgcmV0dXJuIGZhbHNlXG4gIGNvbnN0IGJhc2UgPSBiYXNlTW9kdWxlKG5hbWUpXG4gIGNvbnN0IGV4dHJhcyA9IChzZXR0aW5ncyAmJiBzZXR0aW5nc1snaW1wb3J0L2NvcmUtbW9kdWxlcyddKSB8fCBbXVxuICByZXR1cm4gY29yZU1vZHVsZXNbYmFzZV0gfHwgZXh0cmFzLmluZGV4T2YoYmFzZSkgPiAtMVxufVxuXG5mdW5jdGlvbiBpc0V4dGVybmFsUGF0aChwYXRoLCBuYW1lLCBzZXR0aW5ncykge1xuICBjb25zdCBmb2xkZXJzID0gKHNldHRpbmdzICYmIHNldHRpbmdzWydpbXBvcnQvZXh0ZXJuYWwtbW9kdWxlLWZvbGRlcnMnXSkgfHwgWydub2RlX21vZHVsZXMnXVxuXG4gIC8vIGV4dHJhY3QgdGhlIHBhcnQgYmVmb3JlIHRoZSBmaXJzdCAvIChyZWR1eC1zYWdhL2VmZmVjdHMgPT4gcmVkdXgtc2FnYSlcbiAgY29uc3QgcGFja2FnZU5hbWUgPSBuYW1lLm1hdGNoKC8oW14vXSspLylbMF1cblxuICByZXR1cm4gIXBhdGggfHwgZm9sZGVycy5zb21lKGZvbGRlciA9PiAtMSA8IHBhdGguaW5kZXhPZihqb2luKGZvbGRlciwgcGFja2FnZU5hbWUpKSlcbn1cblxuY29uc3QgZXh0ZXJuYWxNb2R1bGVSZWdFeHAgPSAvXlxcdy9cbmZ1bmN0aW9uIGlzRXh0ZXJuYWxNb2R1bGUobmFtZSwgc2V0dGluZ3MsIHBhdGgpIHtcbiAgcmV0dXJuIGV4dGVybmFsTW9kdWxlUmVnRXhwLnRlc3QobmFtZSkgJiYgaXNFeHRlcm5hbFBhdGgocGF0aCwgbmFtZSwgc2V0dGluZ3MpXG59XG5cbmNvbnN0IGV4dGVybmFsTW9kdWxlTWFpblJlZ0V4cCA9IC9eW1xcd10oKD8hXFwvKS4pKiQvXG5leHBvcnQgZnVuY3Rpb24gaXNFeHRlcm5hbE1vZHVsZU1haW4obmFtZSwgc2V0dGluZ3MsIHBhdGgpIHtcbiAgcmV0dXJuIGV4dGVybmFsTW9kdWxlTWFpblJlZ0V4cC50ZXN0KG5hbWUpICYmIGlzRXh0ZXJuYWxQYXRoKHBhdGgsIG5hbWUsIHNldHRpbmdzKVxufVxuXG5jb25zdCBzY29wZWRSZWdFeHAgPSAvXkBbXi9dK1xcL1teL10rL1xuZnVuY3Rpb24gaXNTY29wZWQobmFtZSkge1xuICByZXR1cm4gc2NvcGVkUmVnRXhwLnRlc3QobmFtZSlcbn1cblxuY29uc3Qgc2NvcGVkTWFpblJlZ0V4cCA9IC9eQFteL10rXFwvP1teL10rJC9cbmV4cG9ydCBmdW5jdGlvbiBpc1Njb3BlZE1haW4obmFtZSkge1xuICByZXR1cm4gc2NvcGVkTWFpblJlZ0V4cC50ZXN0KG5hbWUpXG59XG5cbmZ1bmN0aW9uIGlzSW50ZXJuYWxNb2R1bGUobmFtZSwgc2V0dGluZ3MsIHBhdGgpIHtcbiAgY29uc3QgZm9sZGVycyA9IHNldHRpbmdzICYmIHNldHRpbmdzWydpbXBvcnQvaW50ZXJuYWwtbW9kdWxlLWZvbGRlcnMnXVxuICBjb25zdCBjdXN0b21JbnRlcm5hbCA9IGZvbGRlcnMgJiYgZm9sZGVycy5zb21lKGZvbGRlciA9PiBuYW1lLnN0YXJ0c1dpdGgoZm9sZGVyKSlcbiAgY29uc3QgbWF0Y2hlc1Njb3BlZE9yRXh0ZXJuYWxSZWdFeHAgPSBzY29wZWRSZWdFeHAudGVzdChuYW1lKSB8fCBleHRlcm5hbE1vZHVsZVJlZ0V4cC50ZXN0KG5hbWUpXG4gIHJldHVybiBjdXN0b21JbnRlcm5hbCB8fCAobWF0Y2hlc1Njb3BlZE9yRXh0ZXJuYWxSZWdFeHAgJiYgIWlzRXh0ZXJuYWxQYXRoKHBhdGgsIG5hbWUsIHNldHRpbmdzKSlcbn1cblxuZnVuY3Rpb24gaXNSZWxhdGl2ZVRvUGFyZW50KG5hbWUpIHtcbiAgcmV0dXJuIC9eXFwuXFwuW1xcXFwvXS8udGVzdChuYW1lKVxufVxuXG5jb25zdCBpbmRleEZpbGVzID0gWycuJywgJy4vJywgJy4vaW5kZXgnLCAnLi9pbmRleC5qcyddXG5mdW5jdGlvbiBpc0luZGV4KG5hbWUpIHtcbiAgcmV0dXJuIGluZGV4RmlsZXMuaW5kZXhPZihuYW1lKSAhPT0gLTFcbn1cblxuZnVuY3Rpb24gaXNSZWxhdGl2ZVRvU2libGluZyhuYW1lKSB7XG4gIHJldHVybiAvXlxcLltcXFxcL10vLnRlc3QobmFtZSlcbn1cblxuY29uc3QgdHlwZVRlc3QgPSBjb25kKFtcbiAgW2lzQWJzb2x1dGUsIGNvbnN0YW50KCdhYnNvbHV0ZScpXSxcbiAgW2lzQnVpbHRJbiwgY29uc3RhbnQoJ2J1aWx0aW4nKV0sXG4gIFtpc0ludGVybmFsTW9kdWxlLCBjb25zdGFudCgnaW50ZXJuYWwnKV0sXG4gIFtpc0V4dGVybmFsTW9kdWxlLCBjb25zdGFudCgnZXh0ZXJuYWwnKV0sXG4gIFtpc1Njb3BlZCwgY29uc3RhbnQoJ2V4dGVybmFsJyldLFxuICBbaXNSZWxhdGl2ZVRvUGFyZW50LCBjb25zdGFudCgncGFyZW50JyldLFxuICBbaXNJbmRleCwgY29uc3RhbnQoJ2luZGV4JyldLFxuICBbaXNSZWxhdGl2ZVRvU2libGluZywgY29uc3RhbnQoJ3NpYmxpbmcnKV0sXG4gIFtjb25zdGFudCh0cnVlKSwgY29uc3RhbnQoJ3Vua25vd24nKV0sXG5dKVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiByZXNvbHZlSW1wb3J0VHlwZShuYW1lLCBjb250ZXh0KSB7XG4gIHJldHVybiB0eXBlVGVzdChuYW1lLCBjb250ZXh0LnNldHRpbmdzLCByZXNvbHZlKG5hbWUsIGNvbnRleHQpKVxufVxuIl19