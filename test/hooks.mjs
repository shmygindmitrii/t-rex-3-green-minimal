// Node module hooks: resolve every '@zos/*' import to the mock and load the
// watch face sources (plain .js with ES syntax) as ES modules.
const MOCK = new URL('./zos-mock.mjs', import.meta.url).href

export async function resolve(specifier, context, next) {
  if (specifier.startsWith('@zos/')) return { url: MOCK, format: 'module', shortCircuit: true }
  return next(specifier, context)
}

export async function load(url, context, next) {
  if (url.includes('/watchface/')) return next(url, { ...context, format: 'module' })
  return next(url, context)
}
