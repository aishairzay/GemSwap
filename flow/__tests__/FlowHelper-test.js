import { FlowHelper } from "../FlowHelper";

test(`can call script`, async () => {
    const flowHelper = new FlowHelper();
    const scriptResult = await flowHelper.runScript(
        "pub fun main(): Int { return 42 }"
    );
    expect(scriptResult).toEqual("42");
});

test(`can call tx`, async () => {
    if (!process.env.FLOW_ADDRESS) {
        return;
    }
    const flowHelper = new FlowHelper({
        address: process.env.FLOW_ADDRESS,
        privateKey: process.env.FLOW_PRIVATE_KEY,
        publicKey: process.env.FLOW_PUBLIC_KEY,
    });
    const result = await flowHelper.startTransaction(
        "transaction() { prepare(signer: AuthAccount) { } execute { } }"
    );
    console.log(result);
}, 60000);

test(`can multisig tx`, async () => {
    if (!process.env.FLOW_ADDRESS || !process.env.FLOW_MULTI_SIG_ADDRESS) {
        return;
    }
    const tx =
        "transaction() { prepare(signer1: AuthAccount, signer2: AuthAccount) { } execute { } }";
    const flowHelper1 = new FlowHelper({
        address: process.env.FLOW_ADDRESS,
        privateKey: process.env.FLOW_PRIVATE_KEY,
        publicKey: process.env.FLOW_PUBLIC_KEY,
    });
    const firstTx = await flowHelper1.multiSigSignTransaction(
        undefined,
        tx,
        [],
        [process.env.FLOW_ADDRESS, process.env.FLOW_MULTI_SIG_ADDRESS],
        false
    );
    const flowHelper2 = new FlowHelper({
        address: process.env.FLOW_MULTI_SIG_ADDRESS,
        privateKey: process.env.FLOW_MULTI_SIG_PRIVATE_KEY,
        publicKey: process.env.FLOW_MULTI_SIG_PUBLIC_KEY,
    });
    const result = await flowHelper2.multiSigSignTransaction(
        firstTx,
        tx,
        [],
        [process.env.FLOW_ADDRESS, process.env.FLOW_MULTI_SIG_ADDRESS],
        true
    );
    console.log(result);
}, 60000);
