const { Parser } = require('json2csv');
const PDFDocument = require('pdfkit');
const { pool } = require('../config/db');
const { error } = require('../utils/response');

const REPORT_QUERIES = {
  donations: `SELECT d.id, u.name as donor_name, d.type, d.status, d.donation_date, h.hospital_name, bb.bank_name
              FROM donations d JOIN donor_profiles dp ON dp.id = d.donor_id JOIN users u ON u.id = dp.user_id
              LEFT JOIN hospitals h ON h.id = d.hospital_id LEFT JOIN blood_banks bb ON bb.id = d.blood_bank_id
              ORDER BY d.created_at DESC`,
  blood_requests: `SELECT br.id, u.name as recipient_name, br.blood_group, br.units_needed, br.urgency, br.status, br.created_at
                    FROM blood_requests br JOIN recipient_profiles rp ON rp.id = br.recipient_id JOIN users u ON u.id = rp.user_id
                    ORDER BY br.created_at DESC`,
  organ_requests: `SELECT o.id, u.name as recipient_name, o.organ_type, o.urgency, o.status, o.created_at
                    FROM organ_requests o JOIN recipient_profiles rp ON rp.id = o.recipient_id JOIN users u ON u.id = rp.user_id
                    ORDER BY o.created_at DESC`,
  inventory: `SELECT bb.bank_name, bi.blood_group, bi.units_available, bi.updated_at
              FROM blood_inventory bi JOIN blood_banks bb ON bb.id = bi.blood_bank_id
              ORDER BY bb.bank_name, bi.blood_group`,
  hospitals: `SELECT hospital_name, license_number, city, state, is_verified, created_at FROM hospitals`,
  blood_banks: `SELECT bank_name, license_number, city, state, is_verified, created_at FROM blood_banks`,
  users: `SELECT id, name, email, role, is_active, created_at FROM users`,
};

const REPORT_TITLES = {
  donations: 'Donations Report',
  blood_requests: 'Blood Requests Report',
  organ_requests: 'Organ Requests Report',
  inventory: 'Blood Inventory Report',
  hospitals: 'Hospitals Report',
  blood_banks: 'Blood Banks Report',
  users: 'User Activity Report',
};

// GET /api/reports/:type?format=csv|pdf
async function generateReport(req, res, next) {
  try {
    const { type } = req.params;
    const { format = 'csv' } = req.query;

    if (!REPORT_QUERIES[type]) return error(res, 'Unknown report type', 400);

    const [rows] = await pool.query(REPORT_QUERIES[type]);

    if (format === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-report.pdf`);

      const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
      doc.pipe(res);

      doc.fontSize(18).text(REPORT_TITLES[type] || 'Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(9).fillColor('gray').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(1.5);

      if (!rows.length) {
        doc.fontSize(11).fillColor('black').text('No data available.');
      } else {
        const columns = Object.keys(rows[0]);
        const colWidth = (doc.page.width - 80) / columns.length;

        doc.fontSize(9).fillColor('white');
        let x = 40;
        const headerY = doc.y;
        doc.rect(40, headerY, doc.page.width - 80, 18).fill('#b91c1c');
        doc.fillColor('white');
        columns.forEach((col) => {
          doc.text(col.replace(/_/g, ' ').toUpperCase(), x + 4, headerY + 4, { width: colWidth - 8 });
          x += colWidth;
        });
        doc.moveDown(1.2);

        doc.fillColor('black').fontSize(8);
        rows.forEach((row, i) => {
          if (doc.y > doc.page.height - 60) doc.addPage({ size: 'A4', layout: 'landscape' });
          let rowX = 40;
          const rowY = doc.y;
          if (i % 2 === 0) doc.rect(40, rowY, doc.page.width - 80, 16).fill('#f3f4f6').fillColor('black');
          columns.forEach((col) => {
            const val = row[col] === null || row[col] === undefined ? '-' : String(row[col]);
            doc.text(val, rowX + 4, rowY + 3, { width: colWidth - 8, ellipsis: true });
            rowX += colWidth;
          });
          doc.moveDown(1);
        });
      }

      doc.end();
      return;
    }

    // default CSV
    const parser = new Parser();
    const csv = parser.parse(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}-report.csv`);
    return res.send(csv);
  } catch (err) {
    next(err);
  }
}

module.exports = { generateReport };
