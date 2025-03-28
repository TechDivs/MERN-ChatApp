import User from "../models/user.model.js";
import Message from "../models/message.model.js"
import cloudinary from "cloudinary"
import { getReceiverSocketId, io } from "../lib/socket.js";

export const getUsersForSidebar = async(req,res) => {
    try {
        const user = req.user._id;
        const filteredUsers = await User.find({_id: {$ne: user}}).select("-password");

        res.status(200).json(filteredUsers);
    } catch (error) {
        console.log("Error in getUsersForSidebar: ", error.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export const getMessages = async(req,res) => {
    try {
        const {id: userToChatId} = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                {senderId: myId, receiverId: userToChatId},
                {senderId: userToChatId, receiverId: myId},
            ],
        });

        res.status(200).json(messages);

    } catch (error) {
        console.log("Error in getMessages controller: ", error.message);
        res.status(500).json({error: "Internal Server Error"});
    }
}

export const sendMessage = async(req,res) => {
    try {
        const senderId = req.user._id;
        const {id: receiverId} = req.params;
        const {text,image} = req.body;
        
        let imageUrl;
        if(image) {
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        });

        await newMessage.save();

        const receiverScoketId = getReceiverSocketId(receiverId);
        if(receiverScoketId) {
            io.to(receiverScoketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    } catch (error) {
        console.log("Error in sendMessage Controller: ", error.message);
        res.status(500).json({message: "Internal Server Error"});
    }
}
