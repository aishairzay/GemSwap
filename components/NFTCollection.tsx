import { View, Text, StyleSheet, Button } from 'react-native';
import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { FlowHelper } from '../flow/FlowHelper';
import { scripts } from '../flow/CadenceToJson.json';
import { styles } from '../app/utils/styles';

type VaultButtonProps = {
    address: string,
    label: string|undefined,
    selectable: boolean
}

export default function NFTCollection({ address, label, selectable }: VaultButtonProps) {
    const [nftCount, setNFTCount] = React.useState<number|null>(null)

    useEffect(() => {
        const flowHelper = new FlowHelper(undefined)
        flowHelper.runScript(scripts.GetGemIds,
          (arg: any, t: any) => {
            return [arg(address, t.Address)]
          }
        ).then((result) => {
            setNFTCount(result.length)
        })
    })

    const navigation = useNavigation();
    return (
      <View style={ styles.centerContainer }>
        <Text 
          style={{ ...styles.text, ...styles.smallText, ...styles.clickable }}
          onPress={() => {
            navigation.navigate('CollectionViewer', {
              address: address,
              onBack: (gems) => {
                console.log('selectedGems is', gems)
              }
            })
          }}
        >{label || 'My Gem Collection'}</Text>
      </View>
    )
}