import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

// Validate required environment variables
const requiredVars = ['POSTGRES_DB_NAME', 'POSTGRES_DB_USERNAME', 'POSTGRES_DB_PASSWORD'];
for (const varName of requiredVars) {
    if (!process.env[varName]) {
        console.error(`Missing required environment variable: ${varName}`);
        process.exit(1);
    }
}

const postgresDb = new Sequelize(
    process.env.POSTGRES_DB_NAME, 
    process.env.POSTGRES_DB_USERNAME, 
    process.env.POSTGRES_DB_PASSWORD, 
    {
        host: process.env.POSTGRES_DB_HOST,
        port: parseInt(process.env.POSTGRES_DB_PORT) || 5432,
        dialect: "postgres",
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

export const syncPostgresDatabase = async () => {
  try {
    console.log('Connecting to PostgreSQL database...');
    console.log(`Host: ${process.env.POSTGRES_DB_HOST}:${process.env.POSTGRES_DB_PORT}`);
    console.log(`Database: ${process.env.POSTGRES_DB_NAME}`);
    console.log(`User: ${process.env.POSTGRES_DB_USERNAME}`);
    
    await postgresDb.authenticate();
    console.log('PostgreSQL connection established successfully.');
    
    // FIXED: Don't use force sync to preserve data
    // Only use alter to update schema without losing data
    await postgresDb.sync({ 
      force: false, // NEVER use force: true in any environment to preserve data
      alter: true   // Use alter to update schema safely
    });
    
    console.log('PostgreSQL database synchronized (data preserved).');
    
    // Log table info for debugging
    const [results] = await postgresDb.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('PostgreSQL tables:', results.map(r => r.table_name));
    
  } catch (error) {
    console.error('Unable to connect to PostgreSQL database:', error);
    throw error;
  }
};

export default postgresDb;
