import NonFungibleToken from "./NonFungibleToken.cdc"
import MetadataViews from "./MetadataViews.cdc"
import Gem from "./Gem.cdc"

pub contract GemGames {
    pub let GemMinterStoragePath : StoragePath
    pub let GemMinterPrivatePath : PrivatePath

    pub let GemGameManagerPublicPath: PublicPath
    pub let GemGameManagerStoragePath: StoragePath
    pub let GemGameManagerPrivatePath: PrivatePath

    pub event GameCreated(uuid: UInt64, setId: UInt64)
    pub event GemClaimed(gameUuid: UInt64, setId: UInt64, nftId: UInt64, claimerAddress: Address)
    pub event PrizeAdded(setId: UInt64, prize: String)
    pub event PrizeRemoved(setId: UInt64)

    access(self) let prizes : {UInt64 : String}
    
    pub resource GemMinter {
        pub fun createSet() : UInt64 {
            return Gem.createSet()
        }

        pub fun mintNFT(color: String, setId: UInt64): @Gem.NFT {
            return <- Gem.mintNFT(color: color, setId: setId)
        }
       
       init () {}
    }

    pub resource interface IGemGamePublic {
        pub let setId: UInt64
        
        pub fun claim(address: Address) 
    }

    pub resource GemGame : IGemGamePublic {
        pub let setId: UInt64

        access(self) let collection: Capability<&Gem.Collection>

        pub let nftIds: [UInt64]

        access(self) let claims: {Address: UInt}

        pub var prizes: [String]

        // TODO: Add open/closing and limiations around how many you can claim
        // TODO: Add vault password system

        init(
            setId: UInt64,
            collection: Capability<&Gem.Collection>,
        ) {
            self.setId = setId
            self.collection = collection
            self.claims = {}
            self.nftIds = []
            self.prizes = []
        }

        pub fun setPrizes(prizes: [String]) {
            self.prizes = prizes
        }

        pub fun deposit(token: @Gem.NFT) {
            let collection = self.collection.borrow() 
                ?? panic("CollectionQueue.deposit: failed to borrow collection capability")

            self.nftIds.append(token.id)

            collection.deposit(token: <- token)
        }

        pub fun claim(address: Address) {
            if self.nftIds.length == 0 {
                return
            }
            let claims = self.claims[address] ?? 0
            self.claims[address] = claims + 1
            
            let collection = self.collection.borrow() ?? panic("Set collection not setup")

            while self.nftIds.length > 0 {
                let nftId = self.nftIds.removeFirst()

                if collection.ownedNFTs.containsKey(nftId) {
                    let gemToken <- collection.withdraw(withdrawID: nftId) as! @Gem.NFT

                    emit GemClaimed(gameUuid: self.uuid, setId: self.setId, nftId: gemToken.id, claimerAddress: address)

                    let gemReceiver = getAccount(address)
                        .getCapability(Gem.CollectionPublicPath)
                        .borrow<&Gem.Collection{NonFungibleToken.CollectionPublic}>()!
                    
                    gemReceiver.deposit(token: <- gemToken)
                    
                    return
                }
            }

        }
    }

    pub resource interface IGameManagerPublic {
        pub fun addMinterCapability(capability : Capability<&GemMinter>)
        pub fun hasMinterCapability() : Bool
        pub fun borrowGame(setId: UInt64): &GemGame{IGemGamePublic}?
    }

    pub resource GemGameManager : IGameManagerPublic {
        access(self) var minterCapability : Capability<&GemMinter>?
        access(self) let games : @{UInt64: GemGame}
        access(self) let createdSets : {UInt64 :  Bool}

        pub fun addMinterCapability(capability : Capability<&GemMinter>) {
            pre {
                capability.check() : "Invalid GemMinter Capability"
                self.minterCapability == nil : "GemMinter already set"
            }
            self.minterCapability = capability
        }

        pub fun addPrize(setId: UInt64, prize: String) {
            pre {
                self.createdSets.containsKey(setId) : "Need to be creator of set"
                self.games.containsKey(setId) : "Need to create game"
            }

            GemGames.prizes[setId] = prize

            emit PrizeAdded(setId: setId, prize: prize)
        }

        pub fun removePrize(setId: UInt64) {
            pre {
                self.createdSets.containsKey(setId) : "Need to be creator of set"
                self.games.containsKey(setId) : "Need to create game"
            }

            GemGames.prizes.remove(key: setId)

            emit PrizeRemoved(setId: setId)

        }

        pub fun mintNFT(setId: UInt64, color: String) {
            pre {
                self.hasMinterCapability() != nil : "GemMinter not set"
                self.createdSets.containsKey(setId) : "Need to be creator of set"
                self.games.containsKey(setId) : "Need to create game"
            }
            let token <- self.minterCapability!.borrow()!.mintNFT(color: color, setId: setId)
            let gameRef = (&self.games[setId] as &GemGames.GemGame?)!
            gameRef.deposit(token: <-token)
        }

        pub fun createSet() : UInt64 {
            pre {
                self.hasMinterCapability() != nil : "GemMinter not set"
            }
            let setId = self.minterCapability!.borrow()!.createSet()
            self.createdSets.insert(key: setId, true)
            return setId
        }

        pub fun createGame(setId: UInt64, setCollection: Capability<&Gem.Collection>) {
            pre {
                self.createdSets.containsKey(setId) : "Need to be creator of set"
            }

            let game <- create GemGame(
                setId: setId,
                collection: setCollection
            )

            emit GameCreated(uuid: game.uuid, setId: setId)

            let oldGame <- self.games[setId] <- game

            destroy oldGame
        }

        pub fun borrowGame(setId: UInt64): &GemGame{IGemGamePublic}? {
             return &self.games[setId] as &GemGame{IGemGamePublic}?
        }   

        pub fun hasMinterCapability() : Bool {
            return self.minterCapability != nil
        }

        init() {
            self.minterCapability = nil
            self.games <- {}
            self.createdSets = {}
        }

        destroy() {
            destroy self.games
        }
    }

    pub fun createGemGameManager(): @GemGameManager {
        return <- create GemGameManager()
    }

    pub fun makeGameCollectionName(setId : UInt64): String {
        return "gemNFTCollection_".concat(setId.toString())
    }

    pub fun getGameCollectionStoragePath(setId: UInt64): StoragePath {
        return StoragePath(identifier: self.makeGameCollectionName(setId: setId))!
    }

    pub fun getGameCollectionPrivatePath(setId: UInt64): PrivatePath {
        return PrivatePath(identifier: self.makeGameCollectionName(setId: setId))!
    }

    pub fun getGameCollectionPublicPath(setId: UInt64): PublicPath {
        return PublicPath(identifier: self.makeGameCollectionName(setId: setId))!
    }

    pub fun getPrizeSetIds() : [UInt64] {
        return self.prizes.keys
    }

    pub fun getPrizeForSetId(setId : UInt64) : String? {
        return self.prizes[setId]
    }

    init () {
        self.GemMinterStoragePath = /storage/gemMinter
        self.GemMinterPrivatePath = /private/gemMinter

        self.GemGameManagerPublicPath = /public/gemGameManager
        self.GemGameManagerStoragePath = /storage/gemGameManager
        self.GemGameManagerPrivatePath = /private/gemGameManager

        let minter <- create GemMinter()

        self.account.save(<- minter, to: self.GemMinterStoragePath)
        self.account.link<&GemMinter>(self.GemMinterPrivatePath, target: self.GemMinterStoragePath)

        self.prizes = {}
    }

}