import GemGames from "../contracts/GemGames.cdc"
import Gem from "../contracts/Gem.cdc"

pub fun main(setId: UInt64): GemGames.GemGameInfo? {
    return GemGames.getGameForSetId(setId: setId)
}