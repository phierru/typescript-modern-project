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
  await transaction.commit()
}

export const rollback = async (): Promise<void> => {
  for (const statement of statements) {
    await unprepare(statement)
  }
  if (typeof transaction == 'undefined') return
  await transaction.rollback()
}

const createStatement = (): mssql.PreparedStatement => {
  const statement = new mssql.PreparedStatement(transaction)
  statements.push(statement)
  return statement
}

// Application specific code below

export const clearMergeFlag = async (): Promise<void> => {
  await transaction.request().query('UPDATE [dbo].[TimeTools_Manager] SET [isMerged] = 0')
}

export const removeUnmerged = async (): Promise<void> => {
  await transaction.request().query('DELETE FROM [dbo].[TimeTools_Manager] WHERE [isMerged] = 0')
}

export interface UserManagerRow {
  user: string
  userEmail: string
  employeeID: string
  manager: string
  managerEmail: string
  managerEmployeeID: string
}

export const prepareMergeUserManager = async (): Promise<mssql.PreparedStatement> => {
  const statement = createStatement()

  statement.input('user', mssql.VarChar(100))
  statement.input('userEmail', mssql.VarChar(50))
  statement.input('employeeID', mssql.Char(10))
  statement.input('manager', mssql.VarChar(100))
  statement.input('managerEmail', mssql.VarChar(50))
  statement.input('managerEmployeeID', mssql.Char(10))

  await statement.prepare(`
    MERGE [dbo].[TimeTools_Manager] WITH (HOLDLOCK) AS TARGET
    USING (
      SELECT
        @user AS [user],
        @userEmail AS [userEmail],
        @employeeID AS [employeeID],
        @manager AS [manager],
        @managerEmail AS [managerEmail],
        @managerEmployeeID AS [managerEmployeeID]
    ) AS SOURCE
    ON TARGET.[employeeID] = SOURCE.[employeeID]
    WHEN MATCHED THEN UPDATE
    SET
        TARGET.[user] = SOURCE.[user],
        TARGET.[userEmail] = SOURCE.[userEmail],
        TARGET.[manager] = SOURCE.[manager],
        TARGET.[managerEmail] = SOURCE.[managerEmail],
        TARGET.[managerEmployeeID] = SOURCE.[managerEmployeeID],
        TARGET.[isMerged] = 1
    WHEN NOT MATCHED BY TARGET THEN INSERT
    VALUES(
        SOURCE.[user],
        SOURCE.[userEmail],
        SOURCE.[employeeID],
        SOURCE.[manager],
        SOURCE.[managerEmail],
        SOURCE.[managerEmployeeID],
        1 -- isMerged
    );
  `)
  return statement
}
