const express = require("express");
const app = express();

let statusLampu = "OFF";

app.get("/", (req, res) => {
  res.send("Server Kontrol Lampu Aktif 🚗");
});

// Endpoint kontrol
app.get("/kiri", (req, res) => {
  statusLampu = "KIRI";
  res.send("Lampu KIRI aktif");
});

app.get("/kanan", (req, res) => {
  statusLampu = "KANAN";
  res.send("Lampu KANAN aktif");
});

app.get("/hazard", (req, res) => {
  statusLampu = "HAZARD";
  res.send("Lampu HAZARD aktif");
});

app.get("/off", (req, res) => {
  statusLampu = "OFF";
  res.send("Lampu OFF");
});

// Endpoint untuk ESP32 baca status
app.get("/status", (req, res) => {
  res.send(statusLampu);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
