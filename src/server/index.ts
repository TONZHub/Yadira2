import express from 'express';
const app = express();

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

app.listen(8080, () => {
  console.log('server listening on 8080');
});
