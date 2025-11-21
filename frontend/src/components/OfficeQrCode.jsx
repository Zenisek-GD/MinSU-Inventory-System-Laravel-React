import React from "react";
import QRCode from "qrcode.react";

const OfficeQrCode = ({ value }) => {
  if (!value) return null;
  return (
    <div style={{ textAlign: "center" }}>
      <QRCode value={value} size={64} />
      <div style={{ fontSize: "0.75rem", marginTop: 4 }}>{value}</div>
    </div>
  );
};

export default OfficeQrCode;