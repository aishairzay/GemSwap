import { View, ScrollView, Text } from "react-native";
import React, { useEffect, useCallback, useLayoutEffect } from "react";
import { HeaderBackButton } from "@react-navigation/elements";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlowHelper } from "../../flow/FlowHelper";
import NFTCollection from "../../components/NFTCollection";
import { getFlowAccount } from "../utils/getFlowAccount";
import { styles } from "../utils/styles";
import { transactions } from "../../flow/CadenceToJson.json";
import QRCode from "react-native-qrcode-svg";
import axios from "axios";
import GemList from "../../components/GemList";

type Props = {
    navigation: any;
    route: any;
};

export default function ConfirmSwap({ route, navigation }: Props) {
    const multisigJson = route.params.multisigJson;

    const [address, setAddress] = React.useState<string>("");
    const [tradeStatus, setTradeStatus] = React.useState<string|null>(null);

    const [offeredGems, setOfferedGems] = React.useState<any[]>(
        multisigJson.arguments[0].value.map((a: any) => {
            return a.value;
        })
    );
    const [requestedGems, setRequestedGems] = React.useState<any[]>(
        multisigJson.arguments[1].value.map((a: any) => {
            return a.value;
        })
    );

    const offererAddress = multisigJson.authorizers[0];
    const requestedAddress = multisigJson.authorizers[1];

    const handleBackButtonPress = useCallback(() => {
        // Specify the screen you want to navigate to when the back button is pressed
        navigation.pop();
    }, [navigation]);

    useEffect(() => {
        const run = async () => {
            const acc = await getFlowAccount();
            setAddress(acc.address);
        };
        run();
    }, []);

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
            // TODO Get the event from the blockchain
        };
        getEvent();
    }, []);

    const insets = useSafeAreaInsets();

    return (
        <>
            <View
                style={[
                    {
                        flex: 1,
                        justifyContent: "center",
                        alignItems: "center",
                    },
                ]}
            >
                <ScrollView
                    style={{
                        marginTop: 60,
                    }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View
                        style={{
                            paddingTop: insets.top,
                            paddingBottom: insets.bottom,
                            paddingLeft: insets.left,
                            paddingRight: insets.right,
                        }}
                    >
                        <NFTCollection
                            label="Their Collection"
                            address={offererAddress}
                        />
                        <Text>What you receive:</Text>
                        <GemList address={offererAddress} gemIDs={offeredGems} />

                        <NFTCollection
                            label="My Collection"
                            address={requestedAddress}
                        />
                        <Text>What you give:</Text>
                        <GemList address={requestedAddress} gemIDs={requestedGems} />
                    </View>
                    <Text
                        style={{
                            ...styles.text,
                            ...styles.clickable,
                            ...styles.largeText,
                        }}
                        onPress={async () => {
                            // Build second half of multisig trade
                            setTradeStatus("Trade Executing...");
                            const curAccount = await getFlowAccount();
                            const flowHelper = new FlowHelper(curAccount);

                            try {
                                const multiSigTx =
                                    await flowHelper.multiSigSignTransaction(
                                        multisigJson,
                                        transactions.SwapGems,
                                        (arg: any, t: any) => [
                                            arg(offeredGems, t.Array(t.UInt64)),
                                            arg(requestedGems, t.Array(t.UInt64)),
                                        ],
                                        [offererAddress, requestedAddress],
                                        true
                                    );
                                console.log(
                                    "multiSigTx",
                                    JSON.stringify(multiSigTx)
                                );
                                setTradeStatus("Trade Confirmed!");
                            } catch (e) {
                                setTradeStatus("Trade Failed")
                            }
                        }}
                    >
                        Confirm Trade
                    </Text>
                    {tradeStatus && (
                        <Text
                            style={{
                                ...styles.text,
                            }}
                        >
                            {tradeStatus}
                        </Text>
                    )}
                </ScrollView>
            </View>
        </>
    );
}
