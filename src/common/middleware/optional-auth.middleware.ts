import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';

export function optionalAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        // Verify and decode the token using the JWT_SECRET from environment
        const decoded = verify(token, process.env.JWT_SECRET || 'fallback-secret');
        
        // Add user to request object
        req['user'] = decoded;
      } catch (error) {
        // Token is invalid, but we continue without authentication
        // This allows the endpoint to work for guest users
        console.log('Invalid JWT token, continuing as guest user');
      }
    }
    
    // Continue to the next middleware/controller
    // User will be undefined if no valid token was provided
    next();
  } catch (error) {
    // Continue even if there's an error
    console.error('Error in optional auth middleware:', error.message);
    next();
  }
} 