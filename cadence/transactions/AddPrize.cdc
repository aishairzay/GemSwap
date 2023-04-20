import GemGames from "../contracts/GemGames.cdc"

transaction(setId: UInt64, prize: String) {
    let gemGameManagerRef: &GemGames.GemGameManager

    prepare(signer: AuthAccount) {
        self.gemGameManagerRef = signer.borrow<&GemGames.GemGameManager>(from: GemGames.GemGameManagerStoragePath)
            ?? panic("Could not borrow reference to the GemGameManager")
            
        
    }

    execute {
        self.gemGameManagerRef.addPrize(setId: setId, prize: prize)
    }

}