import GemGames from "../contracts/GemGames.cdc"

transaction() {
    prepare(signer: AuthAccount) {
        signer.save(<- GemGames.createGemGameManager(), to: GemGames.GemGameManagerStoragePath)
        signer.link<&GemGames.GemGameManager>(GemGames.GemGameManagerPrivatePath, target: GemGames.GemGameManagerStoragePath)
        signer.link<&GemGames.GemGameManager{GemGames.IGameManagerPublic}>(GemGames.GemGameManagerPublicPath, target: GemGames.GemGameManagerStoragePath)
    }
}