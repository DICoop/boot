const fs = require('fs');
const {Serialize} = require(`eosjs`)
const axios = require('axios').default;

var {get_accounts} = require("./config.js");                                                                        // 
// var Serialize = eosjs.Serialize;
                                                                                                                    // 
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
var get_pass_instance = require("./eos.js");
var initFeature = "0ec7e080177b2c02b278d5088611686b49d739925a92d9bfcacd7fc6b74053bd"

var features = [
    {
        "feature": "ACTION_RETURN_VALUE",
        "hash": "c3a6138c5061cf291310887c0b5c71fcaffeab90d5deb50d3b9e687cead45071"
    },
    {
        "feature": "CONFIGURABLE_WASM_LIMITS2",
        "hash": "d528b9f6e9693f45ed277af93474fd473ce7d831dae2180cca35d907bd10cb40"
    },
    {
        "feature": "BLOCKCHAIN_PARAMETERS",
        "hash": "5443fcf88330c586bc0e5f3dee10e7f63c76c00249c87fe4fbf7f38c082006b4"
    },
    {
        "feature": "GET_SENDER",
        "hash": "f0af56d2c5a48d60a4a5b5c903edfb7db3a736a94ed589d0b797df33ff9d3e1d"
    },
    {
        "feature": "FORWARD_SETCODE",
        "hash": "2652f5f96006294109b3dd0bbde63693f55324af452b799ee137a81a905eed25"
    },
    {
        "feature": "ONLY_BILL_FIRST_AUTHORIZER",
        "hash": "8ba52fe7a3956c5cd3a656a3174b931d3bb2abb45578befc59f283ecd816a405"
    },
    {
        "feature": "RESTRICT_ACTION_TO_SELF",
        "hash": "ad9e3d8f650687709fd68f4b90b41f7d825a365b02c23a636cef88ac2ac00c43"
    },
    {
        "feature": "DISALLOW_EMPTY_PRODUCER_SCHEDULE",
        "hash": "68dcaa34c0517d19666e6b33add67351d8c5f69e999ca1e37931bc410a297428"
    },
    {
        "feature": "FIX_LINKAUTH_RESTRICTION",
        "hash": "e0fb64b1085cc5538970158d05a009c24e276fb94e1a0bf6a528b48fbc4ff526"
    },
    {
        "feature": "REPLACE_DEFERRED",
        "hash": "ef43112c6543b88db2283a2e077278c315ae2c84719a8b25f25cc88565fbea99"
    },
    {
        "feature": "NO_DUPLICATE_DEFERRED_ID",
        "hash": "4a90c00d55454dc5b059055ca213579c6ea856967712a56017487886a4d4cc0f"
    },
    {
        "feature": "ONLY_LINK_TO_EXISTING_PERMISSION",
        "hash": "1a99a59d87e06e09ec5b028a9cbb7749b4a5ad8819004365d02dc4379a8b7241"
    },
    {
        "feature": "RAM_RESTRICTIONS",
        "hash": "4e7bf348da00a945489b2a681749eb56f5de00b900014e137ddae39f48f69d67"
    },
    {
        "feature": "WEBAUTHN_KEY",
        "hash": "4fca8bd82bbd181e714e283f83e1b45d95ca5af40fb89ad3977b653c448f78c2"
    },
    {
        "feature": "WTMSIG_BLOCK_SIGNATURES",
        "hash": "299dcb6af692324b899b39f16d5a530a33062804e41f09dc97e9f156b4476707"
    },
    {
        "feature": "GET_CODE_HASH",
        "hash": "bcd2a26394b36614fd4894241d3c451ab0f6fd110958c3423073621a70826e99"
    },
    {
        "feature": "GET_BLOCK_NUM",
        "hash": "35c2186cc36f7bb4aeaf4487b36e57039ccf45a9136aa856a5d569ecca55ef2b"
    },
    {
        "feature": "CRYPTO_PRIMITIVES",
        "hash": "6bcb40a24e49c26d0a60513b6aeb8551d264e4717f306b81a37a5afb3b47cedc"
    }
]



var contracts = [
        {
          "name" : "eosio.token",
          "path" : "/Users/darksun/dacom-code/foundation/contracts/system/build/contracts/eosio.token",
          "main_file" : "eosio.token.cpp",
          "output_name" : "eosio.token",
          "cdt" : "v1.7.0",
          "networks": {"master" : "eosio.token", "uni" : "eosio.token", "cbs" : "eosio.token", "tc" : "eosio.token", "dacom" : "eosio.token", "essence": "eosio.token","eywa": "eosio.token", "thews": "eosio.token"},
        },
        {
          "name" : "usdt.token",
          "path" : "/Users/darksun/dacom-code/foundation/contracts/system/build/contracts/eosio.token",
          "main_file" : "eosio.token.cpp",
          "output_name" : "eosio.token",
          "cdt" : "v1.7.0",
          "networks": {"master" : "usdt.token", "uni" : "eosio.token", "cbs" : "eosio.token", "tc" : "eosio.token", "dacom" : "usdt.token", "essence": "eosio.token","eywa": "eosio.token", "thews": "eosio.token"},
        },
        {
          "name" : "test.token",
          "path" : "/Users/darksun/dacom-code/foundation/contracts/system/build/contracts/eosio.token",
          "main_file" : "eosio.token.cpp",
          "output_name" : "eosio.token",
          "cdt" : "v1.7.0",
          "networks": {"master" : "test.token", "uni" : "test.token", "cbs" : "test.token", "tc" : "test.token", "dacom" : "test.token"},
        },
        {
          "name" : "p2p",
          "path" : "/Users/darksun/dacom-code/MMM/contracts/p2p",
          "main_file" : "p2p.cpp",
          "output_name" : "p2p",
          "cdt" : "v1.7.0",
          "networks" : {"master" : "p2p", "uni" : "p2p", "tc" : "p2p", "dacom": "p2p", "essence": "p2p","eywa": "p2p"},
        },
        {
          "name" : "registrator",
          "path" : "/Users/darksun/dacom-code/foundation/contracts/registrator",
          "main_file" : "registrator.cpp",
          "output_name" : "registrator",
          "cdt" : "v1.5.0",
          "networks" : {"master" : "registrator", "uni" : "registrator", "cbs" : "reg.core", "tc" : "reg", "dacom" : "registrator", "essence": "registrator","eywa": "registrator",  "thews": "registrator"},
        },
        {
          "name" : "eosio.boot",
          "path" : "/Users/darksun/dacom-code/foundation/contracts/system/build/contracts/eosio.boot",
          "main_file" : "main.cpp",
          "output_name" : "eosio.boot",
          "cdt" : "v1.7.0",
          "networks": {"master" : "eosio", "uni" : "eosio", "cbs" : "eosio", "tc" : "eosio", "dacom" : "eosio", "essence": "eosio","eywa": "eosio",  "thews": "eosio"},
        },
        {
          "name" : "eosio.system",
          "path" : "/Users/darksun/dacom-code/foundation/contracts/system/build/contracts/eosio.system",
          "main_file" : "main.cpp",
          "output_name" : "eosio.system",
          "cdt" : "v1.7.0",
          "networks": {"master" : "eosio", "uni" : "eosio", "cbs" : "eosio", "tc" : "eosio", "dacom" : "eosio", "essence": "eosio","eywa": "eosio",  "thews": "eosio"},
        },
        {
          "name" : "soviet",
          "path" : "/Users/darksun/dacom-code/foundation/contracts/soviet",
          "main_file" : "soviet.cpp",
          "output_name" : "soviet",
          "cdt" : "v1.7.0",
          "networks": {"master" : "soviet"},
        }
        
      ];



async function getContractTarget(contract, network) {

  var contract_object = contracts.find(el => el.name == contract)
  var target = contract_object.networks[network]
  return target

}

async function preActivate(eos, network){

  const axios = require('axios').default;

  try{
    let response = await axios.post("http://localhost:8888/v1/producer/schedule_protocol_feature_activations", {
        protocol_features_to_activate: ["0ec7e080177b2c02b278d5088611686b49d739925a92d9bfcacd7fc6b74053bd"]
    })
    console.log("ok -> init activation: ", response.data);

  } catch(e){
    console.log("error -> init activation: ", e.message)
  }

  await sleep(1000)
  let boot = await setContract(eos, "eosio.boot", network)
  console.log("boot: ", boot)
  
  eos = await get_pass_instance(network, 'init_key')
  
  for (feature of features){
    await activate(eos, feature.hash)    
  }

}

async function setAllContracts(eos, network) {
  
  //TODO 
  //activate feature
  await preActivate(eos, network)

  var promises = []
  var k = 0
  for (contract of contracts){
    if (contract.name != 'eosio.boot'){
      contract.result = await setContract(eos, contract.name, network)
      if (contract.result.status == 'error') {
        contract.result = await setContract(eos, contract.name, network)
        if (contract.result.status == 'error') {
          contract.result = await setContract(eos, contract.name, network)
        }
      }

      console.log(contract.result.status, '-> set contract: ', k + ' | ' + contracts.length, " -> ", contract.name, ' -> ', contract.result.message)
    
      k++
    }
  }
  return contracts
  

}

async function setContract(eos, contract, network) {
    return new Promise(async (resolve, reject) => {
      var contract_object = contracts.find(el => el.name == contract)
      
      var target = await getContractTarget(contract, network)
      // console.log("TARGET", target)
      var wasm_path = contract_object.path + '/' + contract_object.output_name + '.wasm'
      var abi_path = contract_object.path  + '/' + contract_object.output_name + '.abi'

      const wasm = fs.readFileSync(wasm_path)
      const abi = fs.readFileSync(abi_path)
      
      // console.log("EOS", eos.abiTypes)
      const buffer = new Serialize.SerialBuffer({
          textEncoder: eos.textEncoder,
          textDecoder: eos.textDecoder,
      })

   
      const abiDefinitions = eos.abiTypes.get('abi_def')
      
      var abiJSON = JSON.parse(abi);
      
      abiJSON = abiDefinitions.fields.reduce(
          (acc, { name: fieldName }) =>
              Object.assign(acc, { [fieldName]: acc[fieldName] || [] }),
              abiJSON
          )
      abiDefinitions.serialize(buffer, abiJSON)
        
      var serializedAbiHexString = Buffer.from(buffer.asUint8Array()).toString('hex')
      

      let data = {
        account: target,
        vmtype: 0,
        vmversion: 0,
        code: wasm,
      }
  
      eos.transact({ 
        actions: [
        {
          account: 'eosio',
          name: 'setcode',
          authorization: [{
            actor: target,
            permission: 'active',
          }],
          data: data
        },
        {
          account: 'eosio',
          name: 'setabi',
          authorization: [
            {
              actor: target,
              permission: 'active',
            },
          ],
          data: {
            account: target,
            abi: serializedAbiHexString,
          },
        },
        ]
      }, {
        blocksBehind: 6,
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


async function activate(eos, featureHash) {
  return new Promise(async (resolve, reject) => {
      eos.transact({ 
        actions: [
        {
          account: "eosio",
          name: 'activate',
          authorization: [{
            actor: "eosio",
            permission: 'active',
          }],
          data: {
            feature_digest: featureHash
          }
        }
        ]
      }, {
        blocksBehind: 3,
        expireSeconds: 30,
      }).then(res => {
        console.log("ok -> activation: ", res.transaction_id)
        resolve({status: 'ok', message: res.transaction_id})
      }).catch(e => {
        console.log("error -> activation: ", e.message)
        resolve({status: 'error', message: e.message})
      })
  })
}

async function regProducer(eos, producer, producer_key) {
  // console.log("core_token", core_token)
  return new Promise(async (resolve, reject) => {

      eos.transact({ 
        actions: [
        {
          account: "eosio",
          name: 'delegatebw',
          authorization: [{
            actor: producer,
            permission: 'active',
          }],
          data: {
            from: producer,
            receiver: producer,
            stake_net_quantity: `1.0000 ${process.env.CORE_TOKEN}`,
            stake_cpu_quantity: `99000.0000 ${process.env.CORE_TOKEN}`,
            transfer: false,
          }
        },
        {
          account: "eosio",
          name: 'regproducer',
          authorization: [{
            actor: producer,
            permission: 'active',
          }],
          data: {
            producer,
            producer_key,
            url: "",
            location: 0,
          }
        },
        {
          account: "eosio",
          name: 'voteproducer',
          authorization: [{
            actor: producer,
            permission: 'active',
          }],
          data: {
            voter: producer,
            proxy: "",
            producers: [producer]
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


async function initSystemContract(eos, core_token, init_market_amount) {
  // console.log("core_token", core_token)
  return new Promise(async (resolve, reject) => {
      eos.transact({ 
        actions: [
        {
          account: "eosio",
          name: 'init',
          authorization: [{
            actor: "eosio",
            permission: 'active',
          }],
          data: {
            version: 0,
            core: core_token,
            init_market_amount: init_market_amount,
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


module.exports = {
  contracts,
  setContract,
  getContractTarget,
  setAllContracts,
  initSystemContract,
  activate,
  regProducer
};
