import jwt from "jsonwebtoken"
import { env } from "../configs/env.js";

export const createToken = (user) => {
    return jwt.sign({ id: user._id, email: user.email }, env.jwtSecret, {
        expiresIn: "1d",
    });
};
