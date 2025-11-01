import { categories, expenses } from "../db/mongo";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { CategorySchema, ToggleActiveSchema } from "../routes/category.routes";
import { JwtPayload, QueryParams } from "../types";
import { createNotification } from "./notificationController";


export const getCategory = async (id: ObjectId, set: any, jwtPayload: JwtPayload) => {
    try {
        if (!ObjectId.isValid(id)) {
            set.status = 400;
            return { message: 'Invalid Id!' };
        }
        const result = await categories.findOne({ _id: id });
        return result;
    } catch (err: any) {
        console.log('Error', err.errors)
        set.status = 500;
        return { message: 'Something went wrong!' };
    }
}

export const getAllCategories = async (set: any, query: QueryParams, jwtPayload: JwtPayload) => {
    try {
        const { page, limit } = query;
        const offset = (page - 1) * limit;

        if(query.for === 'expense'){
            const result = await categories.find({ userId: jwtPayload.id, active: { $ne: false } }, { projection: { userId: 0,createdAt:0,updatedAt:0 } }).toArray();
            return {success:true,data:{result}};
        }
        const categoriesList = await categories.find({ userId: jwtPayload.id },{projection:{userId:0}}).skip(offset).limit(limit).toArray();

        const result = await Promise.all(categoriesList.map(async(value,_)=>{
            const expenseAgg = await expenses.aggregate([
                {
                    $match:{
                        category:{$regex:new RegExp(`^${value.category}$`,'i')},
                        createdAt:{$gte:new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), 1, 0, 0, 0, 0))},
                        userId: jwtPayload.id
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:"$expense"}
                    }
                }
            ]).toArray();

            const totalCatExpense = expenseAgg[0]?.total || 0;

            const expenseAggOverall = await expenses.aggregate([
                {
                    $match:{
                        userId: jwtPayload.id
                    }
                },
                {
                    $group:{
                        _id:null,
                        total:{$sum:"$expense"}
                    }
                }
            ]).toArray();

            const totalExpense = expenseAggOverall[0]?.total || 0;
            const percentageExpense = Math.round((totalCatExpense/totalExpense)*100);
            return  {...value,percentageExpense};
        }))
        set.status=200;
        return {success:true,data:{result}};
    } catch (err: any) {
        console.log('Error:', err);
        set.status = 500;
        return { message: 'Something went wrong!' };
    }
}

export const createNewCategory = async (body: any, set: any, jwtPayload: JwtPayload) => {
    try {
        const validatedData = CategorySchema.parse(body);
        const categoryExists = await categories.findOne({userId:jwtPayload.id,category:{$regex: new RegExp(`^${validatedData.category}$`,'i')}});
        if(categoryExists){
            return {success:false,message:`The category ${validatedData.category} already exists!`};
        }
        const newInsertData = {
            ...validatedData,
            userId: jwtPayload.id,
            createdAt: new Date(),
            updatedAt: new Date()
        }
        const result = await categories.insertOne(newInsertData);
        if (!result.acknowledged) {
            set.status = 500;
            return {success:false, message: 'Failed to create category!' };
        }

        createNotification({
            userId: jwtPayload.id,
            message: `A new category ${validatedData.category} has been created!`,
            type: 'info',
            read: false,
            createdAt: new Date()
        })

        return {success:true, message: 'New Category created!' };
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            set.status = 400;
            return {success:false, message: "Invalid category data", errors: err.errors };
        }
        console.log('Error:', err);
        set.status = 500;
        return {success:false, message: 'Something went wrong!' };
    }
}

export const deleteCategory = async (id: ObjectId, set: any, jwtPayload: JwtPayload) => {
    try {
        if (!ObjectId.isValid(id)) {
            set.status = 400;
            return {success:false, message: 'Invalid Id!' };
        }
        const category = await categories.findOne({ _id: id, userId: jwtPayload.id });
        const result = await categories.deleteOne({ _id: id, userId: jwtPayload.id });
        const response = result.acknowledged ? {success:true, message: `Category Deleted successfully!` } : {success:false, message: `${id} Not Found!` };

        createNotification({
            userId: jwtPayload.id,
            message: `A category ${category?.category || ''} has been deleted!`,
            type: 'info',
            read: false,
            createdAt: new Date()
        })

        return response;
    } catch (err: any) {
        console.log('Error:', err);
        set.status = 500;
        return {success:false, message: 'Something went wrong!' };
    }
}

export const updateCategory = async (id: ObjectId, body: any, set: any, jwtPayload: JwtPayload) => {
    try {
        if (!ObjectId.isValid(id)) {
            set.status = 400;
            return {success:false, message: 'Invalid Id!' };
        }

        if (!body) {
            set.status = 400;
            return {success:false, message: 'Nothing to update!' };
        }

        const validatedData = CategorySchema.parse(body);
        const toBeUpdatedData = {
            ...validatedData,
            updatedAt: new Date()
        }
        const category = await categories.findOne({ _id: id, userId: jwtPayload.id });
        const result = await categories.updateOne({ _id: id, userId: jwtPayload.id }, { $set: toBeUpdatedData });
        if (!result.acknowledged) {
            set.status = 404;
            return {success:true, message: `${id} failed to update!` };
        }

        createNotification({
            userId: jwtPayload.id,
            message: `A category ${category?.category || ''} has been updated to ${validatedData.category}!`,
            type: 'info',
            read: false,
            createdAt: new Date()
        })

        return {success:true, message: `Category Updated successfully!` };
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            set.status = 400;
            return { message: "Invalid category data", errors: err.errors };
        }
        console.log('Error:', err);
        set.status = 500;
        return { message: 'Something went wrong!' };
    }
}

export const toggleActiveStatus = async (id: ObjectId, body: any, set: any, jwtPayload: JwtPayload) => {
    try {
        if (!ObjectId.isValid(id)) {
            set.status = 400;
            return {success:false, message: 'Invalid Id!' };
        }

        const validatedData = ToggleActiveSchema.parse(body);
        const category = await categories.findOne({ _id: id, userId: jwtPayload.id });
        
        createNotification({
            userId: jwtPayload.id,
            message: `A category ${category?.category || ''} has been ${validatedData.active ? 'activated' : 'deactivated'}!`,
            type: 'info',
            read: false,
            createdAt: new Date()
        })
        
        await categories.findOneAndUpdate({ _id: id, userId: jwtPayload.id }, { $set: { ...validatedData } });
        return {success:true, message: `Updated category active status` };
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            set.status = 400;
            console.log( 'Zod Error:', err.errors)
            return {success: false, message: "Invalid active status data" };
        }
        console.log('Error:', err);
        set.status = 500;
        return {success: false, message: 'Something went wrong!' };
    }
}

export const getCategoryCount = async (set:any,jwtPayload:JwtPayload,query:{for:string}) =>{
    try{
        const expression = query.for === 'budget' ? {userId:jwtPayload.id,active:{$ne:false}} : {userId:jwtPayload.id};
        const count = await categories.countDocuments(expression);
        return {success:true, count};
    }catch(err:any){
        console.log('Count Error:',err);
        return {success:false, message: 'Something went wrong!'};
    }
}