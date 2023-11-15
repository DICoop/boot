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

let privateKeys = ['5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'];
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

    console.log("\tcoopname: ", username)
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
        coop_id: account.coop_id
      
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
                actor: username, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
              registrator: "registrator",
              username: username, 
              storage: {
                storage_username: "registrator",
                uid: "testuid",
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
    const result = await api.transact(
      {
        actions: [
          {
            account: getTarget('registrator'), // Имя контракта
            name: 'joincoop', // Имя метода
            authorization: [
              {
                actor: username, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
              coopname: coopname,
              username: username, 
              signed_doc: {
                  hash: "hash",
                  pkey: "pkey",
                  sign: "sign", 
                  vars: "vars", 
              },
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



const authorize = async (targets, api, coopname, member, decision_id) => {
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

                for (const target of targets) {
                  const key = Object.keys(target)[0]; // Получаем значение объекта
                  const value = Object.values(target)[0]; // Получаем значение объекта
                  try {
                    const account = await rpc.get_account(value);  
                    // Обрабатываем account
                    
                  } catch(e) {
                    // Обработка ошибок

                    // console.log('\n\t_______ аккаунт ', value)
                    // await generateKeypair(value)
                    
                    const account = {
                      coopname: getTarget('ano'),
                      name: value,
                      pub: network_config.accounts.params.default_key, //key.publicKey,
                      userData: { value: 'someUserData' },
                      sign: "sign",
                      tgId: 1,
                      email: generateRandomEmail()
                    };
                    
                    await registerAccount(account);
                    await set_code_permissions(api, account.pub, value, [value])
                    await buy_resources(api, network, {username: value, ram_kbytes: 2048})
                    await setContract(api, key, value, network)  
                    
                  }
                }


              }).timeout(60000);

            // describe('Устанавливаем шаблоны договоров', () => {
              it('Установливаем и стандартизируем шаблоны договоров', async () => {
                const drafts = require("../../terminal/src/utils/drafts.js")
                
                meta.drafts = []
                meta.drafts_version = getRandomInt()
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
                          model: JSON.stringify({}),
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
                  pub: key.publicKey,
                  userData,
                  sign,
                  tgId,
                  email
                };
                
                const {status, message} = await registerAccount(account);
                
                assert.equal(status, 'ok');
              }).timeout(10000);


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
                        registrator: getTarget('ano'),
                        username: meta.coopname,
                        params: {
                          storage: {
                            storage_username: getTarget('ano'),
                            uid: "uid"
                          },
                          is_cooperative: true,
                          coop_type: "conscoop",
                          token_contract: network_config.coopcontract,
                          slug: "testcoop",
                          announce: null,
                          description: null,
                          initial: `1.0000 ${network_config.coopsymbol}`,
                          minimum: `1.0000 ${network_config.coopsymbol}`,
                          membership: `1.0000 ${network_config.coopsymbol}`,
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
                  coopname: meta.coopname,
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


             it('Создаём токен кооператива', async () => {

                const result = await create(targets, meta.cooptoken, api, meta.coopname, `1000000000.0000 ${network_config.coopsymbol}`, "");
                
                assert.exists(result, 'ok');
              
              }).timeout(10000);


             it('Регистрируем аккаунт для председателя', async () => {

                const email = generateRandomEmail();
                const tgId = 12345;
                const sign = 'signature';
                const userData = { value: 'someUserData' };
                const username = generateRandomAccountName()
                
                console.log('\n\t_______ аккаунт председателя')
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


                meta.member1 = account.name

                const {status, message} = await registerAccount(account);
                assert.equal(status, 'ok');
              }).timeout(10000);


             it('Создаём совет кооператива без председателя', async () => {
                const chairman = meta.member1;
                // const members = ['tester1', 'tester2']; // Председатель в списке
                
                const members = [{
                  username: chairman,
                  is_voting: true,
                  position_title: "Председатель",
                  position: "member",
                }]
                
                try {
                  let result = await api.transact({
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
                  }, {
                    blocksBehind: 3,
                    expireSeconds: 30,
                  });

                  let cons = findConsoleResponses(result)

                  // Здесь можно добавить дополнительные проверки результата, если это необходимо
                  // assert.exists(result.transaction_id, 'Транзакция должна была быть успешной');
                  assert.fail(result.transaction_id, "Совет создан без председателя")
                  // Проверьте успешное выполнение транзакции
                } catch (error) {
                  assert.exists(error.message, 'Председатель кооператива должен быть указан в членах совета');
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
                
                try {
                  let result = await api.transact({
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
                  }, {
                    blocksBehind: 3,
                    expireSeconds: 30,
                  });

                  let cons = findConsoleResponses(result)
                  
                  // Здесь можно добавить дополнительные проверки результата, если это необходимо
                  assert.exists(result.transaction_id, 'Транзакция должна была быть успешной');

                  // Проверьте успешное выполнение транзакции
                } catch (error) {
                  console.log("error.message: ", error.message)
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
                        membership_percent_fee: 0
                      },
                    }]
                  }, {
                    blocksBehind: 3,
                    expireSeconds: 30,
                  });

                  meta.program_id = findAction(result, "newid").id

                  // Здесь можно добавить дополнительные проверки результата, если это необходимо
                  assert.exists(result.transaction_id, 'Транзакция должна была быть успешной');

                  // Проверьте успешное выполнение транзакции
                } catch (error) {
                  console.log("error.message: ", error.message)
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
                  console.log("error.message: ", error.message)
                  assert.fail(error.message, 'Председатель кооператива должен быть указан в членах совета');
                }
              });
            

             it('Создаём предложение на обмен', async () => {
                
                let data = {
                  params: {
                    coopname: meta.coopname,
                    username: meta.member1,
                    parent_id: 0,
                    program_id: meta.program_id,
                    pieces: 10,
                    price_for_piece: `10.0000 ${network_config.coopsymbol}`,
                    data: JSON.stringify({title: 'Лакомый продукт', description: "Чёткое описание", preview: "https://img.freepik.com/premium-vector/grocery-store-set_267448-203.jpg", images: ["https://img.freepik.com/premium-vector/grocery-store-set_267448-203.jpg", "https://pictures.pibig.info/uploads/posts/2023-04/1681263763_pictures-pibig-info-p-produkti-risunok-vkontakte-3.jpg"]}),
                    meta: JSON.stringify({})
                  }
                }

                try {

                  let result = await api.transact({
                    actions: [{
                      account: getTarget('marketplace'),
                      name: 'offer',
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

                  assert.exists(result.transaction_id, 'Предложение успешно создано');
                  
                  meta.exchange_id = findAction(result, "newid").id
                  // console.log("exchange_id: ", meta.exchange_id)

                  let cons = findConsoleResponses(result)
                  // console.log("console>", cons)

                } catch (error) {
                  assert.fail(error.message);
                }
              }).timeout(10000);


             it('Проводим модерацию предложения', async () => {
                
                const data = {
                  coopname: meta.coopname,
                  username: meta.member1,
                  exchange_id: meta.exchange_id,
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


             it('Регистрируем аккаунт для пайщика', async () => {

                const email = generateRandomEmail();
                const tgId = 12345;
                const sign = 'signature';
                const userData = { value: 'someUserData' };
                const username = generateRandomAccountName()
                
                console.log('\n\t_______ аккаунт пайщика')
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

                // Получаем запись из таблицы после регистрации
                const secondary_key = eosjsAccountName.nameToUint64(meta.member2);

                meta.joincoop_decision_id = findAction(result, "newid").id

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
                assert.equal(decision.executed, 1);

              });

              it('Проверяем активный статус пайщика', async () => {
                // Получаем запись из таблицы после добавления
                const account = await getTableRow(rpc, getTarget('registrator'), getTarget('registrator'), 'accounts', meta.member2, 1);
                
                assert.equal(account.status, "active");
              });

              it('Пополняем баланс пайщику для совершения заказа', async () => {
                try {
                  await issue(targets, meta.cooptoken, api, meta.member2, `100.0000 ${network_config.coopsymbol}`, "");
                } catch (e) {
                  assert.fail(e.message)
                }
              });

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