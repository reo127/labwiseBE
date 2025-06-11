const { Readable } = require('stream');
const csvParser = require('csv-parser');
const { v4: uuidv4 } = require('uuid');
const Test = require('../models/Test');

// Define UserType enum to match Java implementation
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

// CSV column mapping to match Java implementation
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

// CSV header for export
const CSV_HEADER = [
  'Test Name',
  'Component',
  'Result Type',
  'Units',
  'Adult Male Lower Limit',
  'Adult Male Upper Limit',
  'Adult Female Lower Limit',
  'Adult Female Upper Limit',
  'Newborn Lower Limit',
  'Newborn Upper Limit',
  'Infant Lower Limit',
  'Infant Upper Limit',
  'Toddler Lower Limit',
  'Toddler Upper Limit',
  'Child Lower Limit',
  'Child Upper Limit',
  'Adolescent Male Lower Limit',
  'Adolescent Male Upper Limit',
  'Adolescent Female Lower Limit',
  'Adolescent Female Upper Limit',
  'Adolescent Lower Limit',
  'Adolescent Upper Limit',
  'Geriatric Lower Limit',
  'Geriatric Upper Limit',
  'Type of Specimen',
  'Medicine Introduction',
  'Time of Sample Collection',
  'Test Environment Temperature',
  'Methodology',
  'Patient-Friendly Interpretation',
  'Calculation formulae',
  'Test ID',
  'Component ID',
  'Ordering'
];

/**
 * Parse CSV file from buffer
 * @param {Buffer} fileBuffer - The uploaded file buffer
 * @returns {Promise<Array>} - Array of parsed records
 */
const parseCsvFile = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const readableStream = Readable.from(fileBuffer);
    
    readableStream
      .pipe(csvParser({
        mapHeaders: ({ header }) => CSV_COLUMN_MAPPING[header] || header.toLowerCase().replace(/\s+/g, '_')
      }))
      .on('data', (row) => {
        // Clean up row data by trimming string values
        const cleanedRow = Object.fromEntries(
          Object.entries(row).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
        );
        results.push(cleanedRow);
      })
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
};

/**
 * Add a reference range if lower or upper limit is not empty
 * @param {Array} ranges - Array to add the range to
 * @param {String} lower - Lower limit
 * @param {String} upper - Upper limit
 * @param {String} userType - User type from UserType enum
 */
const addRangeIfNotEmpty = (ranges, lower, upper, userType) => {
  if ((lower && lower.trim()) || (upper && upper.trim())) {
    ranges.push({
      lowerLimit: lower || '',
      upperLimit: upper || '',
      userType
    });
  }
};

/**
 * Create reference ranges from record
 * @param {Object} record - CSV record
 * @returns {Array} - Array of reference ranges
 */
const createReferenceRanges = (record) => {
  const ranges = [];
  
  addRangeIfNotEmpty(ranges, record.adultMaleLow, record.adultMaleHi, UserType.ADULT_MALE);
  addRangeIfNotEmpty(ranges, record.adultFemaleLow, record.adultFemaleHi, UserType.ADULT_FEMALE);
  addRangeIfNotEmpty(ranges, record.newbornLow, record.newbornHi, UserType.NEWBORN);
  addRangeIfNotEmpty(ranges, record.infantLow, record.infantHi, UserType.INFANT);
  addRangeIfNotEmpty(ranges, record.toddlerLow, record.toddlerHi, UserType.TODDLER);
  addRangeIfNotEmpty(ranges, record.childLow, record.childHi, UserType.CHILD);
  addRangeIfNotEmpty(ranges, record.adolescentMaleLow, record.adolescentMaleHi, UserType.ADOLESCENT_MALE);
  addRangeIfNotEmpty(ranges, record.adolescentFemaleLow, record.adolescentFemaleHi, UserType.ADOLESCENT_FEMALE);
  addRangeIfNotEmpty(ranges, record.adolescentLow, record.adolescentHi, UserType.ADOLESCENT);
  addRangeIfNotEmpty(ranges, record.geriatricLow, record.geriatricHi, UserType.GERIATRIC);
  
  return ranges;
};

/**
 * Parse tables map from text
 * @param {String} text - Text to parse
 * @returns {Array} - Array of parsed tables or empty array
 */
const parseTablesMap = (text) => {
  if (!text) return [];
  try {
    return text.startsWith('{') || text.startsWith('[') ? JSON.parse(text) : [];
  } catch {
    return [];
  }
};

/**
 * Map CSV row to Test object
 * @param {Object} record - CSV record
 * @returns {Object} - Test object
 */
const mapToTest = (record) => {
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
  
  // Handle patient-friendly interpretation
  const tables = parseTablesMap(record.patientFriendlyInterpretation);
  if (tables.length > 0) {
    masterTest.interpretation = tables;
  } else {
    masterTest.patientFriendlyInterpretation = record.patientFriendlyInterpretation || '';
  }

  // Map to schema field names
  return {
    id: uuidv4(),
    name: record.testName || '',
    component_name: record.component || '',
    master_test: masterTest,
    test_id: record.testId || '',
    component_id: record.componentId || '',
    test_group: record.testGroup || '',
    ordering: parseInt(record.ordering) || 0,
    type: record.resultType || ''
  };
};

/**
 * Process master test CSV file
 * @param {Object} file - Uploaded file object
 * @returns {Promise<Array>} - Array of Test objects
 */
const processMasterTestCsv = async (file) => {
  try {
    const records = await parseCsvFile(file.buffer);
    return records.map(mapToTest);
  } catch (error) {
    throw new Error(`Failed to parse CSV file: ${error.message}`);
  }
};

/**
 * Create master tests in database
 * @param {Array} testList - Array of Test objects
 * @returns {Promise<void>}
 */
const createMasterTests = async (testList) => {
  // Generate component IDs for tests without one
  testList.forEach(test => {
    if (!test.componentId?.trim()) {
      test.componentId = uuidv4();
    }
  });

  // Group tests by name for assigning test IDs
  const groupedTests = new Map();
  testList.forEach(test => {
    if (!test.testId?.trim()) {
      const key = test.name.trim().toLowerCase();
      if (!groupedTests.has(key)) groupedTests.set(key, []);
      groupedTests.get(key).push(test);
    }
  });

  // Get existing tests to reuse test IDs
  const testNames = [...groupedTests.keys()];
  const existingTests = await Test.find({ name: { $in: testNames.map(name => new RegExp(name, 'i')) } });
  const testNameToId = new Map(existingTests.map(test => [test.name.toLowerCase(), test.testId]));

  // Assign test IDs
  groupedTests.forEach((tests, key) => {
    const testId = testNameToId.get(key) || uuidv4();
    tests.forEach(test => test.testId = testId);
  });

  // Bulk write operations
  const bulkOps = testList.map(test => ({
    updateOne: {
      filter: { id: test.id },
      update: { $set: test },
      upsert: true
    }
  }));

  await Test.bulkWrite(bulkOps);
  return testList;
};

/**
 * Convert Test objects to CSV format
 * @param {Array} testList - Array of Test objects
 * @returns {String} - CSV string
 */
const convertToCsv = (testList) => {
  // Convert tests to CSV records
  const records = testList.map(test => {
    const masterTest = test.masterTest;
    const record = {
      testName: test.name || '',
      component: test.componentName || '',
      resultType: masterTest.resultType || '',
      units: masterTest.units || '',
      specimenType: masterTest.specimen || '',
      medicineIntro: masterTest.intro || '',
      sampleCollectionTime: masterTest.sampleCollectionTime || '',
      testEnvironmentTemp: masterTest.testEnvironmentTemp || '',
      methodology: masterTest.methodology || '',
      calculationFormula: masterTest.calculationFormulae || '',
      testId: test.testId || '',
      componentId: test.componentId || '',
      testGroup: test.testGroup || '',
      derivationType: masterTest.derivationType || '',
      ordering: masterTest.ordering || 0,
      patientFriendlyInterpretation: masterTest.patientFriendlyInterpretation || ''
    };
    
    // Set reference ranges
    if (masterTest.referenceRanges && Array.isArray(masterTest.referenceRanges)) {
      masterTest.referenceRanges.forEach(range => {
        switch (range.userType) {
          case UserType.ADULT_MALE:
            record.adultMaleLow = range.lowerLimit || '';
            record.adultMaleHi = range.upperLimit || '';
            break;
          case UserType.ADULT_FEMALE:
            record.adultFemaleLow = range.lowerLimit || '';
            record.adultFemaleHi = range.upperLimit || '';
            break;
          case UserType.NEWBORN:
            record.newbornLow = range.lowerLimit || '';
            record.newbornHi = range.upperLimit || '';
            break;
          case UserType.INFANT:
            record.infantLow = range.lowerLimit || '';
            record.infantHi = range.upperLimit || '';
            break;
          case UserType.TODDLER:
            record.toddlerLow = range.lowerLimit || '';
            record.toddlerHi = range.upperLimit || '';
            break;
          case UserType.CHILD:
            record.childLow = range.lowerLimit || '';
            record.childHi = range.upperLimit || '';
            break;
          case UserType.ADOLESCENT:
            record.adolescentLow = range.lowerLimit || '';
            record.adolescentHi = range.upperLimit || '';
            break;
          case UserType.GERIATRIC:
            record.geriatricLow = range.lowerLimit || '';
            record.geriatricHi = range.upperLimit || '';
            break;
          case UserType.ADOLESCENT_MALE:
            record.adolescentMaleLow = range.lowerLimit || '';
            record.adolescentMaleHi = range.upperLimit || '';
            break;
          case UserType.ADOLESCENT_FEMALE:
            record.adolescentFemaleLow = range.lowerLimit || '';
            record.adolescentFemaleHi = range.upperLimit || '';
            break;
        }
      });
    }
    
    return record;
  });
  
  // Convert records to CSV
  const csvRows = [];
  
  // Add header row
  csvRows.push(CSV_HEADER.join(','));
  
  // Add data rows
  records.forEach(record => {
    const row = CSV_HEADER.map(header => {
      const field = CSV_COLUMN_MAPPING[header];
      const value = record[field] || '';
      // Escape commas and quotes
      return typeof value === 'string' && (value.includes(',') || value.includes('"')) 
        ? `"${value.replace(/"/g, '""')}"` 
        : value;
    });
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
};

module.exports = {
  processMasterTestCsv,
  createMasterTests,
  convertToCsv,
  UserType,
  CSV_HEADER
};