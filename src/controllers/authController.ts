import { z } from "zod"
import { otps, users } from "../db/mongo";
import bcrypt from "bcryptjs";
import { LoginSchema } from "../routes/auth.routes";
import { generateOTP } from "../middlewares/otp";
import { sendMail } from "../middlewares/mailer";


export const userLogin = async (body: any, set: any, jwt: any, authorization: any) => {
    try {
        const { email, password } = LoginSchema.parse(body);
        // Find user by email
        const user = await users.findOne({ email });
        if (!user) {
            set.status = 401;
            return {success: false, message: "Invalid email or password" };
        }

        // Compare passwords
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            set.status = 401;
            return {success:false, message: "Invalid email or password" };
        }

        // Create JWT token
        const token = await jwt.sign({
            id: user._id.toString(),
            email:user.email,
            role: user.role
        });

        // Set cookie with token
        authorization.set({
            value: `Bearer ${token}`,
            httpOnly: true,
            path: '/',
            secure: Bun.env.BUN_ENV === 'production',
            sameSite: 'strict',
            domain: Bun.env.SITE_DOMAIN,
            maxAge: 7 * 86400, // 7 days in seconds
        });

        // Return user data (excluding password)
        return {
            success: true,
            user: {
                // _id: user._id.toString(),
                email: user.email,
                username: user.username
            },
            message: "Login successful"
        };

    } catch (err: any) {
        if (err instanceof z.ZodError) {
            set.status = 400;
            return {success:false, message: "Missing or invalid Login Credentials" };
        }
        console.error("Login error:", err);
        set.status = 500;
        return {success:false, message: "Something went wrong!" };
    }
}

export const userLogout = async (set: any, cookie: any, authorization: any) => {
    try {
        authorization.set({
            value: '',
            path: '/',  // same as when cookie was set
            domain: Bun.env.SITE_DOMAIN, // same domain
            httpOnly: true,
            secure: Bun.env.BUN_ENV === 'production',
            sameSite: 'strict',
            maxAge: 0, // expire immediately
        });
        delete cookie.authorization;
        return {success:true, message: "Logout successful" };
    } catch (err: any) {
        console.error("Logout error:", err);
        set.status = 500;
        return {success:false, message: "Something went wrong!" };
    }
}

// otp for signup
export const generateSendOtp = async (set: any,query:{for:string}, body: object) => {
    try {
        const validatedBody = LoginSchema.partial().parse(body);
        let successReturnStatement = {};

        if(query.for === 'signup'){
            const userExists = await users.findOne({ email: validatedBody.email });
            if (userExists) {
                set.status = 400;
                return { message: 'User already exists with this email!' };
            }
        }
        if (!validatedBody.email) {
            set.status = 404;
            return { success: false, message: 'No email found!' };
        }
        const otp = await generateOTP();
        // 300000 ms = 5 min
        const checkExpiration = await otps.findOne({ email: validatedBody.email });
        if (checkExpiration?.expiresAt > (Date.now() + 4*60*1000)) {
            set.status = 400;
            return { success: false, message: `Please wait ${(checkExpiration?.expiresAt - Date.now()) / 1000} more seconds!` };
        }
        const otpUpdate = await otps.findOneAndUpdate({
            email: validatedBody.email
        }, {
            $set: {
                otp: otp,
                expiresAt: Date.now() + 300 * 1000 // 5 min
            }
        });
        if (otpUpdate) {
            set.status = 200;
            successReturnStatement = { success: true, message: 'Otp sent successfully!' };
        } else {
            const otpInsert = await otps.insertOne({
                otp: otp,
                email: validatedBody.email,
                expiresAt: Date.now() + 300 * 1000 // 5 min
            })
            if (otpInsert) {
                set.status = 200;
                successReturnStatement = { success: true, message: 'Otp sent successfully!' };
            }
        }

        const subject = 'ET: Signup Otp!';
        const text = `Ignore if not expecting this mail. your ${query.for === 'signup'?'register':'password change'} otp is: ---------- ${otp} ---------- . Do not reply!`;
        const mail = sendMail(validatedBody.email, subject, text);
        return successReturnStatement;
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            set.status = 400;
            return { message: "Missing or invalid parameters" };
        }
        console.error("Register error:", err);
        set.status = 500;
        return { message: "Something went wrong!" };
    }
}

export const verifyOtp = async (otp: string|undefined, email: string|undefined): Promise<boolean> => {
    try {
        if(!otp || !email) return false;
        const otpData = await otps.findOne({ email: email });
        if (!otpData) {
            return false;
        } else if (otpData.expiresAt < Date.now()) {
            return false;
        } else if (otp?.toString() !== otpData?.otp) {
            return false;
        }
        return true;
    } catch (err: any) {
        console.log('Error:', err);
        return false;
    }
}

// otp for forgot password
export const forgotPassword = async (set: any, body: object) => {
    let validatedBody = LoginSchema.partial().parse(body);
    if (!validatedBody.email) {
        set.status = 400;
        return { success: false, message: "Email is required!" };
    }

    try {
        const userExists = await users.findOne({email:validatedBody.email});
        if(!userExists){
            set.status = 400;
            return {success:false,message:"User for this email doesnot exists!"};
        }

        const otp = await generateOTP();
        let successReturnStatement = {};

        const otpUpdate = await otps.findOneAndUpdate({ email: validatedBody.email }, {
            $set: {
                otp: otp,
                expiresAt: Date.now() + 300 * 1000 // 5 min
            }
        })
        if (otpUpdate) {
            set.status = 200;
            successReturnStatement = { success: true, message: 'Otp sent successfully!' };
        } else {
            const otpInsert = await otps.insertOne({
                otp: otp,
                email: validatedBody.email,
                expiresAt: Date.now() + 300 * 1000 // 5 min
            })
            if (otpInsert) {
                set.status = 200;
                successReturnStatement = { success: true, message: 'Otp sent successfully!' };
            }
        }
        const subject = 'ET: Password Reset Otp!';
        const text = `Ignore if not expecting this mail. your password reset otp is: ---------- ${otp} ---------- . Do not reply!`;
        const mail = sendMail(validatedBody.email, subject, text);
        return successReturnStatement;
    } catch (err: any) {
        console.log("Error:", err);
        set.status = 500;
        return { success: false, message: 'Failed mailing! something went wrong!' };
    }
}

export const updatePassword = async(set:any, password:string, confirmPassword:string)=>{

}