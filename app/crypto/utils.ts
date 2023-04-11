import * as Crypto from "expo-crypto";
import CryptoJS from "crypto-js";
import * as secp from "@noble/secp256k1";

export const createHash = async (
    pw: string,
    hashAlgorithm: string
): Promise<string> => {
    const digest = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pw
    );
    return digest.toString();
};

export const symmetricDecryptMessage = (
    message: string,
    key: string,
    algorithm: string
): any => {
    // using the key and algorithm, decrypt the message
    // return the decrypted message
    return CryptoJS.AES.decrypt(message, key).toString(CryptoJS.enc.Utf8);
};

export const deriveKey = async (
    pw: string
): Promise<{ privateKey: string, publicKey: string }> => {
    // using the password, derive a key
    // return the key
    let hash = await createHash(pw, 'SHA256');
    hash = hash + hash // we need more than the 32 bytes of the hash
    // just double it for now

    const privateKey = buf2hex(secp.utils.hashToPrivateKey(hash));
    const publicKey = buf2hex(secp.getPublicKey(privateKey));

    return {
        privateKey: privateKey,
        publicKey: publicKey,
    }
}

export const sign = async (
    message: string,
    privateKey: string
) => {
    const signature = await secp.sign(message, privateKey);
    const realSignature = secp.Signature.fromHex(signature).toCompactHex();
    return realSignature;
}

export const symmetricEncryptMessage = (
    message: string,
    key: string,
    algorithm: string
): any => {
    // using the key and algorithm, encrypt the message
    // assuming only algorithm used here ATM is AES
    return CryptoJS.AES.encrypt(message, key).toString();
};

export const buf2hex = (buffer: Uint8Array) => {
    // buffer is an ArrayBuffer
    return [...new Uint8Array(buffer)]
        .map((x) => x.toString(16).padStart(2, "0"))
        .join("")
        .replace(/^04/, "");
};

/*
to be used during creation of a new vault
or when testing

const key = 'samplesalt:apples'//deriveKey('samplesalt:apples')
createHash(key, 'SHA256').then((hashedKey) => {
  const encrypted = symmetricEncryptMessage('Nice Solve, Join the secret discord at https://discord.gg/SecretApplesSociety', key, 'AES')
  console.log('encrypted is', encrypted)
  
  const unencrypted = symmetricDecryptMessage(encrypted, key, 'AES')
})
*/
