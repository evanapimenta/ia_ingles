import app from './app';
import * as dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  GENAI PAST ENGLISH VERBS ASSESSMENT ENGINE   `);
  console.log(`  Server port: http://localhost:${PORT}        `);
  console.log(`  Health Check: http://localhost:${PORT}/health`);
  console.log(`===============================================`);
});
