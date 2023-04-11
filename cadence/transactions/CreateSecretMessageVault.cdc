import "VaultService"

transaction(description: String, thumbnail: String, passwordSalt: String, hashControl: String, hashAlgorithm: String, encryptedMessage: String?, encryptionAlgorithm: String?, derivedPublicKey: String?) {
  let vaultCollection: &VaultService.VaultCollection

  prepare(signer: AuthAccount) {
    var vaultCollectionCap = signer.borrow<&VaultService.VaultCollection>(from: /storage/VaultCollection)
    if (vaultCollectionCap == nil) {
      let vaultCollection <- VaultService.createVaultCollection()
      signer.save(<-vaultCollection, to: /storage/VaultCollection)
      vaultCollectionCap = signer.borrow<&VaultService.VaultCollection>(from: /storage/VaultCollection)
      self.vaultCollection = vaultCollectionCap!
    } else {
      self.vaultCollection = vaultCollectionCap!
    }
    signer.link<&{VaultService.VaultCollectionPublic}>(/public/VaultCollection, target: /storage/VaultCollection)
  }

  execute {
    let vault <- VaultService.createVault(description: description, thumbnail: thumbnail, passwordSalt: passwordSalt, hashControl: hashControl, hashAlgorithm: hashAlgorithm, encryptedMessage: encryptedMessage, encryptionAlgorithm: encryptionAlgorithm, derivedPublicKey: derivedPublicKey, action: nil)
    self.vaultCollection.deposit(vault: <-vault)
  }
}
