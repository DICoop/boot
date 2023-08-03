const fs = require('fs');
const {Serialize} = require(`eosjs`)

var {get_config, get_hosts} = require("./config.js");   
const {transfer_token} = require("./tokens")


async function setupHost(eos, network, target_username, source_username) {
  return new Promise(async (resolve, reject) => {
    
    let hosts = await get_hosts(network)
    
    let source_host = hosts.find(el => el.username === source_username)

    
    let upgrade_res = await upgradeHost(eos, target_username, source_host, network)
    console.log(`${upgrade_res.status} ->  UPGRADE: ${target_username} -> ${upgrade_res.message}`)
    
    let settype_res = await setTypeHost(eos, target_username, source_host, network)
    console.log(`${settype_res.status} ->  SET TYPE: ${target_username} -> ${settype_res.message}`)
    

    let setparams_res = await setParamsToHost(eos, target_username, source_host, network)
    console.log(`${setparams_res.status} ->  SET PARAMS: ${target_username} -> ${setparams_res.message}`)
  

    if (source_host.sale_is_enabled){
        
        let enablesale_res = await enableSale(eos, target_username, source_host, network)
        console.log(`ENABLE SALE: ${target_username} -> ${enablesale_res.status} -> ${enablesale_res.message}`)
        
    }
    
    resolve()
    
    })


}

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function setupGoals(eos, network) {
  return new Promise(async (resolve, reject) => {
    
    var hosts = await get_hosts(network)

    Promise.all(
      await hosts.map(async host => {
        Promise.all(
          await host.goals.map(async (goal, index) => {
            return new Promise(async (resolve2, reject2) => {

              try {
                // console.log("should set goal", goal)
                // goal.result = "should set goal"
                await sleep(0.5 * index * 1000)

                goal.result = await setGoal(eos, host, goal, network)
                resolve2()
              } catch(e) {
                goal.result = e.message
                resolve2()
              }              
            })                        
          })
        ).then(() => {
          resolve(hosts) 
        })

      })).then(res => {
         
    }).catch(e => reject(e))
  })

}


async function depositToCurrentPool(eos, username, hostname, percents) {
  return new Promise(async (resolve, reject) => {

      let hosts = await eos.api.getTableRows({ json: true, code: "unicore", scope: "unicore", table: 'hosts', upper_bound: hostname, lower_bound: hostname, limit: 1});
      let host = hosts.rows[0]
      
      let pools = await eos.api.getTableRows({ json: true, code: "unicore", scope: hostname, table: 'pool', upper_bound: host.current_pool_id, lower_bound: host.current_pool_id, limit: 1});
      let pool = pools.rows[0]
      
      let amount = (parseFloat(pool.remain) * percents / 100).toFixed(4) + " " + process.env.CORE_TOKEN

      let result = await transfer_token(eos, host.root_token_contract, username, "unicore", amount, `100-${hostname}`)
      

      console.log(`${result.status} -> deposit to ${pool.pool_num} pool | ${pool.cycle_num} cycle of ${hostname} -> ${amount} -> ${result.message}`)
      console.log(`\t CONSOLE: ${result.console}\n`)
      resolve(result.balance_id)
  })  

}


async function getLiquidBalance(eos, username, symbol){
  let liquid_bal = await eos.api.getCurrencyBalance("eosio.token", username, symbol); 
  
  if (liquid_bal.length === 0)
    liquid_bal = parseFloat(0).toFixed(4) + ' ' + symbol
  else liquid_bal = liquid_bal[0]

  return liquid_bal
}


async function refreshAllBalances(eos, hostname, username) {
  
      // let balances = await eos.api.getTableRows({ json: true, code: "unicore", scope: username, table: 'balance'});
      let balances = await lazy_fetch_all_table_internal(eos.api, "unicore", hostname, "balance4")

      for (balance of balances) {
        try {
          balance.result = await eos.transact({ 
              actions: [
              {
                account: 'unicore',
                name: 'refreshbal',
                authorization: [{
                  actor: username,
                  permission: 'active',
                }],
                data: {
                  username: username,
                  host: hostname,
                  balance_id: balance.id,
                  partrefresh: 50,
                }
              }]
            }, {
              blocksBehind: 3,
              expireSeconds: 30,
            })
        let cons = ""
        try {

          cons = balance.result.processed.action_traces[0].console

        } catch(e){}
        console.log(`ok -> refresh balance ${balance.id} of ${username} | ${balance.host}`)
        console.log(`\t CONSOLE: ${cons}\n`)

      } catch(e){

        console.log(`error -> refresh balance ${balance.id} of ${username} | ${balance.host} -> ${e.message}`)
      
      }
          
      }
    return

}



async function withdrawAllBalances(eos, hostname, username, bal_id) {
  

      // let balances = await eos.api.getTableRows({ json: true, code: "unicore", scope: username, table: 'balance'});
      let balances = await lazy_fetch_all_table_internal(eos.api, "unicore", hostname, "balance4")

      
      if (bal_id != undefined)
        balances = balances.filter(el => Number(el.id) === Number(bal_id))

      for (balance of balances) {
        try {
          balance.result = await eos.transact({ 
              actions: [
              {
                account: 'unicore',
                name: 'withdraw',
                authorization: [{
                  actor: username,
                  permission: 'active',
                }],
                data: {
                  username: username,
                  balance_id: balance.id,
                  host: hostname
                }
              }]
            }, {
              blocksBehind: 3,
              expireSeconds: 30,
            })
        console.log(`ok -> withdraw balance ${balance.id} of ${username} | ${hostname}`)
        try {
          
          cons = balance.result.processed.action_traces[0].console

        } catch(e){}
  
          console.log(`\t CONSOLE: ${cons}\n`)

      } catch(e){

        console.log(`error -> withdraw balance ${balance.id} of ${username} | ${hostname} -> ${e.message}`)
      
      }
          
      }
      
      return

}



async function setGoal(eos, host, goal) {

  
  try{

    let res = await eos.transact({ 
      actions: [
      {
        account: "unicore",
        name: 'setgoal',
        authorization: [{
          actor: goal.creator,
          permission: 'active',
        }],
        data: goal
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30,
    })
    
    console.log(`ok -> set goal ${goal.title} -> ${res.transaction_id}`)
  } catch(e) {
    console.log(`error -> set goal ${goal.title} -> ${e.message}`)
  } 
}



async function refreshState(eos, host) {

  
  try{

    let res = await eos.transact({ 
      actions: [
      {
        account: "unicore",
        name: 'refreshst',
        authorization: [{
          actor: host,
          permission: 'active',
        }],
        data: {
          username: host,
          host: host,
        }
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30,
    })
    
    console.log(`ok -> refrest State: ${host} -> ${res.transaction_id}`)
  } catch(e) {
    console.log(`error -> refrest State: ${host} -> ${e.message}`)
  } 
}



async function pair(eos, base_host, quote_host) {

  
  try{

    let res = await eos.transact({ 
      actions: [
      {
        account: "unicore",
        name: 'pair',
        authorization: [{
          actor: base_host,
          permission: 'active',
        }],
        data: {
          base_host,
          quote_host
        }
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30,
    })
    
    console.log(`ok -> pair base_host ${base_host} quote_host ${quote_host} -> ${res.transaction_id}`)
  } catch(e) {
    console.log(`error -> pair base_host ${base_host} quote_host ${quote_host} -> ${e.message}`)
  } 
}



async function addAuCycle(eos, host, cycle) {

  
  try{

    let res = await eos.transact({ 
      actions: [
      {
        account: "auction",
        name: 'addlbrcycle',
        authorization: [{
          actor: cycle.host,
          permission: 'active',
        }],
        data: cycle
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30,
    })
    
    console.log(`ok -> add auction cycle ${host} -> ${res.transaction_id}`)
  } catch(e) {
    console.log(`error -> add auction cycle ${host} -> ${e.message}`)
  } 
}


async function laborRefresh(eos, host, username, labor) {

  
  try{

    let res = await eos.transact({ 
      actions: [
      {
        account: "auction",
        name: 'lbrrefresh',
        authorization: [{
          actor: username,
          permission: 'active',
        }],
        data: labor
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30,
    })
    
    console.log(`ok -> labor refresh ${labor.id} -> ${res.transaction_id}`)
  } catch(e) {
    console.log(`error -> labor refresh ${labor.id} -> ${e.message}`)
  } 
}



async function laborWithdraw(eos, host, username, labor) {

  
  try{

    let res = await eos.transact({ 
      actions: [
      {
        account: "auction",
        name: 'lbrwithdraw',
        authorization: [{
          actor: username,
          permission: 'active',
        }],
        data: labor
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30,
    })
    
    console.log(`ok -> labor withdraw ${labor.id} -> ${res.transaction_id}`)
  } catch(e) {
    console.log(`error -> labor withdraw ${labor.id} -> ${e.message}`)
  } 
}


async function createAuction(eos, host, auction){
    try{
     
    let res = await eos.transact({ 
      actions: [
      {
        account: "auction",
        name: 'create',
        authorization: [{
          actor: host,
          permission: 'active',
        }],
        data: auction
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30,
    })
    
    console.log(`ok -> create auction ${host} -> ${res.transaction_id}`)
  } catch(e) {
    console.log(`error -> create auction ${host} -> ${e.message}`)
  } 
  //cleos push action auction create '[core, eosio.token, "0.0000 FLOWER", 1000000, 60, 1000, "2022-06-10T11:25:00", ""]' -p core 
  //cleos push action unicore enpmarket '[core]' -p core  
}


async function enablePowerMarket(eos, host){
    try{
     
    let res = await eos.transact({ 
      actions: [
      {
        account: "unicore",
        name: 'enpmarket',
        authorization: [{
          actor: host,
          permission: 'active',
        }],
        data: {
          host
        }
      }]
    }, {
      blocksBehind: 3,
      expireSeconds: 30,
    })
    
    console.log(`ok -> enable power market for ${host} -> ${res.transaction_id}`)
  } catch(e) {
    console.log(`error -> enable power market for ${host} -> ${e.message}`)
  } 
  //cleos push action auction create '[core, eosio.token, "0.0000 FLOWER", 1000000, 60, 1000, "2022-06-10T11:25:00", ""]' -p core 
  //cleos push action unicore enpmarket '[core]' -p core  
}



async function setTask(eos, host, task) {

  try{
  
    let res = await eos.transact({ 
        actions: [
        {
          account: "unicore",
          name: 'settask',
          authorization: [{
            actor: host,
            permission: 'active',
          }],
          data: task
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      })

    console.log(`ok -> set task ${task.title} -> ${res.transaction_id}`)
  } catch(e){
    console.log(`error -> set task ${task.title} -> ${e.message}`)
  }

        
        
  
}



async function withrawAu(eos, username, host, period_id) {

  try{
  
    let res = await eos.transact({ 
        actions: [
        {
          account: "auction",
          name: 'withdraw',
          authorization: [{
            actor: username,
            permission: 'active',
          }],
          data: {
            username,
            host,
            period_id
          }
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      })

    console.log(`ok -> withdraw from auction for ${username} -> ${res.transaction_id}`)
  } catch(e){
    console.log(`error -> withdraw from auction for ${username} -> ${e.message}`)
  }

}


async function setReport(eos, reporter, host, report) {

  try{
  
    let res = await eos.transact({ 
        actions: [
        {
          account: "unicore",
          name: 'setreport',
          authorization: [{
            actor: reporter,
            permission: 'active',
          }],
          data: report
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      })

    console.log(`ok -> report from ${reporter} for task ${report.task_id} -> ${res.transaction_id}`)
  } catch(e){
    console.log(`error -> report from ${reporter} for task ${report.task_id} -> ${e.message}`)
  }

}



async function approveReport(eos, host, report) {

  try{
  
    let res = await eos.transact({ 
        actions: [
        {
          account: "unicore",
          name: 'approver',
          authorization: [{
            actor: host,
            permission: 'active',
          }],
          data: report
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      })

    console.log(`ok -> approve report ${report.report_id} -> ${res.transaction_id}`)
  } catch(e){
    console.log(`error -> approve report ${report.report_id} -> ${e.message}`)
  }

}




async function setGoalReport(eos, host, report) {

  try{
  
    let res = await eos.transact({ 
        actions: [
        {
          account: "unicore",
          name: 'report',
          authorization: [{
            actor: host,
            permission: 'active',
          }],
          data: report
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      })

    console.log(`ok -> create goal report ${report.goal_id} -> ${res.transaction_id}`)
  } catch(e){
    console.log(`error -> create goal report ${report.goal_id} -> ${e.message}`)
  }

}



async function checkGoalReport(eos, host, report) {

  try{
  
    let res = await eos.transact({ 
        actions: [
        {
          account: "unicore",
          name: 'check',
          authorization: [{
            actor: host,
            permission: 'active',
          }],
          data: report
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      })

    console.log(`ok -> check goal report ${report.goal_id} -> ${res.transaction_id}`)
  } catch(e){
    console.log(`error -> check goal report ${report.goal_id} -> ${e.message}`)
  }

}


async function voteForGoal(eos, voter, host, goal_id) {

  try{
  
    let res = await eos.transact({ 
        actions: [
        {
          account: "unicore",
          name: 'vote',
          authorization: [{
            actor: voter,
            permission: 'active',
          }],
          data: {
            voter,
            host,
            goal_id,
            up: true
          }
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      })

    console.log(`ok -> voting from ${voter} for goal ${goal_id} -> ${res.transaction_id}`)
  } catch(e){
    console.log(`error -> voting from ${voter} for goal ${goal_id} -> ${e.message}`)
  }

}



async function voteForReport(eos, voter, host, report_id) {

  try{
  
    let res = await eos.transact({ 
        actions: [
        {
          account: "unicore",
          name: 'rvote',
          authorization: [{
            actor: voter,
            permission: 'active',
          }],
          data: {
            voter,
            host,
            report_id,
            up: true
          }
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      })

    console.log(`ok -> voting from ${voter} for report ${report_id} -> ${res.transaction_id}`)
  } catch(e){
    console.log(`error -> voting from ${voter} for report ${report_id} -> ${e.message}`)
  }

}




async function distributeReport(eos, username, host, report_id) {

  try{
  
    let res = await eos.transact({ 
        actions: [
        {
          account: "unicore",
          name: 'distrepo',
          authorization: [{
            actor: username,
            permission: 'active',
          }],
          data: {
            username,
            host,
            report_id,
          }
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      })

    console.log(`ok -> distribute report ${username} for id: ${report_id} -> ${res.transaction_id}`)
  } catch(e){
    console.log(`error -> distribute report ${username} for id: ${report_id} -> ${e.message}`)
  }

}


async function withdrawReport(eos, username, host, report_id) {

  try{
  
    let res = await eos.transact({ 
        actions: [
        {
          account: "unicore",
          name: 'withdrawrepo',
          authorization: [{
            actor: username,
            permission: 'active',
          }],
          data: {
            username,
            host,
            report_id,
          }
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      })

    console.log(`ok -> withdraw report ${username} for id: ${report_id} -> ${res.transaction_id}`)
  } catch(e){
    console.log(`error -> withdraw report ${username} for id: ${report_id} -> ${e.message}`)
  }

}


async function setupTasks(eos, network) {
  // return new Promise(async (resolve, reject) => {
    
  //   var hosts = await get_hosts(network)

  //   Promise.all(
  //     await hosts.map(async host => {
  //       Promise.all(
  //         await host.tasks.map(async (task, index) => {
  //           return new Promise(async (resolve2, reject2) => {

  //             try {
  //               console.log("should set goal", task)
  //               // goal.result = "should set goal"
  //               await sleep(0.5 * index * 1000)

  //               task.result = await setTask(eos, host, task)
  //               resolve2()
  //             } catch(e) {
  //               task.result = e.message
  //               resolve2()
  //             }              
  //           })                        
  //         })
  //       ).then(() => {
  //         resolve(hosts) 
  //       })

  //     })).then(res => {
         
  //   }).catch(e => reject(e))
  // })

}




async function upgradeHost(eos, target_host, host, network) {

    return new Promise(async (resolve, reject) => {

        let data = {
          username: target_host,
          platform: target_host,
          title: host.title,
          purpose: host.purpose,
          total_shares: host.total_shares,
          quote_amount: host.quote_amount,
          root_token: host.root_token,
          root_token_contract: host.root_token_contract,
          consensus_percent: host.consensus_percent,
          gtop: host.gtop,
          emission_percent:host.emission_percent,
          referral_percent: host.referral_percent,
          dacs_percent: host.dacs_percent,
          cfund_percent: host.cfund_percent,
          hfund_percent: host.hfund_percent,
          quote_token_contract: host.quote_token_contract,
          voting_only_up: host.voting_only_up,
          levels: host.levels,
          meta: host.meta
        }

        data.meta = JSON.stringify(data.meta)


        console.log("data,", data)
        eos.transact({ 
          actions: [
          {
            account: host.core_contract,
            name: 'upgrade',
            authorization: [{
              actor: target_host,
              permission: 'active',
            }],
            data: data
          }]
        }, {
          blocksBehind: 3,
          expireSeconds: 30,
        }).then(res => {
          // console.log("setContract", res)
          resolve({status: 'ok', message: res.transaction_id})
        }).catch(e => {
          // console.log(e.message)
          resolve({status: 'error', message: e.message})
        })
  })
}


async function setParamsToHost(eos, target_host, host, network) {

    return new Promise(async (resolve, reject) => {

        let data = {
          host: target_host,
          chost: target_host,
          size_of_pool: host.spiral.size_of_pool,
          overlap: host.spiral.overlap,
          profit_growth: host.spiral.profit_growth, 
          base_rate: host.spiral.base_rate,
          loss_percent: host.spiral.loss_percent,
          compensator_percent: host.spiral2.compensator_percent,
          pool_limit: host.spiral.pool_limit,
          pool_timeout: host.spiral.pool_timeout,
          priority_seconds: host.spiral.priority_seconds,
          quants_precision: host.quants_precision
        }

        
        eos.transact({ 
          actions: [
          {
            account: host.core_contract,
            name: 'setparams',
            authorization: [{
              actor: target_host,
              permission: 'active',
            }],
            data: data
          }]
        }, {
          blocksBehind: 3,
          expireSeconds: 30,
        }).then(res => {
          // console.log("setContract", res)
          resolve({status: 'ok', message: res.transaction_id})
        }).catch(e => {
          // console.log(e.message)
          resolve({status: 'error', message: e.message})
        })
  })
}


async function setTypeHost(eos, target_host, host, network) {
    // let hosts = await get_hosts(network)
    
    // let host = hosts.find(el => el.username === source_host)


    return new Promise(async (resolve, reject) => {

        eos.transact({ 
          actions: [
          {
            account: host.core_contract,
            name: 'changemode',
            authorization: [{
              actor: target_host,
              permission: 'active',
            }],
            data: {
              host: target_host,
              mode: host.type
            }
          }]
        }, {
          blocksBehind: 3,
          expireSeconds: 30,
        }).then(res => {
          // console.log("setContract", res)
          resolve({status: 'ok', message: res.transaction_id})
        }).catch(e => {
          // console.log(e.message)
          resolve({status: 'error', message: e.message})
        })
  })
}


async function startHost(eos, target_host, source_host, network) {
    let hosts = await get_hosts(network)
    
    let host = hosts.find(el => el.username === source_host)

    return new Promise(async (resolve, reject) => {

        eos.transact({ 
          actions: [
          {
            account: host.core_contract,
            name: 'start',
            authorization: [{
              actor: target_host,
              permission: 'active',
            }],
            data: {
              host: target_host,
              chost: target_host
            }
          }]
        }, {
          blocksBehind: 3,
          expireSeconds: 30,
        }).then(res => {
          // console.log("setContract", res)
          resolve({status: 'ok', message: res.transaction_id})
        }).catch(e => {
          // console.log(e.message)
          resolve({status: 'error', message: e.message})
        })
  })
}

async function setP2PDistributionRate(eos, p2p_contract, target, rate) {
  return new Promise(async (resolve, reject) => {

        eos.transact({ 
          actions: [
          {
            account: p2p_contract,
            name: 'setdistrrate',
            authorization: [{
              actor: target,
              permission: 'active',
            }],
            data: {
              host: target,
              distribution_rate: rate, 
              partner_host: target
            }
          }]
        }, {
          blocksBehind: 3,
          expireSeconds: 30,
        }).then(res => {
          // console.log("setContract", res)
          resolve({status: 'ok', message: res.transaction_id})
        }).catch(e => {
          // console.log(e.message)
          resolve({status: 'error', message: e.message})
        })
  })


}





async function addFund(eos, p2p_contract, target, data) {
  return new Promise(async (resolve, reject) => {
      eos.transact({ 
        actions: [
        {
          account: p2p_contract,
          name: 'addfund',
          authorization: [{
            actor: target,
            permission: 'active',
          }],
          data 
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      }).then(res => {
        // console.log("issue_token", res)
        resolve({status: 'ok', message: res.transaction_id})
      }).catch(e => {
        // console.log(e.message)
        resolve({status: 'error', message: e.message})
      })
  })
}




async function addDac(eos, p2p_contract, target, data) {
  return new Promise(async (resolve, reject) => {
      eos.transact({ 
        actions: [
        {
          account: p2p_contract,
          name: 'adddac',
          authorization: [{
            actor: target,
            permission: 'active',
          }],
          data: data
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      }).then(res => {
        // console.log("issue_token", res)
        resolve({status: 'ok', message: res.transaction_id})
      }).catch(e => {
        // console.log(e.message)
        resolve({status: 'error', message: e.message})
      })
  })
}



async function setFunds(eos, target_host, source_host, network) {
    let hosts = await get_hosts(network)
    
    let host = hosts.find(el => el.username === source_host)
    console.log("host: ", host)
    let config = await get_config(network)



    let coreTokenUSDTRate = config.p2p.coreUsdRate

    let p2pDistributionRate = config.p2p.distributionRate

    let res1 = await setP2Prate(eos, "p2p", "eosio.token", `0.0000 ${process.env.CORE_TOKEN}`, coreTokenUSDTRate)
    console.log(`${res1.status} ->  P2P rate for ${process.env.CORE_TOKEN} is set: ${res1.message}`)

    let res2 = await setP2Prate(eos, "p2p", "", "0.0000 USDT", 1)
    console.log(`${res2.status} ->  P2P rate for USDT is set: ${res2.message}`)


    //TODO enable growth from config
    let res0 = await activateP2P(eos, "p2p", true, 'linear', coreTokenUSDTRate, 10, false, 78085000, "2020-01-01T00:00:00", 100000, 'flexible')
  
    console.log(`${res0.status} -> P2P contract is activated -> ${res0.message}`)


    let res25 = await transfer_token(eos, config.p2p.distributionContract, "alfatest", "p2p", config.p2p.onDistribution, `${target_host}`)
    console.log(`${res25.status} ->  Transfer for distribution: ${config.p2p.onDistribution} -> ${res25.message}`)
  

    // X установка курса распределения в p2p
    let res3 = await setP2PDistributionRate(eos, "p2p", target_host, p2pDistributionRate)
    console.log(`${res3.status} ->  Distribution rate for SYS is set: ${res3.message}`)

    // //цикл FOR
    for (fund of config.p2p.funds){
      let res4 = await addFund(eos, "p2p", target_host, {
        owner: target_host,
        title: fund.title,
        type: fund.type,
        weight: fund.weight,
        transfer_to: fund.transfer_to,
        transfer_memo: fund.transfer_memo
      })
      console.log(`${res4.status} ->  Fund ${fund.title} is set: ${res4.message}`)

    }
    
    //цикл FOR по DACS    
    
    for (dac of config.dacs){
      let res4 = await addDac(eos, "unicore", target_host, {
        host: target_host,
        username: dac.username,
        weight: dac.weight,
        title: dac.title,
        description: dac.description,
        vested: dac.vested,
        vesting_seconds: dac.vesting_seconds,
        cliff_seconds: dac.cliff_seconds
      })

      console.log(`${res4.status} ->  Fund ${dac.username} is set: ${res4.message}`)

    }
    


}


async function enableSale(eos, target_host, host, network) {

    return new Promise(async (resolve, reject) => {
        let data = {
              host: target_host,
              mode: host.sale_mode,
              contract: host.sale_contract,
              asset_for_sale: host.asset_for_sale
            }

        console.log(data)
        eos.transact({ 
          actions: [
          {
            account: host.core_contract,
            name: 'enablesale',
            authorization: [{
              actor: target_host,
              permission: 'active',
            }],
            data: data
          }]
        }, {
          blocksBehind: 3,
          expireSeconds: 30,
        }).then(res => {
          // console.log("setContract", res)
          resolve({status: 'ok', message: res.transaction_id})
        }).catch(e => {
          // console.log(e.message)
          resolve({status: 'error', message: e.message})
        })
  })
}


async function lazy_fetch_all_table_internal(api, code, scope, table, lower_bound, upper_bound, limit, index_position, key_type){
      
      if (!limit) limit = 100
      if (!lower_bound) lower_bound = 0
    
      let data = await api.getTableRows({json: true, code: code, scope: scope, table: table, lower_bound: lower_bound, upper_bound: upper_bound, limit: limit, index_position: index_position, key_type: key_type})
      let result = data.rows
      
      if (data.more === true) {
        
        let redata = await lazy_fetch_all_table_internal(api, code, scope, table, data.next_key, upper_bound, limit, index_position, key_type)
        result = [...result, ...redata]
        return result
      
      } else {
      
        return result
        
      }
}



async function initCoreContract(eos, core_contract, core_system_percent, operator_system_percent) {
  // console.log("core_token", core_token)
  return new Promise(async (resolve, reject) => {
      eos.transact({ 
        actions: [
        {
          account: core_contract,
          name: 'init',
          authorization: [{
            actor: core_contract,
            permission: 'active',
          }],
          data: {
            system_income: core_system_percent * 10000,
            operator_income: operator_system_percent * 10000,
          }
        }
        ]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      }).then(res => {
        // console.log("issue_token", res)
        resolve({status: 'ok', message: res.transaction_id})
      }).catch(e => {
        // console.log(e.message)
        resolve({status: 'error', message: e.message})
      })
  })
}




async function setP2Prate(eos, p2p_contract, out_contract, out_asset, rate) {
  return new Promise(async (resolve, reject) => {
      eos.transact({ 
        actions: [
        {
          account: p2p_contract,
          name: 'setrate',
          authorization: [{
            actor: p2p_contract,
            permission: 'active',
          }],
          data: {
            out_contract: out_contract,
            out_asset: out_asset, 
            rate: rate
          }
        }
        ]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      }).then(res => {
        // console.log("issue_token", res)
        resolve({status: 'ok', message: res.transaction_id})
      }).catch(e => {
        // console.log(e.message)
        resolve({status: 'error', message: e.message})
      })
  })
}



async function activateP2P(eos, p2p_contract, enable_growth, growth_type, start_rate, percents_per_month, enable_vesting, vesting_seconds, vesting_pause_until, gift_account_from_amount, ref_pay_type) {
  return new Promise(async (resolve, reject) => {
      eos.transact({ 
        actions: [
        {
          account: p2p_contract,
          name: 'setparams',
          authorization: [{
            actor: p2p_contract,
            permission: 'active',
          }],
          data: {
            enable_growth: enable_growth,
            growth_type: growth_type, 
            start_rate: start_rate,
            percents_per_month: percents_per_month,
            enable_vesting: enable_vesting,
            vesting_seconds: vesting_seconds,
            vesting_pause_until: vesting_pause_until,
            gift_account_from_amount: gift_account_from_amount,
            ref_pay_type: ref_pay_type
          }
        }
        ]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      }).then(res => {
        // console.log("issue_token", res)
        resolve({status: 'ok', message: res.transaction_id})
      }).catch(e => {
        // console.log(e)
        resolve({status: 'error', message: e.message})
      })
  })
}

module.exports = {
  upgradeHost,
  setupHost,
  initCoreContract,
  setParamsToHost,
  setupGoals,
  setupTasks,
  setP2Prate,
  activateP2P,
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
  voteForGoal,
  setReport,
  approveReport,
  setGoalReport,
  checkGoalReport,
  laborWithdraw,
  laborRefresh,
  voteForReport,
  withdrawReport,
  distributeReport,
  pair,
  startHost,
  refreshState,
  setFunds
};
