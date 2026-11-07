/** Executa uma varredura das fontes agora. Uso: npm run ingest */
import { runIngest } from '../src/lib/ingest'

const stats = await runIngest({ notify: !process.argv.includes('--no-notify') })
console.log(JSON.stringify(stats, null, 2))
process.exit(0)
