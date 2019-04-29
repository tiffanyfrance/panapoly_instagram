import { Vector3, Matrix4 } from 'math.gl';
import { assert, uid } from '../../utils';
export default class ScenegraphNode {
  constructor(props) {
    const id = props.id;
    this.id = id || uid(this.constructor.name);
    this.display = true;
    this.position = new Vector3();
    this.rotation = new Vector3();
    this.scale = new Vector3(1, 1, 1);
    this.matrix = new Matrix4();
    this.userData = {};
    this.props = {};

    this._setScenegraphNodeProps(props);
  }

  delete() {}

  setProps(props) {
    this._setScenegraphNodeProps(props);

    return this;
  }

  toString() {
    return "{type: ScenegraphNode, id: ".concat(this.id, ")}");
  }

  setPosition(position) {
    assert(position.length === 3, 'setPosition requires vector argument');
    this.position = position;
    return this;
  }

  setRotation(rotation) {
    assert(rotation.length === 3, 'setRotation requires vector argument');
    this.rotation = rotation;
    return this;
  }

  setScale(scale) {
    assert(scale.length === 3, 'setScale requires vector argument');
    this.scale = scale;
    return this;
  }

  setMatrix(matrix) {
    let copyMatrix = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    if (copyMatrix) {
      this.matrix.copy(matrix);
    } else {
      this.matrix = matrix;
    }
  }

  setMatrixComponents(_ref) {
    let position = _ref.position,
        rotation = _ref.rotation,
        scale = _ref.scale,
        _ref$update = _ref.update,
        update = _ref$update === void 0 ? true : _ref$update;

    if (position) {
      this.setPosition(position);
    }

    if (rotation) {
      this.setRotation(rotation);
    }

    if (scale) {
      this.setScale(scale);
    }

    if (update) {
      this.updateMatrix();
    }

    return this;
  }

  updateMatrix() {
    const pos = this.position;
    const rot = this.rotation;
    const scale = this.scale;
    this.matrix.identity();
    this.matrix.translate(pos);
    this.matrix.rotateXYZ(rot);
    this.matrix.scale(scale);
    return this;
  }

  update() {
    let _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
        position = _ref2.position,
        rotation = _ref2.rotation,
        scale = _ref2.scale;

    if (position) {
      this.setPosition(position);
    }

    if (rotation) {
      this.setRotation(rotation);
    }

    if (scale) {
      this.setScale(scale);
    }

    this.updateMatrix();
    return this;
  }

  getCoordinateUniforms(viewMatrix, modelMatrix) {
    assert(viewMatrix);
    modelMatrix = modelMatrix || this.matrix;
    const worldMatrix = new Matrix4(viewMatrix).multiplyRight(modelMatrix);
    const worldInverse = worldMatrix.invert();
    const worldInverseTranspose = worldInverse.transpose();
    return {
      viewMatrix,
      modelMatrix,
      objectMatrix: modelMatrix,
      worldMatrix,
      worldInverseMatrix: worldInverse,
      worldInverseTransposeMatrix: worldInverseTranspose
    };
  }

  transform() {
    if (!this.parent) {
      this.endPosition.set(this.position);
      this.endRotation.set(this.rotation);
      this.endScale.set(this.scale);
    } else {
      const parent = this.parent;
      this.endPosition.set(this.position.add(parent.endPosition));
      this.endRotation.set(this.rotation.add(parent.endRotation));
      this.endScale.set(this.scale.add(parent.endScale));
    }

    const ch = this.children;

    for (let i = 0; i < ch.length; ++i) {
      ch[i].transform();
    }

    return this;
  }

  _setScenegraphNodeProps(props) {
    if ('display' in props) {
      this.display = props.display;
    }

    if ('position' in props) {
      this.setPosition(props.position);
    }

    if ('rotation' in props) {
      this.setPosition(props.rotation);
    }

    if ('scale' in props) {
      this.setScale(props.scale);
    }

    if ('matrix' in props) {
      this.setPosition(props.matrix);
    }

    Object.assign(this.props, props);
  }

}
//# sourceMappingURL=scenegraph-node.js.map