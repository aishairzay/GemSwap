import NonFungibleToken from "./NonFungibleToken.cdc"
import MetadataViews from "./MetadataViews.cdc"
import ViewResolver from "./ViewResolver.cdc"

pub contract Gem: NonFungibleToken, ViewResolver {

    pub var totalSupply: UInt64
    pub var setCount: UInt64

    pub event ContractInitialized()
    pub event Withdraw(id: UInt64, from: Address?)
    pub event Deposit(id: UInt64, to: Address?)
    pub event Minted(id: UInt64, setId: UInt64, color: String)
    pub event Burned(id: UInt64, setId: UInt64, color: String)
    pub event SetCreated(setId: UInt64)

    pub let CollectionStoragePath: StoragePath
    pub let CollectionPublicPath: PublicPath
    pub let CollectionPrivatePath: PrivatePath


    pub resource NFT: NonFungibleToken.INFT, MetadataViews.Resolver {
        pub let id: UInt64

        pub let color: String

        pub let setId : UInt64
    
        init(
            color: String,
            setId: UInt64,

        ) {
            self.id = self.uuid
            self.color = color
            self.setId = setId
        }

        pub fun getViews(): [Type] {
            return [
                Type<MetadataViews.Display>(),
                Type<MetadataViews.Royalties>(),
                Type<MetadataViews.Editions>(),
                Type<MetadataViews.ExternalURL>(),
                Type<MetadataViews.NFTCollectionData>(),
                Type<MetadataViews.NFTCollectionDisplay>()
            ]
        }


        pub fun resolveView(_ view: Type): AnyStruct? {
            switch view {
                case Type<MetadataViews.Display>():
                    return MetadataViews.Display(
                        name: self.color.concat( " Gem"),
                        description: "A shiny gem",
                        thumbnail: MetadataViews.HTTPFile(
                            url: "www.flow.com"
                        )
                    )
                case Type<MetadataViews.Royalties>():
                    return MetadataViews.Royalties(
                        []
                    )
                case Type<MetadataViews.ExternalURL>():
                    return MetadataViews.ExternalURL("www.flow.com")
                case Type<MetadataViews.NFTCollectionData>():
                    return MetadataViews.NFTCollectionData(
                        storagePath: Gem.CollectionStoragePath,
                        publicPath: Gem.CollectionPublicPath,
                        providerPath: Gem.CollectionPrivatePath,
                        publicCollection: Type<&Gem.Collection{Gem.GemCollectionPublic}>(),
                        publicLinkedType: Type<&Gem.Collection{Gem.GemCollectionPublic,NonFungibleToken.CollectionPublic,NonFungibleToken.Receiver,MetadataViews.ResolverCollection}>(),
                        providerLinkedType: Type<&Gem.Collection{Gem.GemCollectionPublic,NonFungibleToken.CollectionPublic,NonFungibleToken.Provider,MetadataViews.ResolverCollection}>(),
                        createEmptyCollectionFunction: (fun (): @NonFungibleToken.Collection {
                            return <-Gem.createEmptyCollection()
                        })
                    )
                case Type<MetadataViews.NFTCollectionDisplay>():
                    let media = MetadataViews.Media(
                        file: MetadataViews.HTTPFile(
                            url: "https://assets.website-files.com/5f6294c0c7a8cdd643b1c820/5f6294c0c7a8cda55cb1c936_Flow_Wordmark.svg"
                        ),
                        mediaType: "image/svg+xml"
                    )
                    return MetadataViews.NFTCollectionDisplay(
                        name: "Gems",
                        description: "Gems",
                        externalURL: MetadataViews.ExternalURL("www.flow.com"),
                        squareImage: media,
                        bannerImage: media,
                        socials: {}
                    )

            }
            return nil
        }

        destroy() {
            Gem.totalSupply = Gem.totalSupply - 1

            emit Burned(id: self.id, setId: self.setId, color: self.color)
        }
    }

    pub resource interface GemCollectionPublic {
        pub fun deposit(token: @NonFungibleToken.NFT)
        pub fun getIDs(): [UInt64]
        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT
        pub fun borrowGem(id: UInt64): &Gem.NFT? {
            post {
                (result == nil) || (result?.id == id):
                    "Cannot borrow Gem reference: the ID of the returned reference is incorrect"
            }
        }
    }

    /// The resource that will be holding the NFTs inside any account.
    /// In order to be able to manage NFTs any account will need to create
    /// an empty collection first
    ///
    pub resource Collection: GemCollectionPublic, NonFungibleToken.Provider, NonFungibleToken.Receiver, NonFungibleToken.CollectionPublic, MetadataViews.ResolverCollection {
        pub var ownedNFTs: @{UInt64: NonFungibleToken.NFT}

        init () {
            self.ownedNFTs <- {}
        }

        pub fun withdraw(withdrawID: UInt64): @NonFungibleToken.NFT {
            let token <- self.ownedNFTs.remove(key: withdrawID) ?? panic("missing NFT")

            emit Withdraw(id: token.id, from: self.owner?.address)

            return <-token
        }

        pub fun deposit(token: @NonFungibleToken.NFT) {
            let token <- token as! @Gem.NFT

            let id: UInt64 = token.id

            // add the new token to the dictionary which removes the old one
            let oldToken <- self.ownedNFTs[id] <- token

            emit Deposit(id: id, to: self.owner?.address)

            destroy oldToken
        }

        pub fun getIDs(): [UInt64] {
            return self.ownedNFTs.keys
        }


        pub fun borrowNFT(id: UInt64): &NonFungibleToken.NFT {
            return (&self.ownedNFTs[id] as &NonFungibleToken.NFT?)!
        }

        pub fun borrowGem(id: UInt64): &Gem.NFT? {
            if self.ownedNFTs[id] != nil {
                // Create an authorized reference to allow downcasting
                let ref = (&self.ownedNFTs[id] as auth &NonFungibleToken.NFT?)!
                return ref as! &Gem.NFT
            }

            return nil
        }

        pub fun borrowViewResolver(id: UInt64): &AnyResource{MetadataViews.Resolver} {
            let nft = (&self.ownedNFTs[id] as auth &NonFungibleToken.NFT?)!
            let gemNFT = nft as! &Gem.NFT
            return gemNFT as &AnyResource{MetadataViews.Resolver}
        }

        destroy() {
            destroy self.ownedNFTs
        }
    }

    pub fun createEmptyCollection(): @NonFungibleToken.Collection {
        return <- create Collection()
    }

    access(account) fun mintNFT(
        color: String,
        setId: UInt64
    ): @Gem.NFT {
        pre {
            setId <= Gem.setCount : "Invalid Set Id"
        }

        Gem.totalSupply = Gem.totalSupply + 1
        

        let nft  <- create NFT(
            color: color,
            setId: setId
        )

        emit Minted(id: nft.id, setId: nft.setId, color: nft.color)

        return <-nft
    }

    access(account) fun createSet(): UInt64 {
            Gem.setCount = Gem.setCount + 1
            emit SetCreated(setId: Gem.setCount)
            return Gem.setCount
    }

    pub fun resolveView(_ view: Type): AnyStruct? {
        switch view {
            case Type<MetadataViews.NFTCollectionData>():
                return MetadataViews.NFTCollectionData(
                    storagePath: Gem.CollectionStoragePath,
                    publicPath: Gem.CollectionPublicPath,
                    providerPath: Gem.CollectionPrivatePath,
                    publicCollection: Type<&Gem.Collection{Gem.GemCollectionPublic}>(),
                    publicLinkedType: Type<&Gem.Collection{Gem.GemCollectionPublic,NonFungibleToken.CollectionPublic,NonFungibleToken.Receiver,MetadataViews.ResolverCollection}>(),
                    providerLinkedType: Type<&Gem.Collection{Gem.GemCollectionPublic,NonFungibleToken.CollectionPublic,NonFungibleToken.Provider,MetadataViews.ResolverCollection}>(),
                    createEmptyCollectionFunction: (fun (): @NonFungibleToken.Collection {
                        return <-Gem.createEmptyCollection()
                    })
                )
            case Type<MetadataViews.NFTCollectionDisplay>():
                let media = MetadataViews.Media(
                    file: MetadataViews.HTTPFile(
                        url: "https://assets.website-files.com/5f6294c0c7a8cdd643b1c820/5f6294c0c7a8cda55cb1c936_Flow_Wordmark.svg"
                    ),
                    mediaType: "image/svg+xml"
                )
        }
        return nil
    }

    pub fun getViews(): [Type] {
        return [
            Type<MetadataViews.NFTCollectionData>(),
            Type<MetadataViews.NFTCollectionDisplay>()
        ]
    }

    init() {
        self.totalSupply = 0
        self.setCount = 0

        self.CollectionStoragePath = /storage/gemNFTCollection
        self.CollectionPublicPath = /public/gemNFTCollection
        self.CollectionPrivatePath = /private/gemNFTCollection

        let collection <- create Collection()
        self.account.save(<-collection, to: self.CollectionStoragePath)

        self.account.link<&Gem.Collection{NonFungibleToken.CollectionPublic, Gem.GemCollectionPublic, MetadataViews.ResolverCollection}>(
            self.CollectionPublicPath,
            target: self.CollectionStoragePath
        )
        self.account.link<&Gem.Collection>(self.CollectionPrivatePath, target: self.CollectionStoragePath)

        emit ContractInitialized()
    }
}
 