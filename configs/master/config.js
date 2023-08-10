var config = {
  init_key: "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3",
  main_key: "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3",
  producer_key: "EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV",
  core_token: "4,SYS",
  init_market_amount: 50000000000,
  main_core_contract: "unicore",
  partners_contract: "part",
  core_system_percent: 50,
  operator_system_percent: 50,
  
  
  p2p: {
    coreUsdRate: 0.0001,
    distributionRate: 3.3,
    onDistribution: "10000.0000 SYS",
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
      symbol: "0.0000 SYS",
      contract: "eosio.token",
      issuer: "eosio",
      max_supply: "461168601842738.7903 SYS",
      allocation: [{
        username: "eosio",
        amount: "1000000000.0000 SYS"
      },
      {
        username: "eosio.ram",
        amount: "1000000.0000 SYS"
      },
      {
        username: "eosio.saving",
        amount: "1000000000.0000 SYS"
      },
      {
        username: "alfatest",
        amount: "1000000.0000 SYS"
      }
      ]  
    },
    {
      symbol: "0.0000 USDT",
      contract: "eosio.token",
      issuer: "eosio",
      max_supply: "461168601842738.7903 USDT",
      allocation: [{
        username: "eosio",
        amount: "1000000000.0000 USDT"
      },
      {
        username: "eosio.ram",
        amount: "1000000.0000 USDT"
      },
      {
        username: "eosio.saving",
        amount: "1000000000.0000 USDT"
      },
      {
        username: "alfatest",
        amount: "1000000.0000 USDT"
      },
      ]  
    },
    {
      symbol: "0.0000 TEST",
      contract: "eosio.token",
      issuer: "eosio",
      max_supply: "461168601842738.7903 TEST",
      allocation: [
      {
        username: "alfatest",
        amount: "1000000000.0000 TEST"
      }
      ]  
    },{
      symbol: "0.0000 RUB",
      contract: "eosio.token",
      issuer: "eosio",
      max_supply: "461168601842738.7903 RUB",
      allocation: [
      {
        username: "alfatest",
        amount: "1000000000.0000 RUB"
      }
      ]  
    }
  ],

  accounts : {
    
    params: {
      default_key: "EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV",
      default_net_weight: '1.0000 SYS',
      default_cpu_weight: '1.0000 SYS',
      default_ram_kbytes: 16,
    },

    list: [
      {
        username: 'withdrawer',
        code_permissions_to: ["withdrawer"],
        ram_kbytes: 2024,
        is_contract: true,
      },
      {
        username: 'reserve',
        code_permissions_to: ["reserve"],
        ram_kbytes: 1024,
        is_contract: true,
      },
      {
        username: 'soviet',
        code_permissions_to: ["soviet"],
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
        username: 'chairman',
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
        username: 'registrator',
        code_permissions_to: ["registrator"],
        is_contract: true,
        ram_kbytes: 1024,
        referer: "part"
      }, 
      {
        username: 'p2p',
        code_permissions_to: ["p2p"],
        is_contract: true,
        ram_kbytes: 2024,
        referer: "part"
      }, 
      {
        username: 'log',
        code_permissions_to: [],
        is_contract: true,
        ram_kbytes: 1024,
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
        username: 'tester',
        code_permissions_to: [],
        referer: "part",
        ram_kbytes: 32,
      },
      {
        username: 'base',
        code_permissions_to: [],
        ram_kbytes: 32,
      },
      {
        username: 'gateway',
        code_permissions_to: [],
        ram_kbytes: 32,
      },
      
    ]
  },

  hosts:[
  ]    
};

module.exports = config;