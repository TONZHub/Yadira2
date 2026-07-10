import app from './src/server/index';
import dotenv from 'dotenv';

dotenv.config();

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`[Yadira Full-Stack Server] Listening on port ${port}`);
});
