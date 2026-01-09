export type LenField = {
  field: number
  depth: number
  p0: number
  p1: number
  p2: number
  p3: number
  p4: number
  p5: number
  lenOffset: number
  lenSize: number
  dataStart: number
  dataEnd: number
}

export type Patch = {
  start: number
  end: number
  replacement: Uint8Array
}

export type FolderEntry = { typeValue?: number; id?: number }
export type FolderMetaList = { name?: string; entries: FolderEntry[] }
export type FolderIndex = {
  entryField: LenField
  folderId?: number
  contentField?: LenField
  contentName?: string
  contentEntries: FolderEntry[]
  metaLists: Array<{ field: LenField; list: FolderMetaList }>
}

export type InjectGilInput = {
  gilBytes: Uint8Array
  giaBytes: Uint8Array
  targetId?: number
  skipNonEmptyCheck?: boolean
  /**
   * i18n language for warnings/errors (e.g. 'zh-CN' | 'en-US' | 'auto')
   */
  lang?: string
}

export type InjectGilResult = {
  bytes: Uint8Array
  mode: 'replace'
}

export type InjectGilFileOptions = {
  gilPath: string
  giaPath: string
  targetId?: number
  skipNonEmptyCheck?: boolean
  outPath?: string
  protoPath?: string
  /**
   * i18n language for warnings/errors (e.g. 'zh-CN' | 'en-US' | 'auto')
   */
  lang?: string
}

export type InjectGilFileResult = InjectGilResult & {
  outPath: string
}
