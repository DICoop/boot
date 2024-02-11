
var networks = {
  "master" : {
    "protocol" : "http",
    "host" : "localhost",
    "port" : ":8888",
    "registrator": "http://127.0.0.1:5010"
  },
  "dacom" : {
    // "protocol" : "http",
    // "host" : "localhost",
    // "port" : ":8888"
    "protocol" : "http",
    "host" : "92.63.96.109",
    "port" : ":8888",
    "registrator": "https://testnet1.copenomics.world/api"
  },
  "uni" : {
    "protocol" : "http",
    "host" : "95.216.220.50:8888",
    "port" : ""
  },
  "tc" : {
    "protocol" : "https",
    "host" : "api.travelchain.io",
    "port" : ""
  },
  "cbs" : {
    "protocol" : "http",
    "host" : "185.132.178.253:8888",
    "port" : ""
  },
  "essence" : {
    "protocol" : "http",
    "host" : "54.36.178.85:8888",
    "port" : ""
  },
  "eywa" : {
    "protocol" : "http",
    "host" : "136.243.173.72:8888",
    "port" : ""
  },
  "thews" : {
    "protocol" : "http",
    "host" : "5.75.231.4:8888",
    "port" : ""
  },
};


async function get_network_params(name){

  return networks[name]  
}

module.exports = get_network_params;