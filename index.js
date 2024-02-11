require('dotenv').config()

const axios = require('axios').default;
const base_path = "http://127.0.0.1:" + process.env.PORT

var get_pass_instance = require("./common/eos.js");

var {get_config, get_tokens_data, get_core_token, get_init_market_amount, get_accounts, get_core_system_percent, get_core_contract, get_operator_system_percent, get_partners_contract, get_producer_key} = require("./common/config.js");

var {initCoreContract, setupAllHosts, setupGoals, setupTasks, setP2Prate, activateP2P, setupHost, depositToCurrentPool,refreshAllBalances, withdrawAllBalances, getLiquidBalance, pair, startHost, setFunds} = require("./common/core.js");
var {register_accounts1, register_accounts2, buy_resources, set_code_permissions, set_ref} = require('./common/accounts.js');
var {setContract, setAllContracts, initSystemContract, activate, regProducer} = require("./common/contracts.js");
var {create_token, issue_token, transfer_token} = require("./common/tokens.js");
const {depositToTwoPools, base5RefTest, base3RefTest, base4RefTest, base15RefTest, manualRefreshAndWithdrawAll} = require("./tests/baseRef")
const {goalTest} = require("./tests/goals")
const {AuctionTest} = require("./tests/auction")
const {distributionTest} = require("./tests/labor")

var network =  process.env.NETWORK || 'master'
console.log("NETWORK: ", network)

  
async function registerBaseAccounts() {

  try{
        var accounts = await get_accounts(network)
        
        let eos = await get_pass_instance(network, 'init_key')

          for (account of accounts.list) {
            account.result = await register_accounts1(eos, account, accounts.params.default_key)
            console.log(`${account.result.status} -> registered ${account.username} -> ${account.result.message}`)
          }

    } catch(err){
      console.error(err)
    }

    return accounts.list
}



async function set_all_contracts(config){

  let eos = await get_pass_instance(network, 'main_key')
  console.log(config.targets)
  let result = await setAllContracts(eos, network, config.targets)

}

async function issueTokens(){
  var tokens = await get_tokens_data(network)

  let eos = await get_pass_instance(network, 'main_key')
            
  for (token of tokens) {
    for (allocation of token.allocation) {
      allocation.result = await issue_token(eos, token, allocation.username, allocation.amount)
      console.log(`${allocation.result.status} -> token issued: ${allocation.username} -> ${allocation.amount}`)
    }
  }            

            
}

async function init_system_contract() {
  let eos = await get_pass_instance(network, 'main_key')
  let core_token = await get_core_token(network)
  let init_market_amount = await get_init_market_amount(network)


  let result = await initSystemContract(eos, core_token, init_market_amount)
  console.log(result.status, ' -> ', "System contract initializated: ", result.message)

}

async function activateBlockchain(eos){
  let producer_key = await get_producer_key(network)

  let registered_producer = await regProducer(eos, "core", producer_key)
  console.log(registered_producer.status, ' -> ', "Producer is setted", registered_producer.message)
  let result = await activate(eos)
  console.log(result.status, ' -> ', "Blockchain is activated", result.message)

}

async function init_core_contract() {
  let eos = await get_pass_instance(network, 'main_key')
  let core_contract = await get_core_contract(network)
  let core_system_percent = await get_core_system_percent(network)
  let operator_system_percent = await get_operator_system_percent(network)

  let result = await initCoreContract(eos, core_contract, core_system_percent, operator_system_percent)

  console.log(result.status, ' -> ', "Core contract initializated: ",  result.message)
}


async function buy_all_resources(){
  let accounts = await get_accounts(network)
  let eos = await get_pass_instance(network, 'init_key')

  for (account of accounts.list){
    account.result = await buy_resources(eos, network, account)
    console.log(account.result.status, ' -> ',  "buy resouces for: ", account.username, " -> ", account.result.message)
  }

}


async function set_all_code_permissions(){
   var accounts = await get_accounts(network)
   let eos = await get_pass_instance(network, 'main_key')
    
   for (account of accounts.list){
    account.result = await set_code_permissions(eos, account.active || accounts.params.default_key, account.username, account.code_permissions_to)
    console.log( account.result.status, ' -> ', "give permissions for: ", account.username, ' -> ', account.result.message)
   }
}

async function createTokens() {
  let tokens = await get_tokens_data(network)

  let eos = await get_pass_instance(network, 'main_key')
    
    
  let promises = []
    
  for (token of tokens) {
    token.result = await create_token(eos, token)
    console.log(`${token.result.status}`, " -> token created: ", token.symbol, " -> ", "contract -> ", token.contract, " -> ", token.result.message)
  }
}

async function fillRegistrator() {
  let tokens = await get_tokens_data(network)
  let eos = await get_pass_instance(network, 'init_key')
  
  for (token of tokens){
    if(token.toRegistrator){
      let result = await transfer_token(eos, token.contract, "eosio", token.registrator_contract, token.toRegistrator, token.registrator)
      console.log(`${result.status} -> registrator ${token.registrator} filled for ${token.toRegistrator}: ${result.message}`)
      result = await transfer_token(eos, token.contract, "eosio", token.registrator_contract, token.toRegistrator, token.registrator2)
      console.log(`${result.status} -> registrator2 ${token.registrator2} filled for ${token.toRegistrator}: ${result.message}`)
    }
  } 
}

async function set_all_refs() {
   let accounts = await get_accounts(network)
   let partners_contract = await get_partners_contract(network)

   let eos = await get_pass_instance(network, 'init_key')
   
    for (account of accounts.list) {
      account.result = await set_ref(eos, partners_contract, account)
      console.log(`${account.result.status} -> set ref: ${account.username} -> ${account.result.message}`)
    }

      
}

// async function set_p2p_rates(){
//   let eos = await get_pass_instance(network, 'init_key')
   
   
// }





async function setup_host(target, source){
  let eos = await get_pass_instance(network, 'init_key')

  var liquid_bal = await getLiquidBalance(eos, "unicore", process.env.CORE_TOKEN)
  
  if (parseFloat(liquid_bal) > 0){
    let result = await transfer_token(eos, "eosio.token", "unicore", "eosio", liquid_bal, "")
    console.log(`${result.status} transfer out from unicore ${liquid_bal} -> ${result.message}`)
  }
    

  var accounts = await get_accounts(network)
  
  let exist = accounts.list.find(el => el.username === target)
  
  if (!exist){
    let result = await register_accounts2(eos, target, accounts.params.default_key, false, "")
    console.log(result.status, " -> ", "registered for be host: ", target, " -> ", result.message)
  }


  await setupHost(eos, network, target, source)

}

async function run_tests(hostname) {
  

}

function generateAccount(){
  let username = "";
  let possible = "abcdefghijklmnopqrstuvwxyz"
  
  for (var i = 0; i < 12; i++)
    username += possible.charAt(Math.floor(Math.random() * possible.length));

  return username

}

async function init(skip) {
  let eos = await get_pass_instance(network, 'init_key')
  
  const config = await get_config(network)
  
  if (!skip) {
    await registerBaseAccounts()
    
    await set_all_contracts(config)
    
    await createTokens()
    await issueTokens()
    await init_system_contract()
  
    await buy_all_resources()
    await set_all_code_permissions()
    
    await fillRegistrator()
  } 

  //TODO choose test flow
  
  

}

const args = process.argv.slice(2);

let skip_install = false
if (args[0] == "-s")
  skip_install = true


init(skip_install)
