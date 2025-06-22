

// import User from "../models/User.js";
// import bcrypt from "bcrypt";
// import jwt from "jsonwebtoken";
// // No longer need to import cloudinary

// // registerUser and loginUser functions remain the same as the previous response...
// // Make sure they include 'profilePicture' in the returned userData.

// export const registerUser = async (req, res) => {
//     const { email, fullName, password } = req.body;
//     if (!email || !fullName || !password) {
//         return res.status(400).json({ success: false, message: "Please fill all fields." });
//     }
//     try {
//         const existingUser = await User.findOne({ email });
//         if (existingUser) {
//             return res.status(400).json({ success: false, message: "User with this email already exists." });
//         }
//         const hashedPassword = await bcrypt.hash(password, 10);
//         const newUser = new User({ email, fullName, password: hashedPassword });
//         await newUser.save();
//         const userData = { _id: newUser._id, fullName: newUser.fullName, email: newUser.email, role: newUser.role, profilePicture: newUser.profilePicture };
//         return res.status(201).json({ success: true, message: "User registered successfully.", data: userData });
//     } catch (e) {
//         console.error("Registration Error:", e);
//         return res.status(500).json({ success: false, message: "Server error during registration." });
//     }
// };

// export const loginUser = async (req, res) => {
//   try {
//     const { email, password } = req.body;
//     if (!email || !password) {
//       return res.status(400).json({ success: false, message: 'Email and password are required.' });
//     }

//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(401).json({ success: false, message: 'Invalid email or password.' });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(401).json({ success: false, message: 'Invalid email or password.' });
//     }
    
//     if (!process.env.SECRET) {
//         throw new Error('JWT Secret is not defined in the .env file.');
//     }

//     const token = jwt.sign({ _id: user._id, role: user.role }, process.env.SECRET, { expiresIn: '1d' });
//     const userData = { _id: user._id, fullName: user.fullName, email: user.email, role: user.role, profilePicture: user.profilePicture };
//     res.status(200).json({ success: true, data: userData, token });
//   } catch (error) {
//     console.error('Login error:', error);
//     res.status(500).json({ success: false, message: 'Server error during login.' });
//   }
// };

// export const getUserProfile = async (req, res) => {
//     try {
//         const user = await User.findById(req.user._id).select('-password');
//         if (!user) {
//             return res.status(404).json({ success: false, message: 'User not found' });
//         }
//         res.status(200).json({ success: true, data: user });
//     } catch (error) {
//         console.error("Get Profile Error:", error);
//         res.status(500).json({ success: false, message: 'Server error while fetching profile' });
//     }
// };

// // --- THIS IS THE UPDATED FUNCTION ---
// export const updateUserProfilePicture = async (req, res) => {
//     if (!req.file) {
//         return res.status(400).json({ success: false, message: "No file uploaded." });
//     }

//     try {
//         const user = await User.findById(req.user._id);
//         if (!user) {
//             return res.status(404).json({ success: false, message: "User not found." });
//         }

//         // Construct the URL path to be saved.
//         // req.file.path is something like "public/images/profile-pictures/filename.jpg"
//         // We want to save "/images/profile-pictures/filename.jpg"
//         const imageUrl = `/images/profile-pictures/${req.file.filename}`;
        
//         user.profilePicture = imageUrl;
//         await user.save();

//         const userData = {
//             _id: user._id,
//             fullName: user.fullName,
//             email: user.email,
//             role: user.role,
//             profilePicture: user.profilePicture,
//             createdAt: user.createdAt
//         };

//         res.status(200).json({
//             success: true,
//             message: "Profile picture updated successfully.",
//             data: userData
//         });

//     } catch (error) {
//         console.error("Profile picture update error:", error);
//         res.status(500).json({ success: false, message: "Server error during file update." });
//     }
// };



import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// registerUser and loginUser functions remain the same as the previous response...
// Make sure they include 'profilePicture' in the returned userData.

export const registerUser = async (req, res) => {
    const { email, fullName, password } = req.body;
    if (!email || !fullName || !password) {
        return res.status(400).json({ success: false, message: "Please fill all fields." });
    }
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User with this email already exists." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, fullName, password: hashedPassword });
        await newUser.save();

        // --- FIX ---
        // Add `createdAt` to the response data. Mongoose adds this field automatically.
        const userData = { 
            _id: newUser._id, 
            fullName: newUser.fullName, 
            email: newUser.email, 
            role: newUser.role, 
            profilePicture: newUser.profilePicture,
            createdAt: newUser.createdAt // <-- ADD THIS LINE
        };

        return res.status(201).json({ success: true, message: "User registered successfully.", data: userData });
    } catch (e) {
        console.error("Registration Error:", e);
        return res.status(500).json({ success: false, message: "Server error during registration." });
    }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    
    if (!process.env.SECRET) {
        throw new Error('JWT Secret is not defined in the .env file.');
    }

    const token = jwt.sign({ _id: user._id, role: user.role }, process.env.SECRET, { expiresIn: '1d' });
    
    // --- FIX ---
    // Add `createdAt` to the response data.
    const userData = { 
        _id: user._id, 
        fullName: user.fullName, 
        email: user.email, 
        role: user.role, 
        profilePicture: user.profilePicture,
        createdAt: user.createdAt // <-- ADD THIS LINE
    };

    res.status(200).json({ success: true, data: userData, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

export const getUserProfile = async (req, res) => {
    try {
        // This function is already correct as .select('-password') includes all other fields.
        const user = await User.findById(req.user._id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        console.error("Get Profile Error:", error);
        res.status(500).json({ success: false, message: 'Server error while fetching profile' });
    }
};

// This function is already correct and will not be harmed by the changes.
export const updateUserProfilePicture = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded." });
    }

    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const imageUrl = `/images/profile-pictures/${req.file.filename}`;
        
        user.profilePicture = imageUrl;
        await user.save();

        const userData = {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            profilePicture: user.profilePicture,
            createdAt: user.createdAt // This was already correctly included.
        };

        res.status(200).json({
            success: true,
            message: "Profile picture updated successfully.",
            data: userData
        });

    } catch (error) {
        console.error("Profile picture update error:", error);
        res.status(500).json({ success: false, message: "Server error during file update." });
    }
};