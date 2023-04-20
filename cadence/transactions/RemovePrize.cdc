import GemGames from "../contracts/GemGames.cdc"

transaction(setId: UInt64) {
    let gemGameManagerRef: &GemGames.GemGameManager

    prepare(signer: AuthAccount) {
        self.gemGameManagerRef = signer.borrow<&GemGames.GemGameManager>(from: GemGames.GemGameManagerStoragePath)
            ?? panic("Could not borrow reference to the GemGameManager")
            
        
    }

    execute {
        self.gemGameManagerRef.removePrize(setId: setId)
    }

}