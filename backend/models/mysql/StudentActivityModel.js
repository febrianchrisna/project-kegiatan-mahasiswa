import { Sequelize } from "sequelize";
import mysqlDb from "../../config/mysqlDatabase.js";

const { DataTypes } = Sequelize;

const StudentActivity = mysqlDb.define("student_activity", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    activity_type: {
        type: DataTypes.ENUM('academic', 'non_academic', 'competition', 'community_service', 'seminar', 'workshop'),
        allowNull: false
    },
    organizer: {
        type: DataTypes.STRING,
        allowNull: false
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false
    },
    start_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    end_date: {
        type: DataTypes.DATE,
        allowNull: false
    },
    budget_needed: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
    },
    participant_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
        defaultValue: 'pending'
    },
    approval_notes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    approved_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    approved_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    rejected_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    rejected_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    freezeTableName: true,
    timestamps: true
});

export default StudentActivity;
