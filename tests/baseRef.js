const {refreshState, setupHost, depositToCurrentPool,refreshAllBalances, withdrawAllBalances, getLiquidBalance, lazy_fetch_all_table_internal} = require("../common/core.js");

const network = "master"
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));


async function depositToTwoPools(eos, hostname){
  let tester = "tester"
  let balanses_ids = []
  
  let beforeTestContractBalance = await getLiquidBalance(eos, "unicore", process.env.CORE_TOKEN)
  
  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  await refreshState(eos, hostname)

  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  await refreshState(eos, hostname)

  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  await refreshState(eos, hostname)

  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  await refreshState(eos, hostname)

  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  await refreshState(eos, hostname)

  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  await refreshState(eos, hostname)

  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  await refreshState(eos, hostname)

  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  await refreshState(eos, hostname)

  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  await refreshState(eos, hostname)

  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  await refreshState(eos, hostname)


  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  await refreshState(eos, hostname)


  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  await refreshState(eos, hostname)


  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  await refreshState(eos, hostname)


  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  await refreshState(eos, hostname)


  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  await refreshState(eos, hostname)


  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  await refreshState(eos, hostname)


  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  await refreshState(eos, hostname)

  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  await refreshState(eos, hostname)

  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  await refreshState(eos, hostname)

  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  await refreshState(eos, hostname)

  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  await refreshState(eos, hostname)

  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  await refreshState(eos, hostname)

  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  await refreshState(eos, hostname)


  // let masterPool = await lazy_fetch_all_table_internal(eos.api, "unicore", hostname, "masterpool")
  // console.log("masterPool: ", masterPool)
  
  let pools = await lazy_fetch_all_table_internal(eos.api, "unicore", hostname, "pool")
  console.log("pools: ", pools)
  
  let balances = await lazy_fetch_all_table_internal(eos.api, "unicore", hostname, "balance4")
  console.log("before refresh balances: ", balances)

  await refreshAllBalances(eos, hostname, tester)
  
  balances = await lazy_fetch_all_table_internal(eos.api, "unicore", hostname, "balance4")
  console.log("balances after refresh: ", balances)
  
  // await withdrawAllBalances(eos, hostname, tester)
  
  pools = await lazy_fetch_all_table_internal(eos.api, "unicore", hostname, "pool")
  console.log("pools after withdraw: ", pools)
  let calculateTotalAvailableBal = 0

  balances.map(el => {
    calculateTotalAvailableBal += parseFloat(el.available)
  });


  let afterTestContractBalance = await getLiquidBalance(eos, "unicore", process.env.CORE_TOKEN)

  pools = await lazy_fetch_all_table_internal(eos.api, "unicore", hostname, "refbalances")


  console.log("TOTAL WIN AVAILABLE: ", calculateTotalAvailableBal);
  console.log("beforeTestContractBalance: ", beforeTestContractBalance)
  console.log("afterTestContractBalance: ", afterTestContractBalance)
}


async function base5RefTest(eos, hostname) {
  console.log("\nSTART BASE 5 REFERRAL TEST\n")
  let tester = "tester"
  let balanses_ids = []

  //DEPOSIT to 1 and 2
  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  //REFRESH ALL
  await refreshAllBalances(eos, tester)
  
  //WITHDRAW 1st
  await withdrawAllBalances(eos, tester, balanses_ids[0])
  
  //DEPOSIT TO 3
  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  //REFRESH ALL
  await refreshAllBalances(eos, tester)
  
  //WITHDRAW 2nd
  await withdrawAllBalances(eos, tester, balanses_ids[1])
  
  
  //DEPOSIT to 4
  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  //DEPOSIT to 5
  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  await refreshAllBalances(eos, tester)
  //WITHDRAW ALL
  await withdrawAllBalances(eos, tester)
  

  let sincomes = await lazy_fetch_all_table_internal(eos.api, "unicore", hostname, "sincome")
  
  let last_sincome = sincomes[sincomes.length - 1]

  let user_liqbal = await getLiquidBalance(eos, tester, process.env.CORE_TOKEN)
  let core_liqbal = await getLiquidBalance(eos, "unicore", process.env.CORE_TOKEN)
  
  console.log(`\tCORE LIQUID BAL: ${core_liqbal} >= MAX_SYSTEM INCOME: ${last_sincome.max}`)
  
  if (parseFloat(core_liqbal) >= parseFloat(last_sincome.max) ){
    console.log(`\tOK`)  
  } else console.log(`\tERROR! DISBALANCE DETECTED`)
  
  let part_rbalances = await lazy_fetch_all_table_internal(eos.api, "unicore", "part", "refbalances")
  
  part_rbalances = part_rbalances.filter(el => el.host == hostname)
  let total_part_rbalances = 0
  
  part_rbalances.map(el => total_part_rbalances += parseFloat(el.amount))
  total_part_rbalances = (total_part_rbalances).toFixed(4) + ` ` + process.env.CORE_TOKEN
  
  console.log(`${part_rbalances.length == 3 ? 'ok - ref balances count' : "ERROR - missing ref balance"}`)
  
  console.log(`\tPARTNER BALANCES: ${total_part_rbalances} <= LIQUID UNICORE ${core_liqbal}`)
    
  if (parseFloat(total_part_rbalances) <= parseFloat(core_liqbal)) {
    console.log(`\tOK`)
  } else {
    console.log(`\tERROR! DISBALANCE DETECTED`)
  }
  console.log("\nFINISH BASE REFERRAL TEST\n")
}



async function base3RefTest(eos, hostname) {
  console.log("\nSTART BASE 3 REFERRAL TEST\n")
  let tester = "tester"
  let balanses_ids = []

  //DEPOSIT to 2
  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  //REFRESH ALL
  await refreshAllBalances(eos, tester)
  
  //WITHDRAW 1st
  await withdrawAllBalances(eos, tester, balanses_ids[0])
  
  

  let sincomes = await lazy_fetch_all_table_internal(eos.api, "unicore", hostname, "sincome")
  
  let last_sincome = sincomes[sincomes.length - 1]

  let user_liqbal = await getLiquidBalance(eos, tester, process.env.CORE_TOKEN)
  let core_liqbal = await getLiquidBalance(eos, "unicore", process.env.CORE_TOKEN)
  
  console.log(`\tCORE LIQUID BAL: ${core_liqbal} >= MAX_SYSTEM INCOME: ${last_sincome.max}`)
  
  if (parseFloat(core_liqbal) >= parseFloat(last_sincome.max) ){
    console.log(`\tOK`)  
  } else console.log(`\tERROR! DISBALANCE DETECTED`)
  
  let part_rbalances = await lazy_fetch_all_table_internal(eos.api, "unicore", "part", "refbalances")
  
  part_rbalances = part_rbalances.filter(el => el.host == hostname)
  let total_part_rbalances = 0
  
  part_rbalances.map(el => total_part_rbalances += parseFloat(el.amount))
  total_part_rbalances = (total_part_rbalances).toFixed(4) + " " + process.env.CORE_TOKEN
  
  console.log(`${part_rbalances.length == 1 ? 'ok - ref balances count' : "ERROR - missing ref balance"}`)
  
  console.log(`\tPARTNER BALANCES: ${total_part_rbalances} <= LIQUID UNICORE ${core_liqbal}`)
    
  if (parseFloat(total_part_rbalances) <= parseFloat(core_liqbal)) {
    console.log(`\tOK`)
  } else {
    console.log(`\tERROR! DISBALANCE DETECTED`)
  }
  console.log("\nFINISH BASE REFERRAL TEST\n")
}




async function base4RefTest(eos, hostname) {
  console.log("\nSTART BASE 4 REFERRAL TEST\n")
  let tester = "tester"
  let balanses_ids = []

  //DEPOSIT to 1 and 2
  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  //REFRESH ALL
  await refreshAllBalances(eos, tester)
  
  //WITHDRAW 1st
  await withdrawAllBalances(eos, tester, balanses_ids[0])
  
  //DEPOSIT TO 3
  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  //REFRESH ALL
  await refreshAllBalances(eos, tester)
  
  //WITHDRAW 2nd
  await withdrawAllBalances(eos, tester, balanses_ids[1])
  
  
  // //DEPOSIT to 4
  // balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  await refreshAllBalances(eos, tester)
  //WITHDRAW ALL
  await withdrawAllBalances(eos, tester)

  let sincomes = await lazy_fetch_all_table_internal(eos.api, "unicore", hostname, "sincome")
  
  let last_sincome = sincomes[sincomes.length - 1]

  let user_liqbal = await getLiquidBalance(eos, tester, process.env.CORE_TOKEN)
  let core_liqbal = await getLiquidBalance(eos, "unicore", process.env.CORE_TOKEN)
  
  console.log(`\tCORE LIQUID BAL: ${core_liqbal} >= MAX_SYSTEM INCOME: ${last_sincome.max}`)
  
  if (parseFloat(core_liqbal) >= parseFloat(last_sincome.max) ){
    console.log(`\tOK`)  
  } else console.log(`\tERROR! DISBALANCE DETECTED`)
  
  let part_rbalances = await lazy_fetch_all_table_internal(eos.api, "unicore", "part", "refbalances")
  
  part_rbalances = part_rbalances.filter(el => el.host == hostname)
  let total_part_rbalances = 0
  
  part_rbalances.map(el => total_part_rbalances += parseFloat(el.amount))
  total_part_rbalances = (total_part_rbalances).toFixed(4) + " " + process.env.CORE_TOKEN
  
  console.log(`${part_rbalances.length == 2 ? 'ok - ref balances count' : "ERROR - missing ref balance"}`)
  
  console.log(`\tPARTNER BALANCES: ${total_part_rbalances} <= LIQUID UNICORE ${core_liqbal}`)
    
  if (parseFloat(total_part_rbalances) <= parseFloat(core_liqbal)) {
    console.log(`\tOK`)
  } else {
    console.log(`\tERROR! DISBALANCE DETECTED`)
  }
  console.log("\nFINISH BASE REFERRAL TEST\n")
}

async function manualRefreshAndWithdrawAll(eos, tester) {
  // await refreshAllBalances(eos, tester)
  await withdrawAllBalances(eos, tester)
  
}

async function base15RefTest(eos, hostname) {
  console.log("\nSTART BASE 15 REFERRAL TEST\n")
  let tester = "tester"
  let balanses_ids = []

  //DEPOSIT to 2
  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  //REFRESH ALL
  await refreshAllBalances(eos, tester)
  
  //WITHDRAW 1st
  await withdrawAllBalances(eos, tester, balanses_ids[0])
  
  //DEPOSIT TO 3
  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  //REFRESH ALL
  await refreshAllBalances(eos, tester)
  
  //WITHDRAW 2nd
  await withdrawAllBalances(eos, tester, balanses_ids[1])
  
  
  //DEPOSIT to 10
  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  

  await refreshAllBalances(eos, tester)
  //WITHDRAW ALL
  await withdrawAllBalances(eos, tester)
  

  let sincomes = await lazy_fetch_all_table_internal(eos.api, "unicore", hostname, "sincome")
  
  let last_sincome = sincomes[sincomes.length - 1]

  let user_liqbal = await getLiquidBalance(eos, tester, process.env.CORE_TOKEN)
  let core_liqbal = await getLiquidBalance(eos, "unicore", process.env.CORE_TOKEN)
  
  console.log(`\tCORE LIQUID BAL: ${core_liqbal} >= MAX_SYSTEM INCOME: ${last_sincome.max}`)
  
  if (parseFloat(core_liqbal) >= parseFloat(last_sincome.max) ){
    console.log(`\tOK`)  
  } else console.log(`\tERROR! DISBALANCE DETECTED`)
  
  let part_rbalances = await lazy_fetch_all_table_internal(eos.api, "unicore", "part", "refbalances")
  
  part_rbalances = part_rbalances.filter(el => el.host == hostname)
  let total_part_rbalances = 0
  
  part_rbalances.map(el => total_part_rbalances += parseFloat(el.amount))
  total_part_rbalances = (total_part_rbalances).toFixed(4) + " " + process.env.CORE_TOKEN
  
  console.log(`${part_rbalances.length == 6 ? 'ok - ref balances count' : "ERROR - missing ref balance"}`)
  
  console.log(`\tPARTNER BALANCES: ${total_part_rbalances} (${part_rbalances.length}) <= LIQUID UNICORE ${core_liqbal}`)
    
  if (parseFloat(total_part_rbalances) <= parseFloat(core_liqbal)) {
    console.log(`\tOK`)
  } else {
    console.log(`\tERROR! DISBALANCE DETECTED`)
  }
  console.log("\nFINISH BASE REFERRAL TEST\n")
}



module.exports = {depositToTwoPools, base5RefTest, base3RefTest, base4RefTest, base15RefTest, manualRefreshAndWithdrawAll}