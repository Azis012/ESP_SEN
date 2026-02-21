const express = require('express');
const app = express();
app.use(express.json());

let statusLampu = 'OFF';

app.get('/', (req, res) => res.send('Server lampu aktif 🚀'));

// Endpoint untuk ESP32 polling
app.get('/status', (req, res) => res.send(statusLampu));

// Endpoint untuk WA bot update status
app.post('/lampu', (req, res) => {
    const { status } = req.body;
    const valid = ['KIRI','KANAN','HAZARD','OFF'];
    if (!status || !valid.includes(status.toUpperCase())) return res.status(400).send('Invalid status');
    statusLampu = status.toUpperCase();
    console.log('Status lampu diperbarui:', statusLampu);
    res.send({ status: statusLampu });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server aktif di port ${PORT}`));
