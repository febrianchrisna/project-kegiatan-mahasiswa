// Import models
import User from './UserModel.js';
import StudentActivity from './mysql/StudentActivityModel.js';
import StudentProposal from './postgres/StudentProposalModel.js';

// Define User and Activity associations
User.hasMany(StudentActivity, { foreignKey: 'user_id' });
StudentActivity.belongsTo(User, { foreignKey: 'user_id' });

// Define approval relationships
User.hasMany(StudentActivity, { foreignKey: 'approved_by', as: 'ApprovedActivities' });
StudentActivity.belongsTo(User, { foreignKey: 'approved_by', as: 'Approver' });

User.hasMany(StudentActivity, { foreignKey: 'rejected_by', as: 'RejectedActivities' });
StudentActivity.belongsTo(User, { foreignKey: 'rejected_by', as: 'Rejector' });

// Note: Since PostgreSQL and MySQL are separate databases, we can't define 
// foreign key constraints between them in the ORM, but we'll manage the 
// relationship in our application logic.

console.log('Model associations loaded');
