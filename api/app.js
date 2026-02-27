const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const xlsx = require('xlsx');
const fs = require('fs');
const PDFDocument = require('pdfkit');

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ================= DATABASE ================= */
const db = mysql.createPool({
  host: process.env.MYSQLHOST,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  port: process.env.MYSQLPORT,
  waitForConnections: true,
  connectionLimit: 10,
  connectTimeout: 10000
});

/* ================= TEST ROUTES ================= */
app.get("/", (req, res) => {
  res.send("API jalan 🚀");
});

app.get("/api", (req, res) => {
  res.send("API READY 🔥");
});

/* ================= READ ================= */
app.get('/api/data', (req, res) => {

  db.query(
    "SELECT * FROM pelanggan ORDER BY area, id",
    (err, result) => {
      if (err) {
        console.log("DB ERROR:", err);
        return res.status(500).send("Database error");
      }
      res.json(result);
    }
  );

});

/* ================= SEARCH ================= */
app.get('/api/search', (req, res) => {

  const keyword = `%${req.query.keyword}%`;

  db.query(
    `SELECT * FROM pelanggan 
     WHERE idpel LIKE ? OR nama LIKE ? OR area LIKE ?
     ORDER BY area`,
    [keyword, keyword, keyword],
    (err, result) => {
      if (err) {
        console.log("DB ERROR:", err);
        return res.status(500).send("Database error");
      }
      res.json(result);
    }
  );

});

/* ================= TAMBAH ================= */
app.post('/api/tambah', (req, res) => {

  const { idpel, nama, tarif, daya, no_bindex, area } = req.body;

  const sql = `
    INSERT INTO pelanggan (idpel, nama, tarif, daya, no_bindex, area)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [idpel, nama, tarif, daya, no_bindex, area], (err) => {
    if (err) {
      console.log("DB ERROR:", err);
      return res.status(500).send("Gagal tambah data");
    }
    res.send("Berhasil tambah data");
  });

});

/* ================= DELETE ================= */
app.post('/api/delete', (req, res) => {

  db.query("DELETE FROM pelanggan WHERE id=?", [req.body.id], err => {
    if (err) {
      console.log("DB ERROR:", err);
      return res.send("Gagal");
    }
    res.send("OK");
  });

});

module.exports = app;