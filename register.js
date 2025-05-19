const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const Parent = require('../models/Parent');
const Teacher = require('../models/Teacher');

// Generate ID and PIN
const generateIdAndPin = () => {
  const id = 'YPC' + Math.floor(100000 + Math.random() * 900000);
  const pin = Math.floor(1000 + Math.random() * 9000).toString();
  return { id, pin };
};

// Gmail email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'yidanavictor@gmail.com',
    pass: 'ptdjqykhctpanyov' // Gmail app password (no spaces)
  }
});

// Function to send login credentials via email
const sendCredentialsEmail = (to, role, id, pin) => {
  const subject = `Welcome to YIDANA PARENT CONECT - Your ${role} Login Credentials`;
  const text = `
Hi ${role},

Thank you for registering on YIDANA PARENT CONECT.

Here are your login credentials:

🔐 ID: ${id}
🔑 PIN: ${pin}

Use them to access your dashboard at any time. Keep this information safe and confidential.

Warm regards,  
YIDANA PARENT CONECT Team
  `;

  return transporter.sendMail({
    from: 'yidanavictor@gmail.com',
    to,
    subject,
    text
  });
};

// ✅ Parent Registration Route
router.post('/register/parent', async (req, res) => {
  const { fullName, mobile, email, childName, childClass } = req.body;
  const { id, pin } = generateIdAndPin();

  try {
    const parent = new Parent({ id, pin, fullName, mobile, email, childName, childClass });
    await parent.save();

    await sendCredentialsEmail(email, 'Parent', id, pin);

    res.json({ success: true, id, pin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

// ✅ Teacher Registration Route
router.post('/register/teacher', async (req, res) => {
  const { fullName, class: teachingClass, mobile, email, subjects } = req.body;
  const { id, pin } = generateIdAndPin();

  try {
    const teacher = new Teacher({ id, pin, fullName, class: teachingClass, mobile, email, subjects });
    await teacher.save();

    await sendCredentialsEmail(email, 'Teacher', id, pin);

    res.json({ success: true, id, pin });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
});

module.exports = router;
