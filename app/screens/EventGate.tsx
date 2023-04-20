import {
    View,
    Text,
    StyleSheet,
    Image,
    KeyboardAvoidingView,
    Share,
    ScrollView,
    Keyboard,
    StatusBar
} from "react-native";
import { Button } from "react-native-elements";
import React, { useEffect, useCallback, useLayoutEffect } from "react";
import LockedContent from "../../components/LockedContent";
import { StackNavigationProp } from "@react-navigation/stack";
import { HeaderBackButton } from '@react-navigation/elements';
import { RootStackParamList } from "../root";
import { RouteProp } from "@react-navigation/native";
import UnlockedContent from "../../components/UnlockedContent";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createHash } from "../crypto/utils";
import { FlowHelper } from "../../flow/FlowHelper";
import { scripts } from '../../flow/CadenceToJson.json';
import toast from '../utils/toast';
const vaultUnlockingGif = require('../../assets/images/vault-unlocking.gif')
const closedVault = require("../../assets/images/vault.png")
const openVault = require("../../assets/images/open-vault.png")


const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center", // Add alignItems center
        backgroundColor: "black",
    },
    grayBackground: {
        position: "absolute",
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        height: "35%",
        backgroundColor: "gray",
    },
    centerContainer: {
        justifyContent: "center",
        alignItems: "center",
        marginTop: 32,
    },
    text: {
        color: "white",
        fontSize: 24,
        fontWeight: "bold",
    },
    lockedText: {
        color: "red",
        fontSize: 24,
        fontWeight: "bold",
        textShadowColor: "black",
        textShadowRadius: 5,
    },
    unlockedText: {
        color: "#00FF00",
        fontSize: 24,
        fontWeight: "bold",
        textShadowColor: "black",
        textShadowRadius: 5,
    },
    missingText: {
        color: "#00ffff",
        fontSize: 24,
        fontWeight: "bold",
        textShadowColor: "black",
        textShadowRadius: 5,
    },
    paragraph: {
        color: "white",
        fontSize: 12,
        marginTop: 32,
        textAlign: "center",
        marginHorizontal: 32,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 5,
        marginBottom: 20,
        backgroundColor: "white",
        borderRadius: 5,
        marginTop: 32,
    },
    input: {
        flex: 1,
        height: 40,
        paddingHorizontal: 10,
        color: "black",
        textAlign: "left",
        textAlignVertical: "center",
    },
});

type VaultScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    "Vault"
>;
type VaultScreenRouteProp = RouteProp<RootStackParamList, "Vault">;

type Props = {
    navigation: VaultScreenNavigationProp;
    route: VaultScreenRouteProp;
};

export default function EventGate({ route, navigation }: Props) {
    const [vault, setVault] = React.useState<any | null>(null);
    const [password, setPassword] = React.useState<string>("");
    const [isLocked, setIsLocked] = React.useState<boolean>(true);
    const [showUnlockAnimation, setShowUnlockAnimation] = React.useState<boolean>(false)
    const [error, setError] = React.useState<string | null>(null);
    const vaultID = route.params.vaultID;

    const onShare = async () => {
        let message = `I locked away something in vault ${vaultID}, figure out how to open it to see what's inside!`;
        if (!isLocked) {
            message = `I solved vault ${vaultID}!`;
        }
        await Share.share({
            message: message,
            url: `https://moharsvault.gg/${vaultID}`,
        });
    };
    const handleBackButtonPress = useCallback(() => {
        // Specify the screen you want to navigate to when the back button is pressed
        navigation.navigate('Home');
    }, [navigation]);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <HeaderBackButton
                    onPress={handleBackButtonPress}
                    tintColor="black"
                />
            ),
        });
    }, [navigation, handleBackButtonPress]);

    useEffect(() => {
        const getVault = async () => {
            const flowHelper = new FlowHelper(undefined);
            let vault = null;
            try {
                vault = await flowHelper.runScript(
                    scripts.GetVaultByVaultID,
                    (arg: any, t: any) => [
                        arg(parseInt(vaultID.toString()).toString(), t.UInt64),
                    ]
                );
            } catch (e) {
                console.log("Failed to retrieve given vault: ", e);
                setError(
                    `We could not find this vault.\n\nMake sure you have the correct Vault ID`
                );
            }
            setVault(vault);
        };
        getVault();
    }, []);

    useEffect(() => {
        if (password.length === 0) {
            return;
        }
        const run = async () => {
            const passwordKey = `${vault.passwordSalt}:${password}`;
            const passwordHash = await createHash(
                passwordKey,
                vault.hashAlgorithm
            );
            if (passwordHash === vault.hashControl) {
                setShowUnlockAnimation(true)
                setTimeout(() => {
                    setShowUnlockAnimation(false)
                }, 3500);
                setIsLocked(false);
            } else {
                toast("Hmm.. Nothing happened, wrong code maybe?", 'warning')
                Keyboard.dismiss()
                setIsLocked(true);
            }
        };
        run();
    }, [password]);

    const insets = useSafeAreaInsets();

    let content = <Text style={styles.paragraph}>Loading...</Text>;
    if (error !== null) {
        content = (
            <Text
                style={{ ...styles.text, paddingTop: 48, textAlign: "center" }}
            >
                {error}
            </Text>
        );
    } else if (vault !== null) {
        content = (
            <>
                {isLocked ? (
                    <LockedContent vault={vault} submitPassword={setPassword} />
                ) : (
                    <UnlockedContent answer={password} vault={vault} />
                )}
            </>
        );
    }

    if (showUnlockAnimation) {
        return (
            <View
                style={[
                    {
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "black",
                    },
                ]}
            >
                <ScrollView
                    style={{
                        marginTop: 120,
                        
                    }}
                    keyboardShouldPersistTaps='handled'
                >
                    <View style={{
                        paddingTop: insets.top,
                        paddingBottom: insets.bottom,
                        paddingLeft: insets.left,
                        paddingRight: insets.right,
                    }}>
                        <Image
                            source={vaultUnlockingGif}
                            style={{ alignSelf: "center", marginTop: 50, width: 300, height: 300}}
                        />
                        <Text style={{ ...styles.text, paddingTop: 20 }}>Cracking the vault's code....</Text>
                    </View>
                </ScrollView>
            </View>
        )
    }

    return (
        <>
            <View
                style={[
                    {
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "black",
                    },
                ]}
            >
                <StatusBar barStyle="dark-content" backgroundColor="#ecf0f1" />
                <View style={styles.grayBackground} />
                <View
                    style={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        marginTop: 50,
                        marginRight: 15,
                    }}
                >
                    <Button
                        type="clear"
                        icon={{
                            name: "share",
                            size: 25,
                            color: "black",
                        }}
                        onPress={onShare}
                    />
                </View>
                <ScrollView
                    style={{
                        marginTop: 60,
                        
                    }}
                    keyboardShouldPersistTaps='handled'
                >
                    <View style={{
                        paddingTop: insets.top,
                        paddingBottom: insets.bottom,
                        paddingLeft: insets.left,
                        paddingRight: insets.right,
                    }}>
                        <KeyboardAvoidingView
                            behavior="position"
                            keyboardVerticalOffset={120}
                        >
                            <View style={styles.centerContainer}>
                                <Text style={styles.text}>Vault #{vaultID}</Text>
                                {error !== null && (
                                    <Text style={styles.missingText}>MISSING</Text>
                                )}
                                {error === null &&
                                    (isLocked === true ? (
                                        <Text style={styles.lockedText}>LOCKED</Text>
                                    ) : (
                                        <Text style={styles.unlockedText}>UNLOCKED</Text>
                                    ))}
                            </View>
                            <Image
                                source={isLocked ? closedVault : openVault}
                                style={{ alignSelf: "center", marginTop: 30, width: 250, height: 250}}
                            />
                            {content}
                        </KeyboardAvoidingView>
                    </View>
                </ScrollView>
            </View>
        </>
    );
}
