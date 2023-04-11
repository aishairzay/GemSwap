import { Image, Text, StyleSheet } from 'react-native';
import React from 'react';
import VaultButton from './VaultButton';
import ParagraphText from './ParagraphText';

const styles = StyleSheet.create({
    paragraph: {
        color: 'white',
        fontSize: 12,
        marginTop: 32,
        textAlign: "center",
        marginHorizontal: 32
    }
});


export default function UnlockedClaim() {
    return (
        <>
            <ParagraphText text="It seems there was an item left inside" />
            <Image source={require('../assets/images/flowvatar.png')} style={{ alignSelf: 'center', marginTop: 30 }} />
            <VaultButton text="Claim Item" />
        </>
    );
}