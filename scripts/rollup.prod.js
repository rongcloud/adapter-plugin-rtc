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
const globals = {
  [engineName]: engineAttrs.globals
}

const consts = {
  __COMMIT_ID__: JSON.stringify(commitId),
  __VERSION__: JSON.stringify(pkg.version),
  __RUNTIME_TAG_WECHAT__: JSON.stringify('wechat'),
  __RUNTIME_TAG_BROWSER__: JSON.stringify('browser'),
  __RUNTIME_TAG_ELECTRON__: JSON.stringify('electron'),
  __RUNTIME_TAG_UNIAPP__: JSON.stringify('uniapp'),
  __RUNTIME_TAG_ALIPAY__: JSON.stringify('alipay')
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
