const { execSync } = require('child_process')

const runshell = (command, cwd) => {
  execSync(command, { stdio: 'inherit', cwd })
}

const pkg = require('../package.json')
const ver = pkg.version.split(/[^\d]/).slice(0, 2).join('.')
const attrs = pkg.__attrs__
const commitId = execSync('git rev-parse HEAD').toString().replace(/\s/g, '')

const npmRelease = 'release/npm'

module.exports = (buildScripts) => {
  // 清除历史构建内容
  runshell('rm -rf dist release')

  // 编译
  runshell(buildScripts);

  // 预发布前的资源整理，最终:
  // 发布 release/npm 目录内容到 npm 仓库
  // 发布 release/cdn 目录内容到 cdn.rongcloud.cn

  // release/npm 资源拷贝
  (() => {
    runshell(`mkdir -p ${npmRelease}`)
    pkg.files.forEach(item => {
      runshell(`cp -r ${item} ${npmRelease}/${item}`)
    })

    delete pkg.private
    delete pkg.devDependencies
    delete pkg.scripts
    delete pkg.husky
    delete pkg['lint-staged']
    pkg.__commit__ = commitId

    // 覆盖 README.md
    runshell(`cp -r INTRODUCTION.md ${npmRelease}/README.md`)
    runshell(`echo '${JSON.stringify(pkg, null, '  ')}' > ${npmRelease}/package.json`)
  })();

  // release/cdn 资源拷贝
  (() => {
    runshell('mkdir -p release/cdn')
    runshell(`cp ${pkg.unpkg} release/cdn/${attrs.globals}-${ver}.latest.js`)
    runshell(`cp ${pkg.unpkg} release/cdn/${attrs.globals}-${pkg.version}.prod.js`)
  })()
}
