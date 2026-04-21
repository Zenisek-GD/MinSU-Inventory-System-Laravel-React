import React, { useState } from "react";
import { Box, Paper, Tab, Tabs, Typography } from "@mui/material";
import DashboardLayout from "../components/Layout/DashboardLayout";
import LocationManager from "../components/LocationManager";
import LocationReports from "../components/LocationReports";

const LocationsPage = () => {
  const [currentTab, setCurrentTab] = useState(0);

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 1 }}>
            📍 Location Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage locations by standardized `room_id` and keep inventory tracking consistent.
          </Typography>
        </Box>

        <Paper sx={{ mb: 3, borderRadius: 2 }}>
          <Tabs
            value={currentTab}
            onChange={(e, newValue) => setCurrentTab(newValue)}
            indicatorColor="primary"
            textColor="primary"
            variant="fullWidth"
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              "& .MuiTab-root": {
                textTransform: "none",
                fontSize: "1rem",
                fontWeight: 500,
                py: 2,
              },
            }}
          >
            <Tab label="🏢 Locations" />
            <Tab label="📈 Analytics" />
          </Tabs>
        </Paper>

        {currentTab === 0 && <LocationManager />}
        {currentTab === 1 && <LocationReports />}
      </Box>
    </DashboardLayout>
  );
};

export default LocationsPage;
