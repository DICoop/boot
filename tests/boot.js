const { assert } = require('chai');
const { Api, JsonRpc } = require('eosjs');
const ecc = require('eosjs-ecc');
const fetch = require('node-fetch');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const { ChainsSingleton } = require('unicore')
const { encrypt, decrypt } = require('eos-encrypt');
const axios = require("axios")
const {get_config} = require('../common/config')
const get_network_params = require('../common/networks')
const {setContract} = require('../common/contracts')
const {buy_resources, set_code_permissions} = require('../common/accounts')

const eosjsAccountName = require('eosjs-account-name');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms * 1000));

let privateKeys = ['5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3', '5JoNYmWXTUUPd17Q5YuHBnzb9AsoPFrZftC1eSpTtt56UGzkgLS'];
var network =  process.env.NETWORK || 'master'
var network_params
var network_config
var targets = []
var rpc
var api 
var url
var meta = {}

const getTarget = name => {
  const found = targets.find(el => el.hasOwnProperty(name));
  return found ? found[name] : undefined;
};

async function generateKeypair(username) {
    let privateKey = await ecc.randomKey()
    privateKeys = [...privateKeys, privateKey]
    
    let publicKey = await ecc.privateToPublic(privateKey)
    //reinit
    signatureProvider = new JsSignatureProvider(privateKeys);
    api = new Api({
      rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new
        TextEncoder()
    });

    console.log("\tusername: ", username)
    console.log("\tprivateKey: ", privateKey)
    console.log("\tpublicKey: ", publicKey)
    

    return {privateKey, publicKey}
}

async function registerAccount(account) {
  try {
    const response = await axios.post(`${network_params.registrator}/register`, {
        coopname: account.coopname,
        active_pub: account.pub,
        owner_pub: account.pub,
        username: account.name,
        coop_id: account.coop_id,
        signature_hash: account.signature_hash
    });

    const { status, message } = response.data;
    
    return { status, message };
  } catch (error) {
    console.error('Ошибка:', error.message);
    return {status: false};
  }
}

// async function registerAccount(account, email, tgId, sign, userData) {
//   try {
//     const { status, message } = await instance.registrator.setAccount(
//       account.name,
//       account.pub,
//       account.pub,
//       email,
//       null, // referrer теперь установлен как null
//       "localhost",
//       'guest',
//       JSON.stringify({ tgId, sign, profile: userData.value })
//     );

//     if (status === 'ok') {
//       return { success: true };
//     } else {
//       return { success: false, error: status, message: message };
//     }
//   } catch (e) {
//     return { success: false, message: e.message };
//   }
// }


const generateRandomEmail = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let email = '';
  for (let i = 0; i < 10; i++) {
    email += chars[Math.floor(Math.random() * chars.length)];
  }
  email += '@example.com';
  return email;
};

function getRandomInt() {
  return Math.floor(Math.random() * 1000000000) + 1;
}


const generateRandomAccountName = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz12345';
  let accountName = '';
  for (let i = 0; i < 12; i++) {
    accountName += chars[Math.floor(Math.random() * chars.length)];
  }
  return accountName;
};


async function printWallet(rpc, coopname, username, who) {
  // console.log(rpc, getTarget('soviet'), getTarget('soviet'), 'participants', username, 1)

  const participant = await getTableRow(rpc, getTarget('soviet'), coopname, 'participants', username, 1);

  const program_wallet = await getTableRow(rpc, getTarget('soviet'), coopname, 'wallets', username, 2);

  console.log(`\t_______________`)
  console.log(`\tкошелёк аккаунта ${who} ${username}: `)
  console.log(`\t\tдоступно: ${participant.available}`)
  console.log(`\t\tзаблокировано: ${participant.blocked}`)
  console.log(`\t\t\tнайдено в программах: ${program_wallet ? program_wallet.available : '-'}`)

  console.log(`\t_______________`)
  
}




const getTableRow = async (rpc, contract, scope, table, key_value, index_position = 1, key_type = 'i64', encode_type = 'dec') => {
  try {
    // Основной запрос
    const query = {
      json: true,
      code: contract,
      scope: scope,
      table: table,
      limit: 1
    };

    // Если используется вторичный ключ (или другой индекс), добавляем соответствующие параметры
    if (index_position > 1) {
      query.index_position = index_position;
      query.key_type = key_type;
      query.encode_type = encode_type;
      query.lower_bound = key_value;
      query.upper_bound = key_value;
    } else {
      // Иначе используем первичный ключ
      query.lower_bound = key_value;
      query.upper_bound = key_value;
    }

    const result = await rpc.get_table_rows(query);

    return result.rows[0];
  } catch (error) {
    console.error(`Ошибка при получении строки из таблицы: ${error.message}`);
    throw error;
  }
};



const votefor = async (targets, api, coopname, member, decision_id) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: getTarget('soviet'), // Имя контракта
            name: 'votefor', // Имя метода
            authorization: [
              {
                actor: member, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
              coopname, 
              member,
              decision_id,
            },
          },
        ],
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    );

    return result;
  } catch (error) {
    throw error;
  }
};



const accept = async (api, coopname, member, exchange_id, document) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: getTarget('marketplace'), // Имя контракта
            name: 'accept', // Имя метода
            authorization: [
              {
                actor: member, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
              coopname, 
              username,
              exchange_id,
              document
            },
          },
        ],
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    );

    return result;
  } catch (error) {
    throw error;
  }
};




const regindivid = async (targets, api, coop_id, username) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: getTarget('registrator'), // Имя контракта
            name: 'reguser', // Имя метода
            authorization: [
              {
                actor: meta.coopname, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
              coopname: meta.coopname,
              username: username, 
              storage: {
                storage_username: meta.coopname,
                uid: "",
              },
              // profile: JSON.stringify({
              //   first_name: '[xxx]',
              //   second_name: '[xxx]',
              //   middle_name: '[xxx]',
              //   birthdate: "[xxx]",
              //   country: "[xxx]",
              //   city: "[xxx]",
              //   address: "[xxx]",
              //   phone: "[xxx]",
              // }),
              // meta: '[xxx]',
            },
          },
        ],
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    );

    return result;
  } catch (error) {
    throw error;
  }
};




const joincoop = async (targets, api, coopname, username) => {
  try {
    const actions = [
          {
            account: getTarget('registrator'), // Имя контракта
            name: 'joincoop', // Имя метода
            authorization: [
              {
                actor: coopname, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
              coopname: coopname,
              username: username, 
              document: {
                  hash: "hash",
                  pkey: "pkey",
                  sign: "sign", 
                  meta: "meta", 
              },
            },
          },
        ]

    const result = await api.transact(
      {
        actions
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    );

    return result;
  } catch (error) {
    throw error;
  }
};



const voteagainst = async (targets, api, coopname, member, decision_id) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: getTarget('soviet'), // Имя контракта
            name: 'voteagainst', // Имя метода
            authorization: [
              {
                actor: member, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
              coopname,
              member,
              decision_id,
            },
          },
        ],
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    );

    return result;
  } catch (error) {
    throw error;
  }
};



const cancelVote = async (targets, api, member, decision_id) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: getTarget('soviet'), // Имя контракта
            name: 'cancelvote', // Имя метода
            authorization: [
              {
                actor: member, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
              member,
              decision_id,
            },
          },
        ],
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    );

    return result;
  } catch (error) {
    throw error;
  }
};



const validate = async (targets, api, coopname, administrator, decision_id) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: getTarget('soviet'), // Имя контракта
            name: 'validate', // Имя метода
            authorization: [
              {
                actor: administrator, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
              coopname,
              username: administrator,
              decision_id,
            },
          },
        ],
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    );

    return result;
  } catch (error) {
    throw error;
  }
};

async function setProviderAuth(targets, api, accountName, publicKey){
  
  const result = await api.transact({
    actions: [{
      account: 'eosio',
      name: 'updateauth',
      authorization: [{
        actor: accountName,
        permission: 'active',
      }],
      data: {
        account: accountName,
        permission: 'provider',
        parent: 'active',
        auth: {
          threshold: 1,
          keys: [{
            key: publicKey,
            weight: 1,
          }],
          accounts: [],
          waits: [],
        },
      },
    },
    {
      account: 'eosio',
      name: 'linkauth',
      authorization: [{
        actor: accountName,
        permission: 'active', // или 'owner', в зависимости от ваших потребностей
      }],
      data: {
        account: accountName,
        code: getTarget('soviet'),
        type: "votefor",
        requirement: "provider",
      },
    },
    {
      account: 'eosio',
      name: 'linkauth',
      authorization: [{
        actor: accountName,
        permission: 'active', // или 'owner', в зависимости от ваших потребностей
      }],
      data: {
        account: accountName,
        code: getTarget('soviet'),
        type: "voteagainst",
        requirement: "provider",
      },
    },
    {
      account: 'eosio',
      name: 'linkauth',
      authorization: [{
        actor: accountName,
        permission: 'active', // или 'owner', в зависимости от ваших потребностей
      }],
      data: {
        account: accountName,
        code: getTarget('soviet'),
        type: "cancelvote",
        requirement: "provider",
      },
    },
    {
      account: 'eosio',
      name: 'linkauth',
      authorization: [{
        actor: accountName,
        permission: 'active', // или 'owner', в зависимости от ваших потребностей
      }],
      data: {
        account: accountName,
        code: getTarget('soviet'),
        type: "authorize",
        requirement: "provider",
      },
    }

    ],
  }, {
    blocksBehind: 3,
    expireSeconds: 30,
  });

  return result

}


function findAction(data, actionName) {
  // Вспомогательная функция для рекурсивного поиска
  function searchTraces(traces) {
    for (const trace of traces) {
      if (trace.act.name === actionName) {
        return trace.act.data; // Предполагается, что вам нужны данные, а не сам act
      }
      if (trace.inline_traces && trace.inline_traces.length) {
        const result = searchTraces(trace.inline_traces);
        if (result) {
          return result;
        }
      }
    }
    return null;
  }

  // Начальный вызов для processed.action_traces
  if (data?.processed?.action_traces) {
    return searchTraces(data.processed.action_traces);
  }

  return null;
}


function findActions(data, actionName) {
  const result = []

  // Вспомогательная функция для рекурсивного поиска
  function searchTraces(traces) {
    for (const trace of traces) {
      if (trace.act.name === actionName) {
        result.push(trace.act)
      }
      if (trace.inline_traces && trace.inline_traces.length) {
        searchTraces(trace.inline_traces);
      }
    }
    return result;
  }

  // Начальный вызов для processed.action_traces
  if (data?.processed?.action_traces) {
    return searchTraces(data.processed.action_traces);
  }

  return result;
}


function findConsoleResponses(data) {
  const responses = [];

  const searchTraces = (trace) => {
    // Добавление консольного ответа из trace, если он есть
    if (trace.console) {
      responses.push(trace.console);
    }

    // Рекурсивный поиск в inline_traces, если они существуют
    if (trace.inline_traces) {
      trace.inline_traces.forEach(searchTraces);
    }
  };

  if (data?.processed) {
    if (data.processed.console) {
      responses.push(data.processed.console);
    }

    if (data.processed.action_traces) {
      data.processed.action_traces.forEach(searchTraces);
    }

    if (data.processed.inline_traces) {
      data.processed.inline_traces.forEach(searchTraces);
    }
  }

  return responses; // Возвращение всех найденных консольных ответов
}

async function encryptMessage(wif, to, message) {
  // eslint-disable-next-line no-param-reassign
  // message = btoa(unescape(encodeURIComponent(message)));

  const account = await rpc.get_account(to);
  const pactivekey = account.permissions.find((el) => el.perm_name === 'active');
  const pkey = pactivekey.required_auth.keys[0].key;

  return encrypt(wif, pkey, message, { maxsize: 10000 });
}


const automate = async (targets, api, member, action_type) => {
  try {
    const provider = "provider"

    const private_key = await encryptMessage(privateKeys[0], provider, privateKeys[0])
    
    const result = await api.transact(
      {
        actions: [
          {
            account: getTarget('soviet'), // Имя контракта
            name: 'automate', // Имя метода
            authorization: [
              {
                actor: member, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
              member: member,
              action_type,
              provider,
              private_key
            },
          },
        ],
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    );

    return result;
  } catch (error) {
    throw error;
  }
};


const autochair = async (targets, api, member, action_type) => {
  try {

    const result = await api.transact(
      {
        actions: [
          {
            account: getTarget('soviet'), // Имя контракта
            name: 'autochair', // Имя метода
            authorization: [
              {
                actor: member, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
              chairman: member,
              action_type,
            },
          },
        ],
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    );

    return result;
  } catch (error) {
    throw error;
  }
};



const exec = async (targets, api, coopname, member, decision_id) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: getTarget('soviet'), // Имя контракта
            name: 'exec', // Имя метода
            authorization: [
              {
                actor: member, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
              coopname, 
              executer: member,
              decision_id,
            },
          },
        ],
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    );

    return result;
  } catch (error) {
    throw error;
  }
};



const authorize = async (targets, api, coopname, member, decision_id, hash, pkey, sign, meta) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: getTarget('soviet'), // Имя контракта
            name: 'authorize', // Имя метода
            authorization: [
              {
                actor: member, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
              coopname,
              chairman: member,
              decision_id,
              document: {
                hash: hash || "hash",
                pkey: pkey || "pkey",
                sign: sign || "sign",
                meta: meta || "meta"
              }
            },
          },
        ],
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    );

    return result;
  } catch (error) {
    throw error;
  }
};


const transfer = async (targets, contract, api, from, to, quantity, memo) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: contract, // Имя контракта
            name: 'transfer', // Имя метода
            authorization: [
              {
                actor: from, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
              from, to, quantity, memo
            },
          },
        ],
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    );

    return result;
  } catch (error) {
    throw error;
  }
};



const create = async (targets, contract, api, to, quantity, memo) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: contract, // Имя контракта
            name: 'create', // Имя метода
            authorization: [
              {
                actor: contract, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
              issuer: to,
              maximum_supply: quantity
            },
          },
        ],
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    );

    return result;
  } catch (error) {
    console.log(error)
    throw error;
  }
};


const issue = async (targets, contract, api, to, quantity, memo) => {
  try {
    console.log("\tвыпущено на контракт: ", contract, " пользователю: ", to, quantity)
    const result = await api.transact(
      {
        actions: [
          {
            account: contract, // Имя контракта
            name: 'issue', // Имя метода
            authorization: [
              {
                actor: meta.coopname, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
              to, quantity, memo
            },
          },
        ],
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    );

    return result;
  } catch (error) {
    throw error;
  }
};


const addAdmin = async (targets, api, chairman, username, rights) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: getTarget('soviet'), // Имя контракта
            name: 'addadmin', // Имя метода
            authorization: [
              {
                actor: chairman, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
              chairman,
              username,
              rights,
              meta: ""
            },
          },
        ],
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    );

    return result;
  } catch (error) {
    console.error(`Ошибка при добавлении администратора: ${error.message}`);
    throw error;
  }
};


const createOrder = async (targets, api, order) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account:getTarget('marketplace'), // Имя контракта
            name: 'create', // Имя метода
            authorization: [
              {
                actor: order.creator, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: order,
          },
        ],
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    );

    return result;
  } catch (error) {
    throw error;
  }
};


async function init(){
  network_params = await get_network_params(network)
  network_config = await get_config(network)

  let port = parseInt(network_params.port.replace(":", ""))
  
  const config = {
    chains: [
      {
        name: 'LOCAL',
        rpcEndpoints: [
          {
            protocol: network_params.protocol,
            host: network_params.host,
            port: port,
          },
        ],
        explorerApiUrl: 'https://explorer.gaia.holdings',
        wallets: [
          {
            contract: network_config.coopcontract,
            symbol: network_config.coopsymbol,
            canTransfer: true,
            canDeposit: true,
            canWithdraw: true,
            p2pMode: false,
          },
          // {
          //   contract: 'eosio.token',
          //   symbol: 'RUB',
          //   canTransfer: true,
          //   canDeposit: false,
          //   canWithdraw: false,
          //   canChange: false,
          //   p2pMode: false,
          // },
        ],
        coreSymbol: network_config.coopsymbol,
      },
    ],
    ual: {
      rootChain: 'LOCAL',
    },
    registrator: {
      appName: 'UniUI',
      api: network_params.registrator,
    },

  }

  const instance = new ChainsSingleton()
  instance.init(config)

  
  url = network_params.protocol + '://' + network_params.host + network_params.port
  rpc = new JsonRpc(url, { fetch });
  
  privateKeys.push(network_config.init_key)

  let signatureProvider = new JsSignatureProvider(privateKeys);
  api = new Api({
    rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new
      TextEncoder()
  });
  
  
  
  targets = network_config.targets
  console.log(targets)
  

  describe('Проверяем подключение ноде', async () => {
    

    it('Нода должна быть онлайн', (done) => {
      fetch(`${url}/v1/chain/get_info`)
        .then(async (response) => {
          assert(response.ok, 'Нода недоступна');
          
          done();


          describe('Тестируем контракт совета', () => {
            

            // describe('Устанавливаем шаблоны договоров', () => {
              it('Регистрируем аккаунты для контрактов', async () => {
                meta.contracts = {}
                
                for (const target of targets) {
                  const key = Object.keys(target)[0]; // Получаем значение объекта
                  const value = Object.values(target)[0]; // Получаем значение объекта
                  try {
                    const account = await rpc.get_account(value);  
                    // Обрабатываем account
                    
                  } catch(e) {
                    // Обработка ошибок

                    // await generateKeypair(value)
                    
                    const account = {
                      coopname: getTarget('ano'),
                      name: value,
                      pub: network_config.accounts.params.default_key, //key.publicKey,
                      userData: { value: 'someUserData' },
                      sign: "sign",
                      tgId: 1,
                      email: generateRandomEmail(),
                      signature_hash: ""
                    };
                    
                    
                    console.log(1)
                    await registerAccount(account);
                    console.log(2)
                    await set_code_permissions(api, account.pub, value, [value])
                    console.log(3)
                    await buy_resources(api, network, {username: value, ram_kbytes: 2048})
                    console.log(4)
                    await setContract(api, key, value, network)  
                    console.log(5)
                  }
                }


              }).timeout(60000);

            // describe('Устанавливаем шаблоны договоров', () => {
              it('Установливаем и стандартизируем шаблоны договоров', async () => {
                const drafts = require("../../terminal/src/utils/drafts.js")
                
                meta.drafts = []
                meta.drafts_version = getRandomInt() //1
                meta.drafts_lang = 'ru'
                try {
                  for (let index = 0; index < drafts.length; index++) {
                    let draft = drafts[index];
                    
                    let actions = [{
                        account: getTarget('draft'),
                        name: 'createdraft',
                        authorization: [{
                          actor: getTarget('draft'),
                          permission: 'active',
                        }],
                        data: {
                          creator: getTarget('draft'),
                          action_name: draft.action_name,
                          version: meta.drafts_version,
                          lang: meta.drafts_lang,
                          title: draft.translations[meta.drafts_lang].title,
                          description: draft.translations[meta.drafts_lang].title,
                          context: draft.draft,
                          model: JSON.stringify(draft.model),
                          translation_data: JSON.stringify(draft.translations[meta.drafts_lang]),
                        },
                      }]

                    let result = await api.transact({
                      actions
                    }, {
                      blocksBehind: 3,
                      expireSeconds: 30,
                    });

                    meta.drafts.push(findAction(result, "newid").id)

                  }

                  for (let index = 0; index < meta.drafts.length; index++) {
                    let draft_id = meta.drafts[index]
                    
                    let actions = [{
                        account: getTarget('draft'),
                        name: 'publishdraft',
                        authorization: [{
                          actor: getTarget('draft'),
                          permission: 'active',
                        }],
                        data: {
                          creator: getTarget('draft'),
                          draft_id
                        },
                      },
                      {
                        account: getTarget('draft'),
                        name: 'approvedraft',
                        authorization: [{
                          actor: getTarget('draft'),
                          permission: 'active',
                        }],
                        data: {
                          creator: getTarget('draft'),
                          draft_id
                        },
                      },
                      {
                        account: getTarget('draft'),
                        name: 'standardize',
                        authorization: [{
                          actor: getTarget('draft'),
                          permission: 'active',
                        }],
                        data: {
                          creator: getTarget('draft'),
                          draft_id
                        },
                      }]

                    await api.transact({
                      actions: actions
                    }, {
                      blocksBehind: 3,
                      expireSeconds: 30,
                    });
                  }

                  

                //   meta.coop_id = findAction(result, "newid").coop_id
                  

                //   assert.exists(meta.coop_id, 'Успешная регистрация');
                  
                  // Проверьте успешное выполнение транзакции
                } catch (error) {
                  assert.fail(error.message);
                }
              }).timeout(10000);;
            
            
             it('Регистрируем аккаунт для кооператива', async () => {
        
                const email = generateRandomEmail();
                const tgId = 12345;
                const sign = 'signature';
                const userData = { value: 'someUserData' };
                let username

                try {
                  
                  const account = await rpc.get_account(network_config.coopname);
                  username = generateRandomAccountName()

                } catch(e) {
                  username = network_config.coopname                  
                }
                
                meta.coopname = username 

                console.log('\n\t_______ аккаунт кооператива')
                let key = await generateKeypair(username)
                
                const account = {
                  coopname: getTarget('ano'),
                  name: username,
                  pub: network_config.producer_key,
                  userData,
                  sign,
                  tgId,
                  email
                };
                
                const {status, message} = await registerAccount(account);
                
                assert.equal(status, 'ok');
              }).timeout(10000);

             it('Регистрируем аккаунт для контракта токена кооператива', async () => {

                const email = generateRandomEmail();
                const tgId = 12345;
                const sign = 'signature';
                const userData = { value: 'someUserData' };
                let username
                  
                
                try {
                  const temp = await rpc.get_account(network_config.coopcontract);
                  username = generateRandomAccountName()
                  
                } catch(e){
                  
                  username = network_config.coopcontract
                  
                }

                console.log('\n\t_______ аккаунт токена')
                const keys = await generateKeypair(username)


                const account = {
                  coopname: getTarget('ano'),
                  name: username,
                  pub: network_config.accounts.params.default_key,
                  userData,
                  sign,
                  tgId,
                  email
                };


                meta.cooptoken = account.name

                const {status, message} = await registerAccount(account);
                
                assert.equal(status, 'ok');
                
              }).timeout(20000);

             it('Преобретаем ресурсы для установки контракта токена', async () => {
                
                const {status, message} = await buy_resources(api, network, {username: meta.cooptoken, ram_kbytes: 2048})
                assert.equal(status, 'ok');
                
              }).timeout(10000);

             

             it('Устанавливаем контракт токена кооператива', async () => {
                
                const {status, message} = await setContract(api, "eosio.token", meta.cooptoken, network)  
                assert.equal(status, 'ok');
              
              }).timeout(20000);



             it('Регистрируем кооператив', async () => {
                
                try {
                  let result = await api.transact({
                    actions: [{
                      account: getTarget('registrator'),
                      name: 'regorg',
                      authorization: [{
                        actor: getTarget('ano'),
                        permission: 'active',
                      }],
                      data: {
                        coopname: getTarget('ano'),
                        username: meta.coopname,
                        params: {
                          storage: {
                            storage_username: getTarget('ano'),
                            uid: "uid"
                          },
                          is_cooperative: true,
                          coop_type: "conscoop",
                          token_contract: meta.cooptoken,
                          slug: "testcoop",
                          announce: null,
                          description: null,
                          initial: `1000.0000 ${network_config.coopsymbol}`,
                          minimum: `1000.0000 ${network_config.coopsymbol}`,
                          membership: `1000.0000 ${network_config.coopsymbol}`,
                          period: "monthly",
                        }
                      },
                    },
                    {
                      account: getTarget('registrator'),
                      name: 'verificate',
                      authorization: [{
                        actor: getTarget('ano'),
                        permission: 'active',
                      }],
                      data: {
                        username: meta.coopname,
                        procedure: "online"
                      },
                    }
                    ]
                  }, {
                    blocksBehind: 3,
                    expireSeconds: 30,
                  });

                  assert.exists(result.transaction_id, 'Успешная регистрация');
                  

                } catch (error) {
                  console.log(error)
                  assert.fail(error.message);
                }
              }).timeout(10000)


             
             it('Создаём токен кооператива', async () => {

                const result = await create(targets, meta.cooptoken, api, meta.coopname, `1000000000.0000 ${network_config.coopsymbol}`, "");
                
                assert.exists(result, 'ok');
              
              }).timeout(10000);


             it('Регистрируем аккаунт для председателя', async () => {

                const email = generateRandomEmail();
                const tgId = 12345;
                const sign = 'signature';
                const userData = { value: 'someUserData' };
                
                try {
                  
                  const account = await rpc.get_account(network_config.chairman);
                  username = generateRandomAccountName()

                } catch(e) {
                  username = network_config.chairman                  
                }
                
                console.log('\n\t_______ аккаунт председателя')
                const keys = await generateKeypair(username)
                const wif_hash = await ecc.sha256(keys.privateKey)

                console.log("\n\t Хэш ключа для авторизации на бэкенде: ", wif_hash)
                

                const account = {
                  coopname: meta.coopname,
                  name: username,
                  pub: keys.publicKey,
                  userData,
                  sign,
                  tgId,
                  email
                };


                meta.member1 = account.name

                const {status, message} = await registerAccount(account);
                assert.equal(status, 'ok');
              }).timeout(10000);


             it('Создаём совет кооператива без председателя', async () => {
                const chairman = meta.member1;
                // const members = ['tester1', 'tester2']; // Председатель в списке
                
                const members = []
                // console.log("members", members)
                try {
                  let data = {
                    actions: [{
                      account: getTarget('soviet'),
                      name: 'createboard',
                      authorization: [{
                        actor: chairman,
                        permission: 'active',
                      }],
                      data: {
                        coopname: meta.coopname,
                        type: 'soviet',
                        parent_id: 0,
                        chairman,
                        members,
                        name: "Совет кооператива",
                        description: ""
                      },
                    }]
                  }
                  // console.log(data.actions[0])
                  let result = await api.transact(data, {
                    blocksBehind: 3,
                    expireSeconds: 30,
                  });

                  let cons = findConsoleResponses(result)

                  // Здесь можно добавить дополнительные проверки результата, если это необходимо
                  // assert.exists(result.transaction_id, 'Транзакция должна была быть успешной');
                  assert.fail(result.transaction_id, "Совет создан без председателя")
                  // Проверьте успешное выполнение транзакции
                } catch (error) {
                  // console.log("error: ", error.message)
                  assert.exists(error.message, 'assertion failure with message: Председатель кооператива должен быть указан в членах совета');
                }
              });
            



              it('Создаём совет кооператива с председателем', async () => {
                const chairman = meta.member1;
                // const members = ['tester1', 'tester2']; // Председатель в списке
                
                const members = [{
                  username: chairman,
                  is_voting: true,
                  position_title: "Председатель",
                  position: "chairman",
                }]
                const actions = [{
                      account: getTarget('soviet'),
                      name: 'createboard',
                      authorization: [{
                        actor: chairman,
                        permission: 'active',
                      }],
                      data: {
                        coopname: meta.coopname,
                        type: 'soviet',
                        parent_id: 0,
                        chairman,
                        members,
                        name: "Совет кооператива",
                        description: ""
                      },
                    }]
                // console.log("action" , actions[0])

                try {
                  let result = await api.transact({
                    actions
                  }, {
                    blocksBehind: 3,
                    expireSeconds: 30,
                  });

                  let cons = findConsoleResponses(result)
                  
                  // Здесь можно добавить дополнительные проверки результата, если это необходимо
                  assert.exists(result.transaction_id, 'Транзакция должна была быть успешной');

                  // Проверьте успешное выполнение транзакции
                } catch (error) {
                  assert.equal(error.message, 'Председатель кооператива должен быть указан в членах совета');
                }
              });
            

            it('Создаём целевую программу для обмена', async () => {
                try {
                  
                  let result = await api.transact({
                    actions: [{
                      account: getTarget('soviet'),
                      name: 'createprog',
                      authorization: [{
                        actor: meta.member1,
                        permission: 'active',
                      }],
                      data: {
                        coopname: meta.coopname,
                        chairman: meta.member1, 
                        title: "Целевая программа #1", 
                        announce: "ЦПП 1", 
                        description: "описание целевой программы", 
                        preview: "https://img.freepik.com/free-photo/a-picture-of-fireworks-with-a-road-in-the-background_1340-43363.jpg", 
                        images: ["https://img.freepik.com/free-photo/a-picture-of-fireworks-with-a-road-in-the-background_1340-43363.jpg"], 
                        initial: `1.0000 ${network_config.coopsymbol}`, 
                        minimum: `1.0000 ${network_config.coopsymbol}`,
                        maximum: `1.0000 ${network_config.coopsymbol}`,
                        share_contribution: `1.0000 ${network_config.coopsymbol}`,
                        membership_contribution: `1.0000 ${network_config.coopsymbol}`,
                        period: "percase", 
                        category: "ru", 
                        calculation_type: "absolute", 
                        membership_percent_fee: 0,
                        warranty_delay_secs: 3,
                        deadline_for_receipt_secs: 3, 
                      },
                    }]
                  }, {
                    blocksBehind: 3,
                    expireSeconds: 30,
                  });

                  meta.program_id = findAction(result, "program").program_id

                  // Здесь можно добавить дополнительные проверки результата, если это необходимо
                  assert.exists(result.transaction_id, 'Транзакция должна была быть успешной');

                  // Проверьте успешное выполнение транзакции
                } catch (error) {
                  console.error("error.message: ", error.message)
                  assert.fail(error.message, 'Председатель кооператива должен быть указан в членах совета');
                }
            });


              it('Добавляем сотрудника', async () => {
                const chairman = meta.member1;
                // const members = ['tester1', 'tester2']; // Председатель в списке
                
                // eosio::name coopname, eosio::name chairman, eosio::name username, std::vector<right> rights, std::string position_title);

                const rights = [{
                  contract: getTarget('soviet'),
                  action_name: "validate"
                },
                {
                  contract: getTarget('marketplace'),
                  action_name: "moderate"
                },
                {
                  contract: getTarget('marketplace'),
                  action_name: "prohibit"
                }
                ]
                
                try {
                  let result = await api.transact({
                    actions: [{
                      account: getTarget('soviet'),
                      name: 'addstaff',
                      authorization: [{
                        actor: chairman,
                        permission: 'active',
                      }],
                      data: {
                        coopname: meta.coopname,
                        chairman,
                        username: meta.member1,
                        rights,
                        position_title: "Важный сотрудник",
                      },
                    }]
                  }, {
                    blocksBehind: 3,
                    expireSeconds: 30,
                  });

                  let cons = findConsoleResponses(result)
                  
                  // Здесь можно добавить дополнительные проверки результата, если это необходимо
                  assert.exists(result.transaction_id, 'Транзакция должна была быть успешной');

                  // Проверьте успешное выполнение транзакции
                } catch (error) {
                  console.error("error.message: ", error.message)
                  assert.fail(error.message, 'Председатель кооператива должен быть указан в членах совета');
                }
              });
            

             it('Создаём адрес для приёма-выдачи товара', async () => {
                
                let data = {
                  coopname: meta.coopname,
                  chairman: meta.member1,
                  cooplate: "",
                  data: {
                    "latitude": "55.7558",
                    "longitude": "37.6176",
                    "country": "Russia",
                    "state": "Moscow",
                    "city": "Moscow",
                    "district": "Tverskoy",
                    "street": "Tverskaya Street",
                    "house_number": "7",
                    "building_section": "A",
                    "unit_number": "12",
                    "directions": "Enter from Tverskaya Street, through the main entrance, take the elevator to the 3rd floor, unit 12 is on the right.",
                    "phone_number": "+7 495 123 4567",
                    "business_hours": "Mon-Fri 9:00-18:00"
                  },
                  meta: JSON.stringify({})  
                }

                // console.log("data:", data)
                try {

                  let result = await api.transact({
                    actions: [{
                      account: getTarget('soviet'),
                      name: 'creaddress',
                      authorization: [{
                        actor: meta.member1,
                        permission: 'active',
                      }],
                      data: data
                    }]
                  }, {
                    blocksBehind: 3,
                    expireSeconds: 30,
                  });

                  assert.exists(result.transaction_id, 'Адрес успешно создан');
                  // console.log("result: ", result.processed.action_traces)
                  // meta.address_id = findAction(result, "newid").id
                  // console.log("exchange_id: ", meta.exchange_id)

                  // let cons = findConsoleResponses(result)
                  // console.log("console>", cons)

                } catch (error) {
                  // console.log(error)
                  console.error(error.json)
                  assert.fail(error.message);
                }
              }).timeout(10000);



             it('Регистрируем аккаунт для пайщика', async () => {

                const email = generateRandomEmail();
                const tgId = 12345;
                const sign = 'signature';
                const userData = { value: 'someUserData' };
                const username = generateRandomAccountName()
                
                console.log('\n\t_______ аккаунт пайщика (заказчика)')
                const keys = await generateKeypair(username)

                const account = {
                  coopname: meta.coopname,
                  name: username,
                  pub: keys.publicKey,
                  userData,
                  sign,
                  tgId,
                  email
                };

                meta.member2 = account.name

                const {status, message} = await registerAccount(account);
                assert.equal(status, 'ok');

                const registeredAccount1 = await getTableRow(rpc, getTarget('registrator'), getTarget('registrator'), 'accounts', meta.member2, 1);
                assert.exists(registeredAccount1, 'Запись аккаунта не найдена в таблице registrator -> accounts');

              }).timeout(10000);


              it('Создаём карточку пайщика', async () => {

                const individ = await regindivid(targets, api, meta.coop_id, meta.member2);

                
                
                const registeredAccount1 = await getTableRow(rpc, getTarget('registrator'), getTarget('registrator'), 'accounts', meta.member2, 1);
                assert.exists(registeredAccount1, 'Запись аккаунта не найдена в таблице registrator -> accounts');

                
              }).timeout(10000);

              it('Отправляем заявление от пайщика на вступление в кооператив', async () => {

                const result = await joincoop(targets, api, meta.coopname, meta.member2);

                meta.joincoop_decision_id = findAction(result, "draft").decision_id

                const registeredAccount2 = await getTableRow(rpc, getTarget('soviet'), meta.coopname, 'decisions', meta.joincoop_decision_id);
                
                assert.exists(registeredAccount2, 'Запись аккаунта не найдена в таблице soviet -> decisions');
                
              }).timeout(10000);

            it('Валидируем администратором поступление оплаты и корректность данных пайщика', async () => {
                
                await validate(targets, api, meta.coopname, meta.member1, meta.joincoop_decision_id);
                // Получаем запись из таблицы после добавления
                const decision = await getTableRow(rpc, getTarget('soviet'), meta.coopname, 'decisions', meta.joincoop_decision_id, 1);
                assert.equal(decision.validated, 1);
                
              }).timeout(10000);

            
            it('Голосуем председателем как членом совета за решение', async () => {

                await votefor(targets, api, meta.coopname, meta.member1, meta.joincoop_decision_id);

                // Проверяем, что голос зарегистрирован
                const decision = await getTableRow(rpc, getTarget('soviet'), meta.coopname, 'decisions', meta.joincoop_decision_id, 1);
                assert.equal(decision.votes_for.length, 1);
                assert.equal(decision.approved, 1);
                
              }).timeout(10000);

              
              it('Утверждаем решение председателем совета', async () => {
                const chairman = meta.member1;

                try {
                  await authorize(targets, api, meta.coopname, chairman, meta.joincoop_decision_id);
                } catch (e) {
                  assert.fail(e.message)
                }
                // Получаем запись из таблицы после добавления
                const decision = await getTableRow(rpc, getTarget('soviet'), meta.coopname, 'decisions', meta.joincoop_decision_id, 1);
                
                assert.equal(decision.authorized, 1);

              });

              it('Исполняем решение совета о принятии пайщика в кооператив', async () => {
                const chairman = meta.member1;
                await exec(targets, api, meta.coopname, chairman, meta.joincoop_decision_id);
                // Получаем запись из таблицы после добавления
                const decision = await getTableRow(rpc, getTarget('soviet'), meta.coopname, 'decisions', meta.joincoop_decision_id, 1);
                if (decision)
                  assert.fail("Решение не удалено из RAM");

              });

              it('Проверяем активный статус пайщика', async () => {
                // Получаем запись из таблицы после добавления
                const account = await getTableRow(rpc, getTarget('registrator'), getTarget('registrator'), 'accounts', meta.member2, 1);
                
                assert.equal(account.status, "active");
              });



              it('Пополняем баланс пайщику для совершения заказа', async () => {
                try {
                  //TODO заменить это на нормальное пополнение баланса взносом

                  await issue(targets, meta.cooptoken, api, meta.member2, `1000.0000 ${network_config.coopsymbol}`, "");
                  
                  const transferData = {
                        from: meta.member2,
                        to: getTarget('soviet'),
                        quantity: `100.0000 ${network_config.coopsymbol}`,
                        memo: meta.coopname
                      }

                  // console.log("transferData: ", transferData)
                  // console.log("contract token: ", meta.cooptoken)

                  let result = await api.transact({
                    actions: [{
                      account: meta.cooptoken,
                      name: 'transfer',
                      authorization: [{
                        actor: meta.member2,
                        permission: 'active',
                      }],
                      data: transferData
                    }]
                  }, {
                    blocksBehind: 3,
                    expireSeconds: 30,
                  });


                  await printWallet(rpc, meta.coopname, meta.member2, "ЗАКАЗЧИКА")

                } catch (e) {
                  assert.fail(e.message)
                }
              });



              /////////////////////////////////////
             it('Регистрируем аккаунт для второго пайщика (поставщика)', async () => {

                const email = generateRandomEmail();
                const tgId = 12345;
                const sign = 'signature';
                const userData = { value: 'someUserData' };
                const username = generateRandomAccountName()
                
                console.log('\n\t_______ аккаунт пайщика (поставщика)')
                const keys = await generateKeypair(username)

                const account = {
                  coopname: meta.coopname,
                  name: username,
                  pub: keys.publicKey,
                  userData,
                  sign,
                  tgId,
                  email
                };

                meta.member3 = account.name

                const {status, message} = await registerAccount(account);
                assert.equal(status, 'ok');

                const registeredAccount1 = await getTableRow(rpc, getTarget('registrator'), getTarget('registrator'), 'accounts', meta.member3, 1);
                assert.exists(registeredAccount1, 'Запись аккаунта не найдена в таблице registrator -> accounts');

              }).timeout(10000);


              it('Создаём карточку второго пайщика (поставщика)', async () => {

                const individ = await regindivid(targets, api, meta.coop_id, meta.member3);

                
                const registeredAccount1 = await getTableRow(rpc, getTarget('registrator'), getTarget('registrator'), 'accounts', meta.member3, 1);
                assert.exists(registeredAccount1, 'Запись аккаунта не найдена в таблице registrator -> accounts');

                
              }).timeout(10000);

              it('Отправляем заявление от пайщика (поставщка) на вступление в кооператив', async () => {

                const result = await joincoop(targets, api, meta.coopname, meta.member3);

                meta.joincoop_decision_id2 = findAction(result, "draft").decision_id

                const registeredAccount2 = await getTableRow(rpc, getTarget('soviet'), meta.coopname, 'decisions', meta.joincoop_decision_id2);
                
                assert.exists(registeredAccount2, 'Запись аккаунта не найдена в таблице soviet -> decisions');
                
              }).timeout(10000);


            it('Валидируем администратором поступление оплаты и корректность данных пайщика', async () => {
                
                await validate(targets, api, meta.coopname, meta.member1, meta.joincoop_decision_id2);
                // Получаем запись из таблицы после добавления
                const decision = await getTableRow(rpc, getTarget('soviet'), meta.coopname, 'decisions', meta.joincoop_decision_id2, 1);
                assert.equal(decision.validated, 1);
                
              }).timeout(10000);

            
            it('Голосуем председателем как членом совета за решение', async () => {

                await votefor(targets, api, meta.coopname, meta.member1, meta.joincoop_decision_id2);

                // Проверяем, что голос зарегистрирован
                const decision = await getTableRow(rpc, getTarget('soviet'), meta.coopname, 'decisions', meta.joincoop_decision_id2, 1);
                assert.equal(decision.votes_for.length, 1);
                assert.equal(decision.approved, 1);
                
              }).timeout(10000);

              
              it('Утверждаем решение председателем совета', async () => {
                const chairman = meta.member1;

                try {
                  await authorize(targets, api, meta.coopname, chairman, meta.joincoop_decision_id2);
                } catch (e) {
                  assert.fail(e.message)
                }
                // Получаем запись из таблицы после добавления
                const decision = await getTableRow(rpc, getTarget('soviet'), meta.coopname, 'decisions', meta.joincoop_decision_id2, 1);
                
                assert.equal(decision.authorized, 1);

              });

              it('Исполняем решение совета о принятии пайщика в кооператив', async () => {
                const chairman = meta.member1;
                await exec(targets, api, meta.coopname, chairman, meta.joincoop_decision_id2);
                // Получаем запись из таблицы после добавления
                const decision = await getTableRow(rpc, getTarget('soviet'), meta.coopname, 'decisions', meta.joincoop_decision_id2, 1);
                if (decision)
                  assert.fail("Решение не удалено из RAM");

              });

              it('Проверяем активный статус пайщика', async () => {
                // Получаем запись из таблицы после добавления
                const account = await getTableRow(rpc, getTarget('registrator'), getTarget('registrator'), 'accounts', meta.member3, 1);
                
                assert.equal(account.status, "active");
              });


             it('Создаём открытую заявку на поставку от поставщика', async () => {
                meta.product_lifecycle_secs = 10

                let data = {
                  params: {
                    coopname: meta.coopname,
                    username: meta.member3,
                    parent_id: 0,
                    program_id: meta.program_id,
                    pieces: 10,
                    price_for_piece: `10.0000 ${network_config.coopsymbol}`,
                    product_lifecycle_secs: meta.product_lifecycle_secs,
                    data: JSON.stringify({title: 'Лакомый продукт', description: "Чёткое описание", preview: "https://img.freepik.com/premium-vector/grocery-store-set_267448-203.jpg", images: ["https://img.freepik.com/premium-vector/grocery-store-set_267448-203.jpg", "https://pictures.pibig.info/uploads/posts/2023-04/1681263763_pictures-pibig-info-p-produkti-risunok-vkontakte-3.jpg"]}),
                    meta: JSON.stringify({}),
                    document: { //документ пустой потому что открытая заявка на поставку
                      hash: "",
                      pkey: "",
                      sign: "",
                      meta: ""
                    }
                  }
                }
                // console.log("data:", data)
                try {

                  let result = await api.transact({
                    actions: [{
                      account: getTarget('marketplace'),
                      name: 'offer',
                      authorization: [{
                        actor: meta.member3,
                        permission: 'active',
                      }],
                      data: data
                    }]
                  }, {
                    blocksBehind: 3,
                    expireSeconds: 30,
                  });

                  assert.exists(result.transaction_id, 'Предложение успешно создано');
                  // console.log("result: ", result.processed.action_traces)
                  meta.exchange_id1 = findAction(result, "newid").id
                  // console.log("exchange_id: ", meta.exchange_id)

                  let cons = findConsoleResponses(result)
                  // console.log("console>", cons)

                  await printWallet(rpc, meta.coopname, meta.member3, "ПОСТАВЩИКА")

                } catch (error) {
                  // console.log(error)
                  console.log(error.json)
                  assert.fail(error.message);
                }
              }).timeout(10000);


             it('Проводим модерацию предложения', async () => {
                
                const data = {
                  coopname: meta.coopname,
                  username: meta.member1,
                  exchange_id: meta.exchange_id1,
                }
                // console.log("data", data)
                try {

                  let result = await api.transact({
                    actions: [{
                      account: getTarget('marketplace'),
                      name: 'moderate',
                      authorization: [{
                        actor: meta.member1,
                        permission: 'active',
                      }],
                      data
                    }]
                  }, {
                    blocksBehind: 3,
                    expireSeconds: 30,
                  });

                  assert.exists(result.transaction_id, 'Предложение не прошло модерацию');
                  
                  // let cons = findConsoleResponses(result)
                  
                } catch (error) {
                  assert.fail(error.message);
                }
              }).timeout(10000);

             it('Создаём встречную заявку на поставку от лица пайщика', async () => {
                
                let data = {
                  params: {
                    coopname: meta.coopname,
                    username: meta.member2,
                    parent_id: meta.exchange_id1,
                    program_id: meta.program_id,
                    pieces: 1,
                    price_for_piece: `10.0000 ${network_config.coopsymbol}`,
                    product_lifecycle_secs: 0,
                    data: JSON.stringify({title: 'Встречный лакомый продукт', description: "Встречное чёткое описание", preview: "https://img.freepik.com/premium-vector/grocery-store-set_267448-203.jpg", images: ["https://img.freepik.com/premium-vector/grocery-store-set_267448-203.jpg", "https://pictures.pibig.info/uploads/posts/2023-04/1681263763_pictures-pibig-info-p-produkti-risunok-vkontakte-3.jpg"]}),
                    meta: JSON.stringify({}),
                    document: { //документ пустой потому что открытая заявка на поставку
                      hash: "хэш заявления на возврат продуктом",
                      pkey: "публичный ключ заказчика",
                      sign: "подпись заказчика",
                      meta: "мета данные документа заказчика"
                    }
                  }
                }
                // console.log("data:", data)
                try {

                  let result = await api.transact({
                    actions: [{
                      account: getTarget('marketplace'),
                      name: 'order',
                      authorization: [{
                        actor: meta.member2,
                        permission: 'active',
                      }],
                      data: data
                    }]
                  }, {
                    blocksBehind: 3,
                    expireSeconds: 30,
                  });

                  assert.exists(result.transaction_id, 'Предложение успешно создано');
                  // console.log("result: ", result.processed.action_traces)
                  meta.exchange_id2 = findAction(result, "newid").id
                  // console.log("exchange_id: ", meta.exchange_id)

                  let cons = findConsoleResponses(result)
                  
                  // console.log("console>", cons)
                  await printWallet(rpc, meta.coopname, meta.member2, "ЗАКАЗЧИКА")
                  // await printWallet(rpc, meta.coopname, meta.member3, "ПОСТАВЩИКА")

                } catch (error) {
                  // console.log(error)
                  console.log(error.json)
                  assert.fail(error.message);
                }
              }).timeout(10000);


             it('Выражаем согласие поставить продукт', async () => {
                
                // console.log("data", data)
                try {
                  let data = {
                        coopname: meta.coopname,
                        username: meta.member3,
                        exchange_id: meta.exchange_id2,
                        document: {
                          hash: "хэш заявления на взнос продуктом",
                          pkey: "публичный ключ поставщика",
                          sign: "подпись поставщика",
                          meta: "мета данные документа поставщика"
                        }
                      }
                  // console.log("data: ", data)
                  let result = await api.transact({
                    actions: [{
                      account: getTarget('marketplace'),
                      name: 'accept',
                      authorization: [{
                        actor: meta.member3,
                        permission: 'active',
                      }],
                      data
                    }]
                  }, {
                    blocksBehind: 3,
                    expireSeconds: 30,
                  });

                  assert.exists(result.transaction_id, 'Согласие не принято');
                  
                  let cons = findConsoleResponses(result)
                  // console.log("RESULT: ", result)
                  // console.log("manual console: ", result.processed.action_traces[0].inline_traces)
                  // console.log("console: ", cons)
                  // 
                  
                  const actions = findActions(result, "draft")
                  

                  meta.decisions = []
                  actions.forEach((action, index) => meta.decisions[index] = {...action.data})
                  
                  // console.log("Черновики решений: ", meta.decisions)

                  await printWallet(rpc, meta.coopname, meta.member2, "ЗАКАЗЧИКА")
                  await printWallet(rpc, meta.coopname, meta.member3, "ПОСТАВЩИКА")


                } catch (error) {
                  if (error.json)
                    console.log(error.json.error.details)
                  assert.fail(error.message);
                }
              }).timeout(10000);


              it('Получаем заявки и черновики решений', async () => {
                const chairman = meta.member1;
                
                const order_1 = await getTableRow(rpc, getTarget('marketplace'), meta.coopname, 'exchange', meta.exchange_id1, 1);
                console.log("order_1: ", order_1)

                // console.log("meta.decisions[0]: ", meta.decisions[0])
                // console.log("meta.decisions", meta.decisions)

                const decision_1 = await getTableRow(rpc, getTarget('soviet'), meta.coopname, 'decisions', meta.decisions[0].decision_id, 1);
                console.log("decision_1: ", decision_1);

                const order_2 = await getTableRow(rpc, getTarget('marketplace'), meta.coopname, 'exchange', meta.exchange_id2, 1);
                console.log("order_2: ", order_2)   

                const decision_2 = await getTableRow(rpc, getTarget('soviet'), meta.coopname, 'decisions', meta.decisions[1].decision_id, 1);
                console.log("decision_2: ", decision_2);
                
                const batch = await getTableRow(rpc, getTarget('soviet'), meta.coopname, 'changes', meta.exchange_id2, 2);
                console.log("batch: ", batch);
                
                meta.contribution_product_decision_id = batch.contribution_product_decision_id
                meta.return_product_decision_id = batch.return_product_decision_id

              });

            
            it('Голосуем председателем как членом совета за решение о приёме имущества', async () => {

                await votefor(targets, api, meta.coopname, meta.member1, meta.contribution_product_decision_id);

                // Проверяем, что голос зарегистрирован
                const decision = await getTableRow(rpc, getTarget('soviet'), meta.coopname, 'decisions', meta.contribution_product_decision_id, 1);
                assert.equal(decision.votes_for.length, 1);
                assert.equal(decision.approved, 1);


              }).timeout(10000);

              
              it('Утверждаем решение о приёме взноса председателем совета', async () => {
                const chairman = meta.member1;

                try {
                  await authorize(targets, api, meta.coopname, chairman, meta.contribution_product_decision_id, "hash_of_contribution", "pkey_of_contribution", "sign_of_contribution", "meta_of_contribution");
                } catch (e) {
                  assert.fail(e.message)
                }
                // Получаем запись из таблицы после добавления
                const decision = await getTableRow(rpc, getTarget('soviet'), meta.coopname, 'decisions', meta.contribution_product_decision_id, 1);
                
                assert.equal(decision.authorized, 1);

              });

              it('Исполняем решение совета о принятии взноса в кооператив', async () => {
                const chairman = meta.member1;
                await exec(targets, api, meta.coopname, chairman, meta.contribution_product_decision_id);
                // Получаем запись из таблицы после добавления
                const decision = await getTableRow(rpc, getTarget('soviet'), meta.coopname, 'decisions', meta.contribution_product_decision_id, 1);
                
                console.log("decision после утверждения: ", decision)

                console.log("Смотрим изменение статуса (не должно быть): ")
                const order_2 = await getTableRow(rpc, getTarget('marketplace'), meta.coopname, 'exchange', meta.exchange_id2, 1);
                console.log("order_2: ", order_2) 

                assert.equal(order_2.status, "accepted")

                if (!decision)
                  assert.fail("Решение удалено из RAM");

              });





            it('Голосуем председателем как членом совета за решение о возврате имущества', async () => {

                await votefor(targets, api, meta.coopname, meta.member1, meta.return_product_decision_id);

                // Проверяем, что голос зарегистрирован
                const decision = await getTableRow(rpc, getTarget('soviet'), meta.coopname, 'decisions', meta.return_product_decision_id, 1);
                assert.equal(decision.votes_for.length, 1);
                assert.equal(decision.approved, 1);


              }).timeout(10000);

              
              it('Утверждаем решение о приёме взноса председателем совета', async () => {
                const chairman = meta.member1;

                try {
                  await authorize(targets, api, meta.coopname, chairman, meta.return_product_decision_id, "hash_of_return", "pkey_of_return", "sign_of_return", "meta_of_return");
                } catch (e) {
                  assert.fail(e.message)
                }
                // Получаем запись из таблицы после добавления
                const decision = await getTableRow(rpc, getTarget('soviet'), meta.coopname, 'decisions', meta.return_product_decision_id, 1);
                
                assert.equal(decision.authorized, 1);

              });

              it('Исполняем решение совета о принятии взноса в кооператив', async () => {
                const chairman = meta.member1;
                const result = await exec(targets, api, meta.coopname, chairman, meta.return_product_decision_id);
                // Получаем запись из таблицы после добавления
                const decision = await getTableRow(rpc, getTarget('soviet'), meta.coopname, 'decisions', meta.return_product_decision_id, 1);
                
                let cons = findConsoleResponses(result)
                console.log("console: ", cons)
                
                console.log("decision после утверждения: ", decision)

                console.log("Смотрим изменение статуса на authorized и на решения совета: ")
                const order_2 = await getTableRow(rpc, getTarget('marketplace'), meta.coopname, 'exchange', meta.exchange_id2, 1);
                console.log("order_2: ", order_2) 

                assert.equal(order_2.status, "authorized")

                if (decision)
                  assert.fail("Решение не удалено из RAM");

                const batch = await getTableRow(rpc, getTarget('soviet'), meta.coopname, 'changes', meta.exchange_id2, 2);
                
                if (batch)
                  assert.fail("Пачка решений должна удаляться из RAM");
              });


              it('Ждём, пока поставщик доедет до кооперативного участка', async () => {
                // nothing
              })

              
              it('Председатель осмотрел имущество пайщика и подтвердил приём', async () => {
                const chairman = meta.member1;
                const data = {
                      coopname: meta.coopname,
                      username: chairman,
                      exchange_id: meta.exchange_id2,
                      document: {
                        hash: "хэш акта приёма от председателя",
                        pkey: "публичный ключ на хэша акта приёма от председателя",
                        sign: "подпись хэша акта приёма от председателя", 
                        meta: "мета акта приёма от председателя", 
                      }
                    }
                
                let actions = [{
                    account: getTarget('marketplace'),
                    name: 'supplycnfrm',
                    authorization: [{
                      actor: chairman,
                      permission: 'active',
                    }],
                    data
                  }]

                let result = await api.transact({
                  actions
                }, {
                  blocksBehind: 3,
                  expireSeconds: 30,
                });


                console.log("Смотрим изменение статуса на supplied1 на встречной заявке: ")
                const order_2 = await getTableRow(rpc, getTarget('marketplace'), meta.coopname, 'exchange', meta.exchange_id2, 1);
                console.log("встречная аявка: ", order_2) 

                assert.equal(order_2.status, "supplied1")

              });




            it('Поставщик подтвердил передачу имущества кооперативу', async () => {
                const chairman = meta.member1;
                
                const data = {
                      coopname: meta.coopname,
                      username: meta.member3,
                      exchange_id: meta.exchange_id2,
                      document: {
                        hash: "хэш акта приёма от пайщика",
                        pkey: "публичный ключ на хэша акта приёма от пайщика",
                        sign: "подпись хэша акта приёма от пайщика", 
                        meta: "мета акта приёма от пайщика", 
                      }
                    }
                let actions = [{
                    account: getTarget('marketplace'),
                    name: 'supply',
                    authorization: [{
                      actor: meta.member3,
                      permission: 'active',
                    }],
                    data
                  }]

                let result = await api.transact({
                  actions
                }, {
                  blocksBehind: 3,
                  expireSeconds: 30,
                });


                console.log("Смотрим изменение статуса на supplied2 на встречной заявке: ")
                const order_2 = await getTableRow(rpc, getTarget('marketplace'), meta.coopname, 'exchange', meta.exchange_id2, 1);
                console.log("встречная аявка: ", order_2) 

                console.log("Должен появиться заблокированный баланс кошелька у поставщика")
                await printWallet(rpc, meta.coopname, meta.member2, "ЗАКАЗЧИКА")
                await printWallet(rpc, meta.coopname, meta.member3, "ПОСТАВЩИКА")


                assert.equal(order_2.status, "supplied2")

              });


            it('Председатель самостоятельно организует доставку до КУ заказчика', async () => {
                const chairman = meta.member1;
                
                const data = {
                      coopname: meta.coopname,
                      username: meta.member1,
                      exchange_id: meta.exchange_id2,
                      document: {
                        hash: "хэш акта приёма от пайщика",
                        pkey: "публичный ключ на хэша акта приёма от пайщика",
                        sign: "подпись хэша акта приёма от пайщика", 
                        meta: "мета акта приёма от пайщика", 
                      }
                    }
                let actions = [{
                    account: getTarget('marketplace'),
                    name: 'delivered',
                    authorization: [{
                      actor: meta.member1,
                      permission: 'active',
                    }],
                    data
                  }]

                let result = await api.transact({
                  actions
                }, {
                  blocksBehind: 3,
                  expireSeconds: 30,
                });


                console.log("Смотрим изменение статуса на delivered на встречной заявке: ")
                const order_2 = await getTableRow(rpc, getTarget('marketplace'), meta.coopname, 'exchange', meta.exchange_id2, 1);
                console.log("встречная аявка: ", order_2) 

                assert.equal(order_2.status, "delivered")

              });


            it('Пайщик-заказчик подтверждает получение имущества в должном качестве подписью акта', async () => {
                const chairman = meta.member1;
                
                const data = {
                      coopname: meta.coopname,
                      username: meta.member2,
                      exchange_id: meta.exchange_id2,
                      document: {
                        hash: "хэш акта выдачи от пайщика",
                        pkey: "публичный ключ на хэше акта выдачи от пайщика",
                        sign: "подпись хэша акта выдачи от пайщика", 
                        meta: "мета акта выдачи от пайщика", 
                      }
                    }
                let actions = [{
                    account: getTarget('marketplace'),
                    name: 'recieve',
                    authorization: [{
                      actor: meta.member2,
                      permission: 'active',
                    }],
                    data
                  }]

                let result = await api.transact({
                  actions
                }, {
                  blocksBehind: 3,
                  expireSeconds: 30,
                });


                console.log("Смотрим изменение статуса на recieved1 на встречной заявке: ")
                const order_2 = await getTableRow(rpc, getTarget('marketplace'), meta.coopname, 'exchange', meta.exchange_id2, 1);
                console.log("встречная аявка: ", order_2) 

                assert.equal(order_2.status, "recieved1")

              });


            it('Председатель подтверждает выдачу имущества подписью акта', async () => {
                const chairman = meta.member1;
                
                const data = {
                      coopname: meta.coopname,
                      username: meta.member1,
                      exchange_id: meta.exchange_id2,
                      document: {
                        hash: "хэш акта выдачи от председателя",
                        pkey: "публичный ключ на хэше акта выдачи от председателя",
                        sign: "подпись хэша акта выдачи от председателя", 
                        meta: "мета акта выдачи от председателя", 
                      }
                    }

                let actions = [{
                    account: getTarget('marketplace'),
                    name: 'recievecnfrm',
                    authorization: [{
                      actor: meta.member1,
                      permission: 'active',
                    }],
                    data
                  }]

                let result = await api.transact({
                  actions
                }, {
                  blocksBehind: 3,
                  expireSeconds: 30,
                });


                console.log("Смотрим изменение статуса на recieved2 на встречной заявке: ")
                const order_2 = await getTableRow(rpc, getTarget('marketplace'), meta.coopname, 'exchange', meta.exchange_id2, 1);
                console.log("встречная аявка: ", order_2) 

                console.log("Начинается гарантийная задержка, изменений по балансам быть не должно: ")
                await printWallet(rpc, meta.coopname, meta.member2, "ЗАКАЗЧИКА")
                await printWallet(rpc, meta.coopname, meta.member3, "ПОСТАВЩИКА")

                assert.equal(order_2.status, "recieved2")

              });
              
              it('Неудачная заблокировка денег поставщику до истечения срока гарантии', async () => {
                const chairman = meta.member1;
                try{


                 
                  let actions = [{
                      account: getTarget('marketplace'),
                      name: 'complete',
                      authorization: [{
                        actor: meta.member2,
                        permission: 'active',
                      }],
                      data: {
                        coopname: meta.coopname,
                        username: meta.member2,
                        exchange_id: meta.exchange_id2
                      }
                    }]

                  let result = await api.transact({
                    actions
                  }, {
                    blocksBehind: 3,
                    expireSeconds: 30,
                  });

                    assert.fail("Удалось разблокировать средства до истечения гарантии")
                  } catch(e){

                  }

              });

              const sleep_time = meta.product_lifecycle_secs
              console.log("sleep_time: ", sleep_time)

              it('Ждём исхода гарантийной задержки', async () => {
                
                await sleep(meta.product_lifecycle_secs)

              }).timeout(60000);
            


              it('Разблокируем деньги продавцу', async () => {
                const chairman = meta.member1;
                
               
                let actions = [{
                    account: getTarget('marketplace'),
                    name: 'complete',
                    authorization: [{
                      actor: meta.member2,
                      permission: 'active',
                    }],
                    data: {
                      coopname: meta.coopname,
                      username: meta.member2,
                      exchange_id: meta.exchange_id2
                    }
                  }]

                let result = await api.transact({
                  actions
                }, {
                  blocksBehind: 3,
                  expireSeconds: 30,
                });


                console.log("Смотрим изменение статуса на completed на встречной заявке: ")
                const order_2 = await getTableRow(rpc, getTarget('marketplace'), meta.coopname, 'exchange', meta.exchange_id2, 1);
                console.log("встречная аявка: ", order_2) 

                console.log("баланс заказчика должен быть списан, в программе ничего не быть. баланс поставщика должен быть разблокирован.")
                await printWallet(rpc, meta.coopname, meta.member2, "ЗАКАЗЧИКА")
                await printWallet(rpc, meta.coopname, meta.member3, "ПОСТАВЩИКА")

                assert.equal(order_2.status, "completed")

              });

             //COMPLETE (выдать деньги)
              // через задержку (сразу нельзя)
             
             //DISPUTE (открыть гарантийный спор)
              // только во время задержки






             // it('Голосуем председателем за решение принять взнос', async () => {

             //    await votefor(targets, api, meta.coopname, meta.member1, meta.joincoop_decision_id);

             //    // Проверяем, что голос зарегистрирован
             //    const decision = await getTableRow(rpc, getTarget('soviet'), meta.coopname, 'decisions', meta.joincoop_decision_id, 1);
             //    assert.equal(decision.votes_for.length, 1);
             //    assert.equal(decision.approved, 1);
                
             //  }).timeout(10000);

            
            // it('Голосуем председателем за решение вернуть взнос', async () => {

             //    await votefor(targets, api, meta.coopname, meta.member1, meta.joincoop_decision_id);

             //    // Проверяем, что голос зарегистрирован
             //    const decision = await getTableRow(rpc, getTarget('soviet'), meta.coopname, 'decisions', meta.joincoop_decision_id, 1);
             //    assert.equal(decision.votes_for.length, 1);
             //    assert.equal(decision.approved, 1);
                
             //  }).timeout(10000);



              
             //  it('Утверждаем решение председателем совета', async () => {
             //    const chairman = meta.member1;

             //    try {
             //      await authorize(targets, api, meta.coopname, chairman, meta.joincoop_decision_id);
             //    } catch (e) {
             //      assert.fail(e.message)
             //    }
             //    // Получаем запись из таблицы после добавления
             //    const decision = await getTableRow(rpc, getTarget('soviet'), meta.coopname, 'decisions', meta.joincoop_decision_id, 1);
                
             //    assert.equal(decision.authorized, 1);

             //  });

             //  it('Исполняем решение совета о принятии пайщика в кооператив', async () => {
             //    const chairman = meta.member1;
             //    await exec(targets, api, meta.coopname, chairman, meta.joincoop_decision_id);
             //    // Получаем запись из таблицы после добавления
             //    const decision = await getTableRow(rpc, getTarget('soviet'), meta.coopname, 'decisions', meta.joincoop_decision_id, 1);
             //    if (decision)
             //      assert.fail("Решение не удалено из RAM");

             //  });


  //end
            });


            // describe('Регистрация аккаунта', () => {
            //   it('Регистрируем новый аккаунт', async () => {

                
                
            //     const email = generateRandomEmail();
            //     const tgId = 12345;
            //     const sign = 'signature';
            //     const userData = { value: 'someUserData' };

            //     const account = {
            //       coop_id: meta.coop_id,
            //       name: generateRandomAccountName(),
            //       pub: 'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV',
            //       userData,
            //       sign,
            //       tgId,
            //       email
            //     };

            //     meta.username = account.name

            //     const {status, message} = await registerAccount(account);
            //     assert.equal(status, 'ok');

            //     //regindivid
            //     const individ = await regindivid(api, meta.coop_id, account.name);

            //     console.log("findAction(result, 'newid'): ", findAction(individ, "newid"))

            //     meta.individual_decision_id = findAction(individ, "newid")
                

            //     // Получаем запись из таблицы после регистрации
            //     const secondary_key = eosjsAccountName.nameToUint64(account.name);

            //     const registeredAccount1 = await getTableRow(rpc, 'registrator', 'registrator', 'accounts', account.name, 1);
            //     assert.exists(registeredAccount1, 'Запись аккаунта не найдена в таблице registrator -> accounts');

            //     const registeredAccount2 = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', secondary_key, 2);
            //     meta.decisionId = registeredAccount2.id
            //     assert.exists(registeredAccount2, 'Запись аккаунта не найдена в таблице soviet -> decisions');

                
            //     describe('Голосование за решение', () => {
            //       const decision_id = meta.decisionId;

            //       const members = ['chairman', 'tester1', 'tester2', 'tester3', 'tester4'];

            //       it('Должно успешно зарегистрировать голос за решение от допустимого члена', async () => {
            //         // Голосуем первым членом

            //         await votefor(api, members[0], decision_id);

            //         // Проверяем, что голос зарегистрирован
            //         const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', decision_id, 1);
            //         assert.equal(decision.votes_for.length, 1);
            //         assert.equal(decision.approved, 0);
            //       });

            //       it('Получаем принятое решение после достижения консенсуса советом', async () => {
            //         // Голосуем оставшимися необходимыми членами
            //         await votefor(api, members[1], decision_id);
            //         await votefor(api, members[2], decision_id);

            //         // Проверяем, что решение одобрено
            //         const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', decision_id, 1);
            //         assert.equal(decision.votes_for.length, 3);
            //         assert.equal(decision.approved, 1);

            //       });

            //       it('Ненельзя голосовать за решение недопустимому члену', async () => {
            //         // Пытаемся голосовать недопустимым членом
            //         const invalidMember = 'tester5';
            //         try {
            //           await votefor(api, invalidMember, decision_id);
            //           assert.fail('Голосование недопустимым членом не должно быть допустимо');
            //         } catch (error) {

            //           assert.equal(error.message, 'assertion failure with message: Вы не являетесь членом совета'); // Предполагаемое сообщение об ошибке
            //         }

            //         // Проверяем, что голос не зарегистрирован
            //         const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', decision_id, 1);

            //         assert.equal(decision.votes_for.length, 3); // Количество голосов осталось прежним
            //       });


            //       it('Снимаем одобрение с решения при снятии голоса', async () => {
            //         // Голосуем оставшимися необходимыми членами
            //         await cancelVote(targets, api, members[1], decision_id);

            //         // Проверяем, что решение одобрено
            //         const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', decision_id, 1);
            //         assert.equal(decision.votes_for.length, 2);
            //         assert.equal(decision.approved, 0);

            //       });



            //       it('Возвращаем одобрение при возврате голоса', async () => {
            //         // Голосуем оставшимися необходимыми членами
            //         await votefor(api, members[1], decision_id);

            //         // Проверяем, что решение одобрено
            //         const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', decision_id, 1);
            //         assert.equal(decision.votes_for.length, 3);
            //         assert.equal(decision.approved, 1);

            //       });


            //     });


            //     describe('Голосование против решения', () => {
            //       const decision_id = meta.decisionId;

            //       const members = ['chairman', 'tester1', 'tester2', 'tester3', 'tester4'];

            //       it('Нельзя проголосовать ПРОТИВ не сняв голос ЗА', async () => {
            //         // Голосуем первым членом
            //         try {
            //           await voteagainst(targets, api, members[0], decision_id);
            //         } catch (e) {
            //           assert.exists(e.message, 'Нельзя проголосовать не сняв голос');
            //         }

            //       });


            //       it('Добавляем голос против', async () => {
            //         // Голосуем оставшимися необходимыми членами
            //         await voteagainst(targets, api, members[3], decision_id);


            //         const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', decision_id, 1);
            //         assert.equal(decision.votes_against.length, 1);

            //       });

            //       it('Снимаем голос против', async () => {
            //         // Голосуем оставшимися необходимыми членами
            //         await cancelVote(targets, api, members[3], decision_id);
            //         const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', decision_id, 1);
            //         assert.equal(decision.votes_against.length, 0);

            //       });

            //       it('Нельзя снять голос не установив его', async () => {
            //         // Голосуем оставшимися необходимыми членами

            //         try {
            //           await cancelVote(targets, api, members[4], decision_id);
            //         } catch (e) {
            //           assert.exists(e.message, 'Нельзя снять голос не установив его');
            //         }
            //         // Проверяем, что решение одобрено

            //       });

            //     });

            //     describe('Администрирование совета', () => {

            //       it('Добавляем администратора совета', async () => {
            //         const chairman = 'chairman';
            //         const username = 'tester1';
            //         const rights = ['right1', 'right2'];

            //         await addAdmin(api, chairman, username, rights);

            //         // Получаем запись из таблицы после добавления
            //         const addedAdmin = await getTableRow(rpc, 'soviet', 'soviet', 'admins', username, 1);
            //         // Проверяем, существует ли запись
            //         assert.exists(addedAdmin, 'Запись администратора не найдена в таблице admins');
            //         // Дополнительные проверки, если необходимо
            //       });


            //       it('Добавляем валидацию от администратора к решению', async () => {
            //         const username = 'tester1';

            //         await validate(api, username, meta.decisionId);

            //         // Получаем запись из таблицы после добавления
            //         const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', meta.decisionId, 1);
            //         assert.equal(decision.validated, 1);

            //       });

            //       describe('Авторизация председателя', () => {
            //         it('Нельзя авторизовать решение не председателем', async () => {
            //           const username = 'tester1';

            //           try {
            //             await authorize(api, username, meta.decisionId);
            //             assert.fail('Должно было возникнуть исключение')
            //           } catch (e) {
            //             assert.exists("Нельзя авторизовать решение")
            //           }

            //         });


            //         it('Должно добавить авторизацию председателя', async () => {
            //           const chairman = 'chairman';

            //           try {
            //             await authorize(api, chairman, meta.decisionId);
            //           } catch (e) {
            //             assert.fail(e.message)
            //           }
            //           // Получаем запись из таблицы после добавления
            //           const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', meta.decisionId, 1);

            //           assert.equal(decision.authorized, 1);

            //         });

            //         it('Исполняем решение совета', async () => {
            //           const chairman = 'chairman';
            //           await exec(api, chairman, meta.decisionId);
            //           // Получаем запись из таблицы после добавления
            //           const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', meta.decisionId, 1);
            //           assert.equal(decision.executed, 1);

            //         });

            //         it('Статус аккаунта после авторизации должен измениться на member', async () => {
            //           // Получаем запись из таблицы после добавления
            //           const account = await getTableRow(rpc, 'registrator', 'registrator', 'accounts', meta.username, 1);
            //           assert.equal(account.status, "member");
            //         });

                  


                  
            //         it('Обновление аккаунтов членов совета', async () => {
            //           const action_type = "regaccount"
            //           const members = ['chairman', 'tester1', 'tester2', 'tester3', 'tester4']; // chairman входит в список членов
                
            //           try {

            //             for (member of members) {
                          
            //               const result = await setProviderAuth(api, member, "EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV");
            //               assert.exists(result, "Автоматизация подключена")

            //             }
            //           } catch (e) {
            //             assert.fail(e.message)
            //           }

            //         }).timeout(10000);

            //         it('Подключение автоматизации подписи члена совета 1', async () => {
            //           const action_type = "regaccount"

            //           try {

            //             const result = await automate(api, 'chairman', action_type);
            //             assert.exists(result, "Автоматизация подключена")

            //           } catch (e) {
            //             assert.fail(e.message)
            //           }

            //         })

            //         it('Подключение автоматизации подписи члена совета 2', async () => {
            //           const action_type = "regaccount"

            //           try {

            //             const result = await automate(api, 'tester1', action_type);
            //             assert.exists("Автоматизация подключена")

            //           } catch (e) {
            //             assert.fail(e.message)
            //           }

            //         })

            //         it('Подключение автоматизации подписи члена совета 3', async () => {
            //           const action_type = "regaccount"

            //           try {

            //             const result = await automate(api, 'tester2', action_type);
            //             assert.exists("Автоматизация подключена")

            //           } catch (e) {
            //             assert.fail(e.message)
            //           }

            //         })

            //         // it('Поставляем валидацию и ждём авто-поставки подписей', async () => {
            //         //   const username = 'tester1';

            //         //   const result = await validate(api, username, meta.decisionId);

            //         //   console.log("\tЖдём автоматизации оракула 15 секунд ...")
                      
            //         //   await sleep(15)
                      
            //         //   // Получаем запись из таблицы после добавления
            //         //   const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', meta.decisionId, 1);
            //         //   assert.equal(decision.approved, 1);
            //         //   assert.equal(decision.validated, 1);

            //         // }).timeout(20000);


            //         it('Успешная регистрация нового аккаунта', async () => {

            //           const account = {
            //             coop_id: meta.coop_id,
            //             name: generateRandomAccountName(),
            //             pub: 'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV',
            //             userData,
            //             sign,
            //             tgId,
            //             email
            //           };

            //           meta.username = account.name

            //           const email = generateRandomEmail();
            //           const tgId = 12345;
            //           const sign = 'signature';
            //           const userData = { value: 'someUserData' };

            //           const {status, message} = await registerAccount(account);
            //           assert.equal(status, 'ok');

            //           // Получаем запись из таблицы после регистрации
            //           const secondary_key = eosjsAccountName.nameToUint64(account.name);
            //           const registeredAccount1 = await getTableRow(rpc, 'registrator', 'registrator', 'accounts', account.name, 1);
            //           assert.exists(registeredAccount1, 'Запись аккаунта не найдена в таблице registrator -> accounts');
            //           const registeredAccount2 = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', secondary_key, 2);
            //           meta.decisionId2 = registeredAccount2.id
            //           assert.exists(registeredAccount2, 'Запись аккаунта не найдена в таблице soviet -> decisions');
            //         })

            //         it('Автоматизируем кресло председателя для действия регистрации аккаунта', async () => {
            //           try {
            //             const result = await automate(api, 'chairman', 'authorize');
                        
            //             assert.exists(result, "Автоматизация кресла председателя получена")
            //           } catch (e) {
            //             if (e.message != 'assertion failure with message: Действие уже автоматизировано')
            //               assert.fail(e.message)
            //           }
            //         });

            //         it('Получаем информацию о готовности оракула автоматизировать подписи', async () => {
            //           const username = 'tester1';
            //           // let result = await validate(api, username, meta.decisionId2);
            //           sleep(3)

            //           assert.equal(1, 1);
                      
            //         });

            //         it('Должно быть отвадилировано, автоматически принято, утверждено и исполнено', async () => {
            //           const username = 'tester1';
            //           let result = await validate(api, username, meta.decisionId2);
            //           await sleep(10) 
            //           // Получаем запись из таблицы после добавления
            //           const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', meta.decisionId2, 1);
        
            //           assert.equal(decision.approved, 1);
            //           assert.equal(decision.validated, 1);
            //           assert.equal(decision.authorized, 1);
            //           // assert.equal(decision.executed, 1);
            //         }).timeout(20000);
            //       })

              
                // })
              // })  
                
            // });
          

          
            
        }).catch((err) => {
          done(new Error('Сервер недоступен: ' + err.message));
        });
    })
  });
}



init()