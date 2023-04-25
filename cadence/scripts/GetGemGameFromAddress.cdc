import GemGames from "../contracts/GemGames.cdc"
import Gem from "../contracts/Gem.cdc"

pub fun main(gameOwnerAddress: Address, setId: UInt64): GemGames.GemGameInfo? {
    if let gameManagerRef = getAccount(gameOwnerAddress).getCapability(GemGames.GemGameManagerPublicPath).borrow<&GemGames.GemGameManager{GemGames.IGameManagerPublic}>() {
        if let gameRef = gameManagerRef.borrowGame(setId: setId) {
            return gameRef.getInfo()
        }
    }

    return nil 

}