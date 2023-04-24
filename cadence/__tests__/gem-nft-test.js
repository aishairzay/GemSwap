import path from "path"
import {
  init,
  emulator,
  executeScript,
  sendTransaction,
  getAccountAddress,
  deployContractByName
} from "@onflow/flow-js-testing"

jest.setTimeout(30000)

describe("Gem Game Tests", () => {
  // Instantiate emulator and path to Cadence files
  beforeEach(async () => {
    const basePath = path.resolve(__dirname, "../")
    await init(basePath)
    return emulator.start()
  })

  // Stop emulator, so it could be restarted
  afterEach(async () => {
    return emulator.stop()
  })

  test("Basic Functionality", async () => {
    const admin = await getAccountAddress("Admin");
    await deployContractByName({ to: admin, name: "NonFungibleToken" });
    await deployContractByName({ to: admin, name: "MetadataViews" });
    await deployContractByName({ to: admin, name: "ViewResolver" });

    let [_result, error] = await deployContractByName({ to: admin, name: "Gem" });
    expect(error).toBe(null);
    [_result, error] = await deployContractByName({ to: admin, name: "GemGames" });
    expect(error).toBe(null);

    const gemGameManager = await getAccountAddress("GemGameManager");
    [_result, error] = await sendTransaction({ name: "SetupGemGameManager", signers: [gemGameManager] })
    expect(error).toBe(null);

    [_result, error] = await sendTransaction({ name: "SendGemMinterToManager", args: [gemGameManager], signers: [admin] })
    expect(error).toBe(null);

    [_result, error] = await sendTransaction({ name: "CreateGemSet", signers: [gemGameManager] })
    expect(error).toBe(null);

    [_result, error] = await sendTransaction({ name: "MintGems", args: ["1", ["blue", "red"]], signers: [gemGameManager] })
    expect(error).toBe(null);

    [_result, error] = await sendTransaction({ name: "MintGems", args: ["1", ["blue", "blue", "silver"]], signers: [gemGameManager] })
    expect(error).toBe(null);

    [_result, error] = await sendTransaction({ name: "MintGems", args: ["2", ["blue", "blue", "silver"]], signers: [gemGameManager] })
    expect(error).not.toBe(null);

    [_result, error] = await executeScript({name: "GetGemGame", args: [gemGameManager, "1"]});
    expect(_result.setId).toBe("1")
    expect(_result.nftIds.length).toBe(5)
    expect(error).toBe(null);

    const gemGameParticipant = await getAccountAddress("GemGameParticipant");
    [_result, error] = await sendTransaction({ name: "ClaimGem", args: [gemGameManager, "1"], signers: [gemGameParticipant] })
    expect(error).toBe(null);

    [_result, error] = await executeScript({name: "GetGemIds", args: [gemGameParticipant]});
    expect(_result.length).toBe(1);
    expect(error).toBe(null);

    [_result, error] = await executeScript({name: "GetGem", args: [gemGameParticipant, _result[0]]});
    expect(_result.display.name).toBe("blue Gem");
    expect(_result.display.description).toBe("A shiny gem");
    expect(error).toBe(null);

    [_result, error] = await sendTransaction({ name: "AddPrize", args: ["1", "3 Red: Hoodie\n4 Blue: Sticker"], signers: [gemGameManager] })
    expect(error).toBe(null);

    [_result, error] = await executeScript({name: "GetGemGame", args: [gemGameManager, "1"]});
    expect(_result.setId).toBe("1")
    expect(_result.nftIds.length).toBe(4)
    expect(_result.prizes).toBe("3 Red: Hoodie\n4 Blue: Sticker")
    expect(error).toBe(null);

    [_result, error] = await sendTransaction({ name: "RemovePrize", args: ["1"], signers: [gemGameManager] })
    expect(error).toBe(null);


  })
})