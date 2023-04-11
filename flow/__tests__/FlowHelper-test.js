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
