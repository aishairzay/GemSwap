import NonFungibleToken from "../contracts/NonFungibleToken.cdc"
import GemGames from "../contracts/GemGames.cdc"

pub fun main (): [UInt64] {
    return GemGames.getGameSetIds()
}