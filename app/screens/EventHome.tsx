import {
    View,
    Text,
    StyleSheet,
    Image,
    KeyboardAvoidingView,
    ScrollView,
    Keyboard,
    StatusBar
} from "react-native";
import { Button } from "react-native-elements";
import React, { useEffect, useCallback, useLayoutEffect } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { HeaderBackButton } from '@react-navigation/elements';
import { RootStackParamList } from "../root";
import { RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createHash } from "../crypto/utils";
import { FlowHelper } from "../../flow/FlowHelper";
import { scripts } from '../../flow/CadenceToJson.json';
import toast from '../utils/toast';
import NFTCollection from "../../components/NFTCollection";

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

export default function EventHome({ route, navigation }: Props) {
    const [event, setEvent] = React.useState<any | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const eventID = route.params.eventID;

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
        const getEvent = async () => {
            const flowHelper = new FlowHelper(undefined);
            
        };
        getEvent();
    }, []);

    const insets = useSafeAreaInsets();

    let content = (
        <View>
            <Button>Start a Trade</Button>
            <NFTCollection address="" />
            <Text>Event details here.</Text>
        </View>
    );

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
                                <Text style={styles.text}>{eventID}</Text>
                                {error !== null && (
                                    <Text style={styles.missingText}>MISSING</Text>
                                )}
                                {error === null &&
                                    <Text>QR Code here</Text>
                                }
                            </View>
                            {content}
                        </KeyboardAvoidingView>
                    </View>
                </ScrollView>
            </View>
        </>
    );
}
