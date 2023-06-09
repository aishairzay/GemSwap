import NonFungibleToken from "./NonFungibleToken.cdc"
import MetadataViews from "./MetadataViews.cdc"
import Gem from "./Gem.cdc"

pub contract GemGames {
    pub let GemGameManagerPublicPath: PublicPath
    pub let GemGameManagerStoragePath: StoragePath
    pub let GemGameManagerPrivatePath: PrivatePath

    pub event GameCreated(uuid: UInt64, setId: UInt64, name: String, prizes: String)
    pub event GemClaimed(gameUuid: UInt64, setId: UInt64, nftId: UInt64, claimerAddress: Address)

    access(self) let gamesByUuid: {UInt64: GemGameInfo}
    access(self) let gamesBySetId: {UInt64: GemGameInfo}
    access(self) let gamesByName: {String: GemGameInfo}

    pub struct GemGameInfo {
        pub let uuid: UInt64
        pub let setId: UInt64
        pub let name: String
        pub let prizes: String
        pub let creatorAddress: Address

        init(
            uuid: UInt64,
            setId: UInt64,
            name: String,
            prizes: String,
            creatorAddress: Address
        ) {
            self.uuid = uuid
            self.setId = setId
            self.name = name
            self.prizes = prizes
            self.creatorAddress = creatorAddress
        }
    }

    pub resource interface IGemGamePublic {
        pub let setId: UInt64
        pub let name: String
        pub let prizes: String
        
        pub fun claim(address: Address) 
        pub fun getInfo() : GemGameInfo
    }

    pub resource GemGame : IGemGamePublic {   
        pub let setId: UInt64

        pub let name: String

        pub let prizes: String

        pub let nftIds: [UInt64]

        pub let creatorAddress: Address

        access(self) let collection: Capability<&Gem.Collection>

        access(self) let claims: {Address: UInt}

        // TODO: Add open/closing and limiations around how many you can claim
        // TODO: Add vault password system

        init(
            setId: UInt64,
            name: String,
            prizes: String,
            creatorAddress: Address,
            collection: Capability<&Gem.Collection>,
        ) {
            self.setId = setId
            self.name = name
            self.prizes = prizes
            self.creatorAddress = creatorAddress
            self.collection = collection
            self.claims = {}
            self.nftIds = []
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

        pub fun getInfo() : GemGameInfo {
            return GemGameInfo(
                uuid: self.uuid,
                setId: self.setId,
                name: self.name,
                prizes: self.prizes,
                creatorAddress: self.creatorAddress
            )
        }
    }

    pub resource interface IGameManagerPublic {
        pub fun borrowGame(setId: UInt64): &GemGame{IGemGamePublic}?
    }

    pub resource GemGameManager : IGameManagerPublic {
        access(self) let games : @{UInt64: GemGame}
        access(self) let createdSets : {UInt64 :  Bool}

        pub fun mintNFT(setId: UInt64, color: String) {
            pre {
                self.createdSets.containsKey(setId) : "Need to be creator of set"
                self.games.containsKey(setId) : "Need to create game"
            }
            let token <- Gem.mintNFT(color: color, setId: setId)
            let gameRef = (&self.games[setId] as &GemGames.GemGame?)!
            gameRef.deposit(token: <-token)
        }

        pub fun createSet() : UInt64 {
            let setId = Gem.createSet()
            self.createdSets.insert(key: setId, true)
            return setId
        }

        pub fun createGame(setId: UInt64, name: String, prizes: String, setCollection: Capability<&Gem.Collection>) {
            pre {
                self.createdSets.containsKey(setId) : "Need to be creator of set"
                GemGames.gamesBySetId[setId] == nil : "Set id already used"
                GemGames.gamesByName[name] == nil : "Name already taken"
            }

            let game <- create GemGame(
                setId: setId,
                name: name,
                prizes: prizes,
                creatorAddress: self.owner!.address,
                collection: setCollection,
            )

            // Update Cache
            GemGames.gamesByUuid[game.uuid] = game.getInfo()
            GemGames.gamesBySetId[setId] = game.getInfo()
            GemGames.gamesByName[name] = game.getInfo()

            emit GameCreated(uuid: game.uuid, setId: setId, name: name, prizes: prizes)

            let oldGame <- self.games[setId] <- game

            destroy oldGame
        }

        pub fun borrowGame(setId: UInt64): &GemGame{IGemGamePublic}? {
             return &self.games[setId] as &GemGame{IGemGamePublic}?
        }   

        init() {
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

    pub fun getGameUuids() : [UInt64] {
        return self.gamesByUuid.keys
    }

    pub fun getGameForUuid(uuid : UInt64) : GemGameInfo? {
        return self.gamesByUuid[uuid]
    }

    pub fun getGameSetIds() : [UInt64] {
        return self.gamesBySetId.keys
    }

    pub fun getGameForSetId(setId : UInt64) : GemGameInfo? {
        return self.gamesBySetId[setId]
    }

    pub fun getGameNames() : [String] {
        return self.gamesByName.keys
    }

    pub fun getGameForName(name : String) : GemGameInfo? {
        return self.gamesByName[name]
    }

    init () {

        self.GemGameManagerPublicPath = /public/gemGameManager
        self.GemGameManagerStoragePath = /storage/gemGameManager
        self.GemGameManagerPrivatePath = /private/gemGameManager

        self.gamesByUuid = {}
        self.gamesBySetId = {}
        self.gamesByName = {}
    }

}