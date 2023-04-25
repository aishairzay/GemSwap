import axios from "axios";
import { ec as EC } from "elliptic";
import { SHA3 } from "sha3";
import { Account } from "../account/Accounts";
import { Buffer } from "buffer";

const c2j = require("./CadenceToJson.json");
const fcl = require("@onflow/fcl");

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
    network: string;

    // If only running scripts, you can send in an empty account
    constructor(account: Account | undefined, network = "testnet") {
        this.network = network;
        this.fcl = fcl;
        this.account = account;
        const config = this.fcl.config({
            "accessNode.api": `${
                network === "testnet"
                    ? "https://rest-testnet.onflow.org"
                    : "https://rest-mainnet.onflow.org"
            }`,
        });
        config.put("flow.network", network);

        const contractAddresses = c2j.vars[network];
        Object.keys(contractAddresses).forEach((key) => {
            if (key && contractAddresses[key]) {
                config.put(key, contractAddresses[key]);
                config.put(
                    `system.contracts.${key.slice(2)}`,
                    contractAddresses[key]
                );
            }
        });
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

    async multiSigSignTransaction(
        lastTx: any,
        transactionCode: string,
        transactionArgs: any = (arg: any, t: any) => [],
        shouldSend: boolean = true
    ): Promise<any> {
        // Will always use the first key for now
        const keyId = 0;
        const authorization = authorizationFunction(
            this.account?.address,
            keyId,
            this.account?.privateKey
        );
        let payload;
        let account1 = await this.fcl.account("d96401bb22d88f81");
        let account2 = await this.fcl.account("d35471304961eb69");
        console.log(account1);
        console.log(account2);
        if (lastTx) {
            payload = [
                this.fcl.transaction(transactionCode),
                this.fcl.ref(lastTx.refBlock),
                this.fcl.limit(999),
                this.fcl.authorizations([account1, authorization]),
                this.fcl.proposer(account1),
                this.fcl.payer(account1),
            ];
        } else {
            payload = [
                this.fcl.transaction(transactionCode),
                this.fcl.limit(999),
                this.fcl.authorizations([authorization, account2]),
                this.fcl.proposer(authorization),
                this.fcl.payer(authorization),
            ];
        }
        console.log("sdfsdfs");
        const voucher = await this.fcl.serialize(payload);
        let nextTx = JSON.parse(voucher);
        console.log(nextTx);
        if (shouldSend) {
            nextTx.payloadSigs = lastTx.envelopeSigs;
            nextTx.authorizers = lastTx.authorizers.concat(nextTx.authorizers);
            nextTx.proposalKey = lastTx.proposalKey;
            console.log(nextTx);
            return await this.sendRawTransaction(nextTx);
        } else {
            return nextTx;
        }
    }

    async sendRawTransaction(tx: any): Promise<any> {
        const body = {
            script: Buffer.from(tx.cadence).toString("base64"),
            arguments: tx.arguments.map((item: any) =>
                Buffer.from(JSON.stringify(item)).toString("base64")
            ),
            reference_block_id: tx.refBlock,
            gas_limit: String(tx.computeLimit),
            payer: tx.payer,
            proposal_key: {
                address: tx.proposalKey.address,
                key_index: String(tx.proposalKey.keyId),
                sequence_number: String(tx.proposalKey.sequenceNum),
            },
            authorizers: tx.authorizers,
            payload_signatures: tx.payloadSigs.map((item: any) => {
                return {
                    address: item.address,
                    key_index: String(item.keyId),
                    signature: Buffer.from(item.sig, "hex").toString("base64"),
                };
            }),
            envelope_signatures: tx.envelopeSigs.map((item: any) => {
                return {
                    address: item.address,
                    key_index: String(item.keyId),
                    signature: Buffer.from(item.sig, "hex").toString("base64"),
                };
            }),
        };
        console.log(body);
        const txResult = await axios.post(
            `${await this.fcl.config().get("accessNode.api")}/v1/transactions`,
            body
        );
        return await fcl.tx(txResult.data.id).onceSealed();
    }
}
