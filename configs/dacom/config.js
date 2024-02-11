var config = {
  init_key: "5JoNYmWXTUUPd17Q5YuHBnzb9AsoPFrZftC1eSpTtt56UGzkgLS",
  main_key: "5JoNYmWXTUUPd17Q5YuHBnzb9AsoPFrZftC1eSpTtt56UGzkgLS",
  producer_key: "EOS8kNnDfyyFJ8LP9KkmmjAC7o8UVKuge44HSwMREUXKCkoSNAh53",
  core_token: "4,AXON",
  init_market_amount: 50000000000,
  main_core_contract: "unicore",
  partners_contract: "partners",
  core_system_percent: 50,
  operator_system_percent: 50,
  coopname: "testcoop",
  chairman: "chairman",//TODO ADD IT
  coopsymbol: "RUB",
  coopcontract: "testtoken",
  targets: [
    //CHANGE IT!
    { "eosio.token": "eosio.token" },
    { "registrator": "regtest1" },
    { "ano": "anotest1" },
    // { "registrator": "regtest" },
    { "eosio.boot": "eosio" },
    { "eosio.system": "eosio" },
    { "soviet": "soviettest1" },
    { "marketplace": "markettest1" },
    { "draft": "drafttest1" },
    { "gateway": "gatetest1"}
  ],
  p2p: {
    coreUsdRate: 1,
    distributionRate: 3.3,
    onDistribution: "10000.0000 AXON",
    distributionContract: "eosio.token",
    funds: [
      {
        title: "dacs",
        type: "transfer",
        weight: "84",
        transfer_to: "unicore",
        transfer_memo: "111-alfatest" 
      },
      {
        title: "partners",
        type: "partners",
        weight: "16",
        transfer_to: "",
        transfer_memo: ""
      }

    ]
  },
  dacs: [
    {
      username: "investor",
      weight: 3,
      title: "investor",
      description: "investor",
      vested: false,
      vesting_seconds: 0,
      cliff_seconds: 0
    },
    {
      username: "team",
      weight: 12,
      title: "team",
      description: "team",
      vested: false,
      vesting_seconds: 0,
      cliff_seconds: 0
    },
    {
      username: "reserve",
      weight: 9,
      title: "reserve",
      description: "reserve",
      vested: false,
      vesting_seconds: 0,
      cliff_seconds: 0
    },
    {
      username: "core",
      weight: 30,
      title: "core",
      description: "core",
      vested: false,
      vesting_seconds: 0,
      cliff_seconds: 0
    },
    {
      username: "ecosystem",
      weight: 10,
      title: "ecosystem",
      description: "ecosystem",
      vested: false,
      vesting_seconds: 0,
      cliff_seconds: 0
    },
    {
      username: "part",
      weight: 16,
      title: "part",
      description: "part",
      vested: false,
      vesting_seconds: 0,
      cliff_seconds: 0
    },
    {
      username: "marketing",
      weight: 20,
      title: "marketing",
      description: "marketing",
      vested: false,
      vesting_seconds: 0,
      cliff_seconds: 0
    },
  ],


  tokens: [
    {
      symbol: "0.0000 AXON",
      contract: "eosio.token",
      issuer: "eosio",
      max_supply: "461168601842738.7903 AXON",
      registrator_contract: 'regtest1', //CHANGE IT!
      registrator: "anotest1",  //CHANGE IT!
      registrator2: "testcoop",
      toRegistrator: "10000.0000 AXON",
      allocation: [{
        username: "eosio",
        amount: "250000.0000 AXON"
      },
      {
        username: "ano",
        amount: "1000.0000 AXON"
      },
      {
        username: "alfatest",
        amount: "1000.0000 AXON"
      },
      {
        username: "tester1",
        amount: "1000.0000 AXON"
      },
      {
        username: "tester2",
        amount: "1000.0000 AXON"
      },
      {
        username: "tester",
        amount: "1000.0000 AXON"
      }
      ]  
    },
    // {
    //   symbol: "0.0000 USDT",
    //   contract: "eosio.token",
    //   issuer: "eosio",
    //   max_supply: "461168601842738.7903 USDT",
    //   allocation: [{
    //     username: "eosio",
    //     amount: "1000000000.0000 USDT"
    //   },
    //   {
    //     username: "eosio.ram",
    //     amount: "1000000.0000 USDT"
    //   },
    //   {
    //     username: "eosio.saving",
    //     amount: "1000000000.0000 USDT"
    //   },
    //   {
    //     username: "alfatest",
    //     amount: "1000000.0000 USDT"
    //   },
    //   ]  
    // },
    // {
    //   symbol: "0.0000 TEST",
    //   contract: "eosio.token",
    //   issuer: "eosio",
    //   max_supply: "461168601842738.7903 TEST",
    //   allocation: [
    //   {
    //     username: "alfatest",
    //     amount: "1000000000.0000 TEST"
    //   }
    //   ]  
    // },
  ],

  accounts : {
    
    params: {
      default_key: "EOS8kNnDfyyFJ8LP9KkmmjAC7o8UVKuge44HSwMREUXKCkoSNAh53",
      default_net_weight: '5.0000 AXON',
      default_cpu_weight: '5.0000 AXON',
      default_ram_kbytes: 16,
    },

    list: [
    {
        username: 'anotest1', //CHANGE IT!
        code_permissions_to: ['anotest1'],
        ram_kbytes: 32,
      },
      {
        username: 'reserve',
        code_permissions_to: ["reserve"],
        ram_kbytes: 1024,
        is_contract: true,
      },
      {
        username: 'bet',
        code_permissions_to: ["bet"],
        ram_kbytes: 1024,
        is_contract: true,
      },
      {
        username: 'refresher',
        code_permissions_to: [],
        ram_kbytes: 1024,
      },
      {
        username: 'eosio.saving',
        code_permissions_to: ["eosio"],
        ram_kbytes: 1024,
      },
      {
        username: 'eosio.bpay',
        code_permissions_to: [],
      },
      {
        username: 'eosio.msig',
        code_permissions_to: [],
      },
      {
        username: 'eosio.names',
        code_permissions_to: [],
      },
      {
        username: 'eosio.ram',
        code_permissions_to: [],
      },
      {
        username: 'eosio.ramfee',
        code_permissions_to: [],
      },
      {
        username: 'eosio.stake',
        code_permissions_to: [],
      },
      {
        username: 'eosio.vpay',
        code_permissions_to: [],
      },
      {
        username: 'eosio.rex',
        code_permissions_to: [],
      },
      {
        username: 'eosio.token',
        code_permissions_to: [],
        is_contract: true,
        ram_kbytes: 1024,
      },
      {
        username: 'eosio.wrap',
        code_permissions_to: [],
        is_contract: true,
        ram_kbytes: 1024,
      },
      {
        username: 'usdt.token',
        code_permissions_to: [],
        is_contract: true,
        ram_kbytes: 1024,
      },
      {
        username: 'test.token',
        code_permissions_to: [],
        is_contract: true,
        ram_kbytes: 1024,
      },
      {
        username: 'eosio',
        code_permissions_to: [],
        is_contract: true,
        ram_kbytes: 5024,
      },
      {
        username: 'alfatest',
        is_contract: false,
        code_permissions_to: [],
        ram_kbytes: 1024,
        referer: "",
      },
      {
        username: 'regtest1',
        code_permissions_to: ["regtest1"],
        is_contract: true,
        ram_kbytes: 1024,
        referer: "part"
      }, 
      {
        username: 'provider',
        code_permissions_to: [],
      }, 
      {
        username: 'notifier',
        code_permissions_to: [],
        is_contract: true,
        ram_kbytes: 10240,
      }, 
      {
        username: 'rater',
        code_permissions_to: [],
        is_contract: true,
        ram_kbytes: 32,
      },
      {
        username: 'dc',
        code_permissions_to: [],
        referer: "part",
        ram_kbytes: 32,
      },
      {
        username: 'tester',
        code_permissions_to: [],
        referer: "part",
        ram_kbytes: 32,
      },
      {
        username: 'tester1',
        code_permissions_to: ['soviet'],
        referer: "part",
        ram_kbytes: 32,
      },
      {
        username: 'tester2',
        code_permissions_to: ['soviet'],
        referer: "part",
        ram_kbytes: 32,
      },
      {
        username: 'tester3',
        code_permissions_to: ['soviet'],
        referer: "part",
        ram_kbytes: 32,
      },
      {
        username: 'tester4',
        code_permissions_to: [],
        referer: "part",
        ram_kbytes: 32,
      },
      {
        username: 'tester5',
        code_permissions_to: [],
        referer: "part",
        ram_kbytes: 32,
      },
      {
        username: 'base',
        code_permissions_to: [],
        ram_kbytes: 32,
      },
      
    ]
  },

  hosts:[
  ]    
};

module.exports = config;