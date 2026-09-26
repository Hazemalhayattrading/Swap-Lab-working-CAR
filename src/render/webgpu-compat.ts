/**
 * three r186 always passes `swizzle: 'rgba'` to GPUTexture.createView(). 'rgba'
 * is the identity swizzle and the spec default, so leaving it out changes nothing.
 * Some Chromium releases (seen on Chromium 141) shipped an older draft of the
 * field and reject the string, which stops every frame from rendering. Dropping
 * the identity value keeps those browsers working. Remove once they age out.
 */
export function installWebGpuCompat(): void {
  if (typeof GPUTexture === 'undefined') return;
  const proto = GPUTexture.prototype as GPUTexture & { __swaplabCompat?: true };
  if (proto.__swaplabCompat) return;
  // eslint-disable-next-line @typescript-eslint/unbound-method -- re-bound with call() below
  const createView = proto.createView;
  proto.createView = function (this: GPUTexture, descriptor?: GPUTextureViewDescriptor) {
    if (descriptor && (descriptor as { swizzle?: unknown }).swizzle === 'rgba') {
      const rest: GPUTextureViewDescriptor & { swizzle?: unknown } = { ...descriptor };
      delete rest.swizzle;
      return createView.call(this, rest);
    }
    return createView.call(this, descriptor);
  };
  proto.__swaplabCompat = true;
}
