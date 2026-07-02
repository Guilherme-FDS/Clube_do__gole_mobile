export function extrairTextoStrapi(children = []) {
  return children.map((c) => c.text || '').join('')
}
