import express from 'express';
import { registerStripeRoutes } from './stripe';
import { registerTranscribeRoutes } from './transcribe';

const app = express();

app.use(express.json({ limit: '15mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

registerStripeRoutes(app);
registerTranscribeRoutes(app);

let devServer: ReturnType<typeof app.listen> | null = null;

export function startDevServer() {
  if (devServer) return devServer;

  const port = Number(process.env.API_PORT || 3001);
  devServer = app.listen(port, () => {
    console.log(`[Yadira API] Listening on port ${port}`);
  });
  return devServer;
}

export default app;
