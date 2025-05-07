const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    sub: {
        type: String,
        required: true
    }
});

const patientSchema = new mongoose.Schema({
    sampleId: {
        type: String,
        required: true,
        unique: true
    },
    organization: {
        type: String,
        required: true
    },
    register: {
        type: Date,
        required: true
    },
    sampleCollected: {
        type: Date,
        required: true
    },
    approvedOn: {
        type: Date,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    gender: {
        type: String,
        required: true,
        enum: ['male', 'female', 'other']
    },
    referredBy: {
        type: String,
        required: true
    },
    tests: [testSchema],
    createdAt: {
        type: Date,
        default: Date.now
    },
    advancePayment: {
        type: Number,
        required: true
    },
    advancePaymentMode: {
        type: String,
        required: true,
        enum: ['cash', 'card', 'upi']
    },
    totalPrice: {
        type: Number,
        required: true
    },
    paymentStatus: {
        type: String,
        required: true,
        enum: ['pending', 'partial', 'completed'],
        default: 'pending'
    },
    discount: {
        type: Number,
        default: 0
    }
});

const Patient = mongoose.model('Patient', patientSchema);
module.exports = Patient;