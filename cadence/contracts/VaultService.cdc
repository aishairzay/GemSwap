import "MetadataViews"
import "VaultExecutionSignatures"

pub contract VaultService {
  // Events
  pub event VaultCreated(id: UInt64, description: String)

  // To make vaults globally accessible, we wire up the vault collection
  // resource with a global map here that can be used to access what account
  // is holding a specific vault by ID.
  pub let vaultAddresses: {UInt64: Address}

  access(contract) fun updateVaultAddress(uuid: UInt64, address: Address?) {
    self.vaultAddresses[uuid] = address
  }

  // An action that can be run when a user opens a vault
  pub resource interface VaultAction {
    // The vault that was opened should be passed in as a reference
    // and the address that opened it is provided as well, allowing for
    // actions to be taken that affect that account.
    pub fun execute(vaultID: UInt64, address: Address)
  }

  pub resource interface VaultCollectionPublic {
    pub fun getIDs(): [UInt64]
    pub fun borrowVault(uuid: UInt64): &Vault?
  }

  // We keep a top-level collection of vaults that can be accessed by
  // the vault's UUID.
  pub resource VaultCollection: VaultCollectionPublic {
    pub var vaults: @{UInt64: Vault} // Vault UUID to vault

    // allow deposits, withdraws, and transfers of a vault
    // to other accounts
    pub fun deposit(vault: @Vault) {
      VaultService.updateVaultAddress(uuid: vault.uuid, address: self.owner?.address)
      let oldVault <- self.vaults[vault.uuid] <- vault
      destroy oldVault
    }

    pub fun getIDs(): [UInt64] {
      return self.vaults.keys
    }

    pub fun borrowVault(uuid: UInt64): &Vault? {
      post {
          result == nil || result!.uuid == uuid: "The returned reference's ID does not match the requested ID"
      }
      return &self.vaults[uuid] as &Vault?
    }

    destroy() {
      destroy self.vaults
    }

    init() {
      self.vaults <- {}
    }
  }
  

  pub resource Vault {
    // ID for the vault, equivalent to the vault's unique UUID.
    pub let id: UInt64

    // Description for the vault
    pub let description: String

    // Thumbnail for the vault
    pub let thumbnail: String

    // A salt used to attach to the submitted password that is used to open
    // the vault. This salt should be used to generate a hash of the password
    // and the salt, and the hash should be compared to the control string
    pub let passwordSalt: String

    // The control string is used to verify if a user has access to a vault.
    // It is intended to be a hash of the vault's ID combined with the secret
    //  to open the vault like the following: {vaultID}:{secret}
    // The hash algorithm used to generate the control string should be
    // specified in the hashAlgorithm field.
    pub let hashControl: String

    // The hash algorithm used to generate the control string.
    pub let hashAlgorithm: String

    // The data string is used to store any secret string for the vault, and
    // should be encrypted using the same key as the control string.
    pub let encryptedMessage: String?

    // If there is encrypted data, this should be set to let a consumer know
    // what algorithm was used for the symmetric encryption.
    pub let encryptionAlgorithm: String?

    // Using the secret phrase for this vault, a key pair should be derived
    // and the public key should be published on-chain here if the vault
    // requiers any assymetric keys for gating access to an action.
    pub let derivedPublicKey: String?

    // The vault should be able to store an action that can be
    // performed on it. These actions should be able to be executed by
    // by a third party that has access to a derived public key and proves it
    // by submitting a signature on-chain that includes the account address
    // of who solved the riddle.
    access(self) let action: Capability<&{VaultAction}>?

    pub fun executeAction(signed: String, message: String): Bool {
      // verify that the provided signatures match up with the on-chain derived public key
      // and through that, find the address that opened up the vault, and ensure that the
      // ID mentioned in the signed data matches the current vault ID.
      assert(self.action != nil, message: "An action must exist in order to run execute action")
      assert(self.derivedPublicKey != nil, message: "A public key must exist in order to run execute action")

      let address = VaultExecutionSignatures.verifySignature(signed: signed, message: message, publicKey: self.derivedPublicKey!)
      assert(address != nil, message: "Signature verification failed.")
      self.action!.borrow()!.execute(vaultID: self.id, address: address!)

      return true
    }

    pub fun getViews(): [Type] {
      return [
        Type<MetadataViews.Display>()
      ]
    }

    pub fun resolveView(_ view: Type): AnyStruct? {
      return (
        MetadataViews.Display(
          name: "Vault #".concat(self.id.toString()),
          description: self.description,
          thumbnail: MetadataViews.HTTPFile(url: self.thumbnail)
        )
      )
    }

    init(description: String, thumbnail: String, passwordSalt: String, hashControl: String, hashAlgorithm: String, encryptedMessage: String?, encryptionAlgorithm: String?, derivedPublicKey: String?, action: Capability<&{VaultAction}>?) {
      self.id = self.uuid
      self.description = description
      self.passwordSalt = passwordSalt
      self.thumbnail = thumbnail
      self.hashControl = hashControl
      self.hashAlgorithm = hashAlgorithm
      self.encryptedMessage = encryptedMessage
      self.encryptionAlgorithm = encryptionAlgorithm
      self.derivedPublicKey = derivedPublicKey
      self.action = action

      emit VaultCreated(id: self.id, description: self.description)
    }
  }

  pub fun createVaultCollection(): @VaultCollection {
    return <- create VaultCollection()
  }

  // Public method to create a vault
  pub fun createVault(description: String, thumbnail: String, passwordSalt: String, hashControl: String, hashAlgorithm: String, encryptedMessage: String?, encryptionAlgorithm: String?, derivedPublicKey: String?, action: Capability<&{VaultAction}>?): @Vault {
    return <- create Vault(
      description: description,
      thumbnail: thumbnail,
      passwordSalt: passwordSalt,
      hashControl: hashControl,
      hashAlgorithm: hashAlgorithm,
      encryptedMessage: encryptedMessage,
      encryptionAlgorithm: encryptionAlgorithm,
      derivedPublicKey: derivedPublicKey,
      action: action
    )
  }

  init() {
    self.vaultAddresses = {}
  }
}
 