import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from "../config/prisma.js";
import { AppError } from '../utils/AppError.js';

export const registerUser = async(
    data: { name: string; 
            email: string;
            password: string },
    ) => {
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if(existingUser) {
        throw new AppError('User already exists', 409);
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({ 
        data: {
            ...data,
            password: hashedPassword,
        },
    });
    return user;
};

export const loginUser = async(
    data: {
        email: string;
        password: string;
    }) => {
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if(!user) {
        throw new AppError("User Not Found", 404);
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if(!isPasswordValid) {
        throw new AppError("Invalid email or password", 401);
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET as string, { expiresIn: '1h' });
    return { token, user };
};