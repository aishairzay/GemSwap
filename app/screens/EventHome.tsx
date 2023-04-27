import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Button
} from "react-native";
import React, { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NFTCollection from "../../components/NFTCollection";
import { getFlowAccount } from '../utils/getFlowAccount';
import { BarCodeScanner } from "expo-barcode-scanner";
import { styles } from '../utils/styles'
import QRCode from 'react-native-qrcode-svg';
var LZUTF8 = require('lzutf8');

type Props = {
    navigation: any;
    route: any;
};

export default function EventHome({ route, navigation }: Props) {
    const [address, setAddress] = React.useState<string>("");
    const [isScanning, setIsScanning] = React.useState<boolean>(false)
    const eventID = route.params.eventID;

    useEffect(() => {
        const run = async () => {
            const acc = await getFlowAccount()
            setAddress(acc.address)
        }
        run()
    }, [])

    const onBarCodeScan = async (scannedText: string) => {
        console.log('scanned is', scannedText)
        if (scannedText.length > 20) {
            // This is a multisig qr code, compressed and base64 encoded.
            const output = LZUTF8.decompress(scannedText, { inputEncoding: "Base64" })
            console.log('output is', output)
            const multisigJson = JSON.parse(output)
            //const multisigJson = await axios.get(scannedText)
            console.log('json is', multisigJson)
            navigation.navigate('ConfirmSwap', { multisigJson: multisigJson });
        } else {
            // Navigate to a trade between myself and the scanned address.
            navigation.navigate('Swap', { address: scannedText, eventID: eventID });
        }
    }

    const insets = useSafeAreaInsets();

    if (isScanning) {
        return (
            <View style={StyleSheet.absoluteFillObject}>
                <View style={{ height: '80%' }}>
                    <BarCodeScanner
                        onBarCodeScanned={(data) => {
                            setIsScanning(false)
                            if (data.data) {
                                onBarCodeScan(data.data)
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
                        }} onPress={async () =>{
                            await BarCodeScanner.requestPermissionsAsync();
                            setIsScanning(true)
                        }}>Open QR Code Scanner</Text>
                    </View>
                    <View style={{
                        paddingBottom: insets.bottom,
                        paddingLeft: insets.left,
                        paddingRight: insets.right,
                    }}>
                        <View style={{
                            paddingLeft: 20,
                        }}>
                            <NFTCollection label={"View your Gem Collection"} address={address} onBack={null} eventID={eventID} />
                            <Text style={{ ...styles.text }}>Event details</Text>
                            <Text style={{ ...styles.text, ...styles.smallText, ...styles.lightText, marginTop: 0 }}>
                                {
                                    `
Prizes:
2 Diamond Gems - A flow hoodie
5 Gold Gems - A flow beanie
10 Sapphire Gems - Flovatar NFT

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
