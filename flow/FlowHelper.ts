import { ec as EC } from "elliptic";
import { SHA3 } from "sha3";
import { Account } from "../account/Accounts";
import { Buffer } from "buffer";

const c2j = require('./CadenceToJson.json')
const fcl = require("@onflow/fcl");

fcl.config({
    'accessNode.api': 'https://access-testnet.onflow.org'
})

const ec = new EC("secp256k1");

const hashMsgHex = (msgHex: string) => {
    const sha = new SHA3(256);
    sha.update(Buffer.from(msgHex, "hex"));
    return sha.digest();
};

const sign = (privateKey: string, msgHex: string) => {
    const key = ec.keyFromPrivate(privateKey);
    const sig = key.sign(hashMsgHex(msgHex));
    const n = 32;
    const r = sig.r.toArrayLike(Buffer, "be", n);
    const s = sig.s.toArrayLike(Buffer, "be", n);
    return Buffer.concat([r, s]).toString("hex");
};

const authorizationFunction = (
    accountAddress: any,
    keyId: any,
    privateKey: any
) => {
    return async (account: any = {}) => {
        return {
            ...account,
            tempId: `${accountAddress}-${keyId}`,
            addr: fcl.sansPrefix(accountAddress),
            keyId: keyId,
            signingFunction: (signable: any) => {
                return {
                    addr: fcl.withPrefix(accountAddress),
                    keyId: keyId,
                    signature: sign(privateKey, signable.message),
                };
            },
        };
    };
};

export class FlowHelper {
    fcl: any;
    account: Account | undefined;

    // If only running scripts, you can send in an empty account
    constructor(account: Account | undefined, network = "testnet") {
        this.fcl = fcl;
        this.account = account;
        const config = this.fcl.config({
            "accessNode.api": `${
                network === 'testnet' ?
                    'https://access-testnet.onflow.org'
                    :
                    'https://rest-mainnet.onflow.org'
            }`,
        })
        config.put("flow.network", network);

        const contractAddresses = c2j.vars[network]
        Object.keys(contractAddresses).forEach((key) => {
            if (key && contractAddresses[key]) {   
                config.put(key, contractAddresses[key])
                config.put(`system.contracts.${key.slice(2)}`, contractAddresses[key])
            }
        })
    }

    async runScript(
        scriptCode: string,
        scriptArgs: any = (arg: any, t: any) => []
    ): Promise<any> {
        return await this.fcl.query({
            cadence: scriptCode,
            args: scriptArgs,
        });
    }

    async startTransaction(
        transactionCode: string,
        transactionArgs: any = (arg: any, t: any) => []
    ): Promise<any> {
        // Will always use the first key for now
        const keyId = 0;
        const authorization = authorizationFunction(
            this.account?.address,
            keyId,
            this.account?.privateKey
        );
        const response = await this.fcl.mutate({
            cadence: transactionCode,
            args: transactionArgs,
            authorizations: [authorization],
            proposer: authorization,
            payer: authorization,
            limit: 9999,
        });

        return await this.fcl.tx(response).onceSealed();
    }
}
