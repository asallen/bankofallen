// Reset anyone's password (parent or kid) from the command line.
//
//   npm run reset-password -- <username>            # live site; prompts for the new password
//   npm run reset-password -- <username> --local    # local dev database
//
// Also signs that user out everywhere and clears any login lockout.
// Needs Node 22.18+ (runs TypeScript directly) and `npx wrangler login`.

import { execFileSync } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import { hashPassword } from '../src/lib.ts'

const args = process.argv.slice(2)
const target = args.includes('--local') ? '--local' : '--remote'
const username = args.find((a) => !a.startsWith('--'))?.toLowerCase() ?? ''

if (!/^[a-z0-9_-]{1,30}$/.test(username)) {
  console.error('Usage: npm run reset-password -- <username> [--local]')
  process.exit(1)
}

function sql(command: string): { results: Record<string, unknown>[] }[] {
  const out = execFileSync('npx', ['wrangler', 'd1', 'execute', 'bankofallen', target, '--json', '--command', command], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
  })
  return JSON.parse(out)
}

// username is validated above, so it's safe to put in the SQL.
const [{ results }] = sql(`SELECT id, role, display_name FROM users WHERE username = '${username}'`)
if (results.length === 0) {
  console.error(`No account with username "${username}" (${target.slice(2)} database).`)
  process.exit(1)
}
const user = results[0] as { id: number; role: 'parent' | 'kid'; display_name: string }
const minLength = user.role === 'parent' ? 8 : 4

const rl = createInterface({ input: process.stdin, output: process.stdout })
const password = (await rl.question(`New password for ${user.display_name} (${user.role}, at least ${minLength} characters): `)).trim()
rl.close()
if (password.length < minLength) {
  console.error(`Password must be at least ${minLength} characters. Nothing changed.`)
  process.exit(1)
}

// The hash is only base64 and "$", so it's safe to put in the SQL too.
const hash = await hashPassword(password)
sql(
  `UPDATE users SET password_hash = '${hash}' WHERE id = ${user.id}; ` +
    `DELETE FROM sessions WHERE user_id = ${user.id}; ` +
    `DELETE FROM settings WHERE key = 'login:${username}';`,
)
console.log(`Done. ${user.display_name} can log in as "${username}" with the new password.`)
