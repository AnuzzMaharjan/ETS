import { Elysia, t } from "elysia";
import { createNewCategory, deleteCategory, getAllCategories, getCategory, getCategoryCount, toggleActiveStatus, updateCategory } from "../controllers/categoryController";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { jwtPayloadMiddleware } from "../middlewares/jwtPayload";

// Zod schemas for validation in controllers
export const CategorySchema = z.object({
    category: z.string(),
    active: z.boolean()
});

export const ToggleActiveSchema = z.object({
    active: z.boolean()
});

export const categoryRoutes = new Elysia()
    .use(jwtPayloadMiddleware)
    .get('/category/:id', ({ params, set, jwtPayload }) => getCategory(new ObjectId(params.id), set, jwtPayload), {
        detail: {
            tags: ['Categories'],
            summary: 'Get category by ID',
            description: 'Retrieve a category by its ID',
            responses: {
                '200': { description: 'Category found successfully' },
                '400': { description: 'Invalid category ID' },
                '404': { description: 'Category not found' }
            }
        }
    })
    .get('/categories', ({ set, query, jwtPayload }) => getAllCategories(set, query, jwtPayload), {
        query: t.Object({
            page: t.Numeric({ default: 1 }),
            limit: t.Numeric({ default: 10 }),
            startDate: t.String({ default: '' }),
            endDate: t.String({ default: '' }),
            for: t.String({ default: '' })
        }),
        detail: {
            tags: ['Categories'],
            summary: 'Get all categories',
            description: 'Retrieve a paginated list of categories',
            responses: {
                '200': { description: 'Categories retrieved successfully' }
            }
        }
    })
    .post('/category', ({ body, set, jwtPayload }) => createNewCategory(body, set, jwtPayload), {
        body: t.Object({
            category: t.String(),
            active: t.Boolean()
        }),
        detail: {
            tags: ['Categories'],
            summary: 'Create new category',
            description: 'Create a new expense category',
            responses: {
                '201': { description: 'Category created successfully' },
                '400': { description: 'Invalid category data' }
            }
        }
    })
    .delete('/category/:id', ({ params, set, jwtPayload }) => deleteCategory(new ObjectId(params.id), set, jwtPayload), {
        detail: {
            tags: ['Categories'],
            summary: 'Delete category',
            description: 'Delete a category by ID',
            responses: {
                '200': { description: 'Category deleted successfully' },
                '400': { description: 'Invalid category ID' },
                '404': { description: 'Category not found' }
            }
        }
    })
    .put('/category/:id', ({ params, set, body, jwtPayload }) => updateCategory(new ObjectId(params.id), body, set, jwtPayload), {
        body: t.Object({
            category: t.String(),
            active: t.Boolean()
        }),
        detail: {
            tags: ['Categories'],
            summary: 'Update category',
            description: 'Update a category\'s information',
            responses: {
                '200': { description: 'Category updated successfully' },
                '400': { description: 'Invalid category data or ID' },
                '404': { description: 'Category not found' }
            }
        }
    })
    .patch('/category/:id/toggle-status', ({ params, set, body, jwtPayload }) => toggleActiveStatus(new ObjectId(params.id), body, set, jwtPayload), {
        body: t.Object({
            active: t.Boolean()
        }),
        detail: {
            tags: ['Categories'],
            summary: 'Toggle category status',
            description: 'Toggle the active status of a category',
            responses: {
                '200': { description: 'Category status updated successfully' },
                '400': { description: 'Invalid category ID or status' },
                '404': { description: 'Category not found' }
            }
        }
    })
    .get('/category/count',({set,query,jwtPayload})=>getCategoryCount(set,jwtPayload,query),{
        query:t.Object({
            for: t.String({default:''})
        }),
        detail:{
            tags:['Categories'],
            summary:'Get all Category counts',
            description:'All category counts for a user',
            responses:{
                '200':{description: 'Count success'},
                '500':{description: 'Something went wrong!'}
            }
        }
    });