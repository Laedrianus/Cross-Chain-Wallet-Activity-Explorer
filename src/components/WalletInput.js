import React, { useState } from "react";

function WalletInput({ onAddMultiple }) {
  const [input, setInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    const rawList = input
      .split(/[\s,]+/)
      .map((addr) => addr.trim())
      .filter((addr) => addr.startsWith("0x") && addr.length === 42);

    if (rawList.length === 0) {
      alert("Geçerli Ethereum adresi bulunamadı.");
      return;
    }

    onAddMultiple(rawList);
    setInput("");
  };

  return (
    <form onSubmit={handleSubmit} style={{ width: "100%", maxWidth: 400 }}>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="0xabc...123, 0xdef...456 "
        rows={5}
        style={{ width: "100%", padding: 10, fontSize: 16, borderRadius: 6, border: "1px solid #ccc" }}
      />
      <button
        type="submit"
        style={{
          marginTop: 10,
          width: "100%",
          padding: 10,
          fontSize: 16,
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Add Wallet(s)
      </button>
    </form>
  );
}

export default WalletInput;
