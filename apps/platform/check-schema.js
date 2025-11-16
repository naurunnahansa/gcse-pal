const postgres = require('postgres');
require('dotenv').config({ path: '.env.local' });

const client = postgres(process.env.DATABASE_URL);

async function checkSchema() {
  try {
    const result = await client`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'courses'
      ORDER BY ordinal_position
    `;
    console.log('Courses table columns:');
    result.forEach(col => console.log(`- ${col.column_name}: ${col.data_type}`));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkSchema();