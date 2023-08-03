const {setupHost, 
  depositToCurrentPool,
  refreshAllBalances, 
  withdrawAllBalances, 
  getLiquidBalance, 
  lazy_fetch_all_table_internal, 
  setGoal,
  addAuCycle,
  enablePowerMarket,
  createAuction,
  setTask,
  voteForGoal,
  setReport,
  approveReport,
  setGoalReport,
  checkGoalReport,
  laborRefresh,
  laborWithdraw,
  voteForReport,
  distributeReport,
  withdrawReport
} = require("../common/core.js");

const {transfer_token} = require("../common/tokens.js")

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const network = "master"

async function distributionTest(eos, hostname) {
  console.log("\nSTART AUCTION DISTRIBUTION TEST\n")
  let tester = "tester"
  


  await addAuCycle(eos, hostname, {
    host: hostname,
    start_at: "2022-06-15T07:19:47",
    finish_at: "2100-01-01T00:00:00",
    period_sec: 3,
  })

  await setGoal(eos, hostname, {
      creator: hostname,
      host: hostname,
      parent_id: 0,
      title: "TITLE",
      description: "DESCRIPTION",
      target: "0.0000 FLOWER",
      meta: JSON.stringify({})
  })

  await setGoal(eos, hostname, {
      creator: hostname,
      host: hostname,
      parent_id: 0,
      title: "TITLE",
      description: "DESCRIPTION",
      target: "0.0000 FLOWER",
      meta: JSON.stringify({})
  })


  await voteForGoal(eos, "tester1", hostname, 1)
  await voteForGoal(eos, "tester2", hostname, 1)

  await voteForGoal(eos, "tester1", hostname, 2)


  await setTask(eos, hostname, {
    host: hostname,
    creator: hostname,
    permlink: "permlink",
    goal_id: 1,
    priority: 10,
    title: "FIRST TASK",
    data: "REPORT IS",
    requested: "0.0000 FLOWER",
    is_public: true,
    doer: "",
    for_each: "0.0000 FLOWER",
    with_badge: false,
    badge_id: 0,
    duration: 86400,
    is_batch: false,
    parent_batch_id: 0,
    is_regular: false,
    calendar: [],
    start_at: "2022-06-15T00:00:00",
    expired_at: "2100-06-15T00:00:00",
    meta: "{}"
  })


  await setTask(eos, hostname, {
    host: hostname,
    creator: hostname,
    permlink: "permlink",
    goal_id: 2,
    priority: 1,
    title: "FIRST TASK",
    data: "REPORT IS",
    requested: "0.0000 FLOWER",
    is_public: true,
    doer: "",
    for_each: "0.0000 FLOWER",
    with_badge: false,
    badge_id: 0,
    duration: 86400,
    is_batch: false,
    parent_batch_id: 0,
    is_regular: false,
    calendar: [],
    start_at: "2022-06-15T00:00:00",
    expired_at: "2100-06-15T00:00:00",
    meta: "{}"
  })


  await setReport(eos, "tester1", hostname, {
    host: hostname, 
    username: "tester1",
    task_id: 1,
    data: "test report"
  })


  await setReport(eos, "tester2", hostname, {
    host: hostname, 
    username: "tester2",
    task_id: 1,
    data: "test report"
  })

  await approveReport(eos, hostname, {
    host: hostname, 
    report_id: 1,
    comment: ""
  })

  await approveReport(eos, hostname, {
    host: hostname, 
    report_id: 2,
    comment: ""
  })



  await setGoalReport(eos, hostname, {
    username: hostname,
    host: hostname, 
    goal_id: 1,
    report: "Goal is Achieved!"
  })

  //Следующее окно для активации рынка
  let result1 = await transfer_token(eos, "eosio.token", "tester1", "auction", "1.0000 FLOWER", `${hostname}`)
  
  console.log(`ok -> deposit to auction from tester1 -> ${result1.message}`)
    

  await checkGoalReport(eos, hostname, {
    architect: hostname,
    host: hostname, 
    goal_id: 1,
  })

  await sleep(5000)

  //Следующее окно для активации распределения на предыдущее окно
  let result2 = await transfer_token(eos, "eosio.token", "tester1", "auction", "1.0000 FLOWER", `${hostname}`)
  
  console.log(`ok -> deposit to auction from tester1 -> ${result2.message}`)
  


  await laborRefresh(eos, hostname, hostname, {
    owner: hostname, 
    host: hostname,
    id: 1
  })

  await laborWithdraw(eos, hostname, hostname, {
    owner: hostname, 
    host: hostname,
    id: 1
  })


  await voteForReport(eos, "tester1", hostname, 1)
  await voteForReport(eos, "tester2", hostname, 3)
  await voteForReport(eos, "tester1", hostname, 2)

  await sleep(1000)

  await distributeReport(eos, "tester1", hostname, 1)
  await distributeReport(eos, "tester2", hostname, 2)
  await distributeReport(eos, "tester3", hostname, 3)


  console.log("\nFINISH DISTRIBUTION TEST\n")
}





module.exports = {distributionTest}