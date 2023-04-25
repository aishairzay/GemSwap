import GemGames from "../contracts/GemGames.cdc"


transaction(setId: UInt64, colors: [String]) {
    let gemGameManagerRef: &GemGames.GemGameManager

    prepare(signer: AuthAccount) {
        self.gemGameManagerRef = signer.borrow<&GemGames.GemGameManager>(from: GemGames.GemGameManagerStoragePath)
            ?? panic("Could not borrow reference to the GemGameManager")
        
    }

    
    execute {
        for color in colors {
            self.gemGameManagerRef.mintNFT(setId: setId, color: color)
        }

    }
}