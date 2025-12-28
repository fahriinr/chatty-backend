import bcrypt from "bcryptjs";
import User from "../models/User";
import generateUniqueConnectCode from "../utils/generateUniqueConnectCode";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";

class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const { fullName, username, email, password } = req.body;

      if (!fullName || !username || !email || !password) {
        return res.status(400).json({ message: "All field are required" });
      }

      if (password.length < 6) {
        return res
          .status(400)
          .json({ message: "Password must be at least 6 character" });
      }

      const existingUser = await User.findOne({
        $or: [{ username }, { email }],
      });

      if (existingUser) {
        return res
          .status(400)
          .json({ message: "User already exists with username or email" });
      }

      //hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = new User({
        username,
        fullName,
        email,
        password: hashedPassword,
        connectCode: await generateUniqueConnectCode(),
      });

      await user.save();

      res.status(201).json({ succes: true });
    } catch (error) {
      console.error("Registration Error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.send(400).json({ message: "All fields are required" });
      }

      const user = await User.findOne({
        email,
      });

      if (!user) {
        return res.send(400).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        return res.send(400).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      });

      res.cookie("jwt", token, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: true,
        secure: process.env.NODE_ENV !== "development",
      });

      res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          fullname: user.fullName,
          email: user.email,
          connectCode: user.connectCode,
        },
      });
    } catch (error) {
      console.error("Login Error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }

  static logout(req: Request, res: Response) {
    res.cookie("jwt", "", {
      httpOnly: true,
      expires: new Date(0), // epoch → langsung expired
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({ message: "Logged out" });
  }

  static async me(req: Request, res: Response) {
    try {
      const user = await User.findById(req.user.id).select("-password");

      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      res.status(200).json({
        user: {
          id: user.id,
          username: user.username,
          fullname: user.fullName,
          email: user.email,
          connectCode: user.connectCode,
        },
      });
    } catch (error) {
      console.error("Me Error", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
}

export default AuthController;
