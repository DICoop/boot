
const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');      // development only
const { TextEncoder, TextDecoder } = require('util');                   // node only; native TextEncoder/Decoder
const fetch = require('node-fetch');   
const EosApi = require('eosjs-api')


// var network = {
//       protocol: protocol,
//           blockchain: process.env.BLOCKCHAIN,
//           host: endpoint, // ( or null if endorsed chainId )
//           port: process.env.ENDPORT, // ( or null if defaulting to 80 )
//           chainId: process.env.CHAINID,
// }

var get_network_params = require("./networks.js");
var {get_wif} = require("./config.js");


async function get_pass_instance(network, wif_role){

  var params = await get_network_params(network)  
  const protocol = params.protocol
  const endpoint = params.host
  const port = params.port
  var res = protocol + '://'+ endpoint + port

  var wif = await get_wif(wif_role, network)

  const rpc = new JsonRpc(res, { fetch });

  const defaultPrivateKey = wif; // bob
  const signatureProvider = new JsSignatureProvider([defaultPrivateKey]);
  
  let api = new Api({ rpc, signatureProvider, textDecoder: new TextDecoder(), textEncoder: new TextEncoder() });

  api.api = EosApi({ httpEndpoint: res })
  
  return api
}

module.exports = get_pass_instance;