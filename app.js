const express = require("express");
const cors = require("cors");
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());

const pool = require("./db");

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});

app.get("/books", async (req, res) => {
  const { title, author, publisher } = req.query;

  let query = "SELECT * FROM books";
  let conditions = [];
  let values = [];

  if (title) {
    conditions.push(`title ILIKE $${values.length + 1}`);
    values.push(`%${title}%`);
  }
  if (author) {
    conditions.push(`author ILIKE $${values.length + 1}`);
    values.push(`%${author}%`);
  }
  if (publisher) {
    conditions.push(`publisher ILIKE $${values.length + 1}`);
    values.push(`%${publisher}%`);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  try {
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(200).json({
        error: false,
        message: "Tidak ada hasil yang ditemukan",
        data: [],
      });
    }

    res.status(200).json({
      error: false,
      message: "Data berhasil ditemukan",
      data: result.rows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: true, message: "Server Error" });
  }
});

app.get("/books/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("SELECT * FROM books WHERE id = $1", [id]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: true, message: "Buku tidak ditemukan" });
    }

    res.status(200).json({
      error: false,
      message: "Data berhasil ditemukan",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: true, message: "Server Error" });
  }
});

app.use(express.json());

app.post("/books", async (req, res) => {
  const { title, author, publish_date, publisher } = req.body;

  if (!title || !author || !publish_date || !publisher) {
    return res.status(400).json({
      error: true,
      message: "Semua field wajib diisi",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO books (title, author, publish_date, publisher)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, author, publish_date, publisher]
    );

    res.status(201).json({
      error: false,
      message: "Buku berhasil ditambahkan",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: true, message: "Server Error" });
  }
});

app.put("/books/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, author, publish_date, publisher } = req.body;

    const result = await pool.query(
      `UPDATE books SET title = $1, author = $2, publish_date = $3, publisher = $4
       WHERE id = $5 RETURNING *`,
      [title, author, publish_date, publisher, id]
    );

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: true, message: "Buku tidak ditemukan" });
    }

    res.status(200).json({
      error: false,
      message: "Buku berhasil diperbarui",
      data: result.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: true, message: "Server Error" });
  }
});

app.delete("/books/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM books WHERE id=$1 RETURNING *",
      [id]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: true, message: "Buku tidak ditemukan" });
    }
    res.status(200).json({
      error: false,
      message: "Buku berhasil dihapus",
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: true, message: "Server Error" });
  }
});
