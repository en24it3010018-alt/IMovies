import { Router } from 'express';
import { db, Theatre } from '../db.js';
import { authenticateToken, requireAdmin } from '../auth.js';

const router = Router();

// GET all theatres
router.get('/', (req, res) => {
  const { city } = req.query;
  let list = db.theatres;
  if (city && typeof city === 'string' && city !== 'All') {
    list = list.filter(t => t.city.toLowerCase() === city.toLowerCase());
  }
  return res.json({ success: true, theatres: list });
});

// GET theatre by ID
router.get('/:id', (req, res) => {
  const theatre = db.theatres.find(t => t.id === req.params.id);
  if (!theatre) {
    return res.status(404).json({ success: false, message: 'Theatre not found' });
  }
  return res.json({ success: true, theatre });
});

// ADMIN: Add theatre
router.post('/', authenticateToken, requireAdmin, (req, res) => {
  const { name, city, address, facilities, screens } = req.body;
  if (!name || !city || !address) {
    return res.status(400).json({ success: false, message: 'Name, city, and address are required' });
  }

  const newTheatre: Theatre = {
    id: `th-${Date.now()}`,
    name,
    city,
    address,
    totalScreens: screens ? screens.length : 1,
    facilities: facilities || ['Dolby Atmos', 'Recliner Seats', 'Concessions Bar'],
    screens: screens || [
      {
        id: `scr-${Date.now()}`,
        name: 'Screen 1',
        format: 'Dolby Atmos',
        rows: ['A', 'B', 'C', 'D', 'E', 'F'],
        columns: 12,
        totalSeats: 72
      }
    ]
  };

  db.theatres.push(newTheatre);
  return res.status(201).json({ success: true, theatre: newTheatre });
});

export default router;
