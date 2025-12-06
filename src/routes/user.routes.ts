import { Elysia, t } from "elysia";
import { adminUpdateUser, createNewUser, deleteUser, getAllUsers, getUser, updateUser, updateUserPassword } from "../controllers/userController";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { isAdmin } from "../middlewares/isAdmin";
import { jwtPayloadMiddleware } from "../middlewares/jwtPayload";
import { headers } from "../middlewares/setHeaders";
import { sanitizeBody } from "../middlewares/sanitizeBody";
// Zod schemas for validation in controllers
export const CreateUserSchema = z.object({
    username: z.string().min(3),
    email: z.string().email(),
    password: z.string().min(6),
    confirmpw: z.string().min(6).optional(),
    otp: z.string().min(6),
    role: z.enum(['user']).default('user')
});

enum UserRole {
    USER = 'user'
}

export const UpdateUserSchema = CreateUserSchema.partial();

export const userRoutes = new Elysia()
    .use(headers)
    .use(sanitizeBody)
    .post('/user', ({ sanitizedBody, set }) => createNewUser(sanitizedBody, set), {
        sanitizedBody: t.Object({
            username: t.String(),
            email: t.String(),
            password: t.String(),
            role: t.Enum(UserRole),
            otp: t.String()
        }),
        detail: {
            tags: ['Users'],
            summary: 'Create new user',
            description: 'Create a new user account',
            responses: {
                '201': { description: 'User created successfully' },
                '400': { description: 'Invalid user data' }
            }
        }
    })
    .patch('/reset-password', ({ sanitizedBody, set }) => updateUserPassword(sanitizedBody, set), {
        sanitizedBody: t.Object({
            email: t.String(),
            password: t.String(),
            confirmpw: t.String(),
            otp: t.String()
        }),
        detail: {
            tags: ['Users'],
            summary: 'Reset Password',
            description: 'Reset password',
            responses: {
                '200': { description: 'Password updated or user not found' },
                '400': { description: 'Misssing parameters for reset or invalid otp' }
            }
        }
    })
    .use(jwtPayloadMiddleware)
    .get('/user', ({ set, jwtPayload }) => getUser(jwtPayload, set), {
        detail: {
            tags: ['Users'],
            summary: 'Get user by ID',
            description: 'Retrieve a user by their ID',
            responses: {
                '200': { description: 'User found successfully' },
                '400': { description: 'Invalid user ID' },
                '404': { description: 'User not found' }
            }
        }
    })
    .patch('/user', ({ jwtPayload, set, body }) => updateUser(jwtPayload, body, set), {
        body: t.Object({
            username: t.Optional(t.String()),
            email: t.Optional(t.String()),
            password: t.Optional(t.String())
        }),
        detail: {
            tags: ['Users'],
            summary: 'Update user',
            description: 'Update a user\'s information',
            responses: {
                '200': { description: 'User updated successfully' },
                '400': { description: 'Invalid user data or ID' },
                '404': { description: 'User not found' }
            }
        }
    })
    .onBeforeHandle(({ jwtPayload, set }) => {
        isAdmin(jwtPayload, set);
    })
    .get('/users', ({ set, query }) => getAllUsers(set, query), {
        query: t.Object({
            page: t.Numeric({ default: 1 }),
            limit: t.Numeric({ default: 10 })
        }),
        detail: {
            tags: ['Users'],
            summary: 'Get all users',
            description: 'Retrieve a paginated list of users',
            responses: {
                '200': { description: 'Users retrieved successfully' }
            }
        }
    })
    .delete('/user/:id', ({ params, set }) => deleteUser(set, new ObjectId(params.id)), {
        detail: {
            tags: ['Users'],
            summary: 'Delete user',
            description: 'Delete a user by their ID',
            responses: {
                '200': { description: 'User deleted successfully' },
                '400': { description: 'Invalid user ID' },
                '404': { description: 'User not found' }
            }
        }
    })
    .patch('/user/:id', ({ params, set, body }) => adminUpdateUser(new ObjectId(params.id), body, set), {
        body: t.Object({
            username: t.Optional(t.String()),
            email: t.Optional(t.String())
        }),
        detail: {
            tags: ['Users'],
            summary: 'Update user as an admin',
            description: 'Update a user\'s information as an admin',
            responses: {
                '200': { description: 'User updated successfully' },
                '400': { description: 'Invalid user data or ID' },
                '404': { description: 'User not found' }
            }
        }
    });