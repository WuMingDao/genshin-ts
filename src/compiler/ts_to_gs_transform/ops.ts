import ts from 'typescript'

export type BinOpInfo = { method: string; swap?: boolean }

export const BINARY_OP_TO_CALL: Partial<Record<ts.SyntaxKind, BinOpInfo>> = {
  [ts.SyntaxKind.PlusToken]: { method: 'addition' },
  [ts.SyntaxKind.MinusToken]: { method: 'subtraction' },
  [ts.SyntaxKind.AsteriskToken]: { method: 'multiplication' },
  [ts.SyntaxKind.AsteriskAsteriskToken]: { method: 'exponentiation' },
  [ts.SyntaxKind.SlashToken]: { method: 'division' },
  [ts.SyntaxKind.PercentToken]: { method: 'moduloOperation' },

  [ts.SyntaxKind.LessThanToken]: { method: 'lessThan' },
  [ts.SyntaxKind.LessThanEqualsToken]: { method: 'lessThanOrEqualTo' },
  [ts.SyntaxKind.GreaterThanToken]: { method: 'greaterThan' },
  [ts.SyntaxKind.GreaterThanEqualsToken]: { method: 'greaterThanOrEqualTo' },

  [ts.SyntaxKind.LessThanLessThanToken]: { method: 'leftShiftOperation' },
  [ts.SyntaxKind.GreaterThanGreaterThanToken]: { method: 'rightShiftOperation' },
  [ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken]: { method: 'rightShiftOperation' },

  [ts.SyntaxKind.AmpersandToken]: { method: 'bitwiseAnd' },
  [ts.SyntaxKind.BarToken]: { method: 'bitwiseOr' },
  [ts.SyntaxKind.CaretToken]: { method: 'xorExclusiveOr' },

  [ts.SyntaxKind.AmpersandAmpersandToken]: { method: 'logicalAndOperation' },
  [ts.SyntaxKind.BarBarToken]: { method: 'logicalOrOperation' }
}

export function getBinaryOpInfo(op: ts.SyntaxKind): BinOpInfo | undefined {
  return BINARY_OP_TO_CALL[op]
}

export function isAssignmentLikeOperator(op: ts.SyntaxKind): boolean {
  return (
    op === ts.SyntaxKind.EqualsToken ||
    op === ts.SyntaxKind.PlusEqualsToken ||
    op === ts.SyntaxKind.MinusEqualsToken ||
    op === ts.SyntaxKind.AsteriskEqualsToken ||
    op === ts.SyntaxKind.AsteriskAsteriskEqualsToken ||
    op === ts.SyntaxKind.SlashEqualsToken ||
    op === ts.SyntaxKind.PercentEqualsToken ||
    op === ts.SyntaxKind.LessThanLessThanEqualsToken ||
    op === ts.SyntaxKind.GreaterThanGreaterThanEqualsToken ||
    op === ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken ||
    op === ts.SyntaxKind.AmpersandEqualsToken ||
    op === ts.SyntaxKind.BarEqualsToken ||
    op === ts.SyntaxKind.BarBarEqualsToken ||
    op === ts.SyntaxKind.AmpersandAmpersandEqualsToken ||
    op === ts.SyntaxKind.QuestionQuestionEqualsToken ||
    op === ts.SyntaxKind.CaretEqualsToken
  )
}

export function compoundAssignmentToBinaryOperator(op: ts.SyntaxKind): ts.SyntaxKind | null {
  switch (op) {
    case ts.SyntaxKind.PlusEqualsToken:
      return ts.SyntaxKind.PlusToken
    case ts.SyntaxKind.MinusEqualsToken:
      return ts.SyntaxKind.MinusToken
    case ts.SyntaxKind.AsteriskEqualsToken:
      return ts.SyntaxKind.AsteriskToken
    case ts.SyntaxKind.SlashEqualsToken:
      return ts.SyntaxKind.SlashToken
    case ts.SyntaxKind.PercentEqualsToken:
      return ts.SyntaxKind.PercentToken
    default:
      return null
  }
}

export function getCompoundAssignmentMethod(op: ts.SyntaxKind): string | null {
  const bin = compoundAssignmentToBinaryOperator(op)
  if (!bin) return null
  return getBinaryOpInfo(bin)?.method ?? null
}

export function isSupportedSimpleAssignmentOperator(op: ts.SyntaxKind): boolean {
  if (op === ts.SyntaxKind.EqualsToken) return true
  return compoundAssignmentToBinaryOperator(op) !== null
}

export function isUnsupportedBinaryOperator(op: ts.SyntaxKind): boolean {
  return op === ts.SyntaxKind.InKeyword || op === ts.SyntaxKind.InstanceOfKeyword
}
