async function create_token(eos, token) {
    return new Promise(async (resolve, reject) => {
      eos.transact({ 
        actions: [
        {
          account: token.contract,
          name: 'create',
          authorization: [{
            actor: token.contract,
            permission: 'active',
          }],
          data: {
            issuer: token.issuer, 
            maximum_supply: token.max_supply
          }
        }
        ]
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

async function issue_token(eos, token, username, amount) {
  return new Promise(async (resolve, reject) => {
      eos.transact({ 
        actions: [
        {
          account: token.contract,
          name: 'issue',
          authorization: [{
            actor: token.issuer,
            permission: 'active',
          }],
          data: {
            to: username,
            quantity: amount,
            memo: ""
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
        console.log(e.message)
        resolve({status: 'error', message: e.message})
      })
  })
}


async function transfer_token(eos, contract, from, to, amount, memo) {
  return new Promise(async (resolve, reject) => {
      eos.transact({ 
        actions: [
        {
          account: contract,
          name: 'transfer',
          authorization: [{
            actor: from,
            permission: 'active',
          }],
          data: {
            from: from,
            to: to,
            quantity: amount,
            memo: memo
          }
        }
        ]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      }).then(res => {
        let cons = ""
        
        try{
        
          cons = res.processed.action_traces[0].inline_traces[1].console
          const regex = /BALANCE_ID: (\w+);?/gi;
          let group;
          group = regex.exec(cons)
          var balance_id = group[1]

        } catch(e){}
        resolve({status: 'ok', message: res.transaction_id, console: cons, balance_id: balance_id})
      }).catch(e => {
        // console.log(e.message)
        resolve({status: 'error', message: e.message})
      })
  })
}

module.exports = {
   create_token,
   issue_token,
   transfer_token
}