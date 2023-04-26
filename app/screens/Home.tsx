import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ScrollView
} from "react-native";
import React, { useState, useEffect } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../root";
import { RouteProp } from "@react-navigation/native";
import { getFlowAccount } from '../utils/getFlowAccount';
import { styles } from '../utils/styles'
import { FlowHelper } from "../../flow/FlowHelper";
import { scripts } from '../../flow/CadenceToJson.json';
import { LinearGradient } from 'expo-linear-gradient';
const redGem = require('../../assets/images/red-gem.png')

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, "Home">;
type HomeScreenRouteProp = RouteProp<RootStackParamList, "Home">;

type Props = {
    navigation: HomeScreenNavigationProp;
    route: HomeScreenRouteProp;
};

export default function Home({ navigation }: Props) {
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


    const handleGoToEvent = (eventID) => {
        navigation.navigate("EventHome", { eventID: eventID });
    };

    const handleGoToCreate = () => {
        navigation.navigate("CreateEvent");
    };

    const handleGoToList = () => {
        navigation.navigate("ListVaults");
    };

    useEffect(() => {
        const run = async () => {
            const acc = await getFlowAccount()
            const flowHelper = new FlowHelper(undefined);
            const events = await flowHelper.runScript(
                scripts.GetGameGameSetIds,
                (arg: any, t: any) => []
            )
            console.log('events is', events)
        }
        run()
    }, [])

    return (
        <View>
            <LinearGradient
                style={{

                }}
                colors={['#000000', '#FF0000', '#000']}
                start={{ x: 1, y: 1 }}
                end={{ x: 0, y: 0 }}
            >
                <View style={{  }}>

                    <View style={styles.centerContainer}>
                        <Text style={{ ...styles.text, ...styles.whiteText }}>Gem Swap</Text>
                    </View>
                    <ScrollView style={{ keyboardShouldPersistTaps: 'handled' }}>
                        <Image
                            source={redGem}
                            style={{ alignSelf: "center", marginTop: 30, maxWidth: '80%', maxHeight: '50%' }}
                        />
                        <TouchableOpacity
                            onPress={() => {
                                handleGoToEvent("FlowCon 2023")
                            }}
                        >
                            <Text style={{ ...styles.headerText, ...styles.whiteText, marginLeft: 20 }}>Enter FlowCon 2023</Text>
                        </TouchableOpacity>
                        <View style={{ marginTop: '40%' }}></View>
                        <Text onPress={handleGoToCreate} style={{ ...styles.smallText, ...styles.clickable, ...styles.whiteText, marginLeft: 20 }}>Create a new Event</Text>
                    </ScrollView>
                </View>
            </LinearGradient>
        </View>
    );
}
