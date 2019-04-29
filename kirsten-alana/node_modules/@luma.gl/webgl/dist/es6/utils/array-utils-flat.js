let arrayBuffer = null;
export function getScratchArrayBuffer(byteLength) {
  if (!arrayBuffer || arrayBuffer.byteLength < byteLength) {
    arrayBuffer = new ArrayBuffer(byteLength);
  }

  return arrayBuffer;
}
export function getScratchArray(Type, length) {
  const scratchArrayBuffer = getScratchArrayBuffer(Type.BYTES_PER_ELEMENT * length);
  return new Type(scratchArrayBuffer, 0, length);
}
export function fillArray(_ref) {
  let target = _ref.target,
      source = _ref.source,
      _ref$start = _ref.start,
      start = _ref$start === void 0 ? 0 : _ref$start,
      _ref$count = _ref.count,
      count = _ref$count === void 0 ? 1 : _ref$count;
  const length = source.length;
  const total = count * length;
  let copied = 0;

  for (let i = start; copied < length; copied++) {
    target[i++] = source[copied];
  }

  while (copied < total) {
    if (copied < total - copied) {
      target.copyWithin(start + copied, start, start + copied);
      copied *= 2;
    } else {
      target.copyWithin(start + copied, start, start + total - copied);
      copied = total;
    }
  }

  return target;
}
//# sourceMappingURL=array-utils-flat.js.map