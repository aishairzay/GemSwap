import {
  View,
  StyleSheet,
  ScrollView,
  StatusBar,
} from "react-native";
import React, { useEffect, useCallback, useLayoutEffect } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { HeaderBackButton } from '@react-navigation/elements';
import { RootStackParamList } from "../root";
import { RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlowHelper } from "../../flow/FlowHelper";
import toast from '../utils/toast';
import NFTCollection from "../../components/NFTCollection";
import { getFlowAccount } from '../utils/getFlowAccount';
import { BarCodeScanner } from "expo-barcode-scanner";

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
  "Swap"
>;
type VaultScreenRouteProp = RouteProp<RootStackParamList, "Swap">;

type Props = {
  navigation: VaultScreenNavigationProp;
  route: VaultScreenRouteProp;
};

export default function EventHome({ route, navigation }: Props) {
  const [address, setAddress] = React.useState<string>("");
  const [isScanning, setIsScanning] = React.useState<boolean>(false);

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

  if (isScanning) {
      return (
          <View style={StyleSheet.absoluteFillObject}>
              
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
                      backgroundColor: "black"
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
                        <NFTCollection label="My Collection" address={address} selectable={true}></NFTCollection>
                        <NFTCollection label="Their Collection" address={otherAddress} selectable={true}></NFTCollection>
                  </View>
              </ScrollView>
          </View>
      </>
  );
}
