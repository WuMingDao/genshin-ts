import ts from 'typescript'

export type ListType =
  | 'int'
  | 'float'
  | 'bool'
  | 'str'
  | 'vec3'
  | 'guid'
  | 'entity'
  | 'prefab_id'
  | 'config_id'
  | 'faction'

export function inferConcreteTypeFromString(s: string): ListType | null {
  const t = s.trim()
  if (t === 'number' || t === 'float' || t === 'FloatValue') return 'float'
  if (t === 'bigint' || t === 'int' || t === 'IntValue') return 'int'
  if (t === 'boolean' || t === 'bool' || t === 'BoolValue') return 'bool'
  if (t === 'string' || t === 'str' || t === 'StrValue') return 'str'
  if (
    t === 'vec3' ||
    t === 'Vec3Value' ||
    /^\[\s*number\s*,\s*number\s*,\s*number\s*\]\s*$/i.test(t) ||
    /^readonly\s*\[\s*number\s*,\s*number\s*,\s*number\s*\]\s*$/i.test(t)
  ) {
    return 'vec3'
  }
  if (t === 'guid' || t === 'GuidValue') return 'guid'
  if (t === 'entity' || t === 'EntityValue') return 'entity'
  if (t === 'prefabId' || t === 'PrefabIdValue') return 'prefab_id'
  if (t === 'configId' || t === 'ConfigIdValue') return 'config_id'
  if (t === 'faction' || t === 'FactionValue') return 'faction'
  return null
}

export function inferListTypeFromTypeString(s: string): ListType | null {
  const t = s.trim()

  if (
    /^readonly\s*\[\s*number\s*,\s*number\s*,\s*number\s*\]\s*\[\]\s*$/i.test(t) ||
    /^\[\s*number\s*,\s*number\s*,\s*number\s*\]\s*\[\]\s*$/i.test(t)
  ) {
    return 'vec3'
  }

  const readonlyArray = /^readonly\s+(.+)\[\]\s*$/i.exec(t)
  if (readonlyArray) {
    return inferConcreteTypeFromString(readonlyArray[1])
  }

  if (t.endsWith('[]')) {
    return inferConcreteTypeFromString(t.slice(0, -2))
  }

  const arrayRef = /^Array<(.+)>$/i.exec(t)
  if (arrayRef) {
    const inner = arrayRef[1].trim()
    if (/^\[\s*number\s*,\s*number\s*,\s*number\s*\]$/i.test(inner)) return 'vec3'
    return inferConcreteTypeFromString(inner)
  }

  const roArrayRef = /^ReadonlyArray<(.+)>$/i.exec(t)
  if (roArrayRef) {
    const inner = roArrayRef[1].trim()
    if (/^\[\s*number\s*,\s*number\s*,\s*number\s*\]$/i.test(inner)) return 'vec3'
    return inferConcreteTypeFromString(inner)
  }

  return null
}

export function inferListTypeFromType(checker: ts.TypeChecker, type: ts.Type): ListType | null {
  if (type.flags & ts.TypeFlags.Union) {
    const u = type as ts.UnionType
    let base: ListType | null = null
    for (const t of u.types) {
      const next = inferListTypeFromType(checker, t)
      if (!next) return null
      if (!base) base = next
      else if (base !== next) return null
    }
    return base
  }
  if (type.flags & ts.TypeFlags.Intersection) {
    const i = type as ts.IntersectionType
    let base: ListType | null = null
    for (const t of i.types) {
      const next = inferListTypeFromType(checker, t)
      if (!next) return null
      if (!base) base = next
      else if (base !== next) return null
    }
    return base
  }

  const s = checker.typeToString(type)
  return inferListTypeFromTypeString(s)
}

export function inferListElementTypeFromType(
  checker: ts.TypeChecker,
  type: ts.Type
): ListType | null {
  if (type.flags & ts.TypeFlags.Union) {
    const u = type as ts.UnionType
    let base: ListType | null = null
    for (const t of u.types) {
      const next = inferListElementTypeFromType(checker, t)
      if (!next) return null
      if (!base) base = next
      else if (base !== next) return null
    }
    return base
  }
  if (type.flags & ts.TypeFlags.Intersection) {
    const i = type as ts.IntersectionType
    let base: ListType | null = null
    for (const t of i.types) {
      const next = inferListElementTypeFromType(checker, t)
      if (!next) return null
      if (!base) base = next
      else if (base !== next) return null
    }
    return base
  }

  if ((type.flags & ts.TypeFlags.BigIntLike) !== 0) return 'int'
  if ((type.flags & ts.TypeFlags.NumberLike) !== 0) return 'float'
  if ((type.flags & ts.TypeFlags.BooleanLike) !== 0) return 'bool'
  if ((type.flags & ts.TypeFlags.StringLike) !== 0) return 'str'

  const s = checker.typeToString(type)
  return inferConcreteTypeFromString(s)
}

export function isArrayLikeType(checker: ts.TypeChecker, type: ts.Type): boolean {
  if (checker.isArrayType(type) || checker.isTupleType(type)) return true
  const s = checker.typeToString(type)
  if (/\[\]\s*$/.test(s)) return true
  if (/^Array<.+>$/.test(s)) return true
  if (/^ReadonlyArray<.+>$/.test(s)) return true
  if (/^readonly\s+.+\[\]\s*$/i.test(s)) return true
  return false
}

export function inferListTypeFromExpression(
  checker: ts.TypeChecker,
  expr: ts.Node
): ListType | null {
  const type = checker.getTypeAtLocation(expr)
  return inferListTypeFromType(checker, type)
}

export function inferListElementTypeFromExpression(
  checker: ts.TypeChecker,
  expr: ts.Node
): ListType | null {
  const type = checker.getTypeAtLocation(expr)
  return inferListElementTypeFromType(checker, type)
}
