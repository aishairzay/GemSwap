import NonFungibleToken from "../contracts/NonFungibleToken.cdc"
import MetadataViews from "../contracts/MetadataViews.cdc"
import Gem from "../contracts/Gem.cdc"
import GemGames from "../contracts/GemGames.cdc"

pub fun getOrCreateGameCollection(
    account: AuthAccount,
    setId: UInt64
): Capability<&Gem.Collection> {
     let collectionCap = account.getCapability<&Gem.Collection>(GemGames.getGameCollectionPrivatePath(setId: setId))

     if collectionCap.check() {
        return collectionCap
     }

     let collection <- Gem.createEmptyCollection()
     account.save(<-collection, to: GemGames.getGameCollectionStoragePath(setId: setId))
     account.link<&Gem.Collection>(GemGames.getGameCollectionPrivatePath(setId: setId), target: GemGames.getGameCollectionStoragePath(setId: setId))
     account.link<&Gem.Collection{NonFungibleToken.CollectionPublic, Gem.GemCollectionPublic, MetadataViews.ResolverCollection}>(GemGames.getGameCollectionPublicPath(setId: setId), target: GemGames.getGameCollectionStoragePath(setId: setId))

     return collectionCap

}

transaction(name: String, prizes: String) {
    let gemGameManagerRef: &GemGames.GemGameManager

    prepare(signer: AuthAccount) {
        self.gemGameManagerRef = signer.borrow<&GemGames.GemGameManager>(from: GemGames.GemGameManagerStoragePath)
            ?? panic("Could not borrow reference to the GemGameManager")

        let setId = self.gemGameManagerRef.createSet()

        self.gemGameManagerRef.createGame(setId: setId, name: name, prizes: prizes, setCollection: getOrCreateGameCollection(account: signer, setId: setId))
    }
    
    execute {}
}