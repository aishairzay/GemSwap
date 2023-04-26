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
import { transformSwapTx } from '../utils/transformFlowTx';

type Props = {
    navigation: any;
    route: any;
};

export default function ConfirmSwap({ route, navigation }: Props) {
  const multisigJson = route.params.multisigJson

  const [address, setAddress] = React.useState<string>("");

  const [offeredGems, setOfferedGems] = React.useState<any[]>(
    multisigJson.cadence.split('let offeredIds = [')[1].split(']')[0].split(',').map((s: string) => s.trim())
  );
  const [requestedGems, setRequestedGems] = React.useState<any[]>(
    multisigJson.cadence.split('let requestedIds = [')[1].split(']')[0].split(',').map((s: string) => s.trim())
  );

  const offererAddress = multisigJson.authorizers[0]
  const requestedAddress = multisigJson.authorizers[1]

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
                        <NFTCollection label="Their Collection" address={offererAddress} />
                        <Text>What they give:</Text>
                        <Text>
                            {JSON.stringify(offeredGems)}
                        </Text>

                        <NFTCollection label="My Collection" address={requestedAddress} />
                        <Text>What they take:</Text>
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
                        // Build second half of multisig trade
                        const curAccount = await getFlowAccount();
                        const flowHelper = new FlowHelper(curAccount);
                        const multiSigTx = await flowHelper.multiSigSignTransaction(
                            multisigJson,
                            transformSwapTx(offeredGems, requestedGems),
                            (arg: any, t: any) => [],
                            [offererAddress, requestedAddress],
                            true
                        )
                        console.log('multiSigTx', JSON.stringify(multiSigTx))
                    }}
                  >
                    Confirm Trade
                  </Text>
              </ScrollView>
          </View>
      </>
  );
}
