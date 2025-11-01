import { users } from "../db/mongo";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { CreateUserSchema, UpdateUserSchema } from "../routes/user.routes";
import { verifyOtp } from "./authController";
import { JwtPayload } from "../types";

type QueryParams = {
    page: number;
    limit: number;
}

export const getUser = async (jwtPayload:JwtPayload, set: any) => {
    try {
        if (!jwtPayload.id) {
            set.status = 400;
            return { success:false,message: 'Invalid id!' };
        }
        const result = await users.findOne({ _id: new ObjectId(jwtPayload.id) });
        if (!result) {
            set.status = 400;
            return { success:false,message: 'User not Found!' };
        }

        return { success:true,data:{email:result.email,username:result.username}};
    } catch (err: any) {
        console.log('Error', err.errors);
        set.status = 500;
        return {success:false, message: 'Something went wrong!' };
    }
}

export const getAllUsers = async (set: any, query: QueryParams) => {
    try {
        const { page, limit } = query;
        const offset = (page - 1) * limit;
        const data = await users.find().skip(offset).limit(limit).toArray();
        const count = await users.countDocuments({role:{$ne:'admin'}});
        return {success:true, data, count};
    } catch (err: any) {
        console.log('Error', err.errors);
        set.status = 500;
        return { message: 'Something went wrong!' };
    }
}

export const createNewUser = async (body: any, set: any) => {
    try {
        const validatedData = CreateUserSchema.parse(body);

        const otpVerified = await verifyOtp(validatedData.otp,validatedData.email);
        if(!otpVerified){
            set.status = 400;
            return {success:false,message: 'Otp expired or Invalid!'};
        }

        const userExists = await users.findOne({ $or: [{ username: body.username }, { email: body.email }] });
        if (userExists) {
            set.status = 400;
            return {success:false, message: 'User already exists with this username or email!' };
        }
        const { password,username,email,role } = validatedData;
        const salt = await bcrypt.genSalt(10);
        let encryptedPassword = await bcrypt.hash(password, salt);
        const inserData = {
            username,
            email,
            role,
            password:encryptedPassword,
            createdAt: new Date(),
            updatedAt: new Date()
        }
        await users.insertOne(inserData);
        set.status = 201;
        return { success:true,message: 'Registration successful!' };
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            set.status = 400;
            console.log({ message: "Invalid user data", errors: err.errors });
            return {success:false, message: "Invalid User data"};
        }
        console.log('Error', err.errors);
        set.status = 500;
        return {success: false, message: 'Something went wrong!' };
    }
}

export const deleteUser = async (set: any, id:ObjectId) => {
    try {
        if (!ObjectId.isValid(id)) throw new Error('invalid id');
        const result = await users.deleteOne({ _id: id });
        let res = result.deletedCount > 0 ? {success:true, message: 'User Deleted!' } : {success:false, message: 'User not found' };
        return res;
    } catch (err: any) {
        console.log('Error', err.errors);
        set.status = 500;
        return {success:false, message: 'Something went wrong!' };
    }
}

export const updateUser = async (jwtPayload:JwtPayload, body: any, set: any) => {
    try {
        if (!jwtPayload.id) throw new Error('invalid id');
        if (!body) return { message: 'nothing to update' };

        const validatedData = UpdateUserSchema.parse(body);
        let encryptedPassword;
        if (validatedData.password) {
            const salt = await bcrypt.genSalt(10);
            encryptedPassword = await bcrypt.hash(validatedData.password, salt);
        }
        let result = await users.updateOne(
            { _id: new ObjectId(jwtPayload.id) },
            encryptedPassword
                ? { $set: { ...validatedData, password: encryptedPassword } }
                : { $set: { ...validatedData } }
        );
        return result.modifiedCount > 0 ? { message: 'User Updated!' } : { message: 'User not found' };

    } catch (err: any) {
        if (err instanceof z.ZodError) {
            set.status = 400;
            return { message: "Invalid user data", errors: err.errors };
        }
        console.log('Error', err.errors);
        set.status = 500;
        return { message: 'Something went wrong!' };
    }
}
export const updateUserPassword = async ( body: any, set: any) => {
    try {
        if (!body) {
            set.status=400;
            return {success:false, message: 'Missing parameters!' };
        };

        const validatedData = UpdateUserSchema.parse(body);
        const isOtpVerified = await verifyOtp(validatedData.otp,validatedData.email);
        if(!isOtpVerified){
            set.status = 400;
            return {success:false, message:'Otp invalid or Expired. Please try again!'};
        }
        let encryptedPassword;
        if (validatedData.password) {
            const salt = await bcrypt.genSalt(10);
            encryptedPassword = await bcrypt.hash(validatedData.password, salt);
        }
        const userData = {
            email: validatedData.email,
            password: encryptedPassword,
            updatedAt: new Date()
        }
        let result = await users.updateOne(
            { email:validatedData.email },{$set: userData}
        );
        return result.modifiedCount > 0 ? { success:true, message: 'Password Updated!' } : { success:false, message: 'User not found' };

    } catch (err: any) {
        if (err instanceof z.ZodError) {
            set.status = 400;
            return { message: "Invalid user data", errors: err.errors };
        }
        console.log('Error', err.errors);
        set.status = 500;
        return { message: 'Something went wrong!' };
    }
}

export const adminUpdateUser = async (id:ObjectId, body: any, set: any) => {
    try {
        if (!(ObjectId.isValid(id))) throw new Error('invalid id');
        if (!body) return {success:false, message: 'nothing to update' };

        const validatedData = UpdateUserSchema.parse(body);
        let result = await users.updateOne(
            { _id: id }, { $set: validatedData }
        );
        return result.modifiedCount > 0 ? {success:true, message: 'User Updated!' } : {success:false, message: 'User not found' };

    } catch (err: any) {
        if (err instanceof z.ZodError) {
            set.status = 400;
            return {success:false, message: "Invalid user data", errors: err.errors };
        }
        console.log('Error', err.errors);
        set.status = 500;
        return {success:false, message: 'Something went wrong!' };
    }
}