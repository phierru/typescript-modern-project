import { exit, log } from './modules/exception'
import { fetchUsersManagers, UserManager } from './modules/ad'
import { mapUserManager } from './modules/mapping'
import {
  connect,
  disconnect,
  begin,
  commit,
  rollback,
  clearMergeFlag,
  prepareMergeUserManager,
  removeUnmerged,
  unprepare,
} from './modules/database'

try {
  await connect()
  await begin()
  
  const usersManagers: UserManager[] = await fetchUsersManagers() 

  await clearMergeFlag()
  const mergeUserManager = await prepareMergeUserManager()

  for (const userManager of usersManagers.filter(userManager => userManager.userEmployeeId != '71597')) { //TODO: remove filter
    await mergeUserManager.execute(mapUserManager(userManager))
  }
  await unprepare(mergeUserManager)
  await removeUnmerged()

  await commit()
  await disconnect()
  exit(0)
}
catch(e) {
  log.error(e)
  await rollback()
  await disconnect()
  exit(1)
}
