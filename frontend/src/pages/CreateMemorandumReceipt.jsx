import React, { useState, useEffect } from "react";
import {
  Container,
  Box,
  Alert,
  CircularProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useNavigate } from "react-router-dom";
import { createMemorandumReceipt } from "../../api/memorandumReceipt";
import { fetchItems } from "../../api/item";
import { fetchOffices } from "../../api/office";
import { fetchUsers } from "../../api/user";
import { useUser } from "../../context/UserContext";
import MemorandumReceiptForm from "../../components/MemorandumReceiptForm";

const CreateMemorandumReceiptPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch data
  const [offices, setOffices] = useState([]);
  const [items, setItems] = useState([]);
  const [users, setUsers] = useState([]);

  // Load data on mount
  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      setDataLoading(true);
      const [officesRes, itemsRes, usersRes] = await Promise.all([
        fetchOffices(),
        fetchItems(),
        fetchUsers()
      ]);
      setOffices(officesRes?.data || officesRes || []);
      setItems(itemsRes?.data || itemsRes || []);
      setUsers(usersRes?.data || usersRes || []);
    } catch (err) {
      console.error('Error loading form data:', err);
      setError("Failed to load form data");
    } finally {
      setDataLoading(false);
    }
  };

  // Handle submit from form component
  const handleFormSubmit = async (formData) => {
    setLoading(true);
    setError(null);

    try {
      await createMemorandumReceipt(formData);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/memorandum-receipts`);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create Memorandum Receipt");
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center", my: 5 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          icon={<CheckCircleIcon />}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          Memorandum Receipt created successfully! Redirecting...
        </Alert>
      )}

      <MemorandumReceiptForm
        items={items}
        offices={offices}
        users={users}
        onSubmit={handleFormSubmit}
        submitButtonText="Create Memorandum Receipt"
        isLoading={loading}
        variant="full"
      />
    </Container>
  );
};

export default CreateMemorandumReceiptPage;