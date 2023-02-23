"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault")["default"];

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._modelAssign = _modelAssign;
exports.addScope = addScope;
exports.capitalize = capitalize;
exports.exists = exists;
exports.fieldName = fieldName;
exports.generateQuickGuid = generateQuickGuid;
exports.hasKey = hasKey;
exports.hasProp = hasProp;
exports.humanizeCamelCaseString = humanizeCamelCaseString;
exports.inScope = inScope;
exports.isContainer = isContainer;
exports.isNonEmptyString = isNonEmptyString;
exports.isObject = isObject;
exports.modelAdd = modelAdd;
exports.modelAssign = modelAssign;
exports.modelDelete = modelDelete;
exports.modelGet = modelGet;
exports.normalizeModelKey = normalizeModelKey;
exports.parseKeys = parseKeys;
exports.parseParentScope = parseParentScope;
exports.parseRootScope = parseRootScope;
exports.scopeLength = scopeLength;
exports.shallowCopy = shallowCopy;
exports.sortKeysByScopeLength = sortKeysByScopeLength;
exports.splitOnUpperCaseLetter = splitOnUpperCaseLetter;
exports.uncapitalize = uncapitalize;

var _objectSpread2 = _interopRequireDefault(require("@babel/runtime/helpers/objectSpread2"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _typeof2 = _interopRequireDefault(require("@babel/runtime/helpers/typeof"));

function generateQuickGuid() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function exists(v) {
  return v !== undefined && v !== null;
}

function isContainer(v) {
  return (0, _typeof2["default"])(v) === 'object' && v !== null || typeof v === 'function';
}

function isObject(v) {
  return (0, _typeof2["default"])(v) === 'object' && v !== null && !Array.isArray(v);
}

function hasKey(container, name) {
  return isContainer(container) && Object.keys(container).some(function (k) {
    return k === name;
  });
}

function hasProp(props, name) {
  return isObject(props) && hasKey(props, name);
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim() !== '';
}

function capitalize(s) {
  return isNonEmptyString(s) ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function uncapitalize(s) {
  return isNonEmptyString(s) ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}

function splitOnUpperCaseLetter(s) {
  return String(s).split(/(?=[A-Z])/);
}

function humanizeCamelCaseString(s) {
  var a = splitOnUpperCaseLetter(s);
  return a.map(function (s, i) {
    return i === 0 ? capitalize(s) : uncapitalize(s);
  }).join(' ');
}

function addScope(currentScope, scope) {
  if (currentScope && scope) {
    return currentScope + '.' + scope;
  }

  if (currentScope) {
    return currentScope;
  }

  if (scope) {
    return scope;
  }

  return '';
}

function inScope(rootModelKey, scope) {
  return rootModelKey.substring(0, scope.length) === scope;
}

function parseParentScope(modelKey) {
  var i = modelKey.lastIndexOf('.');

  if (i === -1) {
    return ['', modelKey];
  }

  return [modelKey.slice(0, i), modelKey.slice(i + 1)];
}

function parseRootScope(modelKey) {
  var i = modelKey.indexOf('.');

  if (i === -1) {
    return [modelKey, null];
  }

  return [modelKey.slice(0, i), modelKey.slice(i + 1)];
}

function scopeLength(scopeKey) {
  if (scopeKey === '') {
    return -1;
  }

  return scopeKey.split('.').length - 1;
}

function sortKeysByScopeLength(keysByIdToSort, rootModelKeysById) {
  return Object.keys(keysByIdToSort).map(function (id) {
    return rootModelKeysById[id];
  }).sort(function (k1, k2) {
    return scopeLength(k2) - scopeLength(k1);
  });
}

function normalizeModelKey(modelKey) {
  // convert 'contacts[0].address.line1' to 'contacts.0.address.line1'
  var k = String(modelKey).replace(/\[(\w+)\]/g, '.$1');
  return k[0] !== '.' ? k : k.slice(1); // If I go to lengths to clean things up here, I will have to do it in buildLookup as well. Not sure that's best.
  // while (k[0] === '.') {k = k.slice(1);}
  // while (k[k.length - 1] === '.') {k = k.slice(0, -1);}
  // while (k.indexOf('..') !== -1) {k = k.replace('..', '.');}
  // return k;
}

function parseKeys(modelKey) {
  return modelKey.split('.');
}

function fieldName(modelKey) {
  return parseKeys(modelKey).slice(-1);
} // function modelHasKey(model, modelKey) {
//   parseKeys(modelKey).forEach((key) => {
//     if (hasKey(model, key)) {
//       model = model[key];
//     }
//     else {
//       return false;
//     }
//   });
//   return true;
// }


function modelGet(model, modelKey) {
  var throwError = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

  if (modelKey === '') {
    return model;
  }

  var curr = model,
      notFound = false;
  parseKeys(modelKey).forEach(function (key) {
    if (hasKey(curr, key)) {
      curr = curr[key];
    } else {
      notFound = true;
    }
  });

  if (notFound) {
    if (throwError) {
      throw new Error("Unable to get modelKey \"".concat(modelKey, "\" from model ").concat(JSON.stringify(model), "."));
    }

    return undefined;
  }

  return curr;
}

function throwModelAssignError(rootModel, modelKey, action) {
  var preposition = 'in';

  if (action === 'add') {
    preposition = 'to';
  }

  if (action === 'delete') {
    preposition = 'from';
  }

  throw new Error("Unable to ".concat(action, " modelKey \"").concat(modelKey, "\" ").concat(preposition, " model ").concat(JSON.stringify(rootModel), "."));
}

function _modelAssign(currentModel, keys, value, rootModel, modelKey, action) {
  if (!isContainer(currentModel)) {
    throwModelAssignError(rootModel, modelKey, action);
  }

  var key = keys[0];

  if ((keys.length !== 1 || action !== 'add') && !hasKey(currentModel, key)) {
    throwModelAssignError(rootModel, modelKey, action);
  }

  if (keys.length === 1 && action === 'add') {
    if (hasKey(currentModel, key)) {
      throwModelAssignError(rootModel, modelKey, action);
    }

    if (Array.isArray(currentModel) && Number(key) !== currentModel.length) {
      throwModelAssignError(rootModel, modelKey, action);
    }
  }

  var newModel = shallowCopy(currentModel);

  if (keys.length === 1) {
    if (action == 'delete') {
      if (Array.isArray(currentModel)) {
        newModel = newModel.slice(0, Number(key)).concat(newModel.slice(Number(key) + 1));
      } else {
        delete newModel[key];
      }
    } else {
      newModel[key] = value;
    }
  } else {
    newModel[key] = _modelAssign(currentModel[key], keys.slice(1), value, rootModel, modelKey, action);
  }

  return newModel;
}

function modelAssign(model, modelKey, value) {
  return _modelAssign(model, parseKeys(modelKey), value, model, modelKey, 'update');
}

function modelAdd(model, modelKey, value) {
  return _modelAssign(model, parseKeys(modelKey), value, model, modelKey, 'add');
}

function modelDelete(model, modelKey) {
  return _modelAssign(model, parseKeys(modelKey), null, model, modelKey, 'delete');
}

function shallowCopy(value) {
  if (Array.isArray(value)) {
    return (0, _toConsumableArray2["default"])(value);
  }

  if (isContainer(value)) {
    return (0, _objectSpread2["default"])({}, value);
  }

  return value;
}