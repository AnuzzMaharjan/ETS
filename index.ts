import { Elysia } from "elysia";
import { swagger } from '@elysiajs/swagger';
import { userRoutes } from "./src/routes/user.routes";
import { categoryRoutes } from "./src/routes/category.routes";
import { expensesRoutes } from "./src/routes/expense.routes";
import { budgetRoutes } from "./src/routes/budget.routes";
import { authRoutes } from "./src/routes/auth.routes";
import staticPlugin from "@elysiajs/static";
import { notificationRoutes } from "./src/routes/notifications.routes";

const app = new Elysia()
  .use(swagger({
    path: '/docs',
    documentation: {
      info: {
        title: 'Expense Tracking System API',
        version: '1.0.0',
        description: 'API documentation for the Expense Tracking System',
      },
      tags: [
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Users', description: 'User management endpoints' },
        { name: 'Categories', description: 'Category management endpoints' },
        { name: 'Expenses', description: 'Expense management endpoints' },
        { name: 'Budget', description: 'Budget management endpoints' }
      ],
      servers: [
        {
          url: 'http://localhost:3000',
          description: 'Local development server'
        }
      ]
    }
  }))
  .group('/api/v1', app => app
    .use(authRoutes)
    .use(userRoutes)
    .use(categoryRoutes)
    .use(expensesRoutes)
    .use(budgetRoutes)
    .use(notificationRoutes)
  )
  .use(staticPlugin({
    alwaysStatic:true,
    prefix:'/'
  }))
  .get('/dashboard',()=>Bun.file('public/dashboard.html'))
  .get('/transactions',()=>Bun.file('public/transaction.html'))
  .get('/add-expense',()=>Bun.file('public/addexpense.html'))
  .get('/budget',()=>Bun.file('public/budget.html'))
  .get('/categories',()=>Bun.file('public/categories.html'))
  .get('/reports',()=>Bun.file('public/reports.html'))
  .get('/',()=>Bun.file('public/login.html'))

  .use(staticPlugin({
    prefix:'/admin',
    alwaysStatic:true,
    assets:'public/admin'
  }))
  .get('/admin/login',()=>Bun.file('public/admin/login.html'))
  .get('/admin/dashboard',()=>Bun.file('public/admin/dashboard.html'))
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
