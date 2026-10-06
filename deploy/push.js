/**
 * 把已经打好的 dist 上传到服务器。
 * 用法：在项目目录执行 npm run deploy
 */
const { spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')
const target = process.env.RECHARGE_SSH || 'admin@123.56.3.130'
const remote = process.env.RECHARGE_REMOTE || '/home/admin/sgs-recharge-95'
const distDir = path.join(rootDir, 'dist')

function run(command, args) {
  const result = spawnSync(command, args, { cwd: rootDir, stdio: 'inherit' })
  if (result.error) {
    console.error(result.error.message)
    process.exit(1)
  }
  if (result.status !== 0) process.exit(result.status ?? 1)
}

if (!fs.existsSync(distDir)) {
  console.error('没有 dist 目录，先执行 npm run build:h5')
  process.exit(1)
}

run('ssh', [target, `mkdir -p ${remote}/dist && find ${remote}/dist -mindepth 1 -maxdepth 1 ! -name .well-known -exec rm -rf {} +`])
run('scp', ['-r', 'dist/.', `${target}:${remote}/dist/`])
console.log(`已同步到 ${target}:${remote}/dist`)
