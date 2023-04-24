import { View, Text, StyleSheet } from 'react-native';
import React from 'react';

const styles = StyleSheet.create({
    paragraph: {
        color: 'white',
        fontSize: 16,
        marginTop: 32,
        textAlign: "center",
        marginHorizontal: 32
    }
});

type VaultButtonProps = {
    address: string,
}

export default function NFTCollection({ address }: VaultButtonProps) {
    return (
      <View>
        <Text style={styles.paragraph}>My Collection:</Text>
        <Text style={styles.paragraph}>
          {address}
        </Text>
      </View>
    )
}