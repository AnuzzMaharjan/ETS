import cookie from "@elysiajs/cookie";
import jwt from "@elysiajs/jwt";
import Elysia from "elysia";

const SECRET = Bun.env.JWT_SECRET;

if (!SECRET) {
    throw new Error("JWT_SECRET not found!");
}

export const auth = new Elysia({ name: 'auth-middleware' })
    .use(cookie({
        secret: Bun.env.COOKIE_SECRET
    }))
    .use(
        jwt({
            name: 'jwt',
            secret: SECRET
        })
    )
    .derive(async ({ headers, set, jwt, cookie }) => {
        const authToken = cookie.auth ?? headers.authorization?.split(' ')[1];
        console.log(authToken);

        if (!authToken || typeof authToken !== 'string') {
            set.status = 401;
            return { message: "Unauthorized!" };
        }

        try {
            const user = await jwt.verify(authToken);
            return { user };
        } catch {
            set.status = 401;
            return { message: "Unauthorized!" };
        }
    })