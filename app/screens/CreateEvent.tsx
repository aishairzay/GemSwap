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
import React, { useState } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../root";
import { RouteProp } from "@react-navigation/native";
import VaultButton from "../../components/VaultButton";
import { createOrGetFlowAccount } from "../utils/getFlowAccount";
import { FlowHelper } from "../../flow/FlowHelper";
import createToast from '../utils/toast'
import { transactions } from '../../flow/CadenceToJson.json';
const createVaultGif = require('../../assets/images/create-vault.gif')

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
        fontWeight: "700"
    },
    creationStatusText: {
        color: "white",
        marginHorizontal: 5,
        marginBottom: 5,
        marginTop: 100,
        fontSize: 32,
        textAlign: "center"
    },
});

type CreateEventScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    "CreateEvent"
>;
type CreateEventScreenRouteProp = RouteProp<RootStackParamList, "CreateEvent">;

type Props = {
    navigation: CreateEventScreenNavigationProp;
    route: CreateEventScreenRouteProp;
};

export default function CreateEvent({ navigation }: Props) {
    const [input, setInput] = useState({} as any);
    const [creationStatus, setCreationStatus] = useState<string | null>(null);

    const createEvent = async () => {
        try {
            if (
                !input.rewardRedemptionDetails &&
                !input.eventName
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
            setCreationStatus("Creating or getting your Flow account")
            const account = await createOrGetFlowAccount();
            console.log('Retrieved account with address', account.address)

            setCreationStatus('Creating or getting your gem event manager')
            const flowHelper = new FlowHelper(account);

            await flowHelper.startTransaction(
                transactions.SetupGemGameManager,
                (arg: any, t: any) => []
            );

            setCreationStatus('Creating the event...')

            const response = await flowHelper.startTransaction(
                transactions.CreateGemGame,
                (arg: any, t: any) => [
                    arg(input.eventName, t.String),
                    arg(input.rewardRedemptionDetails, t.String),
                ]
            );

            const gameCreatedEvent = response.events.find((e: any) =>
                e.type.includes("GameCreated")
            );

            navigation.navigate("EventHome", { eventID: gameCreatedEvent.data.name });
        } catch (e) {
            console.error(e);
            setCreationStatus(null)
            createToast("We ran into an error creating your event. Please try again later!", "warning")
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
                    style={{ alignSelf: "center", marginTop: 50, width: 300, height: 300 }}
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
                    Gem Swap
                </Text>
            </View>
            <ScrollView keyboardShouldPersistTaps='handled'>
                <KeyboardAvoidingView
                    behavior="position"
                    keyboardVerticalOffset={80}
                >
                    <Text style={styles.headerText}>Event Name</Text>
                    <>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter the event's name"
                            placeholderTextColor="#4d4d4d"
                            onChangeText={(text) => {
                                setInput({
                                    ...input,
                                    eventName: text,
                                });
                            }}
                        />
                        <Text style={styles.headerText}>Reward Redemption Details</Text>
                        <TextInput
                            style={[styles.input, { height: 100 }]}
                            placeholder=""
                            placeholderTextColor="#4d4d4d"
                            onChangeText={(text) => {
                                setInput({
                                    ...input,
                                    rewardRedemptionDetails: text,
                                });
                            }}
                            multiline
                            numberOfLines={4}
                        />
                    </>
                    <VaultButton onPress={createEvent} text="Create Event" />
                </KeyboardAvoidingView>
            </ScrollView>
        </View>
    );
}
