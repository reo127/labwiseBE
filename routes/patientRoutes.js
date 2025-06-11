const express = require('express');
const router = express.Router();
const multer = require('multer');
const { addPatient, getAllPatients, getPatientById, uploadTestList, uploadAllTests } = require('../controllers/patientController');

// Use memory storage so the file is not saved to disk
const storage = multer.memoryStorage();
// const upload = multer({ storage });
const upload = multer({ storage: multer.memoryStorage() }); 

router.post('/add', addPatient);
router.get('/all', getAllPatients);
router.get('/:id', getPatientById);

// File will be available as buffer (not saved to disk)
router.post('/addAllTests', upload.single('file'), uploadTestList);

module.exports = router;