import NonFungibleToken from "../contracts/NonFungibleToken.cdc"
import Gem from "../contracts/Gem.cdc"

pub fun main (address: Address): [UInt64] {
     if let col = getAccount(address).getCapability<&Gem.Collection{NonFungibleToken.CollectionPublic}>(Gem.CollectionPublicPath).borrow() {
        return col.getIDs()
    }

    return []
}