// You can make your own vault action!
// Deploy a contract similar to this, with your own implementation details.
// Then specify the contract in the app when creating your vault to use it.
import "MetadataViews"
import "NonFungibleToken"
import "VaultService"

pub contract SomeStandardVaultActions {

  pub resource interface IRiddleLeaderboard {
    pub fun getLeaderboard(): [Address]
  }

  pub resource RiddleLeaderboardAction: VaultService.VaultAction, MetadataViews.Resolver, IRiddleLeaderboard {
    pub fun getViews(): [Type] {
      return [
        Type<MetadataViews.Display>()
      ]
    }

    pub fun resolveView(_ view: Type): AnyStruct? {
      return [
        MetadataViews.Display(
          name: "Riddle Leaderboard",
          description: "Great solve, click the button to get on the leaderboard.",
          thumbnail: MetadataViews.HTTPFile(url: "https://example.com/icon.png")
        )
      ]
    }

    // The leaderboard will be stored in order of who solved it first to last
    access(self) let leaderboard: [Address]

    // The map will keep track of what account solved it.
    // This is to make sure we don't add the same account twice.
    access(self) let leaderboardMap: { Address: Bool }

    init() {
      self.leaderboard = []
      self.leaderboardMap = {}
    }

    pub fun getLeaderboard(): [Address] {
      return self.leaderboard
    }

    pub fun execute(vaultID: UInt64, address: Address) {
      if self.leaderboardMap[address] == nil {
        self.leaderboardMap[address] = true
        self.leaderboard.append(address)
      }
    }
  }

  pub resource DestroyNFTAction: VaultService.VaultAction, MetadataViews.Resolver {
    pub fun getViews(): [Type] {
      return [
        Type<MetadataViews.Display>()
      ]
    }

    pub fun resolveView(_ view: Type): AnyStruct? {
      return [
        MetadataViews.Display(
          name: "Destroy NFT",
          description: "Destroy the NFT",
          thumbnail: MetadataViews.HTTPFile(url: "https://example.com/icon.png")
        )
      ]
    }

    pub let nftAccess: Capability<&{NonFungibleToken.Provider}>
    pub let nftID: UInt64

    init(nftAccess: Capability<&{NonFungibleToken.Provider}>, nftID: UInt64) {
      self.nftAccess = nftAccess
      self.nftID = nftID
    }

    pub fun execute(vaultID: UInt64, address: Address) {
      let nftCollection = self.nftAccess.borrow()
        ?? panic("Could not borrow NFT collection")

      let nft <- nftCollection.withdraw(withdrawID: self.nftID)

      // destroy the NFT
      destroy nft
    }
  }
}
