import { MODULE_INJECTORS_VS, MODULE_INJECTORS_FS } from '../modules/module-injectors';
import { VERTEX_SHADER, FRAGMENT_SHADER } from './constants';
import { assert } from '../utils';
const MODULE_INJECTORS = {
  [VERTEX_SHADER]: MODULE_INJECTORS_VS,
  [FRAGMENT_SHADER]: MODULE_INJECTORS_FS
};
const REGEX_START_OF_MAIN = /void main\s*\([^)]*\)\s*\{\n?/;
const REGEX_END_OF_MAIN = /}\n?[^{}]*$/;
export default function injectShader(source, type, inject, injectStandardStubs) {
  const isVertex = type === VERTEX_SHADER;

  for (const key in inject) {
    const fragment = inject[key];

    switch (key) {
      case 'vs:#decl':
        if (isVertex) {
          source = source.replace(REGEX_START_OF_MAIN, match => "".concat(fragment, "\n").concat(match));
        }

        break;

      case 'vs:#main-start':
        if (isVertex) {
          source = source.replace(REGEX_START_OF_MAIN, match => match + fragment);
        }

        break;

      case 'vs:#main-end':
        if (isVertex) {
          source = source.replace(REGEX_END_OF_MAIN, match => fragment + match);
        }

        break;

      case 'fs:#decl':
        if (!isVertex) {
          source = source.replace(REGEX_START_OF_MAIN, match => "".concat(fragment, "\n").concat(match));
        }

        break;

      case 'fs:#main-start':
        if (!isVertex) {
          source = source.replace(REGEX_START_OF_MAIN, match => match + fragment);
        }

        break;

      case 'fs:#main-end':
        if (!isVertex) {
          source = source.replace(REGEX_END_OF_MAIN, match => fragment + match);
        }

        break;

      default:
        source = source.replace(key, match => match + fragment);
    }
  }

  if (injectStandardStubs) {
    source = source.replace('}s*$', match => match + MODULE_INJECTORS[type]);
  }

  return source;
}
export function combineInjects(injects) {
  const result = {};
  assert(Array.isArray(injects) && injects.length > 1);
  injects.forEach(inject => {
    for (const key in inject) {
      result[key] = result[key] ? "".concat(result[key], "\n").concat(inject[key]) : inject[key];
    }
  });
  return result;
}
//# sourceMappingURL=inject-shader.js.map