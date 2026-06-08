require('dotenv').config();


const express = require('express');
const cors = require('cors');
const pool = require('./db');
const ExcelJS = require('exceljs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('IT Asset Management API Running');
});

app.get('/assets', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM assets');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send('Database Error');
    }
});
app.put('/assets/:id', async (req, res) => {
    try {
        const {
            asset_tag,
            asset_type,
            brand,
            model,
            serial_number,
            purchase_date,
            warranty_end,
            status,
            assigned_to
        } = req.body;

        const result = await pool.query(
            `UPDATE assets
             SET asset_tag=$1,
                 asset_type=$2,
                 brand=$3,
                 model=$4,
                 serial_number=$5,
                 purchase_date=$6,
                 warranty_end=$7,
                 status=$8,
                 assigned_to=$9
             WHERE id=$10
             RETURNING *`,
            [
                asset_tag,
                asset_type,
                brand,
                model,
                serial_number,
                purchase_date,
                warranty_end,
                status,
                assigned_to,
                req.params.id
            ]
        );

        res.json(result.rows[0]);
    } catch(err){
        console.error(err);
    }
});
app.delete('/assets/:id', async (req, res) => {
    try {
        await pool.query(
            'DELETE FROM assets WHERE id=$1',
            [req.params.id]
        );

        res.send('Asset deleted');
    } catch (err) {
        console.error(err);
        res.status(500).send('Delete error');
    }
});
app.get('/export-assets', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM assets');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Assets');

        worksheet.columns = [
            { header: 'Asset Tag', key: 'asset_tag', width: 20 },
            { header: 'Type', key: 'asset_type', width: 20 },
            { header: 'Brand', key: 'brand', width: 20 },
            { header: 'Model', key: 'model', width: 25 },
            { header: 'Serial Number', key: 'serial_number', width: 25 },
            { header: 'Assigned To', key: 'assigned_to', width: 20 }
        ];

        result.rows.forEach(asset => {
            worksheet.addRow(asset);
        });

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );

        res.setHeader(
            'Content-Disposition',
            'attachment; filename=assets.xlsx'
        );

        await workbook.xlsx.write(res);
        res.end();

    } catch (err) {
        console.error(err);
        res.status(500).send('Export Error');
    }
});

app.post('/login', async (req, res) => {

    const { username, password } = req.body;

    try {

        const result = await pool.query(
            'SELECT * FROM users WHERE username=$1',
            [username]
        );

        if(result.rows.length === 0){
            return res.status(401).send('User not found');
        }

        const user = result.rows[0];

        const validPassword = await bcrypt.compare(
            password,
            user.password
        );

        if(!validPassword){
            return res.status(401).send('Invalid Password');
        }

        const token = jwt.sign(
            {
                id:user.id,
                role:user.role
            },
            process.env.JWT_SECRET,
            { expiresIn:'8h' }
        );

        res.json({
            token,
            role:user.role
        });

    } catch(err){
        console.error(err);
        res.status(500).send('Login Error');
    }
});
app.listen(3000, () => {
    console.log('Server running on port 3000');
});
app.post('/assets', async (req, res) => {
  try {
    const {
      asset_tag,
      asset_type,
      brand,
      model,
      serial_number,
      purchase_date,
      warranty_end,
      status,
      assigned_to
    } = req.body;

    const result = await pool.query(
      `INSERT INTO assets
      (asset_tag, asset_type, brand, model, serial_number,
       purchase_date, warranty_end, status, assigned_to)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *`,
      [
        asset_tag,
        asset_type,
        brand,
        model,
        serial_number,
        purchase_date,
        warranty_end,
        status,
        assigned_to
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error adding asset');
  }
});
