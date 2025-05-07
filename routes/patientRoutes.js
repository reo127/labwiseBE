const express = require('express');
const router = express.Router();
const { addPatient, getAllPatients, getPatientById } = require('../controllers/patientController');
const { protect } = require('../middleware/authMiddleware');

router.post('/add', addPatient);
router.get('/all', getAllPatients);
router.get('/:id', getPatientById);

module.exports = router;