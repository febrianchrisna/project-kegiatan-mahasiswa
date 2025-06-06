import { Sequelize } from "sequelize";
import mysqlDb from "../config/mysqlDatabase.js";

const { DataTypes } = Sequelize;

const User = mysqlDb.define("user", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('admin', 'user'),
        defaultValue: 'user'
    },
    refresh_token: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    student_id: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    faculty: {
        type: DataTypes.STRING,
        allowNull: true
    },
    major: {
        type: DataTypes.STRING,
        allowNull: true
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    freezeTableName: true,
    timestamps: true
});

export default User;