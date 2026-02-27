const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const app = express();
const PDFDocument = require('pdfkit');


app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= DATABASE ================= */
const db = mysql.createConnection({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT
});

db.connect(err => {
  if (err) {
    console.error("Database gagal connect:", err);
  } else {
    console.log("Database terhubung!");
  }
});
/* ================= UPLOAD SETTING ================= */
const upload = multer({ dest: 'uploads/' });

/* ================= READ ================= */
app.get('/data', (req, res) => {
  db.query(
    "SELECT * FROM pelanggan ORDER BY area, id",
    (err, result) => {
      if (err) return res.status(500).send("Database error");
      res.json(result);
    }
  );
});

/* ================= SEARCH ================= */
app.get('/search', (req, res) => {
  const keyword = `%${req.query.keyword}%`;

  db.query(
    `SELECT * FROM pelanggan 
     WHERE idpel LIKE ? OR nama LIKE ? OR area LIKE ?
     ORDER BY area`,
    [keyword, keyword, keyword],
    (err, result) => {
      if (err) return res.status(500).send("Database error");
      res.json(result);
    }
  );
});

// EXPORT EXCEL
app.get('/export/excel', (req, res) => {
  const sql = "SELECT * FROM pelanggan";

  db.query(sql, (err, data) => {
    if (err) return res.status(500).send("Error ambil data");

    const XLSX = require('xlsx');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    XLSX.utils.book_append_sheet(wb, ws, "Data");

    XLSX.writeFile(wb, "data_pelanggan.xlsx");

    res.download("data_pelanggan.xlsx");
  });
});
// EXPORT PDF
app.get('/export/pdf', (req, res) => {
  const sql = "SELECT * FROM pelanggan";

  db.query(sql, (err, data) => {
    if (err) return res.status(500).send("Error ambil data");

    const doc = new PDFDocument({ margin: 30 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=data_pelanggan.pdf');

    doc.pipe(res);

    doc.fontSize(18).text("DATA PELANGGAN", { align: "center" });
    doc.moveDown();

    data.forEach((row, index) => {
      doc
        .fontSize(10)
        .text(
          `${index + 1}. ${row.idpel} | ${row.nama} | ${row.tarif} | ${row.daya} | ${row.no_bindex} | ${row.area}`
        );
    });

    doc.end();
  });
});



/* ================= EDIT ================= */
app.post('/edit', (req, res) => {
  const { id, idpel, nama, tarif, daya, no_bindex, area } = req.body;

  db.query(
    `UPDATE pelanggan 
     SET idpel=?, nama=?, tarif=?, daya=?, no_bindex=?, area=? 
     WHERE id=?`,
    [idpel, nama, tarif, daya, no_bindex, area, id],
    err => {
      if (err) return res.send("Gagal");
      res.send("OK");
    }
  );
});

// TAMBAH DATA
app.post('/tambah', (req, res) => {
  const { idpel, nama, tarif, daya, no_bindex, area } = req.body;

  const sql = `
    INSERT INTO pelanggan (idpel, nama, tarif, daya, no_bindex, area)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [idpel, nama, tarif, daya, no_bindex, area], (err) => {
    if (err) {
      console.log(err);
      return res.status(500).send("Gagal tambah data");
    }
    res.send("Berhasil tambah data");
  });
});


/* ================= DELETE ================= */
app.post('/delete', (req, res) => {
  db.query("DELETE FROM pelanggan WHERE id=?", [req.body.id], err => {
    if (err) return res.send("Gagal");
    res.send("OK");
  });
});

/* ================= UPLOAD EXCEL (BATCH SYSTEM) ================= */
app.post('/upload', upload.single('file'), async (req, res) => {

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    if (data.length === 0) {
      return res.send("File kosong");
    }

    const batchSize = 500; // kirim 500 data sekali insert
    let totalInserted = 0;

    for (let i = 0; i < data.length; i += batchSize) {

      const batch = data.slice(i, i + batchSize);

      const values = batch.map(row => [
        row.idpel || '',
        row.nama || '',
        row.tarif || '',
        row.daya || '',
        row.no_bindex || '',
        row.area || ''
      ]);

      await db.promise().query(
        `INSERT INTO pelanggan 
         (idpel, nama, tarif, daya, no_bindex, area)
         VALUES ?`,
        [values]
      );

      totalInserted += values.length;
      console.log("Inserted:", totalInserted);
    }

    fs.unlinkSync(req.file.path);

    res.send(`Upload selesai ✅ Total masuk: ${totalInserted}`);

  } catch (err) {
    console.log("ERROR:", err);
    res.status(500).send("Terjadi kesalahan saat upload");
  }

});





const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server jalan di port " + PORT);
});
