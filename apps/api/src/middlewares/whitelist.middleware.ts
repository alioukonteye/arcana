import { clerkClient } from '@clerk/clerk-sdk-node';
import { Request, Response, NextFunction } from 'express';

// Whitelist des emails autorisés (chargée depuis les variables d'environnement)
const ALLOWED_EMAILS = (process.env.ALLOWED_EMAILS || '')
  .split(',')
  .map(email => email.trim())
  .filter(email => email.length > 0);

interface AuthenticatedRequest extends Request {
  auth: {
    userId: string | null;
    sessionId: string | null;
    claims: {
      email?: string; // Depends on your session claims configuration
      [key: string]: any;
    } | null;
  };
}

export const WhitelistMiddleware = [
  // 1. Manual Token Verification (Replaces ClerkExpressWithAuth for debugging/control)
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check env var
      if (!process.env.CLERK_SECRET_KEY) {
        console.error('CRITICAL: CLERK_SECRET_KEY missing in Middleware');
        throw new Error('Server misconfiguration: Missing CLERK_SECRET_KEY');
      }

      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('Middleware: Missing or malformed Authorization header');
        res.status(401).json({ error: 'Unauthorized', message: 'Missing Bearer Token' });
        return;
      }

      const token = authHeader.split(' ')[1];

      // Verify token manually using the SDK
      // This uses CLERK_SECRET_KEY from env automatically
      const claims = await clerkClient.verifyToken(token);

      // Populate req.auth to match ClerkExpressWithAuth structure
      (req as unknown as AuthenticatedRequest).auth = {
        userId: claims.sub,
        sessionId: claims.sid || null,
        claims: claims
      };

      // console.log(`Middleware: Token verified for user ${claims.sub}`);
      next();
    } catch (error) {
      console.error('================ AUTH DEBUG ================');
      console.error('Middleware: Token Verification Failed');
      console.error('Error received:', error);
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      // Check for common Clerk errors
      if (typeof error === 'object' && error !== null && 'reason' in error) {
        console.error('Clerk Error Reason:', (error as any).reason);
      }
      console.error('============================================');

      res.status(401).json({
        error: 'Unauthorized',
        message: 'Token verification failed',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  },

  // 2. Check Whitelist
  async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as unknown as AuthenticatedRequest;

    if (!authReq.auth || !authReq.auth.userId) {
      // Should not happen if step 1 passed
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      // Fetch user details from Clerk to get the email
      const user = await clerkClient.users.getUser(authReq.auth.userId);
      const userEmail = user.emailAddresses[0]?.emailAddress;

      if (!userEmail || !ALLOWED_EMAILS.includes(userEmail)) {
        console.warn(`Access blocked for email: ${userEmail}`);
        res.status(403).json({
          error: 'Forbidden',
          message: 'Access restricted to authorized family members only.'
        });
        return;
      }

      // Attach email to request for downstream use
      (req as any).userEmail = userEmail;

      next();
    } catch (error) {
      console.error('Whitelist Check Error:', error);
      res.status(500).json({ error: 'Internal Server Error', details: String(error) });
    }
  }
];
