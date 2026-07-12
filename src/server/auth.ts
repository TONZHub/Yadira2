import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: { uid: string; email?: string };
  token?: string;
}

/**
 * Middleware to verify Firebase JWT token.
 * Extracts token from Authorization header and attaches user to request.
 * If Firebase is not configured, allows requests through (for local development).
 */
export const authMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Keep key demo paths resilient even if one browser tab temporarily loses auth state.
    // Mounted under /api, so req.path values are like "/shared-mode" and "/tts".
    // /drift-mode carries only a boolean and is polled without auth headers by
    // both surfaces — without this exemption its cross-device sync silently 401s.
    if (req.path === '/shared-mode' || req.path === '/tts' || req.path === '/drift-mode') {
      return next();
    }

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.warn('[Yadira Auth] Missing or invalid Authorization header');
      return res.status(401).json({ error: 'Unauthorized: missing token' });
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    try {
      // Decode JWT manually (simple approach without firebase-admin)
      // In production, use firebase-admin for server-side verification
      const decoded = decodeJWT(token);
      const resolvedUid = decoded?.uid || decoded?.user_id || decoded?.sub;
      if (!decoded || !resolvedUid) {
        console.warn('[Yadira Auth] Invalid token structure');
        return res.status(401).json({ error: 'Unauthorized: invalid token' });
      }

      req.user = { uid: resolvedUid, email: decoded.email };
      req.token = token;
      next();
    } catch (err: any) {
      console.warn('[Yadira Auth] Token verification failed:', err.message);
      return res.status(401).json({ error: 'Unauthorized: invalid token' });
    }
  } catch (err: any) {
    console.error('[Yadira Auth] Middleware error:', err);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

/**
 * Simple JWT decoder (parses without verification).
 * In production, use firebase-admin for full verification.
 */
function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Decode payload (second part)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
    return payload;
  } catch {
    return null;
  }
}

/**
 * Optional middleware for routes that don't require auth.
 * Attempts to extract user info if token present, doesn't fail if missing.
 */
export const optionalAuthMiddleware = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = decodeJWT(token);
      const resolvedUid = decoded?.uid || decoded?.user_id || decoded?.sub;
      if (decoded && resolvedUid) {
        req.user = { uid: resolvedUid, email: decoded.email };
        req.token = token;
      }
    }
  } catch (err) {
    // Silently ignore auth errors for optional middleware
  }
  next();
};
