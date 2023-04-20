import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Image,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    ScrollView
} from "react-native";
import React, { useEffect, useState } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../root";
import { RouteProp } from "@react-navigation/native";
import VaultButton from "../../components/VaultButton";
import { createOrGetFlowAccount } from "../utils/getFlowAccount";
import { FlowHelper } from "../../flow/FlowHelper";
import * as Crypto from "expo-crypto";
import {
    buf2hex,
    createHash,
    deriveKey,
    symmetricEncryptMessage,
} from "../crypto/utils";
import createToast from '../utils/toast'
import { transactions } from '../../flow/CadenceToJson.json';
const createVaultGif = require('../../assets/images/create-vault.gif')

import * as secp from "@noble/secp256k1";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
        alignItems: "center",
    },
    centerContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        marginTop: 36,
    },
    text: {
        color: "white",
        fontSize: 24,
        fontWeight: "bold",
        marginTop: 36,
    },
    textInput: {
        color: "black",
    },
    imageText: {
        color: "white",
        fontSize: 12,
        fontWeight: "bold",
        textAlign: "center",
        marginTop: 10,
        alignSelf: "center",
    },
    selectedOption: {
        borderWidth: 1,
        borderColor: "white",
        borderRadius: 4,
        padding: 4,
        justifyContent: "center",
        alignItems: "center",
    },
    input: {
        backgroundColor: "white",
        borderRadius: 5,
        paddingHorizontal: 10,
        height: 50,
        width: "100%",
        textAlign: "left",
        textAlignVertical: "center",
        marginTop: 10,
    },
    headerText: {
        color: "white",
        marginHorizontal: 5,
        marginBottom: 10,
        marginTop: 32,
        fontSize: 18,
        fontWeight: 700
    },
    creationStatusText: {
        color: "white",
        marginHorizontal: 5,
        marginBottom: 5,
        marginTop: 100,
        fontSize: 32,
        textAlign: "center"
    },
    square: {
        backgroundColor: "white",
        borderRadius: 10,
        width: 100,
        height: 100,
    },
    disabledOption: {
        opacity: 0.4,
        borderRadius: 4,
        padding: 4,
    },
    disabledText: {
        color: "lightgray",
    },
});

type CreateVaultScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    "CreateVault"
>;
type CreateVaultScreenRouteProp = RouteProp<RootStackParamList, "CreateVault">;

type Props = {
    navigation: CreateVaultScreenNavigationProp;
    route: CreateVaultScreenRouteProp;
};

export default function CreateEvent({ navigation }: Props) {

    const [type, setType] = useState("riddle");
    const [input, setInput] = useState({} as any);
    const [creationStatus, setCreationStatus] = useState<string | null>(null);

    const createVault = async () => {
        try {
            if (type === "riddle") {
                if (
                    !input.riddleAnswer &&
                    !input.riddleSecret &&
                    !input.description
                ) {
                    Alert.alert(
                        "Invalid Input",
                        "Please fill out all of the fields.",
                        [],
                        {
                            cancelable: true,
                        }
                    );
                    return;
                }
            }
            setCreationStatus("Welcome, first-time vault master! We're forging your shiny new vault key")
            const account = await createOrGetFlowAccount();
            console.log('Retrieved account with address', account.address)

            setCreationStatus('Securing a secret hideout to stash your precious message vault...')
            const flowHelper = new FlowHelper(account);
            const salt = buf2hex(await Crypto.getRandomBytesAsync(8));
            const key = `${salt}:${input.riddleAnswer}`;
            const hashControl = await createHash(key, "SHA256");
            const encryptedMessage = symmetricEncryptMessage(
                input.riddleSecret,
                key,
                "AES"
            );

            // The assymetic key uses a different delimiter (-) so that the
            // hash that we're putting on-chain is not leaking the
            // hash needed to generate the assymetric key
            const asymmetricKey = `${salt}-${input.riddleAnswer}`;
            const keyPair = await deriveKey(asymmetricKey)
            const publicKey = keyPair.publicKey

            console.log('Running tx to create vault')
            const response = await flowHelper.startTransaction(
                transactions.CreateSecretMessageVault,
                (arg: any, t: any) => [
                    arg(input.description, t.String),
                    arg("none", t.String),
                    arg(salt, t.String),
                    arg(hashControl, t.String),
                    arg("SHA256", t.String),
                    arg(encryptedMessage, t.String),
                    arg("AES", t.String),
                    arg(publicKey, t.String),
                ]
            );
            const vaultEvent = response.events.find((e: any) =>
                e.type.includes("VaultCreated")
            );
            navigation.navigate("Vault", { vaultID: vaultEvent.data.id });
        } catch (e) {
            console.error(e);
            setCreationStatus(null)
            createToast("We ran into an error creating your vault. Please try again later!")
        }
    };
    

    if (creationStatus) {
        return (
            <View style={styles.container}>
                <View style={styles.centerContainer}>
                    <TouchableOpacity
                        style={{ marginLeft: 20 }}
                        onPress={() => navigation.goBack()}
                    >
                        <Text style={styles.text}>X</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.centerContainer}>
                    <Text style={styles.creationStatusText}>{creationStatus}</Text>
                </View>
                <Image
                    source={createVaultGif}
                    style={{ alignSelf: "center", marginTop: 50, width: 300, height: 300}}
                />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <View style={styles.centerContainer}>
                <TouchableOpacity
                    style={{ marginLeft: 20 }}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.text}>X</Text>
                </TouchableOpacity>
                <Text style={{ marginRight: 125, paddingBottom: 10, ...styles.text }}>
                    Create Vault
                </Text>
            </View>
            <ScrollView style={{ keyboardShouldPersistTaps: 'handled' }}>
                <KeyboardAvoidingView
                    behavior="position"
                    keyboardVerticalOffset={80}
                >
                    <Text style={styles.headerText}>How can the vault be opened?</Text>
                    <View style={{ flexDirection: "row" }}>
                        <View
                            style={styles.selectedOption}
                            onResponderRelease={() => setType("riddle")}
                        >
                            <Image source={require("../../assets/images/riddle.png")} />
                            <Text style={styles.imageText}>Solve a Riddle</Text>
                        </View>
                        <TouchableOpacity style={styles.disabledOption} onPress={() => {
                            createToast("This feature is not yet available.")
                        }}>
                            <Image source={require("../../assets/images/play.png")} />
                            <Text style={[styles.imageText, styles.disabledText]}>
                                Play a game
                            </Text>
                        </TouchableOpacity>
                    </View>
                    {type === "riddle" && (
                        <>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter the riddle description/hint"
                                placeholderTextColor="#4d4d4d"
                                onChangeText={(text) => {
                                    setInput({
                                        ...input,
                                        description: text,
                                    });
                                }}
                            />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter the riddle answer"
                                placeholderTextColor="#4d4d4d"
                                onChangeText={(text) => {
                                    setInput({
                                        ...input,
                                        riddleAnswer: text,
                                    });
                                }}
                            />
                            <Text style={styles.headerText}>What's in the vault?</Text>
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "flex-start",
                                    justifyContent: "space-between",
                                }}
                            >
                                <View
                                    style={{
                                        marginRight: 10,
                                        ...styles.selectedOption,
                                    }}
                                >
                                    <Image
                                        source={require("../../assets/images/secretmessage.png")}
                                        style={{ width: 100, height: 100 }}
                                    />
                                    <Text style={styles.imageText}>
                                        A Secret Message
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    style={{
                                        marginRight: 10,
                                        ...styles.disabledOption,
                                    }}
                                    onPress={() => {
                                        createToast("This feature is not yet available.")
                                    }}
                                >
                                    <Image
                                        source={require("../../assets/images/kitty.png")}
                                        style={{ width: 100, height: 100 }}
                                    />
                                    <Text
                                        style={[styles.imageText, styles.disabledText]}
                                    >
                                        An NFT
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={{
                                        marginRight: 10,
                                        ...styles.disabledOption,
                                    }}
                                    onPress={() => {
                                        createToast("This feature is not yet available.")
                                    }}
                                >
                                    <Image
                                        source={require("../../assets/images/flow.png")}
                                        style={{ width: 100, height: 100 }}
                                    />
                                    <Text
                                        style={[styles.imageText, styles.disabledText]}
                                    >
                                        Custom on- {"\n"}
                                        chain Action
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter the secret message"
                                placeholderTextColor="#4d4d4d"
                                onChangeText={(text) => {
                                    setInput({
                                        ...input,
                                        riddleSecret: text,
                                    });
                                }}
                            />
                        </>
                    )}
                    <VaultButton onPress={createVault} text="Create Vault" />
                </KeyboardAvoidingView>
            </ScrollView>
        </View>
    );
}
