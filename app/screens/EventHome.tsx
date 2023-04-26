import {
    View,
    Text,
    StyleSheet,
    Image,
    KeyboardAvoidingView,
    ScrollView,
    Keyboard,
    StatusBar,
    Button
} from "react-native";
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
import { getFlowAccount } from '../utils/getFlowAccount';
import { BarCodeScanner } from "expo-barcode-scanner";
import { styles } from '../utils/styles'
import QRCode from 'react-native-qrcode-svg';

type Props = {
    navigation: any;
    route: any;
};

export default function EventHome({ route, navigation }: Props) {
    const [address, setAddress] = React.useState<string>("");
    const [event, setEvent] = React.useState<any | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [isScanning, setIsScanning] = React.useState<boolean>(false)
    const eventID = route.params.eventID;

    useEffect(() => {
        const run = async () => {
            const acc = await getFlowAccount()
            setAddress(acc.address)
        }
        run()
    }, [])

    const onBardcodeScan = (address: string) => {
        const flowHelper = new FlowHelper(undefined);
        // TODO Ensure the address is well-formed.
        
        // Navigate to a trade between myself and the scanned address.
        navigation.navigate('Swap', { address: address, eventID: eventID });
    }

    useEffect(() => {
        const getEvent = async () => {
            const flowHelper = new FlowHelper(undefined);
            // TODO Get the event from the blockchain
        };
        getEvent();
    }, []);

    const insets = useSafeAreaInsets();

    if (isScanning) {
        return (
            <View style={StyleSheet.absoluteFillObject}>
                <View style={{ height: '80%' }}>
                    <BarCodeScanner
                        onBarCodeScanned={(data) => {
                            setIsScanning(false)
                            if (data.data) {
                                onBardcodeScan(data.data)
                            }
                        }}
                        style={StyleSheet.absoluteFillObject}
                    />
                </View>
                <View style={{ height: '20%', padding: 10, marginTop: '10%'}}>
                    <Text style={{ textAlign: 'center' }}>Scan someone else's QR Code to start or confirm a trade</Text>
                    <Button onPress={() => setIsScanning(false)} title="Cancel" />
                </View>
            </View>
        )
    }

    return (
        <>
            <View style={{ paddingTop: 30 }}></View>
            <View
            >
                <ScrollView
                    style={{
                        marginTop: 60,
                        
                    }}
                    keyboardShouldPersistTaps='handled'
                >
                    <View style={{
                        backgroundColor: '#000000',
                        paddingTop: 4,
                        paddingBottom: 46
                    }}>
                        <Text style={{ ...styles.text, ...styles.largeText, ...styles.centerText, ...styles.whiteText }}>
                            {eventID}
                        </Text>
                        <View style={styles.centerContainer}>
                            { address && <QRCode value={address} size={120} /> }
                        </View>
                        <Text style={{
                            ...styles.smallText,
                            ...styles.whiteText,
                            ...styles.centerText,
                            ...styles.clickable
                        }} onPress={() => setIsScanning(true)}>Open QR Code Scanner</Text>
                    </View>
                    <View style={{
                        paddingBottom: insets.bottom,
                        paddingLeft: insets.left,
                        paddingRight: insets.right,
                    }}>
                        <View style={{
                            paddingLeft: 20,
                        }}>
                            <NFTCollection label={"View your Gem Collection"} address={address} selectable={false} eventID={eventID} />
                            <Text style={{ ...styles.text }}>Event details</Text>
                            <Text style={{ ...styles.text, ...styles.smallText, ...styles.lightText, marginTop: 0 }}>
                                {
                                    `
Prizes:
2 Golden Gems - A flow hoodie
5 Blue Gems - A flow beanie
10 Red Gems - Flovatar NFT

Head to the flow booth to redeem prizes!
                                    `
                                }
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </>
    );
}
