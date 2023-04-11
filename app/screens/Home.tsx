import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Image,
    KeyboardAvoidingView,
    ScrollView
} from "react-native";
import React, { useState, useEffect } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../root";
import { RouteProp } from "@react-navigation/native";
import VaultButton from "../../components/VaultButton";
import { Button } from "react-native-elements";
import { getFlowAccount, deleteFlowAccountFromDevice } from '../utils/getFlowAccount';
const lock = require('../../assets/images/lock.png')

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingLeft: 16,
        paddingRight: 16,
        backgroundColor: "black",
        alignItems: "center", // Add alignItems center
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
        marginTop: 36,
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginHorizontal: 5,
        marginBottom: 20,
    },
    input: {
        flex: 1,
        height: 40,
        backgroundColor: "white",
        borderRadius: 5,
        paddingHorizontal: 10,
        color: "black",
    },
    dividerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 40,
        marginBottom: 40,
    },
    dividerText: {
        color: "black",
        fontWeight: "900",
        textShadowColor: "white",
        textShadowRadius: 5,
        fontSize: 32,
        borderWidth: 1,
    },
    headerText: {
        color: "#5db075",
        fontWeight: "bold",
        fontSize: 24,
        paddingHorizontal: 5,
        textDecorationLine: "underline",
    },
});

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">;
type HomeScreenRouteProp = RouteProp<RootStackParamList, "Home">;

type Props = {
    navigation: HomeScreenNavigationProp;
    route: HomeScreenRouteProp;
};

export default function Home({ navigation }: Props) {
    const [vaultId, setVaultId] = useState("");
    const [shouldShowProfileIcon, setShouldShowProfileIcon] = useState(null)

    useEffect(() => {
        const run = async () => {
            // For testing purposes, if you'd like to delete
            // your existing account, you can run with this
            // uncommented once, and then re-comment it.

            //await deleteFlowAccountFromDevice()
        }
        run()
    }, [])

    const handleGoToVault = () => {
        navigation.navigate("Vault", { vaultID: vaultId });
    };

    const handleGoToCreate = () => {
        navigation.navigate("CreateVault");
    };

    const handleGoToList = () => {
        navigation.navigate("ListVaults");
    };

    useEffect(() => {
        const run = async () => {
            const acc = await getFlowAccount()
            const shouldShow = !(!acc)
            setShouldShowProfileIcon(!(!acc))
        }
        run()
    }, [])

    return (
        <View style={{ ...styles.container }}>
            <View style={styles.centerContainer}>
                <Text style={styles.text}>Mohar's Vault</Text>
            </View>
            {
                shouldShowProfileIcon && (
                    <View
                        style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            marginTop: 60,
                            marginRight: 15,
                        }}
                    >
                        <Button
                            type="clear"
                            icon={{
                                name: "person",
                                size: 25,
                                color: "white",
                            }}
                            onPress={handleGoToList}
                        />
                    </View>
                )
            }
            <ScrollView style={{ keyboardShouldPersistTaps: 'handled' }}>
                <Text
                    style={{
                        color: "white",
                        marginHorizontal: 5,
                        marginBottom: 5,
                        marginTop: 48,
                        alignSelf: "flex-start",
                        fontSize: 16,
                    }}
                >
                    Enter a Vault ID
                </Text>
                <KeyboardAvoidingView
                    style={[styles.inputContainer, { backgroundColor: "white" }]}
                >
                    <TextInput
                        inputMode="numeric"
                        style={styles.input}
                        placeholder="Vault ID"
                        placeholderTextColor="gray"
                        value={vaultId}
                        onChangeText={setVaultId}
                    />
                </KeyboardAvoidingView>
                <TouchableOpacity
                    style={{ marginTop: 0, alignSelf: "flex-start" }}
                    onPress={handleGoToVault}
                >
                    <Text style={styles.headerText}>Go to Vault {vaultId}</Text>
                </TouchableOpacity>
                <View style={styles.dividerContainer}>
                    <Text style={styles.dividerText}>OR</Text>
                </View>
                <Image
                    source={lock}
                    style={{ alignSelf: "center", marginTop: 30 }}
                />
                <VaultButton onPress={handleGoToCreate} text="Create a new vault" />
            </ScrollView>
        </View>
    );
}
