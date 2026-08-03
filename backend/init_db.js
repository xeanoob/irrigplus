const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function initDB() {
    if (!process.env.DATABASE_URL) {
        
        const client = new Client({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: 'postgres',
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
        });

        try {
            await client.connect();
            const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = '${process.env.DB_NAME}'`);
            if (res.rowCount === 0) {
                console.log(`Creating database ${process.env.DB_NAME}...`);
                await client.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
            } else {
                console.log(`Database ${process.env.DB_NAME} already exists.`);
            }
        } catch (err) {
            console.error('Error checking/creating database:', err);
        } finally {
            await client.end();
        }
    }

    const poolConfig = process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        }
        : {
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
        };

    
    const pool = new Client(poolConfig);

    try {
        await pool.connect();
        const schemaPath = path.join(__dirname, 'database.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        console.log('Running schema...');
        await pool.query(schema);
        console.log('Database initialized successfully.');
    } catch (err) {
        console.error('Error initializing schema:', err);
    } finally {
        await pool.end();
    }
}

initDB();
