import { ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import { Request, Response, NextFunction } from 'express';

// Whitelist des emails autorisés
const ALLOWED_EMAILS = [
  'aliou.konteye@gmail.com',
  'yourlittlenini@gmail.com'
];

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
  // 1. Verify Clerk Token
  ClerkExpressWithAuth(),

  // 2. Check Whitelist
  async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as unknown as AuthenticatedRequest;

    if (!authReq.auth.userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      // Fetch user details from Clerk to get the email
      // Note: In optimal setup, email should be in session claims to avoid API call
      // verifying session claims or fetching user
      // For now, we will use the unexpected simplicity: we trust the client to have authenticated via Clerk,
      // but strictly we should verify the email match.

      // However, ClerkExpressWithAuth doesn't populate the email directly in req.auth unless configured in session tokens.
      // Let's rely on the fact that we can get the user via the SDK if needed, BUT
      // for performance and simplicity in this specific project, let's use the clerk client to fetch user
      // OR inspect the token if available.

      // Better approach for Node.js integration:
      // The `req.auth` object contains limited info.
      // Let's use the `clerkClient` to fetch the user's email.
      const clerk = require('@clerk/clerk-sdk-node').clerkClient;
      const user = await clerk.users.getUser(authReq.auth.userId);
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
      console.error('Clerk Middleware Error:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
];
