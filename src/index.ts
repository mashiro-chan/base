import type { SpawnOptions } from 'child_process'
import { spawn } from 'child_process'
import type { Context } from 'koishi'
import { Logger, Schema } from 'koishi'

export const name = 'm6c-about'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

const logger = new Logger('m6c/about')

export async function apply(ctx: Context) {
  let version = ''

  try {
    version += (
      await spawnOutput('git', ['describe', '--tags', '--dirty'])
    ).trim()
  } catch (e) {
    logger.error('failed to get version', e)
    return '0.0.0'
  }

  try {
    version +=
      ' build ' +
      (await spawnOutput('git', ['rev-list', '--count', 'HEAD'])).trim()
  } catch (e) {
    logger.error('failed to get build number', e)
  }

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { version: koishiVersion } = require(
    require.resolve('koishi/package.json'),
  ) as {
    version: string
  }

  ctx.command('关于').action(() =>
    `
真白酱机器人 - 一个集游戏娱乐、智能问答、趣味交互、实用工具等功能于一身的群聊机器人
使用「@真白酱 /帮助」查看我的所有功能哦~
版本：${version}
框架：Koishi v${koishiVersion}
开源地址：GitHub @mashiro-chan
`.trim(),
  )
}

export async function spawnOutput(
  command: string,
  args?: ReadonlyArray<string>,
  options?: SpawnOptions,
): Promise<string> {
  const parsedArgs = args ?? []
  const parsedOptions: SpawnOptions = Object.assign<
    SpawnOptions,
    SpawnOptions,
    SpawnOptions | undefined
  >({}, { stdio: 'pipe', shell: true }, options)
  const child = spawn(command, parsedArgs, parsedOptions)
  let stdout = ''
  if (!child.stdout)
    throw new Error(`cannot get stdout of ${command} ${parsedArgs.join(' ')}`)
  child.stdout.on('data', (x) => (stdout += x))
  return new Promise<string>((resolve, reject) => {
    child.on('close', (x) => {
      if (x) reject(x)
      else resolve(stdout)
    })
  })
}
