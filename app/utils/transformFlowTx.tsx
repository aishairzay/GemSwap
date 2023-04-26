import { transactions } from '../../flow/CadenceToJson.json';

export const transformSwapTx = (offered: number[], requested: number[]): string => {
  let tx = transactions.SwapGems
  tx = tx.replaceAll('/*INSERT_OFFERED_IDS*/', offered.join(','))
  tx = tx.replaceAll('/*INSERT_REQUESTED_IDS*/', requested.join(','))
  return tx
}
  