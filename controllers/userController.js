import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const registerUser = async (req, res) => {
    const { email, fullName, password } = req.body;

    if (!email || !fullName || !password) {
        return res.status(403).json({
            success: false,
            message: "Please fill all the fields"
        });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            email,
            fullName,
            password: hashedPassword
        });

        await newUser.save();

        return res.status(201).json({
            success: true,
            message: "User registered",
            data: newUser
        });
    } catch (e) {
        console.error(e);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};



export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password.' });
    }

    // Generate JWT token
    const token = jwt.sign({ _id: user._id, role: user.role }, process.env.SECRET, { expiresIn: '1d' });

    // Send response without password
    const userData = {
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    };

    res.status(200).json({ data: userData, token });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};


