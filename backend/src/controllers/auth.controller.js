import User from "../models/user.model.js"
import bcrypt from "bcryptjs"
import {generateToken} from "../lib/utils.js"
import cloudinary from "../lib/cloudinary.js"

export const signup = async(req,res) => {
    const {fullname, email, password} = req.body;
    try {
        if(!fullname || !email || !password) {
            return res.status(400).json({message: "All fields are required."});
        }

        if(password.length < 6) {
            return res.status(400).json({message: "Password must be atleast 6 characters long."});
        }

        const user = await User.findOne({email});
        if(user) return res.status(400).json({message: "User Already Exists"});

        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullname,
            email,
            password: hashedPass,
        })

        if(newUser) {
            generateToken(newUser._id, res);
            await newUser.save();

            res.status(201).json({
                id: newUser._id,
                fullName: newUser.fullname,
                email: newUser.email,
                profilePic: newUser.profilePic,
            })

        } else {
            return res.status(400).json({message: "Inavlid User Data"});
        }

    } catch (error) {
        console.log("Error in Signup Controller: ", error.message);
        res.status(500).json({message: "Internal Service Error"});
    }
};

export const login = async(req,res) => {
    try {
        const {email,password} = req.body;
        const user = await User.findOne({email});

        if(!user) return res.status(400).json({message: "Invalid Credentials"});

        const result = await bcrypt.compare(password, user.password);
        if(!result) return res.status(400).json({message: "Invalid Credentials"});

        generateToken(user._id, res);

        return res.status(200).json({
            _id: user._id,
            fullname: user.fullname,
            email: user.email,
            profilePic: user.profilePic,
        })
    } catch (error) {
        console.log("Error in Login Controller");
        return res.status(500).json({message: "Internal Server Error"});
    }
};

export const logout = (req,res) => {
    try {
        res.cookie("jwt","",{maxAge:0});
        res.status(200).json({message: "Logged out successfully"});
    } catch (error) {
        console.log("Error in Logout Controller");
        return res.status(500).json({message: "Internal Server Error"});
    }
};

export const updateProfile = async(req,res) => {
    try {
        const {profilePic} = req.body;
        const userId = req.user._id;

        if(!profilePic) return res.status(400).json({message: "Profile Pic is required !"});

        const uploadRes = await cloudinary.uploader.upload(profilePic);
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            {profilePic: uploadRes.secure_url},
            {new: true},
        );

        res.status(200).json(updatedUser);
    } catch (error) {
        console.log("Error in Update Profile: ", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
}

export const checkAuth = (req,res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth Controller: ", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
}