import { createAccount } from "../accounts";

test(`creates an account`, async () => {
    if (!process.env.LILICO_TOKEN) {
        return;
    }
    let account = await createAccount();
    expect(account.address).toBeDefined();
    expect(account.address.startsWith("0x")).toBeTruthy();
    console.log(account);
}, 60000);
