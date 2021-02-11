import * as dotenv from 'dotenv'
import pino from 'pino'

dotenv.config()

export const log = pino({ level: process.env.LOG_LEVEL || 'info' })

export const exit = (exitCode: number): void => {
  process.exit(exitCode)
}
