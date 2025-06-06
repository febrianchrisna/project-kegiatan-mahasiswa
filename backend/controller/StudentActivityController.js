import MySQLService from '../services/MySQLService.js';

// Get all activities
export const getAllActivities = async (req, res) => {
    try {
        const filters = {
            status: req.query.status,
            activity_type: req.query.activity_type,
            search: req.query.search,
            limit: parseInt(req.query.limit) || 50,
            offset: parseInt(req.query.offset) || 0
        };

        // If not admin, only show user's own activities
        if (req.userRole !== 'admin') {
            filters.user_id = req.userId;
        }

        const result = await MySQLService.getAllActivities(filters);

        if (result.success) {
            res.status(200).json({
                status: 'success',
                data: result.data
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get activity by ID
export const getActivityById = async (req, res) => {
    try {
        const result = await MySQLService.getActivityById(req.params.id);

        if (result.success) {
            // Check if user can access this activity
            if (req.userRole !== 'admin' && result.data.user_id !== req.userId) {
                return res.status(403).json({
                    status: 'error',
                    message: 'Not authorized to view this activity'
                });
            }

            res.status(200).json({
                status: 'success',
                data: result.data
            });
        } else {
            res.status(404).json({
                status: 'error',
                message: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Create new activity
export const createActivity = async (req, res) => {
    try {
        const activityData = {
            ...req.body,
            user_id: req.userId
        };

        const result = await MySQLService.createActivity(activityData);

        if (result.success) {
            res.status(201).json({
                status: 'success',
                message: 'Activity created successfully',
                data: result.data
            });
        } else {
            res.status(400).json({
                status: 'error',
                message: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Update activity
export const updateActivity = async (req, res) => {
    try {
        const activityId = req.params.id;
        
        // Check if activity exists and user has permission
        const checkResult = await MySQLService.getActivityById(activityId);
        if (!checkResult.success) {
            return res.status(404).json({
                status: 'error',
                message: checkResult.error
            });
        }

        if (req.userRole !== 'admin' && checkResult.data.user_id !== req.userId) {
            return res.status(403).json({
                status: 'error',
                message: 'Not authorized to update this activity'
            });
        }

        const result = await MySQLService.updateActivity(activityId, req.body);

        if (result.success) {
            res.status(200).json({
                status: 'success',
                message: 'Activity updated successfully',
                data: result.data
            });
        } else {
            res.status(400).json({
                status: 'error',
                message: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Delete activity
export const deleteActivity = async (req, res) => {
    try {
        const activityId = req.params.id;
        
        // Check if activity exists and user has permission
        const checkResult = await MySQLService.getActivityById(activityId);
        if (!checkResult.success) {
            return res.status(404).json({
                status: 'error',
                message: checkResult.error
            });
        }

        if (req.userRole !== 'admin' && checkResult.data.user_id !== req.userId) {
            return res.status(403).json({
                status: 'error',
                message: 'Not authorized to delete this activity'
            });
        }

        const result = await MySQLService.deleteActivity(activityId);

        if (result.success) {
            res.status(200).json({
                status: 'success',
                message: result.message
            });
        } else {
            res.status(400).json({
                status: 'error',
                message: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Approve activity (admin only)
export const approveActivity = async (req, res) => {
    try {
        const activityId = req.params.id;
        const approverData = {
            approved_by: req.userId,
            approval_notes: req.body.approval_notes
        };

        const result = await MySQLService.approveActivity(activityId, approverData);

        if (result.success) {
            res.status(200).json({
                status: 'success',
                message: 'Activity approved successfully',
                data: result.data
            });
        } else {
            res.status(400).json({
                status: 'error',
                message: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Reject activity (admin only)
export const rejectActivity = async (req, res) => {
    try {
        const activityId = req.params.id;
        const rejectionData = {
            rejected_by: req.userId,
            rejection_reason: req.body.rejection_reason
        };

        const result = await MySQLService.rejectActivity(activityId, rejectionData);

        if (result.success) {
            res.status(200).json({
                status: 'success',
                message: 'Activity rejected successfully',
                data: result.data
            });
        } else {
            res.status(400).json({
                status: 'error',
                message: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};

// Get activity statistics
export const getActivityStats = async (req, res) => {
    try {
        const result = await MySQLService.getActivityStats();

        if (result.success) {
            res.status(200).json({
                status: 'success',
                data: result.data
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: result.error
            });
        }
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
};
