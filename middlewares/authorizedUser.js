

// import jwt from 'jsonwebtoken';
// import User from '../models/User.js'; // Use .js extension for relative path

// export const authenticateUser = async (req, res, next) => {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//         return res.status(401).json({
//             success: false,
//             message: "Authentication failed: No token provided."
//         });
//     }

//     try {
//         const token = authHeader.split(" ")[1];
        
//         // Verify the token using your secret key
//         const decoded = jwt.verify(token, process.env.SECRET);
        
//         // Find the user from the token's payload, excluding the password
//         const user = await User.findById(decoded._id).select("-password");

//         if (!user) {
//             return res.status(401).json({
//                 success: false,
//                 message: "Authentication failed: User associated with this token no longer exists."
//             });
//         }

//         // Attach the user object to the request for the next middleware/controller
//         req.user = user;
//         next();

//     } catch (err) {
//         // Log the specific error on the server for debugging purposes
//         console.error("Authentication Error:", err.message);

//         // Send a clear 401 Unauthorized error to the client
//         return res.status(401).json({
//             success: false,
//             message: `Authentication failed: ${err.message}. Please try logging in again.`
//         });
//     }
// };

// export const isAdmin = (req, res, next) => {
//     // This middleware runs *after* authenticateUser, so req.user is available
//     if (req.user && req.user.role === 'admin') {
//         next();
//     } else {
//         return res.status(403).json({ // 403 Forbidden is the correct code for insufficient permissions
//             success: false,
//             message: "Access denied: Admin privileges are required."
//         });
//     }
// };

// // Note: The `export default` has been removed and `export` is now used for each function.



import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticateUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ success: false, message: "Authentication failed: No token provided." });
    }

    try {
        const token = authHeader.split(" ")[1];
        
        // Ensure the SECRET is loaded before verifying
        if (!process.env.SECRET) {
            throw new Error('JWT Secret is not defined. Cannot verify token.');
        }

        const decoded = jwt.verify(token, process.env.SECRET);
        const user = await User.findById(decoded._id).select("-password");

        if (!user) {
            return res.status(401).json({ success: false, message: "Authentication failed: User not found." });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error("Authentication Error:", err.message);
        return res.status(401).json({ success: false, message: `Authentication failed: ${err.message}. Please try logging in again.` });
    }
};

export const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({ success: false, message: "Access denied: Admin privileges are required." });
    }
};