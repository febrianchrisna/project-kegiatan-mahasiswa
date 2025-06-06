import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Validate required environment variables
const requiredVars = ['MYSQL_DB_NAME', 'MYSQL_DB_USERNAME'];
for (const varName of requiredVars) {
    if (!process.env[varName]) {
        console.error(`Missing required environment variable: ${varName}`);
        process.exit(1);
    }
}

const mysqlDb = new Sequelize(
    process.env.MYSQL_DB_NAME, 
    process.env.MYSQL_DB_USERNAME, 
    process.env.MYSQL_DB_PASSWORD || '', 
    {
        host: process.env.MYSQL_DB_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_DB_PORT) || 3306,
        dialect: "mysql",
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

export const syncMySQLDatabase = async () => {
    try {
        console.log(`Connecting to MySQL: ${process.env.MYSQL_DB_USERNAME}@${process.env.MYSQL_DB_HOST}:${process.env.MYSQL_DB_PORT}/${process.env.MYSQL_DB_NAME}`);
        await mysqlDb.authenticate();
        console.log('MySQL connection has been established successfully.');
        
        // FIXED: Use safe sync options
        await mysqlDb.sync({ 
            force: false, // Don't drop tables
            alter: true   // Only alter schema if needed
        });
        console.log('MySQL models (Users & Activities) were synchronized successfully.');
        
        // Log table info for debugging
        const [results] = await mysqlDb.query('SHOW TABLES');
        console.log('MySQL tables:', results.map(r => Object.values(r)[0]));
        
    } catch (error) {
        console.error('Unable to connect to MySQL database:', error.message);
        throw error;
    }
};

export default mysqlDb;
