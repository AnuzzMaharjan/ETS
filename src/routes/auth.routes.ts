import { Elysia, t } from "elysia";
import { forgotPassword, generateSendOtp, userLogin, userLogout } from "../controllers/authController";
import cookie from "@elysiajs/cookie";
import { z } from "zod";
import { jwtPayloadMiddleware } from "../middlewares/jwtPayload";
import { isAdmin } from "../middlewares/isAdmin";
import jwt from "@elysiajs/jwt";

const SECRET = Bun.env.JWT_SECRET;

if (!SECRET) {
    throw new Error("JWT_SECRET not found!");
}

// Zod schema for validation in controller
export const LoginSchema = z.object({
    email: z.string().email().nonempty(),
    password: z.string().min(6).nonempty()
});

export const authRoutes = new Elysia({ name: 'auth-routes', prefix: 'auth' })
    .use(cookie({
        secret: Bun.env.COOKIE_SECRET,
        signed: true
    }))
    .use(jwt({
        name: 'jwt',
        secret: SECRET
    }))
    .post("/login",
        ({ body, set, jwt, cookie: { authorization } }) => userLogin(body, set, jwt, authorization),
        {
            body: t.Object({
                email: t.String(),
                password: t.String()
            }),
            detail: {
                tags: ['Auth'],
                summary: 'Login user',
                description: 'Authenticate user with email and password',
                responses: {
                    '200': {
                        description: 'Login successful',
                    },
                    '401': {
                        description: 'Invalid credentials',
                    }
                }
            }
        })
    .post("/generate-send-otp", ({ set, query, body }) => generateSendOtp(set, query, body), {
        body: t.Object({
            email: t.String()
        }),
        query: t.Object({
            for: t.String({ default: '' })
        }),
        detail: {
            tags: ['Auth'],
            summary: 'Generate and send the otp',
            responses: {
                '200': {
                    description: 'Otp mail successful'
                },
                '404': {
                    description: 'Missing Credentials (email not found)'
                },
                '400': {
                    description: 'Bad request: Data validation failed or OTP already exists and hasn\'t expired'
                }
            }
        }
    })
    .post('/forgot-password', async ({ set, body: { email } }) => forgotPassword(set, email), {
        body: t.Object({
            email: t.String()
        }),
        detail: {
            tags: ['Auth'],
            summary: 'Generate otp for forgot password',
            responses: {
                '200': {
                    description: 'Otp mail successful'
                },
                '400': {
                    description: 'No Email or user with the email doesnt exist'
                },
                '500': {
                    description: 'Otp mail failed or something went wrong'
                }
            }
        }
    })
    .post("/logout", ({ set, cookie, cookie: { authorization } }) => userLogout(set, cookie, authorization), {

        cookie: t.Cookie({
            authorization: t.String()
        }, {
            secrets: [Bun.env.COOKIE_SECRET ?? ''],
            sign: ['authorization']
        }),
        detail: {
            tags: ['Auth'],
            summary: 'Logout user',
            description: 'Logout user by clearing their authentication cookie',
            responses: {
                '200': {
                    description: 'Logout successful',
                },
                '401': {
                    description: 'Unauthorized - Invalid or missing authentication cookie',
                }
            }
        }
    })
    .use(jwtPayloadMiddleware)
    .get("/verify-logged-in", ({ query,jwtPayload,set }) => {
        try{
            if(query.r==="admin"){
                isAdmin(jwtPayload, set);
                set.status = 200;
                return new Response(JSON.stringify({ isLoggedIn: true, message: 'User is logged in' }));
            }else{
                set.status = 200;
                return new Response(JSON.stringify({ isLoggedIn: true, message: 'User is logged in' }));
            }
        }catch(e){
            set.status = 401;
            return new Response(JSON.stringify({ isLoggedIn: false,message:'Unauthorized! You are not an admin.' }))
        }

    }, {
        cookie: t.Cookie({
            authorization: t.String()
        }, {
            secrets: [Bun.env.COOKIE_SECRET ?? ''],
            sign: ['authorization']
        }),
        detail: {
            tags: ['Auth'],
            summary: 'Verify auth cookie for logged in status',
            description: 'Verify if the authentication cookie is valid',
            responses: {
                '200': {
                    description: 'Cookie is valid, user is logged in',
                },
                '401': {
                    description: 'Cookie is invalid or missing, user session over',
                }
            }
        }
    })