
export function generateQuickGuid() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function exists(v) {
  return v !== undefined && v !== null;
}

export function isContainer(v) {
  return (typeof(v) === 'object' && v !== null) || typeof(v) === 'function';
}

export function isObject(v) {
  return typeof(v) === 'object' && v !== null && !Array.isArray(v);
}

export function hasKey(container, name) {
  return isContainer(container) && Object.keys(container).some(k => k === name);
}

export function hasProp(props, name) {
  return isObject(props) && hasKey(props, name);
}

export function isNonEmptyString(v) {
  return typeof(v) === 'string' && v.trim() !== '';
}

export function capitalize(s) {
  return isNonEmptyString(s) ? (s.charAt(0).toUpperCase() + s.slice(1)) : s;
}

export function uncapitalize(s) {
  return isNonEmptyString(s) ? (s.charAt(0).toLowerCase() + s.slice(1)) : s;
}

export function splitOnUpperCaseLetter(s) {
  return String(s).split(/(?=[A-Z])/);
}

export function humanizeCamelCaseString(s) {
  const a = splitOnUpperCaseLetter(s);
  return a.map((s, i) => (i === 0 ? capitalize(s) : uncapitalize(s))).join(' ');
}

export function addScope(currentScope, scope) {
  if (currentScope && scope) {return currentScope + '.' + scope;}
  if (currentScope) {return currentScope;}
  if (scope) {return scope;}
  return '';
}

export function inScope(rootModelKey, scope) {
  return rootModelKey.substring(0, scope.length) === scope;
}

export function parseParentScope(modelKey) {
  const i = modelKey.lastIndexOf('.');
  if (i === -1) {
    return ['', modelKey];
  }
  return [modelKey.slice(0, i), modelKey.slice(i + 1)];
}

export function parseRootScope(modelKey) {
  const i = modelKey.indexOf('.');
  if (i === -1) {
    return [modelKey, null];
  }
  return [modelKey.slice(0, i), modelKey.slice(i + 1)];
}

export function scopeLength(scopeKey) {
  if (scopeKey === '') {return -1;}
  return scopeKey.split('.').length - 1;
}

export function sortKeysByScopeLength(keysByIdToSort, rootModelKeysById) {
  return Object.keys(keysByIdToSort).map(id => rootModelKeysById[id]).sort((k1, k2) => scopeLength(k2) - scopeLength(k1));
}

export function normalizeModelKey(modelKey) {
  // convert 'contacts[0].address.line1' to 'contacts.0.address.line1'
  let k = String(modelKey).replace(/\[(\w+)\]/g, '.$1');
  return (k[0] !== '.') ? k : k.slice(1);

  // If I go to lengths to clean things up here, I will have to do it in buildLookup as well. Not sure that's best.
  // while (k[0] === '.') {k = k.slice(1);}
  // while (k[k.length - 1] === '.') {k = k.slice(0, -1);}
  // while (k.indexOf('..') !== -1) {k = k.replace('..', '.');}
  // return k;
}

export function parseKeys(modelKey) {
  return modelKey.split('.');
}

export function fieldName(modelKey) {
  return parseKeys(modelKey).slice(-1);
}


// function modelHasKey(model, modelKey) {
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

export function modelGet(model, modelKey, throwError = true) {
  if (modelKey === '') {
    return model;
  }
  let curr = model, notFound = false;
  parseKeys(modelKey).forEach((key) => {
    if (hasKey(curr, key)) {
      curr = curr[key];
    }
    else {
      notFound = true;
    }
  });
  if (notFound) {
    if (throwError) {
      throw new Error(`Unable to get modelKey "${modelKey}" from model ${JSON.stringify(model)}.`);
    }
    return undefined;
  }
  return curr;
}


function throwModelAssignError(rootModel, modelKey, action) {
  let preposition = 'in';
  if (action === 'add') {preposition = 'to';}
  if (action === 'delete') {preposition = 'from';}
  throw new Error(`Unable to ${action} modelKey "${modelKey}" ${preposition} model ${JSON.stringify(rootModel)}.`);
}

export function _modelAssign(currentModel, keys, value, rootModel, modelKey, action) {
  if (!isContainer(currentModel)) {
    throwModelAssignError(rootModel, modelKey, action);
  }

  const key = keys[0];

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

  let newModel = shallowCopy(currentModel);

  if (keys.length === 1) {
    if (action == 'delete') {
      if (Array.isArray(currentModel)) {
        newModel = newModel.slice(0, Number(key)).concat(newModel.slice(Number(key) + 1));
      }
      else {
        delete newModel[key];
      }
    }
    else {
      newModel[key] = value;
    }
  }
  else {
    newModel[key] = _modelAssign(currentModel[key], keys.slice(1), value, rootModel, modelKey, action);
  }

  return newModel;
}

export function modelAssign(model, modelKey, value) {
  return _modelAssign(model, parseKeys(modelKey), value, model, modelKey, 'update');
}

export function modelAdd(model, modelKey, value) {
  return _modelAssign(model, parseKeys(modelKey), value, model, modelKey, 'add');
}

export function modelDelete(model, modelKey) {
  return _modelAssign(model, parseKeys(modelKey), null, model, modelKey, 'delete');
}


export function shallowCopy(value) {
  if (Array.isArray(value)) {
    return [...value];
  }
  if (isContainer(value)) {
    return {...value};
  }
  return value;
}
