const { register, login } = require('../services/authService');

const registerUser = async (req, res, next) => {
  try {
    const user = await register(req.body);
    res.status(201).json({ success: true, message: 'User registered successfully', data: user });
  } catch (err) {
    next(err);
  }
};

const loginUser = async (req, res, next) => {
  try {
    const result = await login(req.body);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res) => {
  const { id, name, email, role, created_at } = req.user;
  res.status(200).json({ success: true, data: { id, name, email, role, created_at } });
};

module.exports = { registerUser, loginUser, getMe };
