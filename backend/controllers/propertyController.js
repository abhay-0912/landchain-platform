const pool = require('../config/db');

const getAllProperties = async (req, res) => {
	try {
		const result = await pool.query('SELECT * FROM properties ORDER BY created_at DESC');
		res.json(result.rows);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const addProperty = async (req, res) => {
	try {
		const {
			owner,
			location,
			area,
			aadhaar,
			property_id,
			state,
			district,
			village,
			property_type,
			survey_number,
			document_url,
		} = req.body;
		const result = await pool.query(
			'INSERT INTO properties (owner, location, area, aadhaar, property_id, state, district, village, property_type, survey_number, document_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
			[owner, location, area, aadhaar, property_id, state, district, village, property_type, survey_number, document_url]
		);
		res.status(201).json(result.rows[0]);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

module.exports = {
	getAllProperties,
	addProperty,
};
