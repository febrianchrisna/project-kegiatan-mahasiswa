import User from '../models/UserModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Register new user with student information
export const registerStudent = async (req, res) => {
  try {
    const { 
      email, 
      username, 
      password, 
      student_id, 
      faculty, 
      major, 
      phone,
      role = 'user' 
    } = req.body;
    
    // Validate required fields for student
    if (!email || !username || !password || !student_id || !faculty || !major) {
      return res.status(400).json({ 
        status: "Error", 
        message: "Email, username, password, student ID, faculty, and major are required" 
      });
    }
    
    // Check if user with this email already exists
    const existingUser = await User.findOne({
      where: { email: email }
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        status: "Error", 
        message: "Email already registered" 
      });
    }

    // Check if student ID already exists
    const existingStudentId = await User.findOne({
      where: { student_id: student_id }
    });
    
    if (existingStudentId) {
      return res.status(400).json({ 
        status: "Error", 
        message: "Student ID already registered" 
      });
    }
    
    // Hash the password
    const encryptPassword = await bcrypt.hash(password, 10);
    
    // Create new user
    const newUser = await User.create({
      email,
      username,
      password: encryptPassword,
      role,
      student_id,
      faculty,
      major,
      phone,
      refresh_token: null
    });
    
    // Return success but don't include password in response
    const { password: _, refresh_token: __, ...userWithoutPassword } = newUser.toJSON();
    
    res.status(201).json({
      status: "Success",
      message: "Student registration successful",
      data: userWithoutPassword
    });
    
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ 
      status: "Error", 
      message: error.message 
    });
  }
};

// Register admin
export const registerAdmin = async (req, res) => {
  try {
    const { email, username, password, phone } = req.body;
    
    // Check if user with this email already exists
    const existingUser = await User.findOne({
      where: { email: email }
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        status: "Error", 
        message: "Email already registered" 
      });
    }
    
    // Hash the password
    const encryptPassword = await bcrypt.hash(password, 10);
    
    // Create new admin
    const newAdmin = await User.create({
      email,
      username,
      password: encryptPassword,
      role: 'admin',
      phone,
      refresh_token: null
    });
    
    // Return success but don't include password in response
    const { password: _, refresh_token: __, ...adminWithoutPassword } = newAdmin.toJSON();
    
    res.status(201).json({
      status: "Success",
      message: "Admin registration successful",
      data: adminWithoutPassword
    });
    
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ 
      status: "Error", 
      message: error.message 
    });
  }
};

// Enhanced login with role-based response
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email: email }
    });

    if (!user) {
      return res.status(400).json({
        status: "Error",
        message: "Email or password incorrect"
      });
    }

    const decryptPassword = await bcrypt.compare(password, user.password);

    if (!decryptPassword) {
      return res.status(400).json({
        status: "Error",
        message: "Email or password incorrect"
      });
    }

    const userPlain = user.toJSON();
    const { password: _, refresh_token: __, ...safeUserData } = userPlain;

    // Create access token with user info
    const accessToken = jwt.sign(
      safeUserData,
      process.env.ACCESS_TOKEN_SECRET,
      { expiresIn: "30m" }
    );

    // Create refresh token
    const refreshToken = jwt.sign(
      safeUserData,
      process.env.REFRESH_TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    // Update user's refresh token
    await User.update(
      { refresh_token: refreshToken },
      { where: { id: user.id } }
    );

    // Set refresh token as httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      secure: process.env.NODE_ENV === 'production'
    });

    res.status(200).json({
      status: "Success",
      message: "Login successful",
      data: {
        user: safeUserData,
        accessToken,
        permissions: getRolePermissions(user.role)
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "Error",
      message: error.message
    });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['password', 'refresh_token'] }
    });

    if (!user) {
      return res.status(404).json({
        status: "Error",
        message: "User not found"
      });
    }

    res.status(200).json({
      status: "Success",
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "Error",
      message: error.message
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { username, phone, faculty, major } = req.body;
    
    const user = await User.findByPk(req.userId);
    
    if (!user) {
      return res.status(404).json({
        status: "Error",
        message: "User not found"
      });
    }

    const updateData = {};
    if (username) updateData.username = username;
    if (phone) updateData.phone = phone;
    
    // Only allow faculty/major updates for non-admin users
    if (user.role !== 'admin') {
      if (faculty) updateData.faculty = faculty;
      if (major) updateData.major = major;
    }

    await user.update(updateData);

    const { password: _, refresh_token: __, ...userWithoutPassword } = user.toJSON();

    res.status(200).json({
      status: "Success",
      message: "Profile updated successfully",
      data: userWithoutPassword
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "Error",
      message: error.message
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: "Error",
        message: "Current password and new password are required"
      });
    }

    const user = await User.findByPk(req.userId);
    
    if (!user) {
      return res.status(404).json({
        status: "Error",
        message: "User not found"
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        status: "Error",
        message: "Current password is incorrect"
      });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    
    await user.update({ password: hashedNewPassword });

    res.status(200).json({
      status: "Success",
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "Error",
      message: error.message
    });
  }
};

// Helper function to get role permissions
const getRolePermissions = (role) => {
  const permissions = {
    admin: [
      'view_all_activities',
      'approve_activities',
      'view_all_proposals',
      'review_proposals',
      'manage_users',
      'view_statistics'
    ],
    user: [
      'create_activities',
      'view_own_activities',
      'edit_own_activities',
      'create_proposals',
      'view_own_proposals',
      'edit_own_proposals',
      'submit_proposals'
    ],
    customer: [
      'view_products',
      'create_orders',
      'view_own_orders'
    ]
  };

  return permissions[role] || [];
};

export const logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) return res.sendStatus(204);

  const user = await User.findOne({
    where: { refresh_token: refreshToken }
  });

  if (!user) return res.sendStatus(204);

  await User.update(
    { refresh_token: null },
    { where: { id: user.id } }
  );

  res.clearCookie("refreshToken");
  return res.status(200).json({
    status: "Success",
    message: "Logout successful"
  });
};
