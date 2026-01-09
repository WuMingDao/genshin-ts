import { IRDocument } from '../../runtime/IR'

export type Position = [number, number]
export type NodeId = number
export type IRNode = NonNullable<IRDocument['nodes']>[number]
