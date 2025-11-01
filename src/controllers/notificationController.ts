import { notifications } from "../db/mongo";
import { JwtPayload, NotificationCreate, QueryParams } from "../types";

export const createNotification = async(notification: NotificationCreate) => {
    try{
        const result = await notifications.insertOne(notification);
        return result.acknowledged ? {success:true, message: 'Notification created successfully!'} : {success:false, message: 'Failed to create notification!'}
    }catch(err: any){
        console.log('Error:', err);
        return {success:false, message: 'Could\'nt create the notification!' };
    }
}

export const getNotifications = async(set: any,query: QueryParams, jwtPayload: JwtPayload) => {
    try{
        const { page, limit } = query;
        const offset = (page - 1) * limit;
        const result = await notifications.find({userId: jwtPayload.id},{projection:{userId:0}}).skip(offset).limit(limit).sort({createdAt: -1}).toArray();
        return {success:true, data: result};
    }catch(err: any){
        console.log('Error:', err);
        set.status = 500;
        return {success:false, message: 'Something went wrong!' };
    }
}
export const setNotificationRead = async(set: any, jwtPayload: JwtPayload) => {
    try{
        const result = await notifications.updateMany({userId: jwtPayload.id}, {$set: {read: true}});
        return result.acknowledged ? {success:true, message: 'Notifications marked as read!'} : {success:false, message: 'Something went wrong!' };
    }catch(err: any){
        console.log('Error:', err);
        set.status = 500;
        return {success:false, message: 'Something went wrong!' };
    }
}

export const getNotificationCount = async(set: any, jwtPayload: JwtPayload) => {
    try{
        const result = await notifications.countDocuments({userId: jwtPayload.id, read: false});
        return {success:true, data: {count:result}};
    }catch(err: any){
        console.log('Error:', err);
        set.status = 500;
        return {success:false, message: 'Something went wrong!' };
    }
}