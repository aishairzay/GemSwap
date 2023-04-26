import { View, Text, StyleSheet, FlatList, ScrollView } from "react-native";
import React, { useEffect } from "react";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../root";
import { RouteProp } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlowHelper } from "../../flow/FlowHelper";
import { getFlowAccount } from "../utils/getFlowAccount";
import { scripts } from '../../flow/CadenceToJson.json';

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
        height: "15%",
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
    paragraph: {
        color: "white",
        fontSize: 12,
        marginTop: 32,
        textAlign: "center",
        marginHorizontal: 32,
    },
    buttonText: {
        color: "white",
        fontSize: 20,
        marginTop: 20,
        textAlign: "left",
        marginHorizontal: 20,
        fontWeight: "bold",
        paddingHorizontal: 5,
        textDecorationLine: "underline",
    },
});

type Props = {
    navigation: any;
    route: any;
};

export default function CollectionViewer({ navigation, route }: Props) {
    const [gems, setGems] = React.useState<any[] | null>([]);
    const [error, setError] = React.useState<string | null>(null);

    const address = route.params.address
    const onBack = route.params.onBack

    useEffect(() => {
        const listGems = async () => {
            const account = await getFlowAccount();
            const flowHelper = new FlowHelper(undefined);
            let gems = null;
            try {
              gems = await flowHelper.runScript(
                    scripts.GetGemIds,
                    (arg: any, t: any) => [arg(account.address, t.Address)]
                );
            } catch (e) {
                console.log("Failed to list gems: ", e);
                setError(`We could not list gems for this account.`);
            }
            setGems(
                gems.map((v: any) => {
                    return { key: v.id, description: v.description };
                })
            );
        };
        listGems();
    }, []);

    const insets = useSafeAreaInsets();

    let content = <Text style={styles.paragraph}>Loading...</Text>;
    if (error !== null) {
        content = (
            <Text
                style={{ ...styles.text, paddingTop: 48, textAlign: "center" }}
            >
                {error}
            </Text>
        );
    } else if (gems !== null) {
        content = (
            <FlatList
                style={{ paddingTop: 20, width: '100%' }}
                data={gems}
                renderItem={({ item }) => (
                    <Text
                        style={styles.buttonText}
                    >
                        {item.key} - {item.description}
                    </Text>
                )}
            />
        );
    }

    return (
        <View
            style={[
                {
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "black",
                    paddingTop: insets.top,
                    paddingBottom: insets.bottom,
                    paddingLeft: insets.left,
                    paddingRight: insets.right,
                },
            ]}
        >
            <View style={styles.grayBackground} />
            <View style={styles.centerContainer}>
                <Text style={styles.text}>Gems</Text>
                <Text style={styles.text}>({address})</Text>
            </View>
            {onBack && ( <Text style={styles.text}>Select</Text> )}
            {content}
        </View>
    );
}
