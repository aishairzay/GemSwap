import { View, Text, StyleSheet, Button } from 'react-native';
import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { FlowHelper } from '../flow/FlowHelper';
import { scripts, transactions } from '../flow/CadenceToJson.json';
import { styles } from '../app/utils/styles';

type NFTCollectionProps = {
    address: string,
    label: string|undefined,
    onBack: (selectedGems: [number]) => void|null
}

export default function NFTCollection({ address, label, onBack }: NFTCollectionProps) {
    const navigation = useNavigation();
    return (
      <View>
        <Text 
          style={{ ...styles.text, ...styles.smallText, ...styles.clickable }}
          onPress={() => {
            navigation.navigate('CollectionViewer', {
              address: address,
              onBack: onBack
            })
          }}
        >{label || 'My Gem Collection'}</Text>
      </View>
    )
}