import * as SecureStore from "expo-secure-store";
import { Account, createAccount } from "../../account/Accounts";

const KEY = "flowAccount";

export async function createOrGetFlowAccount(): Promise<Account> {
    try {
        const value = await SecureStore.getItemAsync(KEY);
        if (value !== null && value !== undefined) {
            console.log("Found existing account with address", JSON.parse(value).address);
            return JSON.parse(value);
        } else {
            console.log("Creating account.");
            const newFlowAcc = await createAccount();
            await SecureStore.setItemAsync(KEY, JSON.stringify(newFlowAcc));
            return newFlowAcc;
        }
    } catch (error) {
        console.error("Error loading @flowAccount:", error);
        throw error;
    }
}

export async function getFlowAccount(): Promise<Account> {
    try {
        const value = await SecureStore.getItemAsync(KEY);
        if (value !== null && value !== undefined) {
            console.log("Found existing account with address", JSON.parse(value).address);
            return JSON.parse(value);
        }
        return null
    } catch (error) {
        console.error("Error loading @flowAccount:", error);
        return null
    }
}

// Used for testing removing an account from a device, to re-test account creation.
export async function deleteFlowAccountFromDevice() {
    try {
        await SecureStore.deleteItemAsync(KEY, { requireAuthentication: true })
    } catch (error) {
        console.error("Error deleting account from device", error)
        throw error
    }
}
