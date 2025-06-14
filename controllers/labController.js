const Lab = require('../models/Lab');
const { v4: uuidv4 } = require('uuid');

const addLabTests = (req, res) => {
    try {
        console.log("File received:", req.file.originalname);
        console.log("File buffer:", req.body);
        const {local_id, head_id, name, address, pin_code, poc, phone_number, email, tests, sign_url, password, plan, amount_lost, amount_pending, lab_tests} = req.body;
        const lab = Lab.create({
            id: uuidv4(),
            local_id,
            head_id,
            name,
            address,
            pin_code,
            poc,
            phone_number,
            email,
            tests: [],
            lab_tests: [],
            sign_url,
            password,
            plan,
            amount_lost,
            amount_pending,
            
        });
        return res.status(200).json({
            success: true,
            message: "controller was working",
            data: lab
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
            error: error
        });
    }
}

module.exports = {
    addLabTests
}
