import ts from 'typescript'

export type NumericKind = 'float' | 'int' | 'mixed' | 'unknown'

function mergeKinds(a: NumericKind, b: NumericKind): NumericKind {
  if (a === 'unknown') return b
  if (b === 'unknown') return a
  if (a === b) return a
  return 'mixed'
}

export function isAnyOrUnknown(type: ts.Type): boolean {
  return (type.flags & ts.TypeFlags.Any) !== 0 || (type.flags & ts.TypeFlags.Unknown) !== 0
}

export function getNumericKind(checker: ts.TypeChecker, type: ts.Type): NumericKind {
  if (type.flags & ts.TypeFlags.Union) {
    const u = type as ts.UnionType
    let kind: NumericKind = 'unknown'
    for (const t of u.types) {
      kind = mergeKinds(kind, getNumericKind(checker, t))
      if (kind === 'mixed') return 'mixed'
    }
    return kind
  }
  if (type.flags & ts.TypeFlags.Intersection) {
    const i = type as ts.IntersectionType
    let kind: NumericKind = 'unknown'
    for (const t of i.types) {
      kind = mergeKinds(kind, getNumericKind(checker, t))
      if (kind === 'mixed') return 'mixed'
    }
    return kind
  }

  if ((type.flags & ts.TypeFlags.BigIntLike) !== 0) return 'int'
  if ((type.flags & ts.TypeFlags.NumberLike) !== 0) return 'float'

  const s = checker.typeToString(type)
  if (s === 'IntValue' || s === 'int') return 'int'
  if (s === 'FloatValue' || s === 'float' || s === 'number') return 'float'
  return 'unknown'
}

export function isPossiblyUndefined(type: ts.Type): boolean {
  if ((type.flags & ts.TypeFlags.Undefined) !== 0) return true
  if ((type.flags & ts.TypeFlags.Union) !== 0) {
    const u = type as ts.UnionType
    return u.types.some(isPossiblyUndefined)
  }
  return false
}

export function isBooleanType(checker: ts.TypeChecker, type: ts.Type): boolean {
  if ((type.flags & ts.TypeFlags.BooleanLike) !== 0) return true
  if ((type.flags & ts.TypeFlags.Union) !== 0) {
    const u = type as ts.UnionType
    return u.types.every((t) => isBooleanType(checker, t))
  }
  if ((type.flags & ts.TypeFlags.Intersection) !== 0) {
    const i = type as ts.IntersectionType
    return i.types.every((t) => isBooleanType(checker, t))
  }
  const s = checker.typeToString(type)
  return s === 'BoolValue' || s === 'bool' || s === 'boolean'
}

export function isStringType(checker: ts.TypeChecker, type: ts.Type): boolean {
  if ((type.flags & ts.TypeFlags.StringLike) !== 0) return true
  if ((type.flags & ts.TypeFlags.Union) !== 0) {
    const u = type as ts.UnionType
    return u.types.every((t) => isStringType(checker, t))
  }
  if ((type.flags & ts.TypeFlags.Intersection) !== 0) {
    const i = type as ts.IntersectionType
    return i.types.every((t) => isStringType(checker, t))
  }
  const s = checker.typeToString(type)
  return s === 'StrValue' || s === 'str' || s === 'string'
}

export function isNumberType(checker: ts.TypeChecker, type: ts.Type): boolean {
  if ((type.flags & ts.TypeFlags.NumberLike) !== 0) return true
  if ((type.flags & ts.TypeFlags.Union) !== 0) {
    const u = type as ts.UnionType
    return u.types.every((t) => isNumberType(checker, t))
  }
  const s = checker.typeToString(type)
  return s === 'FloatValue' || s === 'float' || s === 'number'
}

export function isBigIntType(checker: ts.TypeChecker, type: ts.Type): boolean {
  if ((type.flags & ts.TypeFlags.BigIntLike) !== 0) return true
  if ((type.flags & ts.TypeFlags.Union) !== 0) {
    const u = type as ts.UnionType
    return u.types.every((t) => isBigIntType(checker, t))
  }
  const s = checker.typeToString(type)
  return s === 'IntValue' || s === 'int' || s === 'bigint'
}
