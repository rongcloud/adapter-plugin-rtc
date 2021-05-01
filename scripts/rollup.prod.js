const path = require('path')
const { execSync } = require('child_process')
const { terser } = require('rollup-plugin-terser')
const replace = require('@rollup/plugin-replace')
const { default: dts } = require('rollup-plugin-dts')
const del = require('rollup-plugin-delete')
const rollupTs = require('@rollup/plugin-typescript')

const commitId = execSync('git rev-parse HEAD').toString().replace(/\s/g, '')

const resolve = (...args) => path.resolve(__dirname, '..', ...args)

const pkg = require('../package.json')
const attrs = pkg.__attrs__

const input = resolve('src/index.ts')

const banner = [
  '/*',
  ` * ${attrs.globals} - v${pkg.version}`,
  ` * CommitId - ${commitId}`,
  ` * ${new Date()}`,
  ' * ©2020 RongCloud, Inc. All rights reserved.',
  ' */'
].join('\n')

const { name: engineName, __attrs__: engineAttrs } = require('../node_modules/@rongcloud/engine/package.json')
const { name: rtcName, __attrs__: rtcAttrs } = require('../node_modules/@rongcloud/plugin-rtc/package.json')

const globals = {
  [engineName]: engineAttrs.globals,
  [rtcName]: rtcAttrs.globals
}

const consts = {
  __COMMIT_ID__: JSON.stringify(commitId),
  __VERSION__: JSON.stringify(pkg.version),
  __DEV__: false
}

const plugins = [
  // delete 插件只能最初始位置执行一次
  del({ targets: 'dist/*' }),
  replace({ __DEV__: false, ...consts }),
  rollupTs({ sourceMap: false, target: 'ES2016' })
]
const isRelease = /^(\d+\.){2}\d+$/.test(pkg.version)
isRelease && plugins.push(terser())

module.exports = [
  {
    input,
    output: [
      { file: resolve(pkg.unpkg), format: 'umd', name: attrs.globals, banner, globals },
      { file: resolve(pkg.main), format: 'cjs', banner },
      { file: resolve(pkg.module), format: 'esm', banner }
    ],
    plugins
  },
  // d.ts
  {
    input,
    output: { file: resolve(pkg.types), format: 'esm', banner },
    plugins: [
      dts()
    ]
  }
]
