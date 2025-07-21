import React, { useState, useEffect } from "react";
import { getTransactions } from "./services/covalent";
import WalletInput from "./components/WalletInput";
import ChainSelector from "./components/ChainSelector";

// Chain explorer linkleri (Vana Chain eklendi)
const CHAIN_EXPLORERS = {
  1: "https://etherscan.io",
  137: "https://polygonscan.com",
  56: "https://bscscan.com",
  42161: "https://arbiscan.io",
  10: "https://optimistic.etherscan.io",
  43114: "https://snowtrace.io",
  59144: "https://lineascan.build",
  8453: "https://basescan.org",
  10000: "https://explorer.vanachain.io", // Vana Chain eklendi
};

// ChainSelector için chain listesi (Vana Chain dahil)
const CHAINS = [
  { id: 1, name: "Ethereum" },
  { id: 137, name: "Polygon" },
  { id: 56, name: "BSC" },
  { id: 42161, name: "Arbitrum" },
  { id: 10, name: "Optimism" },
  { id: 43114, name: "Avalanche" },
  { id: 59144, name: "Linea" },
  { id: 8453, name: "Base" },
  { id: 10000, name: "Vana Chain" }, // Burada da Vana Chain var
];

function App() {
  const [wallets, setWallets] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [selectedChains, setSelectedChains] = useState([1]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [txFilter, setTxFilter] = useState("both");
  const [darkMode, setDarkMode] = useState(false);

  // Cüzdan ekleme
  const handleAddWallets = (addressList) => {
    const uniqueNew = addressList.filter(
      (addr) => !wallets.includes(addr.toLowerCase())
    );
    if (uniqueNew.length > 0) {
      setWallets((prev) => [...prev, ...uniqueNew.map((a) => a.toLowerCase())]);
    } else {
      alert("All addresses are already added.");
    }
  };

  // Favori ekle/kaldır
  const toggleFavorite = (addr) => {
    const normAddr = addr.toLowerCase();
    setFavorites((prev) =>
      prev.includes(normAddr)
        ? prev.filter((a) => a !== normAddr)
        : [...prev, normAddr]
    );
  };

  // Favori listeden wallet yükle
  const loadWalletFromFavorite = (addr) => {
    if (!wallets.includes(addr)) {
      setWallets((prev) => [...prev, addr]);
    }
  };

  // Dark mode toggle
  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  // Transaction yükleme
  useEffect(() => {
    async function loadTxns() {
      if (wallets.length === 0 || selectedChains.length === 0) {
        setTransactions([]);
        return;
      }
      setLoading(true);
      let allTxns = [];

      for (const chainId of selectedChains) {
        for (const wallet of wallets) {
          try {
            const txns = await getTransactions(chainId, wallet);
            const tagged = txns.map((tx) => ({ ...tx, chainId, wallet }));
            allTxns = allTxns.concat(tagged);
          } catch (err) {
            console.error(`Error fetching txns for ${wallet} on chain ${chainId}:`, err);
          }
        }
      }

      const filteredTxns = allTxns.filter((tx) => {
        if (txFilter === "incoming") {
          return tx.to_address?.toLowerCase() === tx.wallet.toLowerCase();
        } else if (txFilter === "outgoing") {
          return tx.from_address?.toLowerCase() === tx.wallet.toLowerCase();
        }
        return true;
      });

      filteredTxns.sort(
        (a, b) => new Date(b.block_signed_at) - new Date(a.block_signed_at)
      );

      setTransactions(filteredTxns);
      setLoading(false);
    }

    loadTxns();
  }, [wallets, selectedChains, txFilter]);

  // Adres kısaltma
  const shortenAddress = (addr) =>
    addr ? addr.slice(0, 6) + "..." + addr.slice(-4) : "";

  // Tx Hash kısaltma
  const shortenTxHash = (hash) => (hash ? hash.slice(0, 10) + "..." : "");

  // Transfer özetleri (token & NFT)
  const getTransfersSummary = (tx) => {
    if (!tx.log_events || tx.log_events.length === 0) return "No token/NFT transfers";

    const transfers = tx.log_events.filter(
      (e) => e.decoded && e.decoded.name === "Transfer"
    );

    if (transfers.length === 0) return "No token/NFT transfers";

    const summaries = transfers.map((e) => {
      const isNFT = e.decoded.params.some((p) => p.name === "tokenId");
      const tokenName = e.sender_contract_ticker_symbol || e.sender_name || "Token";
      if (isNFT) {
        const tokenIdParam = e.decoded.params.find((p) => p.name === "tokenId");
        return `1 ${tokenName} NFT (ID: ${tokenIdParam.value})`;
      } else {
        const valueParam = e.decoded.params.find((p) => p.name === "value");
        let amount = valueParam ? Number(valueParam.value) : null;
        if (amount !== null) {
          return `${amount} ${tokenName}`;
        } else {
          return `Token transfer: ${tokenName}`;
        }
      }
    });

    return summaries.join(", ");
  };

  // Wallet listesi render
  const renderWalletList = () => {
    if (wallets.length === 0) return <p>No wallets added yet.</p>;

    return (
      <div
        style={{
          marginTop: 10,
          marginBottom: 20,
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "center",
        }}
      >
        {wallets.map((w) => {
          const isFav = favorites.includes(w.toLowerCase());
          return (
            <div
              key={w}
              style={{
                backgroundColor: isFav ? "#d0e7ff" : "#eee",
                padding: "6px 12px",
                borderRadius: 6,
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontFamily: "'Courier New', Courier, monospace",
                userSelect: "none",
              }}
            >
              {shortenAddress(w)}
              <button
                onClick={() => toggleFavorite(w.toLowerCase())}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: isFav ? "#ff5722" : "#007bff",
                  fontSize: "1.2rem",
                  lineHeight: 1,
                }}
                title={isFav ? "Remove from favorites" : "Add to favorites"}
                aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
              >
                {isFav ? "★" : "☆"}
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "40px auto",
        padding: "0 20px 40px",
        fontFamily: "'Courier New', Courier, monospace",
        lineHeight: 1.5,
        textAlign: "center",
        backgroundColor: darkMode ? "#121212" : "#fff",
        color: darkMode ? "#eee" : "#000",
        minHeight: "100vh",
      }}
    >
      {/* Başlık ve sağda Dark Mode */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 15,
        }}
      >
        <h1 style={{ margin: 0, fontWeight: "bold" }}>
          🧭 Cross-Chain Wallet Activity Explorer
        </h1>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            alignItems: "flex-end",
            minWidth: 120,
          }}
        >
          <label
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 14,
              userSelect: "none",
              color: darkMode ? "#eee" : "#000",
            }}
          >
            <input
              type="checkbox"
              checked={darkMode}
              onChange={toggleDarkMode}
              style={{ cursor: "pointer" }}
            />
            Dark Mode
          </label>
        </div>
      </div>

      {/* WalletInput ve Favori Wallets yan yana */}
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "center",
          gap: "20px",
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            flexBasis: "48%",
            minWidth: 320,
            maxWidth: 450,
            border: "1.5px solid #007bff",
            borderRadius: 8,
            padding: 15,
            backgroundColor: darkMode ? "#1e1e1e" : "#f9faff",
            color: darkMode ? "#eee" : "#000",
          }}
        >
          <WalletInput onAddMultiple={handleAddWallets} />
          {renderWalletList()}
        </div>

        <div
          style={{
            flexBasis: "48%",
            minWidth: 320,
            maxWidth: 450,
            border: "1.5px solid #007bff",
            borderRadius: 8,
            padding: 15,
            backgroundColor: darkMode ? "#2a2a2a" : "#f0f8ff",
            color: darkMode ? "#eee" : "#000",
            textAlign: "left",
            userSelect: "none",
          }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 10, color: "#007bff" }}>
            ⭐ Favorite Wallets
          </h3>
          {favorites.length === 0 ? (
            <p style={{ fontStyle: "italic", color: darkMode ? "#bbb" : "#555" }}>
              No favorites yet.
            </p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {favorites.map((fav) => (
                <div
                  key={fav}
                  style={{
                    backgroundColor: "#d0e7ff",
                    padding: "6px 12px",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    userSelect: "none",
                    fontFamily: "'Courier New', Courier, monospace",
                  }}
                >
                  <button
                    onClick={() => loadWalletFromFavorite(fav)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#007bff",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "0.9rem",
                      padding: 0,
                      margin: 0,
                    }}
                    title="Load wallet transactions"
                  >
                    {shortenAddress(fav)}
                  </button>
                  <button
                    onClick={() => toggleFavorite(fav)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "#ff5722",
                      fontSize: "1.2rem",
                      lineHeight: 1,
                    }}
                    title="Remove from favorites"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ChainSelector */}
      <div
        style={{
          marginBottom: 20,
          display: "flex",
          justifyContent: "center",
          gap: "40px",
          flexWrap: "wrap",
          alignItems: "flex-start",
        }}
      >
        <div style={{ minWidth: 200 }}>
          <label
            htmlFor="chainSelector"
            style={{
              fontWeight: "bold",
              display: "block",
              marginBottom: 8,
              color: darkMode ? "#eee" : "#000",
            }}
          >
            Select Chains:
          </label>
          <ChainSelector
            selectedChains={selectedChains}
            onChange={setSelectedChains}
            id="chainSelector"
            darkMode={darkMode}
            chains={CHAINS} // Yeni prop olarak zincir listesini veriyoruz
          />
        </div>
      </div>

      {/* Transaction filtre ve tablo */}
      <div
        style={{
          display: "inline-flex",
          gap: 10,
          marginBottom: 20,
          justifyContent: "center",
          flexWrap: "wrap",
        }}
      >
        {["both", "incoming", "outgoing"].map((filterKey) => {
          const labels = {
            both: "All Transactions",
            incoming: "Incoming Only",
            outgoing: "Outgoing Only",
          };
          const isSelected = txFilter === filterKey;

          return (
            <button
              key={filterKey}
              onClick={() => setTxFilter(filterKey)}
              style={{
                padding: "8px 18px",
                borderRadius: 6,
                border: "1.5px solid #007bff",
                backgroundColor: isSelected ? "#007bff" : "transparent",
                color: isSelected ? "white" : "#007bff",
                fontWeight: "bold",
                cursor: "pointer",
                boxShadow: isSelected ? "0 0 8px rgba(0,123,255,0.6)" : "none",
                transition: "all 0.25s ease",
                minWidth: 140,
                userSelect: "none",
              }}
              aria-pressed={isSelected}
              type="button"
            >
              {labels[filterKey]}
            </button>
          );
        })}
      </div>

      <p>
        <strong>Selected Chains:</strong>{" "}
        {selectedChains
          .map((id) => CHAINS.find((c) => c.id === id)?.name)
          .filter(Boolean)
          .join(", ")}
      </p>

      <p>
        <strong>Total Wallets:</strong> {wallets.length}
      </p>

      {loading ? (
        <p>🔄 Loading transactions...</p>
      ) : transactions.length > 0 ? (
        <table
          style={{
            width: "100%",
            marginTop: 20,
            borderCollapse: "collapse",
            textAlign: "center",
            color: darkMode ? "#eee" : "#000",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  borderBottom: "2px solid #ccc",
                  padding: "8px",
                  textAlign: "center",
                }}
              >
                Tx Hash
              </th>
              <th
                style={{
                  borderBottom: "2px solid #ccc",
                  padding: "8px",
                  textAlign: "center",
                }}
              >
                Timestamp
              </th>
              <th
                style={{
                  borderBottom: "2px solid #ccc",
                  padding: "8px",
                  textAlign: "center",
                  fontFamily: "'Courier New', monospace",
                }}
              >
                From
              </th>
              <th
                style={{
                  borderBottom: "2px solid #ccc",
                  padding: "8px",
                  textAlign: "center",
                  fontFamily: "'Courier New', monospace",
                }}
              >
                To
              </th>
              <th
                style={{
                  borderBottom: "2px solid #ccc",
                  padding: "8px",
                  textAlign: "center",
                }}
              >
                Chain
              </th>
              <th
                style={{
                  borderBottom: "2px solid #ccc",
                  padding: "8px",
                  textAlign: "left",
                  fontSize: 13,
                }}
              >
                Transfers
              </th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr
                key={`${tx.tx_hash}-${tx.chainId}`}
                style={{
                  borderBottom: "1px solid #ddd",
                  backgroundColor: darkMode ? "#222" : "white",
                }}
              >
                <td
                  style={{
                    padding: "6px 8px",
                    fontFamily: "'Courier New', monospace",
                    fontSize: 12,
                    wordBreak: "break-all",
                  }}
                >
                  <a
                    href={`${CHAIN_EXPLORERS[tx.chainId]}/tx/${tx.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: darkMode ? "#00aaff" : "#007bff" }}
                  >
                    {shortenTxHash(tx.tx_hash)}
                  </a>
                </td>
                <td style={{ padding: "6px 8px" }}>
                  {new Date(tx.block_signed_at).toLocaleString()}
                </td>
                <td
                  style={{
                    padding: "6px 8px",
                    fontFamily: "'Courier New', monospace",
                    fontSize: 12,
                  }}
                >
                  {shortenAddress(tx.from_address)}
                </td>
                <td
                  style={{
                    padding: "6px 8px",
                    fontFamily: "'Courier New', monospace",
                    fontSize: 12,
                  }}
                >
                  {shortenAddress(tx.to_address)}
                </td>
                <td style={{ padding: "6px 8px" }}>
                  {CHAINS.find((c) => c.id === tx.chainId)?.name || tx.chainId}
                </td>
                <td
                  style={{
                    padding: "6px 8px",
                    textAlign: "left",
                    fontSize: 12,
                  }}
                  title={getTransfersSummary(tx)}
                >
                  {getTransfersSummary(tx)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p>No transactions found.</p>
      )}

      <footer style={{ marginTop: 60, fontSize: 14, color: darkMode ? "#888" : "#666" }}>
        <p>Made with ❤️ by Laedrianus</p>
      </footer>
    </div>
  );
}

export default App;
