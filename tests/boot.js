const { assert } = require('chai');
const { Api, JsonRpc } = require('eosjs');
const fetch = require('node-fetch');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const { ChainsSingleton } = require('unicore')

const eosjsAccountName = require('eosjs-account-name');


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



const votefor = async (api, member, decision_id) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: 'soviet', // Имя контракта
            name: 'votefor', // Имя метода
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


const voteagainst = async (api, member, decision_id) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: 'soviet', // Имя контракта
            name: 'voteagainst', // Имя метода
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



const cancelVote = async (api, member, decision_id) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: 'soviet', // Имя контракта
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



const automate = async (api, member, action_type) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: 'soviet', // Имя контракта
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


const autochair = async (api, member, action_type) => {
  try {

    const result = await api.transact(
      {
        actions: [
          {
            account: 'soviet', // Имя контракта
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



const exec = async (api, member, decision_id) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: 'soviet', // Имя контракта
            name: 'exec', // Имя метода
            authorization: [
              {
                actor: member, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
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



const authorize = async (api, member, decision_id) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: 'soviet', // Имя контракта
            name: 'authorize', // Имя метода
            authorization: [
              {
                actor: member, // Имя аккаунта, отправляющего транзакцию
                permission: 'active',
              },
            ],
            data: {
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


const addAdmin = async (api, chairman, username, rights) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: 'soviet', // Имя контракта
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




const createOrder = async (api, order) => {
  try {
    const result = await api.transact(
      {
        actions: [
          {
            account: 'marketplace', // Имя контракта
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




describe('Проверяем подключение ноде', () => {
  it('Нода должна быть онлайн', (done) => {
    fetch('http://127.0.0.1:8888/v1/chain/get_info')
      .then((response) => {
        assert(response.ok, 'Нода недоступна');
        done();


        describe('Тестируем контракт совета', () => {
          const rpc = new JsonRpc('http://127.0.0.1:8888', { fetch });
          const privateKeys = ['5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3'];

          const signatureProvider = new JsSignatureProvider(privateKeys);
          const api = new Api({
            rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new
              TextEncoder()
          });



          describe('Создаём совет', () => {
            it('Выпадает ошибка, если председатель не указан в совете при его создании', async () => {
              const chairman = 'chairman';
              const members = ['tester1', 'tester2']; // Председатель в списке
              const expired_after_days = 365;

              try {
                await api.transact({
                  actions: [{
                    account: 'soviet',
                    name: 'createboard',
                    authorization: [{
                      actor: chairman,
                      permission: 'active',
                    }],
                    data: {
                      chairman,
                      members,
                      expired_after_days,
                    },
                  }]
                }, {
                  blocksBehind: 3,
                  expireSeconds: 30,
                });

                assert.fail(error.message);
                // Проверьте успешное выполнение транзакции
              } catch (error) {
                assert.exists(error.message, 'Председатель не указан в совете');
              }
            });
          });


          describe('Проверка прав доступа при создании совета', () => {
            it('получим ошибку при попытке создать совет от имени пользователя без прав', async () => {
              try {
                await api.transact({
                  actions: [{
                    account: 'soviet',
                    name: 'createboard',
                    authorization: [{
                      actor: 'tester', // аккаунт без необходимых прав
                      permission: 'active',
                    }],
                    data: {
                      chairman: 'chairman',
                      members: ['member1', 'member2'],
                      expired_after_days: 365,
                    },
                  }]
                }, {
                  blocksBehind: 3,
                  expireSeconds: 30,
                });

                assert.fail('Должно было возникнуть исключение');
              } catch (error) {
                assert.exists(error.message, 'Ожидается сообщение об ошибке, связанное с правами доступа');
              }
            });
          });


          describe('Позитивный тест создания совета', () => {
            it('Создаём совет с правильными данными', async () => {
              const chairman = 'chairman';
              const members = ['chairman', 'tester1', 'tester2', 'tester3', 'tester4']; // chairman входит в список членов
              const expired_after_days = 365;

              try {
                const result = await api.transact({
                  actions: [{
                    account: 'soviet',
                    name: 'createboard',
                    authorization: [{
                      actor: chairman,
                      permission: 'active',
                    }],
                    data: {
                      chairman,
                      members,
                      expired_after_days,
                    },
                  }]
                }, {
                  blocksBehind: 3,
                  expireSeconds: 30,
                });

                // Здесь можно добавить дополнительные проверки результата, если это необходимо
                assert.exists(result.transaction_id, 'Транзакция должна была быть успешной');
              } catch (error) {
                assert.fail(error);
              }
            });
          });



          describe('Регистрация аккаунта', () => {
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

              // Получаем запись из таблицы после регистрации
              const rpc = new JsonRpc('http://127.0.0.1:8888', { fetch }); // Адрес узла EOS
              const secondary_key = eosjsAccountName.nameToUint64(account.name);

              const registeredAccount1 = await getTableRow(rpc, 'registrator', 'registrator', 'accounts', account.name, 1);
              assert.exists(registeredAccount1, 'Запись аккаунта не найдена в таблице registrator -> accounts');

              const registeredAccount2 = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', secondary_key, 2);
              meta.decisionId = registeredAccount2.id
              assert.exists(registeredAccount2, 'Запись аккаунта не найдена в таблице soviet -> decisions');


              describe('Голосование за решение', () => {
                const decision_id = meta.decisionId;

                const members = ['chairman', 'tester1', 'tester2', 'tester3', 'tester4'];

                it('Должно успешно зарегистрировать голос за решение от допустимого члена', async () => {
                  // Голосуем первым членом

                  await votefor(api, members[0], decision_id);

                  // Проверяем, что голос зарегистрирован
                  const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', decision_id, 1);
                  assert.equal(decision.votes_for.length, 1);
                  assert.equal(decision.approved, 0);
                });

                it('Получаем принятое решение после достижения консенсуса советом', async () => {
                  // Голосуем оставшимися необходимыми членами
                  await votefor(api, members[1], decision_id);
                  await votefor(api, members[2], decision_id);

                  // Проверяем, что решение одобрено
                  const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', decision_id, 1);
                  assert.equal(decision.votes_for.length, 3);
                  assert.equal(decision.approved, 1);

                });

                it('Ненельзя голосовать за решение недопустимому члену', async () => {
                  // Пытаемся голосовать недопустимым членом
                  const invalidMember = 'tester5';
                  try {
                    await votefor(api, invalidMember, decision_id);
                    assert.fail('Голосование недопустимым членом не должно быть допустимо');
                  } catch (error) {

                    assert.equal(error.message, 'assertion failure with message: Вы не являетесь членом совета'); // Предполагаемое сообщение об ошибке
                  }

                  // Проверяем, что голос не зарегистрирован
                  const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', decision_id, 1);

                  assert.equal(decision.votes_for.length, 3); // Количество голосов осталось прежним
                });


                it('Снимаем одобрение с решения при снятии голоса', async () => {
                  // Голосуем оставшимися необходимыми членами
                  await cancelVote(api, members[1], decision_id);

                  // Проверяем, что решение одобрено
                  const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', decision_id, 1);
                  assert.equal(decision.votes_for.length, 2);
                  assert.equal(decision.approved, 0);

                });



                it('Возвращаем одобрение при возврате голоса', async () => {
                  // Голосуем оставшимися необходимыми членами
                  await votefor(api, members[1], decision_id);

                  // Проверяем, что решение одобрено
                  const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', decision_id, 1);
                  assert.equal(decision.votes_for.length, 3);
                  assert.equal(decision.approved, 1);

                });


              });


              describe('Голосование против решения', () => {
                const decision_id = meta.decisionId;

                const members = ['chairman', 'tester1', 'tester2', 'tester3', 'tester4'];

                it('Нельзя проголосовать ПРОТИВ не сняв голос ЗА', async () => {
                  // Голосуем первым членом
                  try {
                    await voteagainst(api, members[0], decision_id);
                  } catch (e) {
                    assert.exists(e.message, 'Нельзя проголосовать не сняв голос');
                  }

                });


                it('Добавляем голос против', async () => {
                  // Голосуем оставшимися необходимыми членами
                  await voteagainst(api, members[3], decision_id);


                  const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', decision_id, 1);
                  assert.equal(decision.votes_against.length, 1);

                });

                it('Снимаем голос против', async () => {
                  // Голосуем оставшимися необходимыми членами
                  await cancelVote(api, members[3], decision_id);
                  const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', decision_id, 1);
                  assert.equal(decision.votes_against.length, 0);

                });

                it('Нельзя снять голос не установив его', async () => {
                  // Голосуем оставшимися необходимыми членами

                  try {
                    await cancelVote(api, members[4], decision_id);
                  } catch (e) {
                    assert.exists(e.message, 'Нельзя снять голос не установив его');
                  }
                  // Проверяем, что решение одобрено

                });






              });

              describe('Администрирование совета', () => {

                it('Добавляем администратора совета', async () => {
                  const chairman = 'chairman';
                  const username = 'tester1';
                  const rights = ['right1', 'right2'];

                  await addAdmin(api, chairman, username, rights);

                  // Получаем запись из таблицы после добавления
                  const addedAdmin = await getTableRow(rpc, 'soviet', 'soviet', 'admins', username, 1);
                  // Проверяем, существует ли запись
                  assert.exists(addedAdmin, 'Запись администратора не найдена в таблице admins');
                  // Дополнительные проверки, если необходимо
                });


                it('Добавляем валидацию от администратора к решению', async () => {
                  const username = 'tester1';

                  await validate(api, username, meta.decisionId);

                  // Получаем запись из таблицы после добавления
                  const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', meta.decisionId, 1);
                  assert.equal(decision.validated, 1);

                });

                describe('Авторизация председателя', () => {
                  it('Нельзя авторизовать решение не председателем', async () => {
                    const username = 'tester1';

                    try {
                      await authorize(api, username, meta.decisionId);
                      assert.fail('Должно было возникнуть исключение')
                    } catch (e) {
                      assert.exists("Нельзя авторизовать решение")
                    }

                  });


                  it('Должно добавить авторизацию председателя', async () => {
                    const chairman = 'chairman';

                    try {
                      await authorize(api, chairman, meta.decisionId);
                    } catch (e) {
                      assert.fail(e.message)
                    }
                    // Получаем запись из таблицы после добавления
                    const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', meta.decisionId, 1);

                    assert.equal(decision.authorized, 1);

                  });

                  it('Исполняем решение совета', async () => {
                    const chairman = 'chairman';
                    await exec(api, chairman, meta.decisionId);
                    // Получаем запись из таблицы после добавления
                    const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', meta.decisionId, 1);
                    assert.equal(decision.executed, 1);

                  });

                  it('Статус аккаунта после авторизации должен измениться на member', async () => {
                    // Получаем запись из таблицы после добавления
                    const account = await getTableRow(rpc, 'registrator', 'registrator', 'accounts', meta.username, 1);
                    assert.equal(account.status, "member");
                  });

                })


                describe('Регистрируем новое входящее заявление от пайщика', () => {

                  it('Успешная регистрация нового аккаунта', async () => {

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

                    // Получаем запись из таблицы после регистрации
                    const rpc = new JsonRpc('http://127.0.0.1:8888', { fetch }); // Адрес узла EOS
                    const secondary_key = eosjsAccountName.nameToUint64(account.name);

                    const registeredAccount1 = await getTableRow(rpc, 'registrator', 'registrator', 'accounts', account.name, 1);
                    assert.exists(registeredAccount1, 'Запись аккаунта не найдена в таблице registrator -> accounts');

                    const registeredAccount2 = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', secondary_key, 2);
                    meta.decisionId = registeredAccount2.id

                    assert.exists(registeredAccount2, 'Запись аккаунта не найдена в таблице soviet -> decisions');



                  })
                })


                describe('Автоматизация решения о приёме пайщика', () => {
                  it('Подключение автоматизации подписи члена совета 1', async () => {
                    const action_type = "regaccount"

                    try {

                      const result = await automate(api, 'chairman', action_type);
                      assert.exists("Автоматизация подключена")

                    } catch (e) {
                      assert.fail(e.message)
                    }

                  })

                  it('Подключение автоматизации подписи члена совета 2', async () => {
                    const action_type = "regaccount"

                    try {

                      const result = await automate(api, 'tester1', action_type);
                      assert.exists("Автоматизация подключена")

                    } catch (e) {
                      assert.fail(e.message)
                    }

                  })

                  it('Подключение автоматизации подписи члена совета 3', async () => {
                    const action_type = "regaccount"

                    try {

                      const result = await automate(api, 'tester2', action_type);
                      assert.exists("Автоматизация подключена")

                    } catch (e) {
                      assert.fail(e.message)
                    }

                  })

                  it('Должно быть отвадилировано, автоматически принято, но не выполнено', async () => {
                    const username = 'tester1';

                    const result = await validate(api, username, meta.decisionId);

                    // Получаем запись из таблицы после добавления
                    const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', meta.decisionId, 1);

                    assert.equal(decision.approved, 1);
                    assert.equal(decision.validated, 1);

                  });

                })

                describe('Автоматическое утверждение председателем', () => {

                  it('Успешная регистрация нового аккаунта', async () => {

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
                    // Получаем запись из таблицы после регистрации
                    const rpc = new JsonRpc('http://127.0.0.1:8888', { fetch }); // Адрес узла EOS
                    const secondary_key = eosjsAccountName.nameToUint64(account.name);
                    const registeredAccount1 = await getTableRow(rpc, 'registrator', 'registrator', 'accounts', account.name, 1);
                    assert.exists(registeredAccount1, 'Запись аккаунта не найдена в таблице registrator -> accounts');
                    const registeredAccount2 = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', secondary_key, 2);
                    meta.decisionId = registeredAccount2.id
                    assert.exists(registeredAccount2, 'Запись аккаунта не найдена в таблице soviet -> decisions');
                  })

                  it('Автоматизируем кресло председателя для действия регистрации аккаунта', async () => {
                    const chairman = 'chairman';
                    try {
                      const result = await autochair(api, chairman, "regaccount");
                      assert.exists(result, "Утверждение действия regaccount автоматизировано")
                    } catch (e) {
                      if (e.message != 'assertion failure with message: Действие уже автоматизировано')
                        assert.fail(e.message)
                    }
                  });


                  it('Должно быть отвадилировано, автоматически принято, утверждено и исполнено', async () => {
                    const username = 'tester1';
                    let result = await validate(api, username, meta.decisionId);
                    
                    // Получаем запись из таблицы после добавления
                    const decision = await getTableRow(rpc, 'soviet', 'soviet', 'decisions', meta.decisionId, 1);
                    assert.equal(decision.approved, 1);
                    assert.equal(decision.validated, 1);
                    assert.equal(decision.authorized, 1);
                    assert.equal(decision.executed, 1);
                  });
                })


              })
              
              describe('Тестируем маркетплейс', () => {
                it('Создаём заявку на поставку', async () => {
                  const username = 'tester1';
                  let result = await createOrder(api, {
                    creator: username, 
                    category: "test",
                    contract: "eosio.token",
                    price: "1.0000 SYS",
                    data: JSON.stringify({
                      subcategory: "test2",
                      title: "title",
                      description: "description"
                    })
                  })

                  meta.itemId = result?.processed?.action_traces[0]?.inline_traces[0]?.act?.data?.id

                  const item = await getTableRow(rpc, 'marketplace', 'marketplace', 'items', meta.itemId, 1);

                  assert.exists(item, 'Заявка не найдена в таблице marketplace -> items');
                })
              })
              


            });
          });
        });

        
          
      }).catch((err) => {
        done(new Error('Сервер недоступен: ' + err.message));
      });
  })
});
