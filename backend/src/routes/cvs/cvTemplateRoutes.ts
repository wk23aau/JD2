import express from 'express';
import pool from '../../db';
// No protect middleware needed if templates are public

const router = express.Router();

// GET /api/cv-templates - Get all available CV templates
router.get('/', async (req, res) => {
    try {
        const [templates] = await pool.query('SELECT id, name, description, preview_image_url FROM cv_templates ORDER BY name ASC');
        res.json(templates);
    } catch (error) {
        console.error('Get CV templates error:', error);
        res.status(500).json({ message: 'Server error while fetching CV templates' });
    }
});

export default router;
