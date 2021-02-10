import pino from 'pino'

export const log = pino({ level: process.env.LOG_LEVEL || 'info' })

export const exit = (exitCode: number): void => {
  process.exit(exitCode)
}

export const notifyByMail = (toAddress: string, error: Error): void => {
  //console.log(toAddress, error)
}
