const Patient = require('../models/Patient');

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

module.exports = {
    addPatient,
    getAllPatients,
    getPatientById
};