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
import GemList from "../../components/GemList";
var LZUTF8 = require('lzutf8');

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
                      paddingLeft: insets.left,
                      paddingRight: insets.right,
                  }}>
                        <NFTCollection label="Select Gems to Offer" address={address} onBack={(selectedGems: [number]) => {
                            setOfferedGems(selectedGems)
                        }} />
                        <Text>Offered Gems:</Text>
                        <GemList address={address} gemIDs={offeredGems} />

                        <NFTCollection label={`Select Gems to Receive`} address={otherAddress} onBack={(selectedGems: [number]) => {
                            setRequestedGems(selectedGems)
                        }} />
                        <Text>Requested Gems:</Text>
                        <GemList address={otherAddress} gemIDs={requestedGems} />
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
                            transactions.SwapGems,
                            (arg: any, t: any) => [
                                arg(offeredGems, t.Array(t.UInt64)),
                                arg(requestedGems, t.Array(t.UInt64))
                            ],
                            [address, otherAddress],
                            false
                        )
                        const compressed = LZUTF8.compress(JSON.stringify(multiSigTx), {outputEncoding: 'Base64'})

                        setQRCodeData(compressed)
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
                                size={260}
                                ecl="L"
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
