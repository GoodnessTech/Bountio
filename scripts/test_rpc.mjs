async function rpcCall(method, params = []) {
  const res = await fetch('https://rpc.botchain.ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
  });
  const data = await res.json();
  return data.result;
}

async function main() {
  console.log('--- Testing BOT Chain RPC ---');
  try {
    const chainIdHex = await rpcCall('eth_chainId');
    const chainId = parseInt(chainIdHex, 16);
    console.log('Chain ID (hex):', chainIdHex);
    console.log('Chain ID (decimal):', chainId);

    const blockNumberHex = await rpcCall('eth_blockNumber');
    console.log('Latest Block (decimal):', parseInt(blockNumberHex, 16));

    const gasPriceHex = await rpcCall('eth_gasPrice');
    console.log('Gas Price (hex):', gasPriceHex, 'wei:', BigInt(gasPriceHex).toString());

    // Check client version
    const clientVersion = await rpcCall('web3_clientVersion');
    console.log('Client Version:', clientVersion);
  } catch (err) {
    console.error('RPC Error:', err);
  }
}

main();
