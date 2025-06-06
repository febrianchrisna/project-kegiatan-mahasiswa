import jwt from "jsonwebtoken";
import User from "../models/UserModel.js";

export const verifyToken = (req, res, next) => {
    // Get token from Authorization header or query parameter (for file downloads)
    let token = req.headers.authorization;
    
    if (!token && req.query.token) {
        // For file downloads, token might be in query parameter
        token = `Bearer ${req.query.token}`;
    }
    
    if (!token) {
        return res.status(401).json({
            status: 'error',
            message: 'Access denied. No token provided.'
        });
    }

    // Remove 'Bearer ' prefix if present
    if (token.startsWith('Bearer ')) {
        token = token.slice(7);
    }

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.userId = decoded.id;
        req.userEmail = decoded.email;
        req.userRole = decoded.role;
        req.username = decoded.username;
        next();
    } catch (error) {
        return res.status(403).json({
            status: 'error',
            message: 'Invalid token.'
        });
    }
};

export const isAdmin = async (req, res, next) => {
  try {
    // Cari user dari database jika belum ada role di req
    let userRole = req.userRole;
    if (!userRole) {
      const user = await User.findByPk(req.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      userRole = user.role;
      req.userRole = user.role;
    }

    if (userRole !== 'admin') {
      return res.status(403).json({ message: "Requires admin privileges" });
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Middleware to check if user is user/student (not admin)
export const isUser = async (req, res, next) => {
  try {
    let userRole = req.userRole;
    if (!userRole) {
      const user = await User.findByPk(req.userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      userRole = user.role;
      req.userRole = user.role;
    }

    if (userRole !== 'user') {
      return res.status(403).json({ message: "Requires user privileges" });
    }

    next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Middleware to check if user is either admin or the owner of the resource
export const isAdminOrOwner = (resourceUserIdField = 'user_id') => {
  return async (req, res, next) => {
    try {
      let userRole = req.userRole;
      if (!userRole) {
        const user = await User.findByPk(req.userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }
        userRole = user.role;
        req.userRole = user.role;
      }

      // Admin can access everything
      if (userRole === 'admin') {
        return next();
      }

      // For non-admin users, check if they own the resource
      // This will be used in controllers to verify ownership
      req.isOwnershipRequired = true;
      next();
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Server error" });
    }
  };
};
