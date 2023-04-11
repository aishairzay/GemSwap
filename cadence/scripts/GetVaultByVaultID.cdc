import "VaultService"

pub fun main(vaultID: UInt64):AnyStruct {
  let address = VaultService.vaultAddresses[vaultID] ?? panic("No address found")
  let vaultCollection = getAccount(address).getCapability<&{VaultService.VaultCollectionPublic}>(/public/VaultCollection).borrow()
    ?? panic("Could not borrow capability from public collection")
  let vault = vaultCollection.borrowVault(uuid: vaultID)
  return vault
}
