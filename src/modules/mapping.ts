import { UserManager } from './ad'
import { UserManagerRow } from './database'

export const mapUserManager = (userManager: UserManager): UserManagerRow => {
  return {
    user: userManager.userName,
    userEmail: userManager.userMail,
    employeeID: userManager.userEmployeeId,
    manager: userManager.managerName,
    managerEmail: userManager.managerMail,
    managerEmployeeID: userManager.managerEmployeeId,
  }
}
