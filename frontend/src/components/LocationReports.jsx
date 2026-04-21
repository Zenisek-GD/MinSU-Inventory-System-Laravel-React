import React, { useEffect, useMemo, useState } from "react";
import { listOffices } from "../api/offices";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";

export default function LocationReports() {
  const [offices, setOffices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await listOffices();
        setOffices(data);
      } catch (e) {
        setError("Failed to load location analytics");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const total = offices.length;
    const missingRoomId = offices.filter((o) => !o.room_id).length;
    const byType = offices.reduce((acc, o) => {
      const key = o.type || "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const topTypes = Object.entries(byType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return { total, missingRoomId, topTypes };
  }, [offices]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Total Locations
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {stats.total}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Missing room_id
              </Typography>
              <Typography variant="h4" fontWeight={800}>
                {stats.missingRoomId}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Add standardized `room_id` to improve tracking.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Top Types
              </Typography>
              <List dense>
                {stats.topTypes.map(([type, count]) => (
                  <ListItem key={type} disableGutters>
                    <ListItemText primary={`${type}`} secondary={`${count} location(s)`} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
