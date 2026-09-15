/** Pure equality for observation maps; intentionally independent of canonical JSON limits. */
export type FactoryObservationMap = Readonly<Record<string, readonly string[]>>

export const equalFactoryObservationMaps = (left: FactoryObservationMap, right: FactoryObservationMap): boolean => {
  const leftKeys = Object.keys(left), rightKeys = Object.keys(right)
  if (leftKeys.length !== rightKeys.length) return false
  for (const key of leftKeys) {
    if (!Object.hasOwn(right, key)) return false
    const leftTokens = left[key], rightTokens = right[key]
    if (!Array.isArray(leftTokens) || !Array.isArray(rightTokens) || leftTokens.length !== rightTokens.length) return false
    for (const [index, token] of leftTokens.entries()) if (token !== rightTokens[index]) return false
  }
  return true
}
