/**
 * 本机构建 H5 后，把 dist 上传到服务器。
 * 用法：在项目目录执行 npm run deploy
 */
const { spawnSync } = require('node:child_process')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')
const target = process.env.RECHARGE_SSH || 'admin@123.56.3.130'
const remote = process.env.RECHARGE_REMOTE || '/home/admin/sgs-recharge-95'
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'

function run(command, args) {
  const result = spawnSync(command, args, { cwd: rootDir, stdio: 'inherit' })
  if (result.error) {
    console.error(result.error.message)
    process.exit(1)
  }
  if (result.status !== 0) process.exit(result.status ?? 1)
}

run(npm, ['run', 'build:h5'])
run('ssh', [target, `mkdir -p ${remote} && rm -rf ${remote}/dist`])
run('scp', ['-r', 'dist', `${target}:${remote}/`])
console.log(`已同步到 ${target}:${remote}/dist`)
