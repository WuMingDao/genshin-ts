import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { program } from 'commander'

import type { IRDocument } from '../runtime/IR.js'
import { irToGia } from './ir_to_gia_transform/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GIA_PROTO = path.resolve(
  __dirname,
  '../thirdparty/Genshin-Impact-Miliastra-Wonderland-Code-Node-Editor-Pack/protobuf/gia.proto'
)

function writeGiaFile(outFile: string, bytes: Uint8Array) {
  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  fs.writeFileSync(outFile, Buffer.from(bytes))
}

program
  .name('gsts_ir_to_gia')
  .description('Convert Genshin-TS IR JSON files to GIA format')
  .option('-i, --input <file>', 'Input IR JSON file')
  .option('-o, --output <path>', 'Output GIA file or directory')
  .argument('[input_file]', 'Input IR JSON file (alternative to -i)')
  .showHelpAfterError('(use --help to see all options)')
  .action((inputFileArg: string | undefined) => {
    const options = program.opts<{ input?: string; output?: string }>()

    const irPath: string | undefined = options.input ?? inputFileArg
    if (!irPath) {
      console.error('[error] Input file is required (use -i/--input or provide as argument)')
      program.help()
      process.exit(1)
    }

    if (!fs.existsSync(irPath)) {
      console.error(`[error] Input file not found: ${irPath}`)
      process.exit(1)
    }

    const raw: unknown = JSON.parse(fs.readFileSync(irPath, 'utf-8'))
    const list = Array.isArray(raw) ? raw : [raw]

    const inputBaseName = path.basename(irPath, path.extname(irPath))
    const inputDir = path.dirname(irPath)

    const outPath = options.output ?? inputDir
    const isOutputDirectory =
      !path.extname(outPath) || (fs.existsSync(outPath) && fs.statSync(outPath).isDirectory())

    list.forEach((item, idx) => {
      let outFile: string
      if (list.length === 1) {
        outFile = isOutputDirectory ? path.join(outPath, `${inputBaseName}.gia`) : outPath
      } else {
        const outputDir = isOutputDirectory ? outPath : path.dirname(outPath)
        outFile = path.join(outputDir, `${inputBaseName}_${idx}.gia`)
      }

      const bytes = irToGia(item as IRDocument, { protoPath: GIA_PROTO })
      writeGiaFile(outFile, bytes)
      console.log(`[ok] ${outFile} (${bytes.length} bytes)`)
    })
  })

if (process.argv.length <= 2) {
  program.help()
}

program.parse()
