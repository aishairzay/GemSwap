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

transaction(claimAddress: Address, setId: UInt64) {
    let claimerAddress: Address

    prepare(signer: AuthAccount) {
        self.claimerAddress = signer.address
        initializeCollection(account: signer)
    }

    execute {
        let gameRef = getAccount(claimAddress).getCapability(GemGames.GemGameManagerPublicPath)!.borrow<&GemGames.GemGameManager{GemGames.IGameManagerPublic}>()!.borrowGame(setId: setId)!

        gameRef.claim(address: self.claimerAddress)
    }
}