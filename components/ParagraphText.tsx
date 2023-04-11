import { Text, StyleSheet } from 'react-native';
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
    text: string,
    style: any
}

export default function ParagraphText({ text, style }: VaultButtonProps) {
    return (
        <Text style={{...styles.paragraph, ...style}}>{text}</Text>
    )
}