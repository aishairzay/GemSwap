import axios from "axios";
import { ec as EC } from "elliptic";
import { SHA3 } from "sha3";
import { Account } from "../account/Accounts";
import { Buffer } from "buffer";

const c2j = require("./CadenceToJson.json");
const fcl = require("@onflow/fcl");
const t = require("@onflow/types");

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

/*
    Workaround to pull in the payload sig from the previous transaction
*/
const payloadProvidedAuthorizationFunction = (
    accountAddress: any,
    keyId: any,
    providedSig: string
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
                    signature: providedSig,
                };
            },
        };
    };
};

/*
    Workaround to not needing the envelope key private key for the proposer of a multisig transaction.
*/
const envelopeBlankAuthorizationFunction = (
    accountAddress: any,
    keyId: any
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
                    signature: "",
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

    /*
        Currently only supports 2 signers, but shouldnt be too bad to add more.
    */
    async multiSigSignTransaction(
        lastTx: any,
        transactionCode: string,
        transactionArgs: any = (arg: any, t: any) => [],
        signers: string[],
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
        let args = transactionArgs(this.fcl.arg, t);
        if (lastTx) {
            payload = [
                this.fcl.transaction(transactionCode),
                this.fcl.args(args),
                this.fcl.ref(lastTx.refBlock),
                this.fcl.limit(999),
                this.fcl.authorizations([
                    payloadProvidedAuthorizationFunction(
                        signers[0],
                        keyId,
                        lastTx.payloadSigs[0].sig
                    ),
                    authorization,
                ]),
                this.fcl.proposer(
                    payloadProvidedAuthorizationFunction(
                        signers[0],
                        keyId,
                        lastTx.payloadSigs[0].sig
                    )
                ),
                this.fcl.payer(authorization),
            ];
        } else {
            payload = [
                this.fcl.transaction(transactionCode),
                this.fcl.args(args),
                this.fcl.limit(999),
                this.fcl.authorizations([
                    authorization,
                    envelopeBlankAuthorizationFunction(signers[1], keyId),
                ]),
                this.fcl.proposer(authorization),
                this.fcl.payer(
                    envelopeBlankAuthorizationFunction(signers[1], keyId)
                ),
            ];
        }
        const voucher = await this.fcl.serialize(payload);
        let nextTx = JSON.parse(voucher);
        if (shouldSend) {
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
        const txResult = await axios.post(
            `${await this.fcl.config().get("accessNode.api")}/v1/transactions`,
            body
        );
        return await fcl.tx(txResult.data.id).onceSealed();
    }
}

const objectsEqual = (o1: any, o2: any) =>
    Object.keys(o1).length === Object.keys(o2).length &&
    Object.keys(o1).every((p) => o1[p] === o2[p]);

const arraysEqual = (a1: any, a2: any) =>
    a1.length === a2.length &&
    a1.every((o: any, idx: any) => objectsEqual(o, a2[idx]));
