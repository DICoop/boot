const {setupHost, depositToCurrentPool,refreshAllBalances, withdrawAllBalances, getLiquidBalance, lazy_fetch_all_table_internal, setGoal} = require("../common/core.js");

const network = "master"

async function goalTest(eos, hostname) {
  console.log("\nSTART GOALS TEST\n")
  let tester = "tester"
  let balanses_ids = []


  var goal = {
      creator: "tester",
      host: hostname,
      parent_id: 0,
      title: "TITLE",
      description: "DESCRIPTION",
      target: "0.0000 FLOWER",
      meta: JSON.stringify({})
  }

  await setGoal(eos, hostname, goal)
  
  //DEPOSIT to 1 and 2
  // balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  // balanses_ids.push(await depositToCurrentPool(eos, tester, hostname, 100))
  
  console.log("\nFINISH GOALS TEST\n")
}





module.exports = {goalTest}