import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { adminOnly } from '../middleware/verifyUser.js';

// Import controllers
import { 
  login, 
  logout, 
  getUser, 
  register 
} from '../controller/UserController.js';

import {
  registerStudent,
  registerAdmin,
  login as authLogin,
  logout as authLogout,
  getProfile,
  updateProfile,
  changePassword
} from '../controller/AuthController.js';

import {
  getAllActivities,
  getActivityById,
  createActivity,
  updateActivity,
  deleteActivity,
  getActivityStats,
  approveActivity,
  rejectActivity
} from '../controller/StudentActivityController.js';

import {
  getAllProposals,
  getProposalById,
  createProposal,
  updateProposal,
  deleteProposal,
  uploadProposal,
  updateProposalFile,
  downloadProposal,
  downloadProposalPublic,
  submitProposal,
  reviewProposal,
  getProposalStats
} from '../controller/StudentProposalController.js';

const router = express.Router();

// Authentication routes
router.post('/auth/login', authLogin);
router.post('/auth/register/student', registerStudent);
router.post('/auth/register/admin', registerAdmin);
router.post('/auth/register/public', registerStudent); // Use same as student for public
router.post('/auth/logout', authLogout);
router.get('/auth/profile', authenticateToken, getProfile);
router.put('/auth/profile', authenticateToken, updateProfile);
router.put('/auth/change-password', authenticateToken, changePassword);

// Legacy user routes (keep for backward compatibility)
router.get('/users', getUser);
router.post('/users', register);
router.post('/login', login);
router.delete('/logout', logout);

// Student Activities routes
router.get('/activities', authenticateToken, getAllActivities);
router.get('/activities/:id', authenticateToken, getActivityById);
router.post('/activities', authenticateToken, createActivity);
router.put('/activities/:id', authenticateToken, updateActivity);
router.delete('/activities/:id', authenticateToken, deleteActivity);

// Admin routes for activities
router.get('/admin/activities', authenticateToken, adminOnly, getAllActivities);
router.get('/admin/activities/stats', authenticateToken, adminOnly, getActivityStats);
router.put('/admin/activities/:id/approve', authenticateToken, adminOnly, approveActivity);
router.put('/admin/activities/:id/reject', authenticateToken, adminOnly, rejectActivity);

// Student Proposals routes
router.get('/proposals', authenticateToken, getAllProposals);
router.get('/proposals/:id', authenticateToken, getProposalById);
router.post('/proposals', authenticateToken, createProposal);
router.put('/proposals/:id', authenticateToken, updateProposal);
router.delete('/proposals/:id', authenticateToken, deleteProposal);
router.post('/proposals/upload', authenticateToken, uploadProposal);
router.put('/proposals/:id/upload', authenticateToken, updateProposalFile);
router.put('/proposals/:id/submit', authenticateToken, submitProposal);

// Download routes - with flexible authentication
router.get('/proposals/:id/download', (req, res, next) => {
  // Set CORS headers immediately
  const origin = req.headers.origin || 'http://localhost:3000';
  res.set({
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
    'Access-Control-Expose-Headers': 'Content-Disposition, Content-Length, Content-Type, Cache-Control, X-Filename',
    'Vary': 'Origin'
  });
  
  // Check if token is provided
  const hasToken = req.headers.authorization || req.query.token;
  
  if (hasToken) {
    // If token provided, authenticate first
    authenticateToken(req, res, (error) => {
      if (error) {
        // If auth fails, still allow download but as public
        req.userId = null;
        req.userRole = 'public';
      }
      downloadProposal(req, res);
    });
  } else {
    // No token, public download
    req.userId = null;
    req.userRole = 'public';
    downloadProposal(req, res);
  }
});

// Public download route (no authentication required)
router.get('/public/proposals/:id/download', downloadProposalPublic);

// Admin routes for proposals
router.get('/admin/proposals', authenticateToken, adminOnly, getAllProposals);
router.get('/admin/proposals/stats', authenticateToken, adminOnly, getProposalStats);
router.put('/admin/proposals/:id/review', authenticateToken, adminOnly, reviewProposal);

// Admin routes for users
router.get('/admin/users', authenticateToken, adminOnly, getUser);

// Debug routes (only in development)
if (process.env.NODE_ENV === 'development') {
  router.get('/debug/proposals/count', async (req, res) => {
    try {
      const { default: PostgreSQLService } = await import('../services/PostgreSQLService.js');
      const result = await PostgreSQLService.getAllProposals();
      res.json({
        status: 'success',
        count: result.success ? result.data.length : 0,
        data: result.success ? result.data.map(p => ({
          id: p.id,
          title: p.title,
          status: p.status,
          createdAt: p.createdAt
        })) : [],
        error: result.success ? null : result.error
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  });

  router.get('/debug/activities/count', async (req, res) => {
    try {
      const { default: MySQLService } = await import('../services/MySQLService.js');
      const result = await MySQLService.getAllActivities();
      res.json({
        status: 'success',
        count: result.success ? result.data.length : 0,
        data: result.success ? result.data.map(a => ({
          id: a.id,
          title: a.title,
          status: a.status,
          createdAt: a.createdAt
        })) : [],
        error: result.success ? null : result.error
      });
    } catch (error) {
      res.status(500).json({
        status: 'error',
        message: error.message
      });
    }
  });
}

export default router;
