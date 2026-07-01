const User = require('../models/User');
const Trainer = require('../models/Trainer');
const Admin = require('../models/Admin');
const Otp = require('../models/Otp');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

// Render's free tier blocks outbound traffic on SMTP ports (25/465/587), so direct
// SMTP (e.g. nodemailer + Gmail) can never connect from there. Brevo's HTTP API sends
// over plain HTTPS instead, which isn't blocked.
const sendViaBrevo = async ({ to, subject, text, html }) => {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { name: 'Fitness Manager', email: process.env.EMAIL_USER.trim() },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Brevo API error ${response.status}: ${body}`);
  }
};

exports.sendOtp = async (req, res) => {
  const email = req.body.email?.toLowerCase().trim();
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const code = String(Math.floor(100000 + Math.random() * 900000));

    await Otp.deleteMany({ email });
    await Otp.create({ email, code });

    const emailConfigured =
      process.env.BREVO_API_KEY &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_USER !== 'your_gmail@gmail.com';

    if (emailConfigured) {
      await sendViaBrevo({
        to: email,
        subject: `${code} is your Fitness Manager verification code`,
        text: `Your Fitness Manager verification code is: ${code}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\nIf you did not request this, please ignore this email.`,
        html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;padding:40px 32px;">
        <tr><td style="padding-bottom:24px;border-bottom:1px solid #f1f5f9;">
          <p style="margin:0;font-size:20px;font-weight:700;color:#0f172a;">Fitness Manager</p>
          <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">Email Verification</p>
        </td></tr>
        <tr><td style="padding:28px 0 20px;">
          <p style="margin:0 0 8px;font-size:15px;color:#475569;">Hi there,</p>
          <p style="margin:0 0 24px;font-size:15px;color:#475569;">Use the code below to complete your registration. It expires in <strong>10 minutes</strong>.</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;padding:20px;">
              <span style="font-size:36px;font-weight:900;letter-spacing:10px;color:#0f172a;">${code}</span>
            </td></tr>
          </table>
          <p style="margin:20px 0 0;font-size:13px;color:#94a3b8;">If you did not request this code, you can safely ignore this email.</p>
        </td></tr>
        <tr><td style="border-top:1px solid #f1f5f9;padding-top:20px;">
          <p style="margin:0;font-size:12px;color:#cbd5e1;">This is an automated message from Fitness Manager. Please do not reply.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
      });
      console.log(`OTP sent via email to ${email}`);
    } else {
      // Dev fallback — print OTP to terminal when email is not configured
      console.log(`\n========================================`);
      console.log(`  OTP for ${email}: ${code}`);
      console.log(`========================================\n`);
    }

    res.json({ message: 'OTP sent' });
  } catch (error) {
    console.error('OTP send error:', error.message);
    res.status(500).json({ message: 'Failed to send OTP. Check email configuration.' });
  }
};

exports.registerUser = async (req, res) => {
  const { name, password, role, trainerCode, otp } = req.body;
  const email = req.body.email?.toLowerCase().trim();
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }
    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const record = await Otp.findOne({ email });
    if (!record) {
      return res.status(400).json({ message: 'OTP expired or not requested. Please request a new one.' });
    }
    if (record.code !== String(otp).trim()) {
      return res.status(400).json({ message: 'Invalid OTP. Please check and try again.' });
    }
    await Otp.deleteMany({ email });

    if (role === 'trainer') {
      if (trainerCode !== '9989') {
        return res.status(400).json({ message: 'Invalid trainer sign up code' });
      }
      const trainerExists = await Trainer.findOne({ email });
      if (trainerExists) {
        return res.status(400).json({ message: 'Trainer already exists with this email' });
      }
      const trainer = await Trainer.create({ name, email, password });
      return res.status(201).json({
        _id: trainer._id,
        name: trainer.name,
        email: trainer.email,
        role: trainer.role,
        token: generateToken(trainer._id),
      });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const user = await User.create({ name, email, password, role, isVerified: true });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(500).json({ message: error.message || 'Server error during registration' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, dateOfBirth, gender, heightCm, weightKg, fitnessGoal, activityLevel, dietType, allergies, fitnessNotes } = req.body;
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (name)                       user.name          = name.trim();
    if (dateOfBirth)                user.dateOfBirth   = new Date(dateOfBirth);
    if (gender)                     user.gender        = gender;
    if (heightCm)                   user.heightCm      = Number(heightCm);
    if (weightKg)                   user.weightKg      = Number(weightKg);
    if (fitnessGoal)                user.fitnessGoal   = fitnessGoal;
    if (activityLevel)              user.activityLevel = activityLevel;
    if (dietType)                   user.dietType      = dietType;
    if (allergies    !== undefined)  user.allergies    = allergies;
    if (fitnessNotes !== undefined)  user.fitnessNotes = fitnessNotes;
    await user.save();
    res.json({ message: 'Profile updated', user: { ...user.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update profile' });
  }
};

exports.authUser = async (req, res) => {
  const { email: rawEmail, password } = req.body;
  const email = rawEmail?.toLowerCase().trim();
  try {
    let account = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (!account) account = await Trainer.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (!account) account = await Admin.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });

    if (!account || !(await bcrypt.compare(password, account.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (account.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked by admin' });
    }

    if (account.role === 'trainer' && !account.isVerified) {
      return res.status(403).json({ message: 'Your account is pending admin approval' });
    }

    let firstLogin = false;
    if (account.role === 'user' && account.firstLogin) {
      firstLogin = true;
      account.firstLogin = false;
      await account.save();
    }

    res.json({ _id: account._id, name: account.name, email: account.email, role: account.role, firstLogin, token: generateToken(account._id) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
