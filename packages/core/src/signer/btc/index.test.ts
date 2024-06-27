//offckb跟钱包交互拿请求body和响应body（拿aggraon测试网配置，script hash config）

const {RPC} = require('@ckb-lumos/rpc')
const nock = require('nock');
const nodeUrl = "http://nock-rpc.com";
// const { decamelizeKeys } from 'humps';

describe("nock demo", () => {

  test("get request", () => {
    const scope = nock('https://api.github.com')
      .get('/repos/atom/atom/license')
      .reply(200, {
        license: {
          key: 'mit',
          name: 'MIT License',
          spdx_id: 'MIT',
          url: 'https://api.github.com/licenses/mit',
          node_id: 'MDc6TGljZW5zZTEz',
        },
      })
  })

  test("post request", () => {
    nock('http://www.example.com')
      .post('/login', 'username=pgte&password=123456')
      .reply(200, {id: '123ABC'})
  })

  test("test send_transaction api", async () => {

    const cellDeps = [
      {
        outPoint: {
          index: "0x7",
          txHash: "0x1dbed8dcfe0f18359c65c5e9546fd15cd69de73ea0a502345be30180649c9467",
        },
        depType: "code",
      },
      {
        outPoint: {
          index: "0x0",
          txHash: "0x75be96e1871693f030db27ddae47890a28ab180e88e36ebb3575d9f1377d3da7",
        },
        depType: "depGroup",
      },
    ];

    const inputs = [
      {
        previousOutput: {
          index: "0x0",
          txHash: "0x79b03499df6d3e706cfecc146d57b52e1c2c63e0bc2a9ce627d5775cbd1b48e4",
        },
        since: "0x0",
      },
    ];

    const outputs = [
      {
        capacity: "0x2540be400",
        lock: {
          codeHash: "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8",
          hashType: "type",
          args: "0x4118c8c16749bf126b22468d030bf9de7da3717b",
        },
      },
      {
        capacity: "0x1258d890ef",
        lock: {
          codeHash: "0x9c6933d977360f115a3e9cd5a2e0e475853681b80d775d93ad0f8969da343e56",
          hashType: "type",
          args: "0x041f120b62e89a2a0ffce5ba8cd2a6b90539e6732f00",
        },
      },
    ];

    const witnesses = [
      "0x690000001000000069000000690000005500000055000000100000005500000055000000410000001ff162ab8a9df2040ae2c3f9dd5e5b5e510537d2be149302a43eb5de8d68bca71a0e7fde2e3fe442cd9daf6105acfddbe7a8a3faaaf360d3530211c90dd5061c5b",
    ];

    const transactionParams = {
      version: "0x0",
      cellDeps: cellDeps,
      headerDeps: [],
      inputs: inputs,
      outputs: outputs,
      outputsData: ["0x", "0x"],
      witnesses: witnesses,
    };

    const transactionRequestBody = {
      id: 4328,
      jsonrpc: "2.0",
      method: "send_transaction",
      params: [transactionParams],
    };

    const nock = require('nock');

    nock(nodeUrl)
      .post("/", (body: { jsonrpc: string; method: string; id: any; params: string | any[]; }) => {
        // 确保基本结构和方法匹配
        return body.jsonrpc === "2.0" &&
          body.method === "send_transaction" &&
          typeof body.id === 'number' &&  // 只检查id是否为数字
          Array.isArray(body.params) &&  // 确保params是数组
          body.params.length > 0;        // 确保params数组非空
      })
      .reply(200, (uri: any, requestBody: { id: any; }) => {
        // 动态返回请求中的 id
        return {
          jsonrpc: "2.0",
          result: "0x1a517caab109a1409be80900184ddc566d05bd35096ddcc757ff06987b5abf96",
          id: requestBody.id
        };
      });

    const rpc = new RPC(nodeUrl, {timeout: 2000});
    const res = await rpc.sendTransaction(transactionParams);

    expect(res).toEqual("0x1a517caab109a1409be80900184ddc566d05bd35096ddcc757ff06987b5abf96");
  });
})


