import { budgets, categories, expenses } from "../db/mongo";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { BudgetSchema } from "../routes/budget.routes";
import { JwtPayload, QueryParams } from "../types";
import { createNotification } from "./notificationController";


export const getBudget = async (id: string, set: any) => {
    try {
        if (!ObjectId.isValid(id)) {
            set.status = 400;
            return { message: 'Invalid Id!' };
        }
        return budgets.findOne({ userId: new ObjectId(id) });
    } catch (err: any) {
        console.log("Error:", err);
        set.status = 500;
        return { message: 'Something went wrong!' };
    }
}

export const getAllBudgets = async (set: any, query: QueryParams, jwtPayload: JwtPayload) => {
    try {
        const { page, limit } = query;
        const offset = (page - 1) * limit;
        return await budgets.find({ userId: jwtPayload.id || new ObjectId(jwtPayload.id) }).skip(offset).limit(limit).toArray();
    } catch (err: any) {
        console.log("Error:", err);
        set.status = 500;
        return { message: 'Something went wrong!' };
    }
}

export const getPrimaryBudget = async (set: any, jwtPayload: JwtPayload) => {
    try {
        const primaryBudget = await budgets.findOne({ userId: jwtPayload.id, category: 'main' }, { projection: { userId: 0 } });
        if (primaryBudget) {
            set.status = 200;
            return { success: true, data: primaryBudget };
        } else {
            set.status = 204;
            return { success: false, message: "Not found!" }
        }
    } catch (err: any) {
        console.log("Error:", err);
        set.status = 500;
        return { message: 'Something went wrong!' };
    }
}

export const updateBudget = async (body: any, set: any, jwtPayload: JwtPayload) => {
    try {
        const validatedData = BudgetSchema.parse(body);
        const insertData = {
            ...validatedData,
            userId: jwtPayload.id,
            category: 'main',
            createdAt: new Date(),
            updatedAt: new Date()
        }
        const updateData = {
            ...validatedData,
            updatedAt: new Date()
        }
        const repeated = await budgets.findOne({ userId: jwtPayload.id });
        let result;
        let response;
        if (repeated) {
            result = await budgets.updateOne({ userId: jwtPayload.id }, { $set: { ...updateData } });
            response = result.acknowledged ? { success: true, message: "Updated successfully!" } : { success: false, message: "Update failed!" };
        } else {
            result = await budgets.insertOne(insertData);
            response = result.acknowledged ? { success: true, message: "Insert successfully!" } : { success: false, message: "Insert failed!" };
        }
        createNotification({
            userId: jwtPayload.id,
            message: `Your total budget has been updated to Rs.${validatedData.budget}!`,
            type: 'info',
            read: false,
            createdAt: new Date()
        })
        return response;
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            set.status = 400;
            return { message: "Invalid budget data", errors: err.errors };
        }
        console.log('Error:', err);
        set.status = 500;
        return { message: 'Something went wrong!' };
    }
}

export const categoryBudget = async (category: string, body: any, set: any, jwtPayload: JwtPayload) => {
    try {
        let validatedData = BudgetSchema.parse(body);

        const categoryData = await categories.findOne({ userId: jwtPayload.id, category: category });

        const prevAllocatedBudget = await budgets.aggregate([{ $match: { userId: jwtPayload.id, $and:[{category: { $ne: 'main' }},{categories: { $regex: `^${category}$`, $options: "i" }}] } }, { $group: { _id: null, total: { $sum: "$budget" } } }]).toArray();

        const primeBudget = await budgets.findOne({ userId: jwtPayload.id, category: 'main' });

        if ((prevAllocatedBudget[0]?.total || 0) + validatedData.budget > primeBudget?.budget) {
            validatedData.budget = primeBudget?.budget - (prevAllocatedBudget[0]?.total || 0);
        }

        if (!categoryData) {
            set.status = 404;
            return { message: "Category not found! Please create a new category first." };
        }

        const insertData = {
            ...validatedData,
            userId: jwtPayload.id,
            category: category,
            createdAt: new Date(),
            updatedAt: new Date()
        }
        const updateData = {
            ...validatedData,
            updatedAt: new Date()
        }
        const repeated = await budgets.findOne({ userId: jwtPayload.id, category: category });
        let result;
        let response;
        if (!repeated) {
            result = await budgets.insertOne(insertData);
            response = result.acknowledged ? { success: true, message: "Insert successfully!" } : { success: false, message: "Insert failed!" };
        } else {
            result = await budgets.updateOne({ userId: jwtPayload.id, category: category }, { $set: { ...updateData } });
            response = result.acknowledged ? { success: true, message: "Updated successfully!" } : { success: false, message: "Update failed!" };
        }
        const totalAllocatedBudget = await budgets.aggregate([{ $match: { userId: jwtPayload.id, category: { $ne: 'main' } } }, { $group: { _id: null, total: { $sum: "$budget" } } }]).toArray();

        createNotification({
            userId: jwtPayload.id,
            message: `Budget of Rs.${validatedData.budget} has been allocated to ${category}!`,
            type: 'info',
            read: false,
            createdAt: new Date()
        })

        return { ...response, totalAllocatedBudget: totalAllocatedBudget[0]?.total || 0 };
    } catch (err: any) {
        if (err instanceof z.ZodError) {
            set.status = 400;
            return { success: false, message: "Invalid budget data", errors: err.errors };
        }
        console.log('Error:', err);
        set.status = 500;
        return { success: false, message: 'Something went wrong!' };
    }
}

export const getCategoryBudget = async (set: any, query: QueryParams, jwtPayload: JwtPayload) => {
    try {
        let cats;
        if(query.for === "home" || query.for === "reports"){
            cats = await categories.find({ userId: jwtPayload.id, active: { $ne: false } }, { projection: { userId: 0, updatedAt: 0, createdAt: 0 } }).toArray();
        }else{
            const { page, limit } = query;
            const offset = (page - 1) * limit;
    
            cats = await categories.find({ userId: jwtPayload.id, active: { $ne: false } }, { projection: { userId: 0, updatedAt: 0, createdAt: 0 } }).skip(offset).limit(limit).toArray();
        }



        if (cats.length === 0) return { success: true, data: [] };

        const result = await Promise.all(cats.map(async (value) => {
            const catBudget = await budgets.find({ userId: jwtPayload.id, category: { $regex: `^${value.category}$`, $options: "i" } }).toArray();

            const catExpense = await expenses.aggregate([{ $match: { userId: jwtPayload.id,createdAt:{
                $gte: new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), 1, 0, 0, 0, 0)),
                $lte: new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 23, 59, 59, 999)),
            }, category: { $regex: `^${value.category}$`, $options: 'i' }, } }, {
                $group: {
                    _id: null,
                    total: { $sum: "$expense" }
                }
            }]).toArray();

            return { ...value, budget: catBudget[0]?.budget || 0, createdAt: catBudget[0]?.createdAt || null, updatedAt: catBudget[0]?.updatedAt || null, expense: catExpense[0]?.total || 0 };
        }))
        const totalAllocatedBudget = await budgets.aggregate([{ $match: { userId: jwtPayload.id, category: { $ne: 'main' } } }, { $group: { _id: null, total: { $sum: "$budget" } } }]).toArray();
        return { success: true, data: result, totalAllocatedBudget: totalAllocatedBudget[0]?.total || 0 };
    } catch (err: any) {
        console.log("Error:", err);
        set.status = 500;
        return { message: 'Something went wrong!' };
    }
}
