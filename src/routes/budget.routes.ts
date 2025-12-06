import { Elysia, t } from 'elysia';
import { categoryBudget, getAllBudgets, getBudget, getCategoryBudget, getPrimaryBudget, updateBudget } from '../controllers/budgetController';
import { z } from 'zod';
import cookie from '@elysiajs/cookie';
import jwt from '@elysiajs/jwt';
import { jwtPayloadMiddleware } from '../middlewares/jwtPayload';
import { sanitizeBody } from '../middlewares/sanitizeBody';
// Zod schemas for validation in controllers
export const BudgetSchema = z.object({
    budget: z.number().nonnegative()
});

export const budgetRoutes = new Elysia()
    .use(jwt({
        name: 'jwt',
        secret: Bun.env.JWT_SECRET ?? ''
    }))
    .use(cookie({
        secret: Bun.env.COOKIE_SECRET ?? ''
    }))
    .use(jwtPayloadMiddleware)
    .use(sanitizeBody)
    .get('/budget/:id', ({ params, set }) => getBudget(params.id, set), {
        detail: {
            tags: ['Budget'],
            summary: 'Get budget by ID',
            description: 'Retrieve a budget by its ID',
            responses: {
                '200': { description: 'Budget found successfully' },
                '400': { description: 'Invalid budget ID' },
                '404': { description: 'Budget not found' }
            }
        }
    })
    .get('/prime-budget',({set,jwtPayload}) => getPrimaryBudget(set,jwtPayload),{
        detail:{
            tags:['Budget'],
            summary: 'Get Primary budget',
            description:'Get the monthly budget allocated',
            responses:{
                '200':{description: 'Successfully got the user related budget'},
                '404':{description: 'Counldnot find the budget for the  user'},
                '500':{description: 'Something went wrong'}
            }
        }
    })
    .patch('/budget', ({ sanitizedBody, set, jwtPayload }) => updateBudget(sanitizedBody, set, jwtPayload), {
        sanitizedBody: t.Object({
            budget: t.Number()
        }),
        detail: {
            tags: ['Budget'],
            summary: 'Update or create budget',
            description: 'Update existing budget or create new one if not exists',
            responses: {
                '200': { description: 'Budget updated successfully' },
                '201': { description: 'Budget created successfully' },
                '400': { description: 'Invalid budget data' }
            }
        }
    })
    .get('/budgets', ({ set, query, jwtPayload }) => getAllBudgets(set, query, jwtPayload), {
        query: t.Object({
            page: t.Numeric({ default: 1 }),
            limit: t.Numeric({ default: 10 })
        }),
        detail: {
            tags: ['Budget'],
            summary: 'Get all budgets',
            description: 'Retrieve a paginated list of budgets',
            responses: {
                '200': { description: 'Budgets retrieved successfully' }
            }
        }
    })
    .patch("budget/:category", ({ params: { category }, sanitizedBody, set, jwtPayload }) => categoryBudget(category, sanitizedBody, set, jwtPayload), {
        sanitizedBody: t.Object({
            budget: t.Number()
        }),
        detail: {
            tags: ['Budget'],
            summary: 'Update or create budget by category',
            description: 'Update existing budget or create new one if not exists by category',
            responses: {
                '200': { description: 'Budget updated successfully' },
                '201': { description: 'Budget created successfully' },
                '400': { description: 'Invalid budget data' }
            }
        }
    })
    .get('/budget-categories',async({set,query,jwtPayload})=> getCategoryBudget(set,query,jwtPayload),{
        query: t.Object({
            page: t.Numeric({ default: 1 }),
            limit: t.Numeric({ default: 10 }),
            for: t.String({ default: '' })
        }),
        detail:{
            tags:['Budget'],
            summary: 'Get the categories with budget',
            description: 'Getting the list of categories with their respective budget based on user id',
            responses:{
                200:{description:'Successfully fetched. with or without data. if no  categories empty data array'},
                500:{description:'Something went wrong'}
            }
        }
    });