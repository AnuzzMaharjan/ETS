import { cookie } from "@elysiajs/cookie";
import { jwt } from "@elysiajs/jwt";
import { Elysia, t } from "elysia";

const verifyLoggedIn = (authorization: unknown, headers: Record<string, string | undefined>, jwt: any, set: any) => {
    if (!Bun.env.JWT_SECRET) {
        throw new Error("JWT_SECRET not found!");
    }
    if (!Bun.env.COOKIE_SECRET) {
        throw new Error("COOKIE_SECRET not found!");
    }
    new Elysia()
        .use(cookie({
            secret: Bun.env.COOKIE_SECRET
        }))
        .use(jwt({
            name: 'jwt',
            secret: Bun.env.JWT_SECRET
        }))
        .onRequest(async () => {
            try {
                console.log(headers);
                // Try to get token from Authorization header first
                let token: string | undefined;

                if (headers.authorization?.startsWith('Bearer ')) {
                    token = headers.authorization.split(' ')[1];
                } else if (authorization) {
                    // If no valid Authorization header, try cookie
                    token = String(authorization);
                }

                if (!token) {
                    set.status = 401;
                    return { success: false, message: "No authorization token provided" };
                }

                const decoded = await jwt.verify(token);
                if (!decoded) {
                    set.status = 401;
                    return { success: false, message: "Invalid token" };
                }
            } catch (error) {
                set.status = 401;
                return { success: false, message: "Authentication failed" };
            }
        });
}

export default verifyLoggedIn;
