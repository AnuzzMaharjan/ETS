import Elysia, { t } from "elysia";
import { jwtPayloadMiddleware } from "../middlewares/jwtPayload";
import { getNotificationCount, getNotifications, setNotificationRead } from "../controllers/notificationController";

export const notificationRoutes = new Elysia()
.use(jwtPayloadMiddleware)
.get('/notifications',({query,set,jwtPayload})=>getNotifications(set,query,jwtPayload),{
    query: t.Object({
        page: t.Numeric({ default: 1 }),
        limit: t.Numeric({ default: 10 })
    }),
    detail: {
        tags: ['Notifications'],
        summary: 'Get all notifications',
        description: 'Retrieve a paginated list of notifications',
        responses: {
            '200': { description: 'Notifications retrieved successfully' },
            '500': { description: 'Something went wrong!' }
        }
    }
})
.get('/notifications/markAsRead',({set,jwtPayload})=>setNotificationRead(set,jwtPayload),{
    detail: {
        tags: ['Notifications'],
        summary: 'Mark all notifications as read',
        description: 'Mark all notifications as read',
        responses: {
            '200': { description: 'Notifications marked as read' },
            '500': { description: 'Something went wrong!' }
        }
    }
})
.get('/notifications/count',({set,jwtPayload})=>getNotificationCount(set,jwtPayload),{
    detail:{
        tags: ['Notifications'],
        summary: 'Get all Notification counts',
        description: 'All Notification counts for a user',
        responses: {
            '200': { description: 'Count success' },
            '500': { description: 'Something went wrong!' }
        }
    }
});
