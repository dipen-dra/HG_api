import User from "../../models/User.js";
import bcrypt from "bcrypt";

// Create
export const createUser = async (req, res) => {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
        return res.status(403).json({
            success: false,
            message: "Please fill all the fields"
        });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword
        });

        await newUser.save();
        return res.status(201).json({
            success: true,
            message: "User registered"
        });

    } catch (err) {
        console.error("Create user error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Read All
export const getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        return res.status(200).json({
            success: true,
            message: "Data fetched",
            data: users
        });
    } catch (err) {
        console.error("Get users error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Read One
export const getOneUser = async (req, res) => {
    try {
        const _id = req.params.id;
        const user = await User.findById(_id).select("-password");

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "One user fetched",
            data: user
        });

    } catch (err) {
        console.error("Get one user error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Update
export const updateOneUser = async (req, res) => {
    const { fullName, email } = req.body;
    const _id = req.params.id;

    if (!fullName && !email) {
        return res.status(400).json({
            success: false,
            message: "At least one field is required to update"
        });
    }

    try {
        const existingUser = await User.findById(_id);
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (email && email !== existingUser.email) {
            const emailExists = await User.findOne({
                email: email,
                _id: { $ne: _id }
            });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: "Email already exists"
                });
            }
        }

        const updateFields = {};
        if (fullName) updateFields.fullName = fullName;
        if (email) updateFields.email = email;

        await User.updateOne({ _id: _id }, { $set: updateFields });

        return res.status(200).json({
            success: true,
            message: "User data updated"
        });

    } catch (err) {
        console.error("Update user error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};

// Delete
export const deleteOneUser = async (req, res) => {
    try {
        const _id = req.params.id;
        const result = await User.deleteOne({ _id: _id });

        if (result.deletedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "User deleted"
        });

    } catch (err) {
        console.error("Delete user error:", err);
        return res.status(500).json({
            success: false,
            message: "Server error"
        });
    }
};
