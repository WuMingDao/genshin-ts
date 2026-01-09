import type { GstsConfig } from './src/compiler/gsts_config.js'

const config: GstsConfig = {
  compileRoot: '.',
  entries: ['./examples'],
  outDir: './dist',
  inject: {
    gameRegion: 'China',
    playerId: 100431567,
    mapId: 1073741851,
    nodeGraphId: 1073741827
  }
}

export default config
