import * as dotenv from 'dotenv'
import PromisedAD from 'activedirectory2/lib/adpromise'

dotenv.config()

const adConfig = {
  url: process.env.AD_URL,
  baseDN: process.env.AD_BASE_DN,
  username: process.env.AD_USER,
  password: process.env.AD_PASS,
  attributes: {
    user: ['cn', 'mail', 'manager', 'employeeID',],
  }
}

const ad = new PromisedAD(adConfig)

interface AdUser {
  cn: string
  mail: string
  manager: string
  employeeID: string
}

export interface UserManager {
  userName: string
  userMail: string
  userEmployeeId: string
  managerName: string
  managerMail: string
  managerEmployeeId: string
}

export const fetchUsersManagers = async (): Promise<UserManager[]> => {
  const result: UserManager[] = []

  await ad.authenticate(adConfig.username, adConfig.password)
  const users: AdUser[] = await ad.findUsers()

  for (const user of users.filter(user => typeof user.employeeID != 'undefined')) {
    if (typeof user.manager == 'undefined') continue
    const manager = await ad.findUser(user.manager)
    result.push({
      userName: user.cn,
      userMail: user.mail,
      userEmployeeId: user.employeeID,
      managerName: manager.cn,
      managerMail: manager.mail,
      managerEmployeeId: manager.employeeID,
    })
  }
  return result
}
