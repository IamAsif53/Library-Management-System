// src/Backend/Server/Routes/userRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../Models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'replace_me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/* ----------------- Signup (create user) ----------------- */
router.post('/', async (req, res) => {
  try {
    let { name, email, password, phone, department, regNo } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    email = String(email).trim().toLowerCase();
    name = String(name).trim();
    phone = phone ? String(phone).trim() : undefined;
    department = department ? String(department).trim() : undefined;
    regNo = regNo ? String(regNo).trim() : undefined;

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const hashed = await bcrypt.hash(password, 10);

    const saved = await User.create({
      name,
      email,
      password: hashed,
      phone,
      department,
      regNo,
    });

    return res.status(201).json({
      _id: saved._id,
      name: saved.name,
      email: saved.email,
      department: saved.department,
      regNo: saved.regNo,
      createdAt: saved.createdAt,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

/* ----------------- Login (returns JWT + user) ----------------- */
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    email = String(email).toLowerCase().trim();

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // 🔥 INCLUDE ROLE IN JWT
    const payload = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    return res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role, // 🔥 REQUIRED
        department: user.department,
        regNo: user.regNo,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

/* ----------------- Auth middleware (FIXED) ----------------- */
async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Authorization token missing' });

    let payload;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // 🔥 FORCE ROLE TO BE INCLUDED
    const user = await User.findById(payload.id).select('-password');
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
}

/* ----------------- Protected routes ----------------- */
router.get('/me', auth, async (req, res) => {
  try {
    return res.json({ user: req.user });
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const list = await User.find().select('-password role').sort({ createdAt: -1 });
    return res.json(list);
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const entry = await User.findById(req.params.id).select('-password role');
    if (!entry) return res.status(404).json({ error: 'User not found' });
    return res.json(entry);
  } catch (err) {
    return res.status(500).json({ error: 'Server error', details: err.message });
  }
});

module.exports = router;
