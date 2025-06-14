const mongoose = require('mongoose');

const LabSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    local_id: {
        type: String,
        required: true
    },
    head_id: {
        type: String,
        default: null
    },
    name: {
        type: String,
        default: null
    },
    address: {
        type: String,
        default: null
    },
    pin_code: {
        type: String,
        default: null
    },
    poc: {
        type: String,
        default: null
    },
    plan: {
        type: String,
        default: null
    },
    tests: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    amount_lost: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    amount_pending: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    sign_url: {
        type: String,
        default: null
    },
    lab_tests: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    password: {
        type: String,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('Lab', LabSchema); 