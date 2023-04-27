import { View, Text, StyleSheet, Button } from 'react-native';
import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { FlowHelper } from '../flow/FlowHelper';
import { scripts, transactions } from '../flow/CadenceToJson.json';
import { styles } from '../app/utils/styles';

type NFTCollectionProps = {
    address: string,
    gemIDs: number[]
}

export default function GemList({ address, gemIDs }: NFTCollectionProps) {
  const [gems, setGems] = React.useState<any[] | null>([]);
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
      }
      setGems(
        gems
          .filter((v: any) => gemIDs.includes(v.id))
          .map((v: any) => {
            return { key: v.id, description: v.display.name };
          })
      );
    };
    listGems();
  }, [address, gemIDs])

  return (
    <View>
      {
        gems?.map((gem: any) => {
          return (
            <Text>* {gem.key} - {gem.description}</Text>
          )
        })
      }
      {
        gems?.length === 0 && <Text>None</Text>
      }
    </View>
  )
}