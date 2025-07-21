// src/services/covalent.js

const API_KEY = "cqt_rQmddHjmp6rm8c6JTTgVtq9d8Qtf";

export async function getTransactions(chainId, wallet) {
  const url = `https://api.covalenthq.com/v1/${chainId}/address/${wallet}/transactions_v2/?key=${API_KEY}&no-logs=false`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch transactions: ${response.status}`);
  }
  const data = await response.json();
  return data.data.items || [];
}
