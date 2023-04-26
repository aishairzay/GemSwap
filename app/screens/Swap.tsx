import {
  View,
  ScrollView,
  Text
} from "react-native";
import React, { useEffect, useCallback, useLayoutEffect } from "react";
import { HeaderBackButton } from '@react-navigation/elements';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlowHelper } from "../../flow/FlowHelper";
import NFTCollection from "../../components/NFTCollection";
import { getFlowAccount } from '../utils/getFlowAccount';
import { styles } from '../utils/styles'
import { transactions } from '../../flow/CadenceToJson.json';
import QRCode from 'react-native-qrcode-svg';
import axios from "axios";

type Props = {
    navigation: any;
    route: any;
};

export default function Swap({ route, navigation }: Props) {
  const [address, setAddress] = React.useState<string>("");
  const [offeredGems, setOfferedGems] = React.useState<any[]>([]);
  const [requestedGems, setRequestedGems] = React.useState<any[]>([]);
  const [qrCodeData, setQRCodeData] = React.useState<string>("");

  const otherAddress = route.params.address
  const eventID = route.params.eventID;

  const handleBackButtonPress = useCallback(() => {
      // Specify the screen you want to navigate to when the back button is pressed
      navigation.pop()
  }, [navigation]);

  useEffect(() => {
      const run = async () => {
          const acc = await getFlowAccount()
          setAddress(acc.address)
      }
      run()
  }, [])

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
                  keyboardShouldPersistTaps='handled'
              >
                  <View style={{
                      paddingTop: insets.top,
                      paddingBottom: insets.bottom,
                      paddingLeft: insets.left,
                      paddingRight: insets.right,
                  }}>
                        <NFTCollection label="My Collection" address={address} onBack={(selectedGems: [number]) => {
                            setOfferedGems(selectedGems)
                        }} />
                        <Text>Offered:</Text>
                        <Text>
                            {JSON.stringify(offeredGems)}
                        </Text>

                        <NFTCollection label="Their Collection" address={otherAddress} onBack={(selectedGems: [number]) => {
                            setRequestedGems(selectedGems)
                        }} />
                        <Text>Requested:</Text>
                        <Text>
                            {JSON.stringify(requestedGems)}
                        </Text>
                  </View>
                  <Text
                    style={{
                        ...styles.text,
                        ...styles.clickable,
                        ...styles.largeText
                    }}
                    onPress={async () => {
                        // Build first half of multisig trade
                        const curAccount = await getFlowAccount();
                        const flowHelper = new FlowHelper(curAccount);
                        const multiSigTx = await flowHelper.multiSigSignTransaction(
                            undefined,
                            transactions.SwapGemsTest,
                            (arg: any, t: any) => [
                                arg(offeredGems, t.Array(t.UInt64)),
                                arg(requestedGems, t.Array(t.UInt64))
                            ],
                            [address, otherAddress],
                            false
                        )
                        console.log('multiSigTx', JSON.stringify(multiSigTx))

                        const headers = {
                            'Content-Type': 'application/json',
                            'X-Master-key': '$2b$10$eO7hvOmrgihsZ5416p0xmey6M4lh0dx7gFnGDMfG7tRrnQu8V4ZPm',
                            'X-Bin-private': "false"
                          }
                        const response = await axios.post('https://api.jsonbin.io/v3/b', JSON.stringify(multiSigTx), {
                            headers: headers
                        })
                        console.log('response is', response.data.metadata.id)
                        const id = response.data.metadata.id
                        console.log(`MultiSig available at https://api.jsonbin.io/v3/b/${id}`)
                        setQRCodeData(`https://api.jsonbin.io/v3/b/${id}`)
                    }}
                  >
                    Propose Trade
                  </Text>

                  {
                    qrCodeData.length > 0 && (
                        <>
                            <Text style={{ ...styles.text, color: 'green' }}>Trade Proposed!</Text>
                            <View style={{marginTop: 20}}></View>
                            <QRCode
                                value={qrCodeData}
                                size={200}
                            />
                            <Text>{`
Have your trade partner scan this
QR Code to confirm your trade!
                            `}</Text>
                        </>
                    )
                  }
              </ScrollView>
          </View>
      </>
  );
}
