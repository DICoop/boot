const { assert } = require('chai');
const { Api, JsonRpc } = require('eosjs');
const fetch = require('node-fetch');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const { ChainsSingleton } = require('unicore')
const { encrypt, decrypt } = require('eos-encrypt');

const {findAction} = require("./utils")

const eosjsAccountName = require('eosjs-account-name');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms * 1000));

const privateKeys = ['5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'];


const config = {
  chains: [
    {
      name: 'LOCAL',
      rpcEndpoints: [
        {
          protocol: 'http',
          host: '127.0.0.1',
          port: 8888,
        },
      ],
      explorerApiUrl: 'https://explorer.gaia.holdings',
      wallets: [
        {
          contract: 'eosio.token',
          symbol: 'USDT',
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
      coreSymbol: 'RUB',
    },
  ],
  ual: {
    rootChain: 'LOCAL',
  },
  registrator: {
    appName: 'UniUI',
    api: 'http://127.0.0.1:5010',
  },

}

const instance = new ChainsSingleton()
instance.init(config)

let meta = {}

async function registerAccount(account, email, tgId, sign, userData) {
  try {
    const { status, message } = await instance.registrator.setAccount(
      account.name,
      account.pub,
      account.pub,
      email,
      null, // referrer теперь установлен как null
      "localhost",
      'guest',
      JSON.stringify({ tgId, sign, profile: userData.value })
    );

    if (status === 'ok') {
      return { success: true };
    } else {
      return { success: false, error: status, message: message };
    }
  } catch (e) {
    return { success: false, message: e.message };
  }
}


const generateRandomEmail = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  let email = '';
  for (let i = 0; i < 10; i++) {
    email += chars[Math.floor(Math.random() * chars.length)];
  }
  email += '@example.com';
  return email;
};

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




async function encryptMessage(wif, to, message) {
  // eslint-disable-next-line no-param-reassign
  // message = btoa(unescape(encodeURIComponent(message)));

  const rpc = new JsonRpc('http://127.0.0.1:8888', { fetch }); // Адрес узла EOS
              
  const account = await rpc.get_account(to);
  const pactivekey = account.permissions.find((el) => el.perm_name === 'active');
  const pkey = pactivekey.required_auth.keys[0].key;

  return encrypt(wif, pkey, message, { maxsize: 10000 });
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


const validate = async (api, member, decision_id) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: 'soviet', // Имя контракта
            name: 'validate', // Имя метода
            authorization: [
              {
                actor: member, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
              username: member,
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


const addAdmin = async (api, data) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: 'soviet', // Имя контракта
            name: 'addadmin', // Имя метода
            authorization: [
              {
                actor: 'chairman', // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data,
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



const moderate = async (api, moderator, data) => {
  try {
    let action = {
            account: 'marketplace', // Имя контракта
            name: 'moderate', // Имя метода
            authorization: [
              {
                actor: moderator, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data,
          }

    
    const result = await api.transact(
      {
        actions: [
          action
        ],
      },
      {
        blocksBehind: 3,
        expireSeconds: 30,
      }
    );

    return result;
  } catch (error) {
    console.error(`Ошибка при модерировании: ${error.message}`);
    throw error;
  }
};



const complete = async (api, data) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: 'marketplace', // Имя контракта
            name: 'complete', // Имя метода
            authorization: [
              {
                actor: data.username, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data,
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
    console.error(`Ошибка при выдаче акта: ${error.message}`);
    throw error;
  }
};


const accept = async (api, data) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: 'marketplace', // Имя контракта
            name: 'accept', // Имя метода
            authorization: [
              {
                actor: data.username, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data,
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
    console.error(`Ошибка при выдаче акта: ${error.message}`);
    throw error;
  }
};



const createOffer = async (api, order) => {
  try {
    
    let actions = [
          {
            account: 'marketplace', // Имя контракта
            name: 'offer', // Имя метода
            authorization: [
              {
                actor: order.params.username, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: order,
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


function parseTokenString(tokenString) {
  const [amountString, symbol] = tokenString.split(" ")
  const amount = parseFloat(amountString)
  return { amount, symbol }
}




const createOrder = async (api, order) => {
  try {
    let tokenArray = parseTokenString(order.params.price_for_piece)

    let quantity = (parseFloat(order.params.pieces) * parseFloat(order.params.price_for_piece)).toFixed(4) + " " + tokenArray.symbol

    let actions = [
          {
            account: order.params.contract, // Имя контракта
            name: 'transfer', // Имя метода
            authorization: [
              {
                actor: order.params.username, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
              from: order.params.username,
              to: 'marketplace',
              quantity: quantity,
              memo: ""
            },
          },
          {
            account: 'marketplace', // Имя контракта
            name: 'order', // Имя метода
            authorization: [
              {
                actor: order.params.username, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: order,
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




describe('Проверяем подключение ноде', () => {
  it('Нода должна быть онлайн', (done) => {
    fetch('http://127.0.0.1:8888/v1/chain/get_info')
      .then((response) => {
        assert(response.ok, 'Нода недоступна');
        done();


        describe('Тестируем контракт совета', () => {
          const rpc = new JsonRpc('http://127.0.0.1:8888', { fetch });
          
          const signatureProvider = new JsSignatureProvider(privateKeys);
          const api = new Api({
            rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new
              TextEncoder()
          });

          meta.firstPair = {}
              
          describe('Тестируем маркетплейс', () => {
            it('Создаём заявку на имущественный паевый взнос', async () => {
              const username = 'tester1';
              
              let result = await createOffer(api, {params: {
                username: username, 
                parent_id: 0,
                pieces: 10,
                contract: "eosio.token",
                price_for_piece: "1.0000 AXON",
                data: JSON.stringify({
                  subcategory: "test2",
                  title: "title",
                  description: "description"
                }),
                meta: JSON.stringify({})
              }})

              meta.firstPair.offer = findAction(result, 'newid').id
              const item = await getTableRow(rpc, 'marketplace', 'marketplace', 'exchange', meta.firstPair.offer, 1);
              assert.exists(item, 'Заявка не найдена в таблице marketplace -> exchange');
            })

          
            it('Модерируем заявку', async () => {
              const moderator = 'marketplace';
              
              let result = await moderate(api, moderator, {
                username: moderator, 
                exchange_id: meta.firstPair.offer
              })

              const item = await getTableRow(rpc, 'marketplace', 'marketplace', 'exchange', meta.firstPair.offer, 1);
            
              assert.equal(item.status, "published", "Статус не соответсвует");
                  
            })

            //TODO moderate

            it('Создаём встречный денежный паевый взнос', async () => {
              const username = 'tester2';
              
              let result = await createOrder(api, {params: {
                username: username, 
                parent_id: meta.firstPair.offer,
                pieces: 10,
                contract: "eosio.token",
                price_for_piece: "1.0000 AXON",
                data: "",
                meta: ""
              }})
              
              meta.firstPair.order = findAction(result, 'newid').id
              const item = await getTableRow(rpc, 'marketplace', 'marketplace', 'exchange', meta.firstPair.order, 1);
              assert.exists(item, 'Заявка не найдена в таблице marketplace -> exchange');
            })

            it('Принимаем встречную заявку', async () => {
              const username = 'tester1';
              
              let result = await accept(api, {
                username,
                exchange_id: meta.firstPair.order
              })
              
              meta.firstPair.decisionId = findAction(result, 'newid').id

              const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', meta.firstPair.decisionId,  1);
              
              const item = await getTableRow(rpc, 'marketplace', 'marketplace', 'exchange', meta.firstPair.order, 1);
             
              assert.ok(item.status === "accepted", "Статус не соответсвует");

            })      

            it('Валидация обмена админом', async () => {
              const username = 'tester1';
              
              let result = await validate(api, 
                username,
                meta.firstPair.decisionId
              )
              
              let item = await getTableRow(rpc, 'marketplace', 'marketplace', 'exchange', meta.firstPair.order,  1);
              
              const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', meta.firstPair.decisionId,  1);
                          
              assert.ok(decision.validated === 1, "Статус не соответсвует");

              await sleep(10)

              item = await getTableRow(rpc, 'marketplace', 'marketplace', 'exchange', meta.firstPair.order,  1);
              assert.ok(item.status === "authorized", "Статус не соответсвует");
              
            }).timeout(15000);

            it('Подписываем акт получателем', async () => {
              const username = 'tester2';
              
              let result = await complete(api,{ 
                username,
                exchange_id: meta.firstPair.order}
              )
              
              const transferData = findAction(result, 'transfer')
              
              let item = await getTableRow(rpc, 'marketplace', 'marketplace', 'exchange', meta.firstPair.order,  1);
              
              assert.ok(item.status === "completed", "Статус не соответсвует");
              
            }).timeout(10000);

            


        })
          


        });

        
          
      }).catch((err) => {
        done(new Error('Сервер недоступен: ' + err.message));
      });
  })
});
