const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'smart_clinic'
  });

  const [rows] = await connection.execute('SELECT id, doctor_id, patient_id, schedule_id, status, visit_type, expected_time FROM appointments ORDER BY id DESC LIMIT 5');
  console.log(JSON.stringify(rows, null, 2));
  
  await connection.end();
}

main().catch(console.error);
