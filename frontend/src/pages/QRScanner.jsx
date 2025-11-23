import React, { useState } from "react";
import { Box, Typography, Paper, Button, Chip, Divider } from "@mui/material";
import { QrReader } from "@blackbox-vision/react-qr-reader";
import { fetchItemByQr, updateItemStatus } from "../api/item";

const QRScanner = () => {
  const [scannedCode, setScannedCode] = useState("");
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleScan = async (result) => {
    if (!result) return;
    setScannedCode(result);
    setError("");
    setSuccess("");
    try {
      const data = await fetchItemByQr(result);
      setItem(data);
    } catch (err) {
      setItem(null);
      setError("Item not found for this QR code.");
    }
  };

  const handleError = (err) => {
    setError("QR scan error: " + (err?.message || err));
  };

  const handleUpdateStatus = async (newStatus) => {
    if (!item) return;
    try {
      await updateItemStatus(item.id, { status: newStatus });
      setSuccess(`Item status updated to ${newStatus}`);
      setItem({ ...item, status: newStatus });
    } catch {
      setError("Failed to update item status.");
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h4" fontWeight={700} mb={2}>QR Scanner</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <QrReader
          constraints={{ facingMode: "environment" }}
          onResult={(result, error) => {
            if (!!result) {
              handleScan(result?.text || result?.data || "");
            }
            if (!!error) {
              handleError(error);
            }
          }}
          containerStyle={{ width: "100%" }}
          videoStyle={{ width: "100%" }}
        />
      </Paper>
      {error && (
        <Box mb={2}>
          <Typography color="error" mb={1}>{error}</Typography>
          {error.includes("NotFoundException") && (
            <Paper sx={{ p: 2, background: '#fffbe6', border: '1px solid #ffe58f' }}>
              <Typography color="warning.main" variant="body2">
                No camera device found or accessible.<br />
                <b>How to fix:</b>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  <li>Make sure your device has a camera.</li>
                  <li>Allow camera access in your browser when prompted.</li>
                  <li>Try using a mobile device or laptop with a camera.</li>
                  <li>Close other apps that may be using the camera.</li>
                  <li>Refresh the page after granting permission.</li>
                </ul>
              </Typography>
            </Paper>
          )}
        </Box>
      )}
      {success && <Typography color="success.main" mb={2}>{success}</Typography>}
      {item && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={600}>{item.name}</Typography>
          <Chip label={item.status} color={item.status === "Available" ? "success" : "warning"} sx={{ mb: 1 }} />
          <Typography variant="body2" color="text.secondary">{item.description}</Typography>
          <Divider sx={{ my: 1 }} />
          <Typography><b>Category:</b> {item.category?.name}</Typography>
          <Typography><b>Office:</b> {item.office?.name}</Typography>
          <Typography><b>Serial Number:</b> {item.serial_number}</Typography>
          <Typography><b>QR Code:</b> {item.qr_code}</Typography>
          <Typography><b>Purchase Date:</b> {item.purchase_date}</Typography>
          <Typography><b>Purchase Price:</b> ₱{item.purchase_price}</Typography>
          <Typography><b>Warranty Expiry:</b> {item.warranty_expiry}</Typography>
          <Typography><b>Notes:</b> {item.notes}</Typography>
          <Divider sx={{ my: 1 }} />
          {item.status === "Borrowed" && item.current_borrow && (
            <Box sx={{ mb: 1 }}>
              <Typography><b>Currently Borrowed</b></Typography>
              <Typography>By: {item.current_borrow.borrowedBy?.name || item.current_borrow.borrowed_by}</Typography>
              <Typography>Since: {item.current_borrow.borrow_date}</Typography>
              <Typography>Expected Return: {item.current_borrow.expected_return_date}</Typography>
            </Box>
          )}
          <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
            {item.status === "Available" && (
              <Button variant="contained" color="warning" onClick={() => handleUpdateStatus("Borrowed")}>Mark as Borrowed</Button>
            )}
            {item.status === "Borrowed" && (
              <Button variant="contained" color="success" onClick={() => handleUpdateStatus("Available")}>Mark as Returned</Button>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default QRScanner;
