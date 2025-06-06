import jwt from 'jsonwebtoken';

// Middleware to authenticate user based on JWT
export const authenticateToken = (req, res, next) => {
    console.log('=== AUTH MIDDLEWARE START ===');
    console.log('Request URL:', req.url);
    console.log('Request Method:', req.method);
    console.log('Authorization Header:', req.headers.authorization ? 'Present' : 'Missing');
    console.log('Query Token:', req.query.token ? 'Present' : 'Missing');
    
    // Set CORS headers immediately at the start of auth middleware
    const origin = req.headers.origin || 'http://localhost:3000';
    res.set({
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
        'Access-Control-Expose-Headers': 'Content-Disposition, Content-Length, Content-Type, Cache-Control, X-Filename'
    });
    
    // Get token from header or query parameter (for downloads)
    let token = req.headers.authorization?.split(' ')[1]; // Bearer token
    
    // If no token in header, check query parameter (for form submissions)
    if (!token && req.query.token) {
        token = req.query.token;
        console.log('Using token from query parameter');
    }
    
    if (!token) {
        console.log('No token found in header or query parameter');
        return res.status(401).json({
            status: 'error',
            message: 'Access token required'
        });
    }

    try {
        // Use the correct JWT secret based on your .env file
        const jwtSecret = process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET;
        
        if (!jwtSecret) {
            console.error('JWT_SECRET or ACCESS_TOKEN_SECRET not configured');
            return res.status(500).json({
                status: 'error',
                message: 'Server configuration error'
            });
        }
        
        console.log('Attempting to verify token with secret...');
        const decoded = jwt.verify(token, jwtSecret);
        
        // Handle different token structures
        req.userId = decoded.userId || decoded.id;
        req.userRole = decoded.role;
        req.userEmail = decoded.email;
        
        console.log('Token verified successfully for user:', {
            userId: req.userId,
            role: req.userRole,
            email: req.userEmail
        });
        
        if (!req.userId) {
            console.error('Token decoded but no userId found:', decoded);
            return res.status(401).json({
                status: 'error',
                message: 'Invalid token structure'
            });
        }
        
        console.log('=== AUTH MIDDLEWARE SUCCESS ===');
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        console.error('Token type:', typeof token);
        console.error('Token length:', token?.length);
        
        let errorMessage = 'Invalid or expired token';
        if (error.name === 'TokenExpiredError') {
            errorMessage = 'Token has expired';
        } else if (error.name === 'JsonWebTokenError') {
            errorMessage = 'Invalid token format';
        }
        
        return res.status(403).json({
            status: 'error',
            message: errorMessage
        });
    }
};