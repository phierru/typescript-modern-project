import * as dotenv from 'dotenv'
import mssql from 'mssql'

dotenv.config()

const sqlServerConfig = {
  server: process.env.SQL_SERVER,
  user: process.env.QS_USER,
  password: process.env.QS_PASS,
  options: { enableArithAbort: false },
}

let pool: mssql.ConnectionPool
let transaction: mssql.Transaction
const statements: mssql.PreparedStatement[] = []

export const connect = async (): Promise<void> => {
  pool = new mssql.ConnectionPool({ ...sqlServerConfig, database: process.env.DATABASE })
  await pool.connect()
}

export const disconnect = async (): Promise<void> => {
  if (typeof pool == 'undefined') return
  if (pool.connected) await pool.close()
}

export const begin = async (): Promise<void> => {
  transaction = new mssql.Transaction(pool)
  await transaction.begin()
}

export const unprepare = async (statement: mssql.PreparedStatement): Promise<void> => {
  if (typeof statement == 'undefined') return
  if (statement.prepared) await statement.unprepare()
}

export const commit = async (): Promise<void> => {
  for (const statement of statements) {
    await unprepare(statement)
  }
  await transaction.commit()
}

export const rollback = async (): Promise<void> => {
  for (const statement of statements) {
    await unprepare(statement)
  }
  await transaction.rollback()
}

// Application specific code

export const clearMergeFlag = async (): Promise<void> => {
  await transaction.request().query('UPDATE [dbo].[TimeTools_Manager] SET [merged] = 0')
}

export const removeUnmerged = async (): Promise<void> => {
  await transaction.request().query('DELETE FROM [dbo].[TimeTools_Manager] WHERE [merged] = 0')
}

export interface UserManagerRow {
  user: string
  userEmail: string
  employeeID: string
  manager: string
  managerEmail: string
  managerEmployeeID: string
  merged?: number
}

export const prepareMergeUserManager = async (): Promise<mssql.PreparedStatement> => {
  const statement = new mssql.PreparedStatement(transaction)

  statement.input('user', mssql.VarChar(100))
  statement.input('userEmail', mssql.VarChar(50))
  statement.input('employeeID', mssql.Char(10))
  statement.input('manager', mssql.VarChar(100))
  statement.input('managerEmail', mssql.VarChar(50))
  statement.input('managerEmployeeID', mssql.Char(10))
  statement.input('merged', mssql.SmallInt)

  await statement.prepare(`
    INSERT INTO[dbo].[TimeTools_Manager]
    VALUES (
        @user,
        @userEmail,
        @employeeID,
        @manager,
        @managerEmail,
        @managerEmployeeID,
        @merged
    )
  `)
  statements.push(statement)
  return statement
}
