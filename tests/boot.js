const { assert } = require('chai');
const { Api, JsonRpc } = require('eosjs');
const fetch = require('node-fetch');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');

describe('Тестирование подключения к ноде', () => {
  it('Нода должна быть доступна', (done) => {
    fetch('http://127.0.0.1:8888/v1/chain/get_info')
      .then((response) => {
        assert(response.ok, 'Нода недоступна');
        done();


        describe('Контракт совета', () => {
          const rpc = new JsonRpc('http://127.0.0.1:8888', { fetch });
          const privateKeys = ['5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3']; 

          const signatureProvider = new JsSignatureProvider(privateKeys);
          const api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new 
        TextEncoder() });



          describe('Создаём совет', () => {
            it('Должно упасть, если председатель не указан в совете', async () => {
              const chairman = 'chairman';
              const members = ['tester1', 'tester2']; // Председатель в списке
              const expired_after_days = 365;

              try {
                const response = await api.transact({
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
            it('должен выдать ошибку при попытке создать совет от имени пользователя без прав', async () => {
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
            it('должен успешно создать совет с правильными данными', async () => {
              const chairman = 'chairman';
              const members = ['chairman', 'member1', 'member2']; // chairman входит в список членов
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






        });
      }).catch((err) => {
        done(new Error('Сервер недоступен: ' + err.message));
      });

      })
      
  });
