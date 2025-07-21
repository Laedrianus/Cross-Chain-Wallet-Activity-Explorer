import React from "react";

export const CHAINS = [
  { id: 1, name: "Ethereum" },
  { id: 137, name: "Polygon" },
  { id: 56, name: "Binance Smart Chain" },
  { id: 42161, name: "Arbitrum" },
  { id: 10, name: "Optimism" },
  { id: 43114, name: "Avalanche" },
  { id: 59144, name: "Linea" },
  { id: 8453, name: "Base" },
  { id: 592, name: "Vana" }, // Yeni eklenen Vana chain
];

function ChainSelector({ selectedChains, onChange, id, darkMode }) {
  const toggleChain = (chainId) => {
    if (selectedChains.includes(chainId)) {
      onChange(selectedChains.filter((id) => id !== chainId));
    } else {
      onChange([...selectedChains, chainId]);
    }
  };

  return (
    <div
      id={id}
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {CHAINS.map(({ id: chainId, name }) => (
        <label
          key={chainId}
          style={{
            cursor: "pointer",
            color: darkMode ? "#eee" : "#000",
            userSelect: "none",
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            border: `1.5px solid ${darkMode ? "#4ea1ff" : "#007bff"}`,
            borderRadius: 6,
            fontSize: 14,
            backgroundColor: darkMode ? "#1a1a1a" : "#f0f8ff",
          }}
        >
          <input
            type="checkbox"
            checked={selectedChains.includes(chainId)}
            onChange={() => toggleChain(chainId)}
            style={{ cursor: "pointer" }}
          />
          {name}
        </label>
      ))}
    </div>
  );
}

export default ChainSelector;
