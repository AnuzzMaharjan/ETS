import { Elysia, t } from "elysia";
import { createNewExpense, deleteExpense, getAllExpenses, getExpenseCount, getExpensesPerDay, getExpensesToday, updateExpense } from "../controllers/expenseController";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { jwtPayloadMiddleware } from "../middlewares/jwtPayload";
import { sanitizeBody } from "../middlewares/sanitizeBody";
import { ExpenseBody } from "../types";

// Zod schemas for validation in controllers
export const ExpenseSchema = z.object({
    expense: z.number(),
    category: z.string(),
    description: z.string()
});

export const expensesRoutes = new Elysia()
    .use(jwtPayloadMiddleware)
    .use(sanitizeBody)
    .get('/expenses', ({ set, query, jwtPayload }) => getAllExpenses(set, query, jwtPayload), {
        query: t.Object({
            page: t.Numeric({ default: 1 }),
            limit: t.Numeric({ default: 10 }),
            startDate: t.String({ default: '' }),
            endDate: t.String({ default: '' })
        }),
        detail: {
            tags: ['Expenses'],
            summary: 'Get all expenses',
            description: 'Retrieve a paginated list of expenses',
            responses: {
                '200': { description: 'Expenses retrieved successfully' }
            }
        }
    })
    .post('/expense', ({ sanitizedBody, set, jwtPayload }) =>  createNewExpense(sanitizedBody as ExpenseBody, set, jwtPayload), {
        sanitizedBody: t.Object({
            expense: t.Number(),
            category: t.String(),
            description: t.String()
        }),
        detail: {
            tags: ['Expenses'],
            summary: 'Create new expense',
            description: 'Create a new expense record',
            responses: {
                '200': { description: 'Expense created successfully' },
                '400': { description: 'Invalid expense data' }
            }
        }
    })
    .delete('/expense/:id', ({ params, set, jwtPayload }) => deleteExpense(new ObjectId(params.id), set,jwtPayload), {
        detail: {
            tags: ['Expenses'],
            summary: 'Delete expense',
            description: 'Delete an expense by ID',
            responses: {
                '200': { description: 'Expense deleted successfully' },
                '400': { description: 'Invalid expense ID' },
                '404': { description: 'Expense not found' }
            }
        }
    })
    .put('/expense/:id/update', ({ params, sanitizedBody, set,jwtPayload }) => updateExpense(new ObjectId(params.id), sanitizedBody, set,jwtPayload), {
        sanitizedBody: t.Object({
            expense: t.Number(),
            category: t.String(),
            description: t.String()
        }),
        detail: {
            tags: ['Expenses'],
            summary: 'Update expense',
            description: 'Update an expense record',
            responses: {
                '200': { description: 'Expense updated successfully' },
                '400': { description: 'Invalid expense data or ID' },
                '404': { description: 'Expense not found' }
            }
        }
    })
    .get('/expenses/count', ({ set, query, jwtPayload }) => getExpenseCount(set, jwtPayload, query), {
        query: t.Object({
            page: t.Numeric({ default: 1 }),
            limit: t.Numeric({ default: 10 }),
            startDate: t.String({ default: '' }),
            endDate: t.String({ default: '' })
        }),
        detail: {
            tags: ['Expenses'],
            summary: 'Get all Expenses counts',
            description: 'All Expenses counts for a user',
            responses: {
                '200': { description: 'Count success' },
                '500': { description: 'Something went wrong!' }
            }
        }
    })
    .get('/expense/monthly',({set,jwtPayload})=> getExpensesPerDay(set,jwtPayload),{
        detail:{
            tags: ['Expenses'],
            summary: 'Get Expenses per day and month',
            description: 'All Expenses per day and month for a user',
            responses: {
                '200': { description: 'Fetch success' },
                '500': { description: 'Something went wrong!' }
            }
        }
    })
    .get('/expense/today',({set,query,jwtPayload})=> getExpensesToday(set,query,jwtPayload),{
        query: t.Object({
            from: t.String({default: ''}),
            to: t.String({default: ''})
        }),
        detail:{
            tags: ['Expenses'],
            summary: 'Get Expenses per category for today',
            description: 'All Expenses per category for today for a user',
            responses: {
                '200': { description: 'Fetch success' },
                '500': { description: 'Something went wrong!' }
            }
        }
    });