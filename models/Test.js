const mongoose = require('mongoose');

const TestSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true,
        unique: true
    },
    test: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    type: {
        type: String,
        default: null
    },
    name: {
        type: String,
        default: null
    },
    master_test: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    test_id: {
        type: String,
        default: null
    },
    component_id: {
        type: String,
        default: null
    },
    component_name: {
        type: String,
        default: null
    },
    test_group: {
        type: String,
        default: null
    },
    ordering: {
        type: Number,
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('AllTests', TestSchema);
