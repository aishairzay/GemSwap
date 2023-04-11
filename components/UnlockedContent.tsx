import React, { useEffect } from 'react';
import UnlockedText from './UnlockedText';
import UnlockedClaim from './UnlockedClaim';
import ParagraphText from './ParagraphText';
import { symmetricDecryptMessage } from '../app/crypto/utils';

export default function UnlockedContent({ answer, vault}: { answer: string, vault: any}) {
    const [loading, setLoading] = React.useState<boolean>(true);
    const [unencryptedMessage, setUnencryptedMessage] = React.useState<string>("");
    useEffect(() => {
        if (!vault) { return } 
        const pw = `${vault.passwordSalt}:${answer}`
        const unencryptedMessage = symmetricDecryptMessage(vault.encryptedMessage, pw, vault.encryptionAlgorithm.toString());
        setUnencryptedMessage(unencryptedMessage.toString())
        setLoading(false)
    }, [answer, vault])

    if (loading) {
        return <>
            <ParagraphText text="The vault door swung wide open!" style={{ fontWeight: 'bold', fontSize: 18 }} />
            <ParagraphText text="Loading..." />
        </>
    }

    return (
        <>
            <ParagraphText text="The vault door swung wide open!" style={{ fontWeight: 'bold', fontSize: 18 }} />
            <UnlockedText text={unencryptedMessage} />
            {false && <UnlockedClaim />}
        </>
    )
}