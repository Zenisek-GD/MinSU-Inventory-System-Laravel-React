import React from "react";
import QRCode from "react-qr-code";

const ItemQrCode = ({ value }) => {
  if (!value) return null;
  return (
    <div style={{ textAlign: "center" }}>
      <QRCode value={value} size={64} />
      <div style={{ fontSize: "0.75rem", marginTop: 4 }}>{value}</div>
    </div>
  );
};

export default ItemQrCode;
