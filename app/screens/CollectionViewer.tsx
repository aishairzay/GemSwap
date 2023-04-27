import { View, Text, FlatList } from "react-native";
import React, { useEffect } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FlowHelper } from "../../flow/FlowHelper";
import { getFlowAccount } from "../utils/getFlowAccount";
import { scripts, transactions } from '../../flow/CadenceToJson.json';
import { styles } from '../utils/styles'

type Props = {
    navigation: any;
    route: any;
};

export default function CollectionViewer({ navigation, route }: Props) {
    const [gems, setGems] = React.useState<any[] | null>([]);
    const [error, setError] = React.useState<string | null>(null);
    const [refreshCount, setRefreshCount] = React.useState<number>(0)
    const [selected, setSelected] = React.useState<number[]>([])
    const [isMyAddress, setIsMyAddress] = React.useState<boolean>(false)

    const address = route.params.address
    const onBack = route.params.onBack

    useEffect(() => {
        const listGems = async () => {
            const flowHelper = new FlowHelper(undefined);
            let gems = null;
            try {
                gems = await flowHelper.runScript(
                    scripts.GetGemsForAccount,
                    (arg: any, t: any) => [arg(address, t.Address)]
                );
            } catch (e) {
                console.log("Failed to list gems: ", e);
                setError(`We could not list gems for this account.`);
            }
            setGems(
                gems.map((v: any) => {
                    return { key: v.id, description: v.display.name };
                })
            );
        };
        listGems();
    }, [refreshCount]);

    useEffect(() => {
        const checkAddress = async () => {
            const curAccount = await getFlowAccount()
            setIsMyAddress(curAccount.address === address)
        }
        checkAddress()
    }, [])


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
        const isSelectable = onBack !== null
        content = (
            <FlatList
                style={{ paddingTop: 20, width: '100%' }}
                data={gems}
                renderItem={({ item }) => (
                    <Text
                        style={styles.buttonText}
                        onPress={() => {
                            if (isSelectable) {
                                if (selected.includes(item.key)) {
                                    setSelected(selected.filter((v) => v !== item.key))
                                } else {
                                    setSelected([...selected, item.key])
                                }
                            }
                        }}
                    >
                        {item.key} - {item.description} {isSelectable && selected.includes(item.key) ? '✅' : ''}
                    </Text>
                )}
            />
        );
    }

    return (
        <>
            <View style={styles.centerContainer}>
                <Text style={styles.text}>{`
Gems owned by
${address} ${isMyAddress ? '(YOU)' : ''}
                `}</Text>
            </View>

            <View style={{ paddingLeft: 20 }}>
                {content}
                {
                    !onBack && (
                        <Text
                            style={{ ...styles.text, ...styles.smallText, ...styles.clickable }}
                            onPress={async () => {
                                const curAccount = await getFlowAccount()
                                const flowHelper = new FlowHelper(curAccount)
                                await flowHelper.startTransaction(
                                    transactions.ClaimGem,
                                    (arg: any, t: any) => {
                                        return [
                                            arg('0x80a8d65f1d30c1b4', t.Address),
                                            arg('1', t.UInt64)
                                        ]
                                    }
                                )
                                setRefreshCount(refreshCount + 1)
                            }}
                        >
                            Claim a FREE Gem
                        </Text>
                    )
                }
                {onBack && (
                <>
                    <Text style={{ ...styles.text, ...styles.smallText }}>Click the gems you'd like to include in the trade, then click Continue</Text>
                
                    <Text
                        onPress={() => {
                            onBack(selected)
                            navigation.goBack();
                        }}
                        style={{ ...styles.text, ...styles.clickable }}
                    >
                        Continue
                    </Text>
                 </>   
                )}
            </View>
        </>
    );
}
