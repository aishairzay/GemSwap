import GemGames from "../contracts/GemGames.cdc"

transaction() {
    prepare(signer: AuthAccount) {
        if signer.borrow<&GemGames.GemGameManager>(from: GemGames.GemGameManagerStoragePath) != nil {
            return
        }
        signer.save(<- GemGames.createGemGameManager(), to: GemGames.GemGameManagerStoragePath)
        signer.link<&GemGames.GemGameManager>(GemGames.GemGameManagerPrivatePath, target: GemGames.GemGameManagerStoragePath)
        signer.link<&GemGames.GemGameManager{GemGames.IGameManagerPublic}>(GemGames.GemGameManagerPublicPath, target: GemGames.GemGameManagerStoragePath)
    }
}