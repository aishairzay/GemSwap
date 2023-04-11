import Crypto

pub contract VaultExecutionSignatures {
  pub fun verifySignature(signed: String, message: String, publicKey: String): Address? {
    let publicKey = PublicKey(
        publicKey: publicKey.decodeHex(),
        signatureAlgorithm: SignatureAlgorithm.ECDSA_secp256k1
    )

    let sig = signed.decodeHex()
    let messageBytes = message.decodeHex()

    if (publicKey.verify(
      signature: sig,
      signedData: messageBytes,
      domainSeparationTag: "",
      hashAlgorithm: HashAlgorithm.SHA2_256
    )) {
      return 0x1234
    } else {
      return nil
    }
  }
}