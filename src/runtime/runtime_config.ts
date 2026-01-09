export type RuntimeOptimizeOptions = {
  precompileExpression: boolean
  removeUnusedNodes: boolean
}

export type RuntimeOptions = {
  optimize: RuntimeOptimizeOptions
}

const runtimeOptions: RuntimeOptions = {
  optimize: {
    precompileExpression: true,
    removeUnusedNodes: true
  }
}

export function setRuntimeOptions(opts: Partial<RuntimeOptions>) {
  if (opts.optimize) {
    if (opts.optimize.precompileExpression !== undefined) {
      runtimeOptions.optimize.precompileExpression = opts.optimize.precompileExpression
    }
    if (opts.optimize.removeUnusedNodes !== undefined) {
      runtimeOptions.optimize.removeUnusedNodes = opts.optimize.removeUnusedNodes
    }
  }
}

export function getRuntimeOptions(): RuntimeOptions {
  return {
    optimize: { ...runtimeOptions.optimize }
  }
}
