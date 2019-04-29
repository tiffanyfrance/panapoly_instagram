import { Matrix4 } from 'math.gl';
import { log, assert } from '../../utils';
import ScenegraphNode from './scenegraph-node';
export default class GroupNode extends ScenegraphNode {
  constructor() {
    let props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    props = Array.isArray(props) ? {
      children: props
    } : props;
    const _props = props,
          _props$children = _props.children,
          children = _props$children === void 0 ? [] : _props$children;
    children.every(child => assert(child instanceof ScenegraphNode));
    super(props);
    this.children = children;
  }

  add() {
    for (var _len = arguments.length, children = new Array(_len), _key = 0; _key < _len; _key++) {
      children[_key] = arguments[_key];
    }

    for (const child of children) {
      if (Array.isArray(child)) {
        this.add(...child);
      } else {
        this.children.push(child);
      }
    }

    return this;
  }

  remove(child) {
    const children = this.children;
    const indexOf = children.indexOf(child);

    if (indexOf > -1) {
      children.splice(indexOf, 1);
    }

    return this;
  }

  removeAll() {
    this.children = [];
    return this;
  }

  delete() {
    this.children.forEach(child => child.delete());
    this.removeAll();
    super.delete();
  }

  traverse(visitor) {
    let _ref = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {},
        _ref$worldMatrix = _ref.worldMatrix,
        worldMatrix = _ref$worldMatrix === void 0 ? new Matrix4() : _ref$worldMatrix;

    const modelMatrix = new Matrix4(worldMatrix).multiplyRight(this.matrix);

    for (const child of this.children) {
      if (child instanceof GroupNode) {
        child.traverse(visitor, {
          worldMatrix: modelMatrix
        });
      } else {
        visitor(child, {
          worldMatrix: modelMatrix
        });
      }
    }
  }

  traverseReverse(visitor, opts) {
    log.warn('traverseReverse is not reverse')();
    return this.traverse(visitor, opts);
  }

}
//# sourceMappingURL=group-node.js.map