async function get_wif(role, network) {
  var config = require("./../configs/" + network + "/config.js");
  
  return config[role]
}

async function get_tokens_data(network) {
  var config = require("./../configs/" + network + "/config.js");
  
  return config.tokens
}

async function get_producer_key(network){
  var config = require("./../configs/" + network + "/config.js");
  
  return config.producer_key
}

async function get_core_token(network) {
  var config = require("./../configs/" + network + "/config.js");
  
  return config.core_token
}


async function get_config(network) {
  var config = require("./../configs/" + network + "/config.js");
  
  return config
}

async function get_init_market_amount(network) {
  var config = require("./../configs/" + network + "/config.js");
  
  return config.init_market_amount
}

async function get_accounts(network) {
  var config = require("./../configs/" + network + "/config.js");
  
  return config.accounts
}

async function get_hosts(network) {
  var config = require("./../configs/" + network + "/config.js");
  
  return config.hosts
}


async function get_core_contract(network) {
  var config = require("./../configs/" + network + "/config.js");
  
  return config.main_core_contract
}


async function get_core_system_percent(network) {
  var config = require("./../configs/" + network + "/config.js");
  
  return config.core_system_percent
}


async function get_operator_system_percent(network) {
  var config = require("./../configs/" + network + "/config.js");
  
  return config.operator_system_percent
}


async function get_partners_contract(network) {
  var config = require("./../configs/" + network + "/config.js");
  
  return config.partners_contract
}






module.exports = {
   get_config,
   get_wif,
   get_tokens_data,
   get_core_token,
   get_init_market_amount,
   get_accounts,
   get_hosts,
   get_core_contract,
   get_core_system_percent,
   get_partners_contract,
   get_producer_key,
   get_operator_system_percent
}