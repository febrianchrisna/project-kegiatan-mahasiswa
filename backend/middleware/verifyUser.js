// Middleware to verify user permissions

export const verifyUser = (req, res, next) => {
    console.log('=== VERIFY USER MIDDLEWARE ===');
    console.log('User ID:', req.userId);
    console.log('User Role:', req.userRole);
    
    if (!req.userId) {
        return res.status(401).json({
            status: 'error',
            message: 'Authentication required'
        });
    }
    
    next();
};

export const adminOnly = (req, res, next) => {
    console.log('=== ADMIN ONLY MIDDLEWARE ===');
    console.log('User Role:', req.userRole);
    
    if (req.userRole !== 'admin') {
        return res.status(403).json({
            status: 'error',
            message: 'Admin access required'
        });
    }
    
    next();
};

export const userOrAdmin = (req, res, next) => {
    console.log('=== USER OR ADMIN MIDDLEWARE ===');
    console.log('User Role:', req.userRole);
    
    if (req.userRole !== 'user' && req.userRole !== 'admin') {
        return res.status(403).json({
            status: 'error',
            message: 'User or admin access required'
        });
    }
    
    next();
};

// Middleware to check if user can access their own resources or if admin
export const ownResourceOrAdmin = (resourceIdParam = 'id') => {
    return (req, res, next) => {
        console.log('=== OWN RESOURCE OR ADMIN MIDDLEWARE ===');
        console.log('User ID:', req.userId);
        console.log('Resource ID:', req.params[resourceIdParam]);
        console.log('User Role:', req.userRole);
        
        const resourceId = parseInt(req.params[resourceIdParam]);
        
        if (req.userRole === 'admin' || req.userId === resourceId) {
            next();
        } else {
            return res.status(403).json({
                status: 'error',
                message: 'Access denied. You can only access your own resources.'
            });
        }
    };
};
