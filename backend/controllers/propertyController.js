const pool = require('../config/db');

const getAllProperties = async (req, res) => {
	try {
		const result = await pool.query('SELECT * FROM properties');
		res.json(result.rows);
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
};

const addProperty = async (req, res) => {
	try {
		const { owner, location, area } = req.body;
		const result = await pool.query(
			'INSERT INTO properties (owner, location, area) VALUES ($1, $2, $3) RETURNING *',
			[owner, location, area]
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
