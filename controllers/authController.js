const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// Register User
const registerUser = async (req, res) => {
    try {
        const { labId, name, email, password, role, gender, phone_number } = req.body;

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            labId,
            name,
            email,
            password,
            role,
            gender,
            phone_number
        });

        if (user) {
            const token = generateToken(user._id);

            res.cookie('jwt', token, {
                httpOnly: true,
                // secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });

            res.status(201).json({
                _id: user._id,
                labId: user.labId,
                name: user.name,
                email: user.email,
                role: user.role,
                gender: user.gender,
                phone_number: user.phone_number
            });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Login User
// http://localhost:800/api/auth/login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            const token = generateToken(user._id, email, user.labId);

            res.cookie('jwt', token, {
                httpOnly: true,
                // secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
            });

            res.json({
                _id: user._id,
                labId: user.labId,
                name: user.name,
                email: user.email,
                role: user.role,
                gender: user.gender,
                phone_number: user.phone_number,
                token
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser
};