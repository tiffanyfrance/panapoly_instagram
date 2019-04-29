import log from './log';
export function checkProps(className, props, propChecks) {
  const _propChecks$removedPr = propChecks.removedProps,
        removedProps = _propChecks$removedPr === void 0 ? {} : _propChecks$removedPr,
        _propChecks$deprecate = propChecks.deprecatedProps,
        deprecatedProps = _propChecks$deprecate === void 0 ? {} : _propChecks$deprecate,
        _propChecks$replacedP = propChecks.replacedProps,
        replacedProps = _propChecks$replacedP === void 0 ? {} : _propChecks$replacedP;

  for (const propName in removedProps) {
    if (propName in props) {
      const replacementProp = removedProps[propName];
      const replacement = replacementProp ? "".concat(className, ".").concat(removedProps[propName]) : 'N/A';
      log.removed("".concat(className, ".").concat(propName), replacement)();
    }
  }

  for (const propName in deprecatedProps) {
    if (propName in props) {
      const replacementProp = deprecatedProps[propName];
      log.deprecated("".concat(className, ".").concat(propName), "".concat(className, ".").concat(replacementProp))();
    }
  }

  let newProps = null;

  for (const propName in replacedProps) {
    if (propName in props) {
      const replacementProp = replacedProps[propName];
      log.deprecated("".concat(className, ".").concat(propName), "".concat(className, ".").concat(replacementProp))();
      newProps = newProps || Object.assign({}, props);
      newProps[replacementProp] = props[propName];
      delete newProps[propName];
    }
  }

  return newProps || props;
}
//# sourceMappingURL=check-props.js.map