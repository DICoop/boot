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
  withrawAu,

} = require("../common/core.js");

const {transfer_token} = require("../common/tokens.js")

const network = "master"

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function AuctionTest(eos, hostname) {
  console.log("\nSTART AUCTION DISTRIBUTION TEST\n")
  let tester = "tester"
  

  await enablePowerMarket(eos, hostname)


  await createAuction(eos, hostname, {
    host: hostname,
    contract: "eosio.token",
    token: `0.0000 ${process.env.CORE_TOKEN}`,
    total_shares: 1000000,
    period_duration: 3,
    shares_on_period: 1000,
    start_at: "2022-06-15T00:00:00",
    meta: "{}"
  })


  // await addAuCycle(eos, hostname, {
  //   host: hostname,
  //   start_at: "2022-06-15T07:19:47",
  //   finish_at: "2100-01-01T00:00:00",
  //   period_sec: 60,
  // })
  
  let result1 = await transfer_token(eos, "eosio.token", "tester1", "auction", `1.0000 ${process.env.CORE_TOKEN}`, `${hostname}`)
  
  console.log(`ok -> deposit to auction from tester1 -> ${result1.message}`)
      
  // console.log(`${result.status} -> deposit to ${pool.pool_num} pool | ${pool.cycle_num} cycle of ${hostname} -> ${amount} -> ${result.message}`)
  console.log("sleep 5s")
  await sleep(5000)
  
  let result2 = await transfer_token(eos, "eosio.token", "tester2", "auction", `1.0000 ${process.env.CORE_TOKEN}`, `${hostname}`)
  console.log(`ok -> deposit to auction from tester2 ->  ${result2.message}`)

  console.log("sleep 5s")
  await sleep(5000)
  
  await withrawAu(eos, "tester1", hostname, 0)
  await withrawAu(eos, "tester2", hostname, 1)

  let user_powers = await lazy_fetch_all_table_internal(eos.api, "unicore", hostname, "power3")
  let tester1_power = user_powers.find(el => el.username == "tester1")
  console.log(`${tester1_power.power === 1000 ? 'ok': 'error'} -> tester1 power is ${tester1_power.power}`)
  
  let tester2_power = user_powers.find(el => el.username == "tester2")
  console.log(`${tester2_power.power === 1000 ? 'ok': 'error'} -> tester2 power is ${tester2_power.power}`)
  
  //TODO
  /*

    Поучаствовать в аукционе несколькими аккаунтами
  */

  console.log("\nFINISH AUCTION TEST\n")
}





module.exports = {AuctionTest}