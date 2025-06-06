import { Sequelize } from "sequelize";
import postgresDb from "../../config/postgresDatabase.js";

const { DataTypes } = Sequelize;

const StudentProposal = postgresDb.define("student_proposal", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    proposal_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    activity_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Foreign key to the approved activity this proposal belongs to'
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    background: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    objectives: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    target_audience: {
        type: DataTypes.STRING,
        allowNull: true
    },
    implementation_plan: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    timeline: {
        type: DataTypes.JSON,
        allowNull: true
    },
    budget_breakdown: {
        type: DataTypes.JSON,
        allowNull: true
    },
    expected_outcomes: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    risk_assessment: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    evaluation_method: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    file_path: {
        type: DataTypes.TEXT, // Changed from STRING to TEXT to allow longer URLs
        allowNull: true,
        comment: 'Signed URL of uploaded PDF file in GCS'
    },
    gcs_filename: {
        type: DataTypes.STRING(500), // Increased length for longer filenames
        allowNull: true,
        comment: 'GCS filename for file management'
    },
    original_filename: {
        type: DataTypes.STRING(500), // Increased length for longer filenames
        allowNull: true,
        comment: 'Original name of uploaded file'
    },
    file_size: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Size of uploaded file in bytes'
    },
    status: {
        type: DataTypes.ENUM('draft', 'submitted', 'approved', 'rejected', 'revision_required'),
        defaultValue: 'draft'
    },
    reviewer_comments: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    reviewed_by: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true
    },
    submitted_at: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    freezeTableName: true,
    timestamps: true
});

export default StudentProposal;
