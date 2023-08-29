const { assert } = require('chai');
const { Api, JsonRpc } = require('eosjs');
const fetch = require('node-fetch');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const { ChainsSingleton } = require('unicore')

const eosjsAccountName = require('eosjs-account-name');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms * 1000));

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



const createGame = async (api, member, id, caption) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: 'bet', // Имя контракта
            name: 'creategame', // Имя метода
            authorization: [
              {
                actor: member, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
              caption,
              id,
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




const addHypo = async (api, member, game_id, hypo_id, title) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: 'bet', // Имя контракта
            name: 'addhypo', // Имя метода
            authorization: [
              {
                actor: member, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
              game_id,
              hypo_id,
              title
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


const pushFeed = async (api, member, game_id, win_hypo_id) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: 'bet', // Имя контракта
            name: 'pushfeed', // Имя метода
            authorization: [
              {
                actor: member, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
              game_id,
              win_hypo_id
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




const settle = async (api, member, bet_id, hypo_id, decrypted_data) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: 'bet', // Имя контракта
            name: 'settle', // Имя метода
            authorization: [
              {
                actor: member, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
              bet_id,
              hypo_id,
              decrypted_data
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


function findAction(data, actionName) {
  if (data?.processed?.action_traces) {
    for (const actionTrace of data.processed.action_traces) {
      // Проверка основного действия
      if (actionTrace.act.name === actionName) {
        return actionTrace.act;
      }

      // Проверка inline_traces, если они существуют
      if (actionTrace.inline_traces) {
        for (const inlineTrace of actionTrace.inline_traces) {
          if (inlineTrace.act.name === actionName) {
            return inlineTrace.act.data;
          }
        }
      }
    }
  }

  return null; // Возврат null, если действие не найдено
}

function getCurrentUTCTime(offsetInSeconds = 0) {
  const now = new Date();
  now.setUTCSeconds(now.getUTCSeconds() + offsetInSeconds);
  return now.toISOString().split('Z')[0];
}

function generateRandomNumber() {
  return Math.floor(Math.random() * 100000000);
}


const makeBet = async (api, username, game_id, hypo_id, encrypted_data, hash_for_check, quantity, timepoint) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: 'eosio.token', // Имя контракта
            name: 'transfer', // Имя метода
            authorization: [
              {
                actor: username, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
              from: username,
              to: 'bet',
              quantity,
              memo: ""
            },
          },
          {
            account: 'bet', // Имя контракта
            name: 'makebet', // Имя метода
            authorization: [
              {
                actor: username, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
              username,
              game_id,
              encrypted_data, 
              hash_for_check,
              amount: quantity,
              timepoint
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



describe('Проверяем подключение ноде', () => {
  it('Нода должна быть онлайн', (done) => {
    fetch('http://127.0.0.1:8888/v1/chain/get_info')
      .then((response) => {
        assert(response.ok, 'Нода недоступна');
        done();


        describe('', () => {
          const rpc = new JsonRpc('http://127.0.0.1:8888', { fetch });
          const privateKeys = ['5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'];

          const signatureProvider = new JsSignatureProvider(privateKeys);
          const api = new Api({
            rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new
              TextEncoder()
          });

          describe('Тестируем контракт ставок на правду', () => {
            it('Регистрируем новый аккаунт', async () => {

              const account = {
                name: generateRandomAccountName(),
                pub: 'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV'
              };

              meta.username = account.name

              const email = generateRandomEmail();
              const tgId = 12345;
              const sign = 'signature';
              const userData = { value: 'someUserData' };

              const result = await registerAccount(account, email, tgId, sign, userData);
              assert.isTrue(result.success, `Ошибка регистрации: ${result.message}`);

            })
          
            let now

            let gameId = generateRandomNumber()
            let hypoId = [generateRandomNumber(), generateRandomNumber()]
            let encryptedData = "encrypted"
            let hashForCheck = "hash"
            let amount = "1.0000 SYS"
            let bets = []
            let tester = 'eosio'
            // console.log("Гипотезы: ", hypoId)

            it('Создаём топик', async () => {
              let result = await createGame(api, "bet", gameId, "Тестовый топик")
              assert.exists(result, `Ошибка создания топика: ${result.message}`);
            });

            it('Создаём Гипотезу 1', async () => {
              let result = await addHypo(api, "bet", gameId, hypoId[0], "Гипотеза 1")
              assert.exists(result, `Ошибка создания топика: ${result.message}`);
            });

            it('Создаём Гипотезу 2', async () => {
              let result = await addHypo(api, "bet", gameId, hypoId[1], "Гипотеза 2")
              assert.exists(result, `Ошибка создания топика: ${result.message}`);
            });

            it('Поставляем фид правды на Гипотезу 1', async () => {
              
              now = getCurrentUTCTime()

              // console.log("Правда поставлена: ", now)
              let result = await pushFeed(api, "bet", gameId, hypoId[0])
              assert.exists(result, `Ошибка поставки правды: ${result.message}`);
              
              // console.log("bets_id: ", bets)
            }).timeout(5000);
            
            

            it('Делаем ставку (1) на победу гипотезы 2 через 2 секунды', async () => {
              // await sleep(3)
              now = getCurrentUTCTime(2);
              let result = await makeBet(api, tester, gameId, hypoId[1], encryptedData, hashForCheck, amount, now)
              bets.push(findAction(result, "newid").id)
              assert.exists(result, `Ошибка создания ставки: ${result.message}`);
            }).timeout(5000);
            

            it('Делаем ставку (2) на победу гипотезы 1 через 3 секунды', async () => {
              // await sleep(4)
              now = getCurrentUTCTime(3);
              let result = await makeBet(api, tester, gameId, hypoId[0], encryptedData, hashForCheck, amount, now)
              bets.push(findAction(result, "newid").id)
              assert.exists(result, `Ошибка создания ставки: ${result.message}`);
            }).timeout(5000);

            it('Делаем ставку (3) на победу гипотезы 2 через 2.5 секунды', async () => {
              // await sleep(3)
              now = getCurrentUTCTime(2.5);
              let result = await makeBet(api, tester, gameId, hypoId[1], encryptedData, hashForCheck, amount, now)
              bets.push(findAction(result, "newid").id)
              assert.exists(result, `Ошибка создания ставки: ${result.message}`);
            }).timeout(5000);
            
            

            it('Проверяем наличие ставок', async () => {
              const bet1 = await getTableRow(rpc, 'bet', 'bet', 'bets', bets[0], 1);
              const bet2 = await getTableRow(rpc, 'bet', 'bet', 'bets', bets[1], 1);
              const bet3 = await getTableRow(rpc, 'bet', 'bet', 'bets', bets[2], 1);

              // console.log("\t","bet1: ", bet1)
              // console.log("\t","bet2: ", bet2)
              // console.log("\t","bet2: ", bet3)

              assert.exists(bet1, `Ставка не найдена`);
              assert.exists(bet2, `Ставка не найдена`);
              assert.exists(bet3, `Ставка не найдена`);

            });

            it('Забираем ставку 1 с проигрышем', async () => {
              
              now = getCurrentUTCTime()
              // console.log("now1: ", now)

              await sleep(3)

              now = getCurrentUTCTime()
              // console.log("now2: ", now)

              // console.log("Ставка изымается: ", now, hypoId[1], bets[0])
              let result = await settle(api, "bet", bets[0], hypoId[1], "decrypted_data")
              
              let res = findAction(result, "notify")
              let cons = findConsoleResponses(result)
              // console.log("КОНСОЛЬ КОНТРАКТА: ", cons)

              console.log("\tСтатус: ", res)

              assert.exists(result, `Ошибка возврата ставки: ${result.message}`);
            }).timeout(5000);;

             it('Забираем ставку 3 с проигрышем', async () => {
              
              now = getCurrentUTCTime()
              // console.log("now1: ", now)
              
              await sleep(3)

              now = getCurrentUTCTime()
              // console.log("now2: ", now)

              // console.log("Ставка изымается: ", now, hypoId[1], bets[1])
              let result = await settle(api, "bet", bets[1], hypoId[1], "decrypted_data")
              
              let res = findAction(result, "notify")
              let cons = findConsoleResponses(result)
              // console.log("КОНСОЛЬ КОНТРАКТА: ", cons)

              console.log("\tСтатус: ", res)

              assert.exists(result, `Ошибка возврата ставки: ${result.message}`);
            }).timeout(5000);;


            it('Забираем ставку 2 с победой', async () => {
              
              now = getCurrentUTCTime()
              // console.log("now1: ", now)
              
              await sleep(3)

              now = getCurrentUTCTime()
              // console.log("now2: ", now)

              // console.log("Ставка изымается: ", now, hypoId[0], bets[2])
              let result = await settle(api, "bet", bets[2], hypoId[0], "decrypted_data")
              
              let res = findAction(result, "notify")
              let cons = findConsoleResponses(result)
              // console.log("КОНСОЛЬ КОНТРАКТА: ", cons)

              console.log("\tСтатус: ", res)
              
              assert.exists(result, `Ошибка возврата ставки: ${result.message}`);
              assert.equal(parseFloat(res.amount), 3);
            }).timeout(5000);

           
            

            // it('Забираем ставку 2', async () => {
            //   now = getCurrentUTCTime()
            //   console.log("Правда поставлена: ", now)
            //   let result = await pushFeed(api, "bet", bets[1], hypoId[0], "decrypted_data")
            //   assert.exists(result, `Ошибка поставки правды: ${result.message}`);
              
            //   console.log("bets_id: ", bets)
            // });


          })


          /*
           * x создать топик
           * x создать гипотезу 1
           * x создать ставку 2
           * x поставить фид 1
           * x создать ставку 1
           * изъять ставку 2 как проигрыш
           * изъять ставку 1 как победу
           
           * поставить фид
           * создать ставку
           * создать ставку
           * создать ставку

           * поставить фид
           * создать ставку
           * создать ставку
           * создать ставку
           * создать ставку
           * создать ставку
           * 
           */


        });

        
          
      }).catch((err) => {
        done(new Error('Сервер недоступен: ' + err.message));
      });
  })
});
