import "VaultService"

pub fun main(address: Address):[AnyStruct] {
  let vaultCollection = getAccount(address).getCapability<&{VaultService.VaultCollectionPublic}>(/public/VaultCollection).borrow()
    ?? panic("Could not borrow capability from public collection")
  let ids = vaultCollection.getIDs()
  var vaults: [AnyStruct] = []
  for id in ids {
    let vault = vaultCollection.borrowVault(uuid: id)
    vaults.append(vault)
  }
  return vaults
}
