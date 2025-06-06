import StudentActivity from '../models/mysql/StudentActivityModel.js';
import { Op } from 'sequelize';

class MySQLService {
    // Student Activity CRUD operations
    async createActivity(activityData) {
        try {
            const activity = await StudentActivity.create(activityData);
            return { success: true, data: activity };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getAllActivities(filters = {}) {
        try {
            const whereClause = {};
            
            if (filters.status) {
                whereClause.status = filters.status;
            }
            
            if (filters.activity_type) {
                whereClause.activity_type = filters.activity_type;
            }
            
            if (filters.user_id) {
                whereClause.user_id = filters.user_id;
            }
            
            if (filters.search) {
                whereClause[Op.or] = [
                    { title: { [Op.like]: `%${filters.search}%` } },
                    { description: { [Op.like]: `%${filters.search}%` } },
                    { organizer: { [Op.like]: `%${filters.search}%` } }
                ];
            }

            const activities = await StudentActivity.findAll({
                where: whereClause,
                order: [['createdAt', 'DESC']],
                limit: filters.limit || 50,
                offset: filters.offset || 0
            });

            return { success: true, data: activities };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getActivityById(id) {
        try {
            const activity = await StudentActivity.findByPk(id);
            if (!activity) {
                return { success: false, error: 'Activity not found' };
            }
            return { success: true, data: activity };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async updateActivity(id, updateData) {
        try {
            const activity = await StudentActivity.findByPk(id);
            if (!activity) {
                return { success: false, error: 'Activity not found' };
            }

            await activity.update(updateData);
            return { success: true, data: activity };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async deleteActivity(id) {
        try {
            const activity = await StudentActivity.findByPk(id);
            if (!activity) {
                return { success: false, error: 'Activity not found' };
            }

            await activity.destroy();
            return { success: true, message: 'Activity deleted successfully' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async approveActivity(id, approverData) {
        try {
            const activity = await StudentActivity.findByPk(id);
            if (!activity) {
                return { success: false, error: 'Activity not found' };
            }

            await activity.update({
                status: 'approved',
                approved_by: approverData.approved_by,
                approved_at: new Date(),
                approval_notes: approverData.approval_notes
            });

            return { success: true, data: activity };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async rejectActivity(id, rejectionData) {
        try {
            const activity = await StudentActivity.findByPk(id);
            if (!activity) {
                return { success: false, error: 'Activity not found' };
            }

            if (activity.status === 'approved') {
                return { success: false, error: 'Cannot reject an already approved activity' };
            }

            await activity.update({
                status: 'rejected',
                rejected_by: rejectionData.rejected_by,
                rejected_at: new Date(),
                rejection_reason: rejectionData.rejection_reason
            });

            return { success: true, data: activity };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async getActivityStats() {
        try {
            const totalActivities = await StudentActivity.count();
            const pendingActivities = await StudentActivity.count({ where: { status: 'pending' } });
            const approvedActivities = await StudentActivity.count({ where: { status: 'approved' } });
            const rejectedActivities = await StudentActivity.count({ where: { status: 'rejected' } });
            const completedActivities = await StudentActivity.count({ where: { status: 'completed' } });

            return {
                success: true,
                data: {
                    total: totalActivities,
                    pending: pendingActivities,
                    approved: approvedActivities,
                    rejected: rejectedActivities,
                    completed: completedActivities
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    
    // New method to check if an activity is approved (for proposal creation)
    async isActivityApproved(activityId) {
        try {
            const activity = await StudentActivity.findByPk(activityId);
            if (!activity) {
                return { success: false, error: 'Activity not found' };
            }
            
            return { 
                success: true, 
                isApproved: activity.status === 'approved',
                activity: activity
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

export default new MySQLService();
