import NonFungibleToken from "../contracts/NonFungibleToken.cdc"
import MetadataViews from "../contracts/MetadataViews.cdc"
import Gem from "../contracts/Gem.cdc"
import GemGames from "../contracts/GemGames.cdc"

pub fun initializeCollection(account: AuthAccount) {
    if account.borrow<&Gem.Collection>(from: Gem.CollectionStoragePath) == nil {
        let collection <- Gem.createEmptyCollection()
        
        account.save(<-collection, to: Gem.CollectionStoragePath)

        account.link<&Gem.Collection{NonFungibleToken.CollectionPublic, Gem.GemCollectionPublic, MetadataViews.ResolverCollection}>(
            Gem.CollectionPublicPath, 
            target: Gem.CollectionStoragePath
        )
    }
}

transaction() {

    let offerer: &Gem.Collection
    let requester: &Gem.Collection

    prepare(offerer: AuthAccount, requester: AuthAccount) {
        initializeCollection(account: offerer)
        initializeCollection(account: requester)
        self.offerer = offerer.borrow<&Gem.Collection>(from: Gem.CollectionStoragePath)!
        self.requester = requester.borrow<&Gem.Collection>(from: Gem.CollectionStoragePath)!
    }

    execute {
        let offererIds = self.offerer.getIDs()
        let requesterIds = self.requester.getIDs()
    }
}