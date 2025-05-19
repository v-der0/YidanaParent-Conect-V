const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer'); // <-- Added nodemailer
const app = express();
const PORT = 5000;

const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:5500'];
app.use(cors({
  origin: function(origin, callback){
    if(!origin) return callback(null, true);
    if(allowedOrigins.indexOf(origin) === -1){
      return callback(new Error('CORS policy does not allow this origin'), false);
    }
    return callback(null, true);
  }
}));

app.use(express.json());

const mongoURI = 'mongodb+srv://yidana:yidana123@cluster0.m5nne2k.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Nodemailer transporter setup — updated with your Gmail & app password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'yidanavictor@gmail.com',          // Your Gmail here
    pass: 'ptdjqykhctpanyov'                  // Your Gmail app password here (no spaces)
  }
});

// Helper to send ID and PIN email
async function sendIdPinEmail(email, id, pin, fullName) {
  const mailOptions = {
    from: 'yidanavictor@gmail.com',           // same as transporter user
    to: email,
    subject: 'Your Yidana Parents Connect ID and PIN',
    text: `Hello ${fullName},\n\nYour registration was successful!\nYour ID: ${id}\nYour PIN: ${pin}\n\nPlease keep these safe.`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully to', email);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

// ============================
// Schemas
// ============================

// User schema
const userSchema = new mongoose.Schema({
  id: String,
  pin: String,
  role: String,
  fullName: String,
  mobile: String,
  email: String,
  childName: String,
  childClass: String,
  teacherClass: String,
  subjects: String,
});
const User = mongoose.model('User', userSchema);

// Announcement schema
const announcementSchema = new mongoose.Schema({
  message: String,
  senderId: String,
  senderName: String,
  timestamp: { type: Date, default: Date.now }
});
const Announcement = mongoose.model('Announcement', announcementSchema);

// ============================
// Registration
// ============================

function generateId() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
function generatePin() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

app.post('/api/register/:role', async (req, res) => {
  const { role } = req.params;
  const data = req.body;

  if (role !== 'parent' && role !== 'teacher') {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }

  try {
    const id = generateId();
    const pin = generatePin();

    const newUserData = {
      id,
      pin,
      role,
      fullName: data.fullName,
      mobile: data.mobile,
      email: data.email,
    };

    if (role === 'parent') {
      newUserData.childName = data.childName;
      newUserData.childClass = data.childClass;
    } else if (role === 'teacher') {
      newUserData.teacherClass = data.class;
      newUserData.subjects = data.subjects;
    }

    const user = new User(newUserData);
    await user.save();

    // Send ID and PIN by email
    sendIdPinEmail(newUserData.email, id, pin, newUserData.fullName);

    res.json({ success: true, id, pin, message: 'Registration successful' });
  } catch (error) {
    console.error('Error in /api/register:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================
// Login
// ============================

app.post('/api/login', async (req, res) => {
  const { id, pin } = req.body;

  if (!id || !pin) {
    return res.status(400).json({ success: false, message: 'ID and PIN are required.' });
  }

  try {
    const user = await User.findOne({ id, pin });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid ID or PIN.' });
    }

    res.json({
      success: true,
      message: 'Login successful',
      role: user.role,
      fullName: user.fullName,
      id: user.id,
    });
  } catch (error) {
    console.error('Error in /api/login:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================
// Announcements
// ============================

// Post new announcement
app.post('/api/announcements', async (req, res) => {
  const { message, senderId, senderName } = req.body;

  if (!message || !senderId || !senderName) {
    return res.status(400).json({ success: false, message: 'Missing fields' });
  }

  try {
    const newAnnouncement = new Announcement({ message, senderId, senderName });
    await newAnnouncement.save();
    res.json({ success: true, message: 'Announcement posted successfully' });
  } catch (error) {
    console.error('Error in /api/announcements:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get all announcements
app.get('/api/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ timestamp: -1 });
    res.json({ success: true, announcements });
  } catch (error) {
    console.error('Error fetching announcements:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================
// Test Route
// ============================
app.get('/', (req, res) => {
  res.send('Hello from Yidana Parents Connect backend!');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
