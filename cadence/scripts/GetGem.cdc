import MetadataViews from "../contracts/MetadataViews.cdc"
import NonFungibleToken from "../contracts/NonFungibleToken.cdc"
import Gem from "../contracts/Gem.cdc"


pub struct NFT {
    pub let id: UInt64

    pub let display: MetadataViews.Display
    
    init(
        id: UInt64,
        display: MetadataViews.Display,
    ) {
        self.id = id
        self.display = display
    }
}


pub fun main(address: Address, id: UInt64): NFT? {
    if let col = getAccount(address).getCapability<&Gem.Collection{NonFungibleToken.CollectionPublic, Gem.GemCollectionPublic}>(Gem.CollectionPublicPath).borrow() {
        if let nft = col.borrowGem(id: id) {

            let display = nft.resolveView(Type<MetadataViews.Display>())! as! MetadataViews.Display

            return NFT(
                id: id,
                display: display
            )
        }
    }

    return nil
}