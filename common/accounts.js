const { Numeric } = require('eosjs');

var {get_accounts} = require("./config.js");



async function register_accounts1(eos, account, default_key){
  if (account.owner)
    account.owner = Numeric.convertLegacyPublicKey(account.owner)

  if (account.active)
    account.active = Numeric.convertLegacyPublicKey(account.active)
  
  
  if (account.username != 'eosio')
    return new Promise(async (resolve, reject) => {
      
      eos.transact({ 
        actions: [{
          account: "eosio",
          name: 'newaccount',
          authorization: [{
            actor: "eosio",
            permission: 'active',
          }],
          data: {
            creator: "eosio",
            name: account.username,
            owner: {
              threshold: 1,
              keys: [{
                key: account.active || default_key,
                weight: 1
              }],
              accounts: [],
              waits: []
            },
            active: {
              threshold: 1,
              keys: [{
                key: account.active || default_key,
                weight: 1
              }],
              accounts: [],
              waits: []
            },
            signature_hash: "testsign"
          },
        }]
      }, {
        blocksBehind: 0,
        expireSeconds: 30,
      }).then(async trx => {
        // console.log("account registered: ",  account.username, trx.transaction_id)
        resolve({status: 'ok', message: trx.transaction_id})

      }).catch(e => {
        
        resolve({status: 'error', message: e.message})

      })

    })
  else return {status: 'ok', message: "system account"}
}



async function register_accounts2(eos, target, default_key, is_guest, referer){
    return new Promise(async (resolve, reject) => {
      eos.transact({ 
            actions: [{
              account: "registrator",
              name: 'regaccount',
              authorization: [{
                actor: "registrator",
                permission: 'active',
              }],
            data: {
              payer: "registrator",
              referer: referer ? referer : "",
              newaccount: target,
              public_key: default_key,
              cpu: `1.0000 ${process.env.CORE_TOKEN}`,
              net: `1.0000 ${process.env.CORE_TOKEN}`,
              ram_bytes: 16 * 1024,
              is_guest: is_guest,
              set_referer: true
            },
          }]
        },{
          blocksBehind: 3,
          expireSeconds: 30,
        }).then(async trx => {
          resolve({status: 'ok', message: trx.transaction_id})

      }).catch(e => {
        
        resolve({status: 'error', message: e.message})

      })

    })
}



async function set_ref(eos, partners_contract, account){
  if (account.referer != null)
    return new Promise((resolve, reject) => {

      eos.transact({ 
        actions: [{
          account: partners_contract,
          name: 'reg',
          authorization: [{
            actor: partners_contract,
            permission: 'active',
          }],
          data: {
            username: account.username,
            referer: account.referer,
            meta: account.meta
          },
        }]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      }).then(async trx => {
        
        resolve({status: 'ok', message: trx.transaction_id})

      }).catch(e => {
        
        resolve({status: 'error', message: e.message})

      })

    })
  else return {status: 'ok', message: 'no referer to set' }
}


async function buy_resources(eos, network, account) {
  var accounts = await get_accounts(network)

  return new Promise((resolve, reject) => {
    eos.transact({ 
        actions: [
        {
          account: 'eosio',
          name: 'buyrambytes',
          authorization: [{
            actor: "eosio",
            permission: 'active',
          }],
          data: {
            payer: "eosio",
            receiver: account.username,
            bytes: account.ram_kbytes * 1024 || accounts.params.default_ram_kbytes * 1024,
          },
        },
        {
          account: 'eosio',
          name: 'delegatebw',
          authorization: [{
            actor: "eosio",
            permission: 'active',
          }],
          data: {
            from: "eosio",
            receiver: account.username,
            stake_net_quantity: account.net_weight || accounts.params.default_net_weight,
            stake_cpu_quantity: account.cpu_weight || accounts.params.default_cpu_weight,
            transfer: false,
          }
        }
        ]
    
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      }).then(async trx => {
        
        resolve({status: 'ok', message: trx.transaction_id})

      }).catch(e => {
        resolve({status: 'error', message: e.message})

      })

  })
}



async function set_code_permissions(eos, key, from, to) {
  var actions = [{
        account: 'eosio',
        name: 'updateauth',
        authorization: [{
            actor: from, 
            permission: 'active',
        }],
        data: {
            account: from,  
            permission: "active", 
            parent: 'owner',
            auth: {
                "threshold": 1,
                "keys": [{
                    "key": key,
                    "weight": 1
                }],
                "accounts": [],
                "waits": []
            }
        }
      }]


  to.map(t => {
    actions[0].data.auth.accounts.push({
        "permission": {
            "actor": t,
            "permission": "eosio.code" 
        },
        "weight": 1
    })
  })

  // console.log("registrator", actions)

  return new Promise((resolve, reject) => {
    eos.transact({ 
        actions: actions
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      }).then(async trx => {
        resolve({status: 'ok', from: from, message: trx.transaction_id})
      }).catch(e => {
        console.log(from, e.message)
        resolve({status: 'error', message: e.message})

      })

  })
}



module.exports = {
  register_accounts1,
  buy_resources,
  set_code_permissions,
  set_ref,
  register_accounts2
};