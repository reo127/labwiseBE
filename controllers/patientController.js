const Patient = require('../models/Patient');
const csvParser = require('csv-parser');
const XLSX = require('xlsx');
const Test = require('../models/Test');
const { Readable } = require('stream');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { processMasterTestCsv, createMasterTests } = require('../utils/processMasterTestCsv');


const UserType = {
  ADULT_MALE: 'ADULT_MALE',
  ADULT_FEMALE: 'ADULT_FEMALE',
  NEWBORN: 'NEWBORN',
  INFANT: 'INFANT',
  TODDLER: 'TODDLER',
  CHILD: 'CHILD',
  ADOLESCENT: 'ADOLESCENT',
  ADOLESCENT_MALE: 'ADOLESCENT_MALE',
  ADOLESCENT_FEMALE: 'ADOLESCENT_FEMALE',
  GERIATRIC: 'GERIATRIC'
};

const CSV_COLUMN_MAPPING = {
  'Test Group': 'testGroup',
  'Test Name': 'testName',
  'Component': 'component',
  'Result Type': 'resultType',
  'Units': 'units',
  'Adult Male Lower Limit': 'adultMaleLow',
  'Adult Male Upper Limit': 'adultMaleHi',
  'Adult Female Lower Limit': 'adultFemaleLow',
  'Adult Female Upper Limit': 'adultFemaleHi',
  'Newborn Lower Limit': 'newbornLow',
  'Newborn Upper Limit': 'newbornHi',
  'Infant Lower Limit': 'infantLow',
  'Infant Upper Limit': 'infantHi',
  'Toddler Lower Limit': 'toddlerLow',
  'Toddler Upper Limit': 'toddlerHi',
  'Child Lower Limit': 'childLow',
  'Child Upper Limit': 'childHi',
  'Adolescent Male Lower Limit': 'adolescentMaleLow',
  'Adolescent Male Upper Limit': 'adolescentMaleHi',
  'Adolescent Female Lower Limit': 'adolescentFemaleLow',
  'Adolescent Female Upper Limit': 'adolescentFemaleHi',
  'Adolescent Lower Limit': 'adolescentLow',
  'Adolescent Upper Limit': 'adolescentHi',
  'Geriatric Lower Limit': 'geriatricLow',
  'Geriatric Upper Limit': 'geriatricHi',
  'Type of Specimen': 'specimenType',
  'Medicine Introduction': 'medicineIntro',
  'Time of Sample Collection': 'sampleCollectionTime',
  'Test Environment Temperature': 'testEnvironmentTemp',
  'Methodology': 'methodology',
  'Patient-Friendly Interpretation': 'patientFriendlyInterpretation',
  'Calculation formulae': 'calculationFormula',
  'Test ID': 'testId',
  'Component ID': 'componentId',
  'Derivation Type': 'derivationType',
  'Ordering': 'ordering'
};

const parseCsvFile = (filePath) => new Promise((resolve, reject) => {
  const results = [];
  fs.createReadStream(filePath)
    .pipe(csv({
      mapHeaders: ({ header }) => CSV_COLUMN_MAPPING[header] || header.toLowerCase().replace(/\s+/g, '_')
    }))
    .on('data', (row) => {
      const cleanedRow = Object.fromEntries(Object.entries(row).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));
      results.push(cleanedRow);
    })
    .on('end', () => {
      fs.unlinkSync(filePath);
      resolve(results);
    })
    .on('error', (err) => {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      reject(err);
    });
});

const addRangeIfValid = (ranges, lower, upper, userType) => {
  if ((lower && lower.trim()) || (upper && upper.trim())) {
    ranges.push({ lowerLimit: lower || '', upperLimit: upper || '', userType });
  }
};

const createReferenceRanges = (record) => {
  const ranges = [];
  addRangeIfValid(ranges, record.adultMaleLow, record.adultMaleHi, UserType.ADULT_MALE);
  addRangeIfValid(ranges, record.adultFemaleLow, record.adultFemaleHi, UserType.ADULT_FEMALE);
  addRangeIfValid(ranges, record.newbornLow, record.newbornHi, UserType.NEWBORN);
  addRangeIfValid(ranges, record.infantLow, record.infantHi, UserType.INFANT);
  addRangeIfValid(ranges, record.toddlerLow, record.toddlerHi, UserType.TODDLER);
  addRangeIfValid(ranges, record.childLow, record.childHi, UserType.CHILD);
  addRangeIfValid(ranges, record.adolescentMaleLow, record.adolescentMaleHi, UserType.ADOLESCENT_MALE);
  addRangeIfValid(ranges, record.adolescentFemaleLow, record.adolescentFemaleHi, UserType.ADOLESCENT_FEMALE);
  addRangeIfValid(ranges, record.adolescentLow, record.adolescentHi, UserType.ADOLESCENT);
  addRangeIfValid(ranges, record.geriatricLow, record.geriatricHi, UserType.GERIATRIC);
  return ranges;
};

const parseTablesMap = (text) => {
  if (!text) return [];
  try {
    return text.startsWith('{') || text.startsWith('[') ? JSON.parse(text) : [];
  } catch {
    return [];
  }
};

const mapCsvRowToTest = (record) => {
  const masterTest = {
    resultType: record.resultType || '',
    units: record.units || '',
    referenceRanges: createReferenceRanges(record),
    specimen: record.specimenType || '',
    intro: record.medicineIntro || '',
    sampleCollectionTime: record.sampleCollectionTime || '',
    testEnvironmentTemp: record.testEnvironmentTemp || '',
    methodology: record.methodology || '',
    calculationFormulae: record.calculationFormula || '',
    testId: record.testId || '',
    componentId: record.componentId || '',
    testGroup: record.testGroup || '',
    componentName: record.component || '',
    derivationType: record.derivationType || '',
    ordering: parseInt(record.ordering) || 0
  };
  const interpretation = parseTablesMap(record.patientFriendlyInterpretation);
  if (interpretation.length > 0) {
    masterTest.interpretation = interpretation;
  } else {
    masterTest.patientFriendlyInterpretation = record.patientFriendlyInterpretation || '';
  }

  return {
    id: uuidv4(),
    name: record.testName || '',
    componentName: record.component || '',
    masterTest,
    testId: record.testId || '',
    componentId: record.componentId || '',
    testGroup: record.testGroup || '',
    ordering: parseInt(record.ordering) || 0
  };
};


const addPatient = async (req, res) => {
    try {
        const {
            sampleId,
            organization,
            register,
            sampleCollected,
            approvedOn,
            name,
            phoneNumber,
            age,
            gender,
            referredBy,
            tests,
            advancePayment,
            advancePaymentMode,
            totalPrice,
            paymentStatus,
            discount
        } = req.body;

        const patient = await Patient.create({
            sampleId,
            organization,
            register,
            sampleCollected,
            approvedOn,
            name,
            phoneNumber,
            age,
            gender,
            referredBy,
            tests,
            advancePayment,
            advancePaymentMode,
            totalPrice,
            paymentStatus,
            discount
        });

        res.status(201).json({
            success: true,
            data: patient
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Get all patients reports
const getAllPatients = async (req, res) => {
    try {
        const patients = await Patient.find().sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            count: patients.length,
            data: patients
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

// Get single patient report by ID
const getPatientById = async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id);

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        res.status(200).json({
            success: true,
            data: patient
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

const uploadTestList = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    if (!req.file.originalname.toLowerCase().endsWith('.csv')) {
      return res.status(400).json({ success: false, message: 'Only CSV files are allowed' });
    }

    // Process the CSV file using our new module
    const tests = await processMasterTestCsv(req.file);
    
    if (!tests.length) {
      return res.status(400).json({ success: false, message: 'No valid test data found in CSV' });
    }

    // Delete all existing tests before inserting new ones
    await Test.deleteMany({});

    // Save the new tests to the database
    await createMasterTests(tests);

    res.json({
      success: true,
      message: `Successfully processed ${tests.length} test records`,
      data: tests.map(({ name, testId, componentName, testGroup }) => ({ 
        name, testId, componentName, testGroup 
      }))
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process CSV file', 
      error: err.message 
    });
  }
};


module.exports = {
    addPatient,
    getAllPatients,
    getPatientById,
    uploadTestList
};