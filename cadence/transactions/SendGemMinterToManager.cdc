import GemGames from "../contracts/GemGames.cdc"

transaction(managerAddress: Address) {
    let minterCap : Capability<&GemGames.GemMinter>

    prepare(signer: AuthAccount) {
        self.minterCap =  signer.getCapability<&GemGames.GemMinter>(GemGames.GemMinterPrivatePath)
    }

    execute {
        let owner = getAccount(managerAddress);

        let managerRef = owner.getCapability<&GemGames.GemGameManager{GemGames.IGameManagerPublic}>(GemGames.GemGameManagerPublicPath).borrow() 
            ?? panic("Could not borrow public manager ref")

        managerRef.addMinterCapability(capability: self.minterCap )
        
    }
}