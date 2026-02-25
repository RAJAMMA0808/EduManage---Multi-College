// server/src/db.ts
import { Pool } from 'pg';
import 'dotenv/config'; // Load environment variables from .env file

// The database connection now uses environment variables.
// Create a file named ".env" in the "server/" directory and add your credentials like this:
//
// DB_USER=your_postgres_username
// DB_HOST=localhost
// DB_DATABASE=edumanage_db
// DB_PASSWORD=your_postgres_password
// DB_PORT=5432
//
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'edumanage_db',
  password: process.env.DB_PASSWORD || 'Raji0808@',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});

export default pool;