import { Buffer, Transform } from '@luma.gl/core';
import { picking } from '@luma.gl/shadertools';
import test from 'tape-catch';
import { fixture } from 'test/setup';
const gl = fixture.gl2;
const TEST_DATA = {
  vertexColorData: new Float32Array([0, 0, 0, 255, 100, 150, 50, 50, 50, 251, 103, 153, 150, 100, 255, 254.5, 100, 150, 100, 150, 255, 255, 255, 255, 255, 100, 149.5])
};
const TEST_CASES = [{
  pickingSelectedColor: null,
  isPicked: [0, 0, 0, 0, 0, 0, 0, 0, 0]
}, {
  pickingSelectedColor: [255, 255, 255],
  isPicked: [0, 0, 0, 0, 0, 0, 0, 1, 0]
}, {
  pickingSelectedColor: [255, 100, 150],
  isPicked: [0, 1, 0, 0, 0, 1, 0, 0, 1]
}, {
  pickingSelectedColor: [255, 100, 150],
  pickingThreshold: 5,
  isPicked: [0, 1, 0, 1, 0, 1, 0, 0, 1]
}];
test('picking#isVertexPicked(pickingSelectedColor invalid)', t => {
  if (!Transform.isSupported(gl)) {
    t.comment('Transform not available, skipping tests');
    t.end();
    return;
  }

  const VS = "  attribute vec3 vertexColor;\n  varying float isPicked;\n\n  void main()\n  {\n    isPicked = float(isVertexPicked(vertexColor));\n  }\n  ";
  const vertexColorData = TEST_DATA.vertexColorData;
  const elementCount = vertexColorData.length / 3;
  const vertexColor = new Buffer(gl, vertexColorData);
  const isPicked = new Buffer(gl, {
    byteLength: elementCount * 4
  });
  const transform = new Transform(gl, {
    sourceBuffers: {
      vertexColor
    },
    feedbackBuffers: {
      isPicked
    },
    vs: VS,
    varyings: ['isPicked'],
    modules: [picking],
    elementCount
  });
  TEST_CASES.forEach(testCase => {
    const uniforms = picking.getUniforms({
      pickingSelectedColor: testCase.pickingSelectedColor,
      pickingThreshold: testCase.pickingThreshold
    });
    transform.run({
      uniforms
    });
    const expectedData = testCase.isPicked;
    const outData = transform.getBuffer('isPicked').getData();
    t.deepEqual(outData, expectedData, 'Vertex should correctly get picked');
  });
  t.end();
});
test('picking#picking_setPickingColor', t => {
  if (!Transform.isSupported(gl)) {
    t.comment('Transform not available, skipping tests');
    t.end();
    return;
  }

  const VS = "  attribute vec3 vertexColor;\n  varying vec4 rgbColorASelected;\n\n  void main()\n  {\n    picking_setPickingColor(vertexColor);\n    rgbColorASelected = picking_vRGBcolor_Aselected;\n  }\n  ";
  const COLOR_SCALE = 1 / 255;
  const EPSILON = 0.00001;
  const vertexColorData = TEST_DATA.vertexColorData;
  const elementCount = vertexColorData.length / 3;
  const vertexColor = new Buffer(gl, vertexColorData);
  const rgbColorASelected = new Buffer(gl, {
    byteLength: elementCount * 4 * 4
  });
  const transform = new Transform(gl, {
    sourceBuffers: {
      vertexColor
    },
    feedbackBuffers: {
      rgbColorASelected
    },
    vs: VS,
    varyings: ['rgbColorASelected'],
    modules: [picking],
    elementCount
  });
  TEST_CASES.forEach(testCase => {
    const uniforms = picking.getUniforms({
      pickingSelectedColor: testCase.pickingSelectedColor,
      pickingThreshold: testCase.pickingThreshold
    });
    transform.run({
      uniforms
    });
    const expectedData = testCase.isPicked.reduce((result, element, index) => {
      const pickingColor = TEST_DATA.vertexColorData.slice(index * 3, index * 3 + 3).map(e => e * COLOR_SCALE);
      result.push(pickingColor[0], pickingColor[1], pickingColor[2], element);
      return result;
    }, []);
    const outData = transform.getBuffer('rgbColorASelected').getData();
    outData.forEach((out, index) => {
      if (Math.abs(out - expectedData[index]) > EPSILON) {
        t.ok(false, 'Vertex should correctly get picked');
      }
    });
  });
  t.ok(true, 'picking_setPickingColor successful');
  t.end();
});
//# sourceMappingURL=picking.spec.js.map