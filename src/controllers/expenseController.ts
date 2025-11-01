import { budgets, categories, expenses } from "../db/mongo";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { ExpenseSchema } from "../routes/expense.routes";
import { ExpenseBody, JwtPayload, QueryParams } from "../types";
import { sendExcessExpenseMail } from "../middlewares/mailer";
import { getPrimaryBudget } from "./budgetController";
import { createNotification } from "./notificationController";

export const getAllExpenses = async (
  set: any,
  query: QueryParams,
  jwtPayload: JwtPayload
) => {
  try {
    const { page, limit } = query;
    const offset = (page - 1) * limit;

    const filter =
      query.startDate && query.endDate
        ? {
            userId: jwtPayload.id,
            createdAt: {
              $gte: new Date(query.startDate),
              $lte: new Date(
                new Date(query.endDate).setDate(
                  new Date(query.endDate).getDate() + 1
                )
              ),
            },
          }
        : query.startDate && !query.endDate
        ? {
            userId: jwtPayload.id,
            createdAt: {
              $gte: new Date(query.startDate),
              $lte: new Date(),
            },
          }
        : !query.startDate && query.endDate
        ? {
            userId: jwtPayload.id,
            createdAt: {
              $lte: new Date(
                new Date(query.endDate).setDate(
                  new Date(query.endDate).getDate() + 1
                )
              ),
            },
          }
        : { userId: jwtPayload.id };

    const result = await expenses
      .find(filter, { projection: { userId: 0 } })
      .skip(offset)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();
    return { success: true, data: result };
  } catch (err: any) {
    console.log("Error:", err);
    set.status = 500;
    return { message: "Something went wrong!" };
  }
};

export const createNewExpense = async (
  body: ExpenseBody,
  set: any,
  jwtPayload: JwtPayload
) => {
  try {
    const validatedData = ExpenseSchema.parse(body);

    const categoryData = await categories.findOne({
      userId: jwtPayload.id || new ObjectId(jwtPayload.id),
      category: validatedData.category,
    });
    if (!categoryData) {
      set.status = 404;
      return {
        success: false,
        message: "Category not found! Please create a new category first.",
      };
    }
    const newInsertData = {
      ...validatedData,
      userId: jwtPayload.id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = await expenses.insertOne(newInsertData);
    if (!result.acknowledged) {
      set.status = 500;
      return { success: false, message: "Failed to create expense!" };
    }

    const categoryBudget = await budgets.findOne({
      userId: jwtPayload.id,
      category: validatedData.category,
    });
    const totalCurrentCategoryExpense = await expenses
      .aggregate([
        {
          $match: {
            category: new RegExp(`^${validatedData.category}$`, "i"),
            userId: jwtPayload.id,
          },
        },
        { $group: { _id: null, total: { $sum: "$expense" } } },
      ])
      .toArray();

    const cBudget = categoryBudget?.budget || 0;
    const tExpense = totalCurrentCategoryExpense[0]?.total || 0;
    const diff = tExpense - cBudget;

    if(diff === 0 && (cBudget !== 0 && tExpense !== 0)){
      createNotification({
        userId: jwtPayload.id,
        message: `You have reached your budget limit of Rs.${Math.abs(cBudget)} for ${validatedData.category}! Please refrain from spending more!`,
        read: false,
        type: "warning",
        createdAt: new Date()
      })
    }else if(diff > 0){
      createNotification({
        userId: jwtPayload.id,
        message: `You have exceeded your budget limit of ${cBudget} by Rs.${Math.abs(diff)} for ${validatedData.category}! Please manage your expenses carefully!`,
        read: false,
        type: "error",
        createdAt: new Date()
      })
    }else if(diff < 0){
      createNotification({
        userId: jwtPayload.id,
        message: `Expense for ${validatedData.category} has been increased by Rs.${Math.abs(validatedData.expense)}! Remaining expendable budget is Rs.${Math.abs(diff)}`,
        read: false,
        type: "info",
        createdAt: new Date()
      })
    }

    if (tExpense !== 0 && cBudget < tExpense) {
      sendExcessExpenseMail(diff, jwtPayload.email, validatedData.category);
    } else if (tExpense !== 0 && cBudget == tExpense) {
      sendExcessExpenseMail(0, jwtPayload.email, validatedData.category);
    }

    return { success: true, message: "New Expense created!" };
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      set.status = 400;
      return { message: "Invalid expense data", errors: err.errors };
    }
    console.log(err);
    set.status = 500;
    return { message: "Something went wrong!" };
  }
};

export const deleteExpense = async (id: ObjectId, set: any,jwtPayload:JwtPayload) => {
  try {
    if (!ObjectId.isValid(id)) {
      set.status = 400;
      return { message: "Invalid Id!" };
    }
    const entry = await expenses.findOne({ _id: id, userId: jwtPayload.id });
    const result = await expenses.deleteOne({ _id: id, userId: jwtPayload.id });
    const response = result.acknowledged
      ? { success: true, message: `${id} Deleted successfully!` }
      : { success: false, message: `${id} Not Found!` };

      createNotification({
        userId: jwtPayload.id,
        message: `An expense entry ${entry?.description} of Rs.${entry?.expense} has been deleted for ${entry?.category}!`,
        type: 'info',
        read: false,
        createdAt: new Date()
      })

    return response;
  } catch (err: any) {
    console.log("Error:", err);
    set.status = 500;
    return { success: true, message: "Something went wrong!" };
  }
};

export const updateExpense = async (
  id: ObjectId,
  body: any,
  set: any,
  jwtPayload: JwtPayload
) => {
  try {
    if (!ObjectId.isValid(id)) {
      set.status = 400;
      return { success: false, message: "Invalid Id!" };
    }

    if (!body) {
      set.status = 400;
      return { success: false, message: "Nothing to update!" };
    }

    const validatedData = ExpenseSchema.parse(body);
    const toBeUpdatedData = {
      ...validatedData,
      updatedAt: new Date(),
    };


    const expense = await expenses.findOne({ _id: id, userId: jwtPayload.id });
    const result = await expenses.updateOne(
      { _id: id },
      { $set: toBeUpdatedData }
    );
    if (!result.acknowledged) {
      set.status = 404;
      return { success: false, message: `Expense failed to update!` };
    }

    const categoryBudget = await budgets.findOne({
      userId: jwtPayload.id,
      category: validatedData.category,
    });
    const totalCurrentCategoryExpense = await expenses
      .aggregate([
        {
          $match: {
            category: new RegExp(`^${validatedData.category}$`, "i"),
            userId: jwtPayload.id,
          },
        },
        { $group: { _id: null, total: { $sum: "$expense" } } },
      ])
      .toArray();

    const cBudget = categoryBudget?.budget || 0;
    const tExpense = totalCurrentCategoryExpense[0]?.total || 0;
    const diff = tExpense - cBudget;

    if(diff === 0 && (cBudget !== 0 && tExpense !== 0)){
      createNotification({
        userId: jwtPayload.id,
        message: `You have reached your budget limit of Rs.${Math.abs(cBudget)} for ${validatedData.category}! Please refrain from spending more!`,
        read: false,
        type: "warning",
        createdAt: new Date()
      })
    }else if(diff > 0){
      createNotification({
        userId: jwtPayload.id,
        message: `You have exceeded your budget limit of ${cBudget} by Rs.${Math.abs(diff)} for ${validatedData.category}! Please manage your expenses carefully!`,
        read: false,
        type: "error",
        createdAt: new Date()
      })
    }else if(diff < 0){
      createNotification({
        userId: jwtPayload.id,
        message: `Expense for ${validatedData.category} has been ${(expense?.expense - validatedData.expense) > 0 ? 'decreased' : 'increased'} by Rs.${Math.abs(expense?.expense - validatedData.expense)}! Remaining expendable budget is Rs.${Math.abs(diff)}`,
        read: false,
        type: "info",
        createdAt: new Date()
      })
    }

    if (tExpense !== 0 && cBudget < tExpense) {
      sendExcessExpenseMail(diff, jwtPayload.email, validatedData.category);
    } else if (tExpense !== 0 && cBudget == tExpense) {
      sendExcessExpenseMail(0, jwtPayload.email, validatedData.category);
    }

    return { success: true, message: `Expense Updated successfully!` };
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      set.status = 400;
      return {
        success: false,
        message: "Invalid expense data",
        errors: err.errors,
      };
    }
    console.log("Error:", err);
    set.status = 500;
    return { success: false, message: "Something went wrong!" };
  }
};
export const getExpenseCount = async (
  set: any,
  jwtPayload: JwtPayload,
  query: QueryParams
) => {
  try {
    const { page, limit } = query;
    const offset = (page - 1) * limit;
    const filter =
      query.startDate && query.endDate
        ? {
            userId: jwtPayload.id,
            createdAt: {
              $gte: new Date(query.startDate),
              $lte: new Date(
                new Date(query.endDate).setDate(
                  new Date(query.endDate).getDate() + 1
                )
              ),
            },
          }
        : query.startDate && !query.endDate
        ? {
            userId: jwtPayload.id,
            createdAt: {
              $gte: new Date(query.startDate),
              $lte: new Date(),
            },
          }
        : !query.startDate && query.endDate
        ? {
            userId: jwtPayload.id,
            createdAt: {
              $lte: new Date(
                new Date(query.endDate).setDate(
                  new Date(query.endDate).getDate() + 1
                )
              ),
            },
          }
        : { userId: jwtPayload.id };
    const count = await expenses.countDocuments(filter);
    return { success: true, count: count - offset };
  } catch (err: any) {
    console.log("Count Error:", err);
    set.status = 500;
    return { success: false, message: "Something went wrong!" };
  }
};

export const getExpensesPerDay = async (set: any, jwtPayload: JwtPayload) => {
  try {
    function getMonthRange() {
      const now = new Date();

      // Start of the month
      const start = new Date(
        Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      );

      // End of the month (start of next month minus 1 ms)
      const end = new Date(
        Date.UTC(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)
      );

      return { start, end };
    }

    const { start, end } = getMonthRange();
    const [totalMonthlyExpense] = await expenses
      .aggregate([
        {
          $match: {
            userId: jwtPayload.id,
            createdAt: {
              $gte: start,
              $lte: end,
            },
          },
        },
        {
          $facet: {
            perDayExpenses: [
              {
                $group: {
                  _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
                  },
                  total: { $sum: "$expense" },
                },
              },
              {
                $sort: { _id: -1 },
              },
            ],
            monthlyExpense: [
              {
                $group: {
                  _id: null,
                  total: { $sum: "$expense" },
                },
              },
            ],
          },
        },
      ])
      .toArray();

    const primaryBudget = await getPrimaryBudget(set, jwtPayload);
    return {
      success: true,
      data: {
        ...totalMonthlyExpense,
        primaryBudget: primaryBudget?.data?.budget || 0,
        percentageExpense:
          (primaryBudget?.data?.budget || 0) !== 0
            ? ((totalMonthlyExpense?.monthlyExpense[0]?.total || 0) /
                (primaryBudget?.data?.budget || 0)) *
              100
            : 0,
      },
    };
  } catch (err: any) {
    console.log("Error:", err);
    set.status = 500;
    return { success: false, message: "Something went wrong!" };
  }
};

export const getExpensesToday = async (set: any,query:{from:string,to:string}, jwtPayload: JwtPayload) => {
  try {
    const categoryArr = await categories
      .find(
        { userId: jwtPayload.id, active: { $ne: false } },
        { projection: { userId: 0, createdAt: 0, updatedAt: 0, active: 0 } }
      )
      .toArray();

      let filter: object = {};

      if(query.from && query.to){
        filter = {
          $gte: new Date(new Date(query.from).setUTCHours(0, 0, 0, 0)),
          $lte: new Date(new Date(query.to).setUTCHours(23, 59, 59, 999)),
        }
              
      }else if(query.from && !query.to){
        filter = {
          $gte: new Date(new Date(query.from).setUTCHours(0, 0, 0, 0)),
          $lte: new Date(new Date().setUTCHours(23, 59, 59, 999))
        }
        
      }else if(!query.from && query.to){
        filter = {
          $gte: new Date(new Date(new Date().getUTCFullYear(), new Date().getUTCMonth(), 2).setUTCHours(0, 0, 0, 0)),
          $lte: new Date(new Date(query.to).setUTCHours(23, 59, 59, 999))
        }
      }else{
        filter = {
          $gte: new Date(new Date().setUTCHours(0, 0, 0, 0)),
          $lte: new Date(new Date().setUTCHours(23, 59, 59, 999))
        }  
      }

    const expensesToday = await Promise.all(
      categoryArr.map(async (cat: any) => {
        const result =  await expenses
          .aggregate([
            {
              $match: {
                userId: jwtPayload.id,
                category: cat.category,
                createdAt: filter
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$expense" },
              },
            }
          ])
          .toArray();

          return {
            category: cat.category,
            expense: result[0]?.total || 0
          }
      })
    );
    const expensesYesterday = await Promise.all(
      categoryArr.map(async (cat: any) => {
        const result =  await expenses
          .aggregate([
            {
              $match: {
                userId: jwtPayload.id,
                category: cat.category,
                createdAt: {
                    $gte: new Date(new Date(new Date().setUTCDate(new Date().getUTCDate() - 1)).setUTCHours(0, 0, 0, 0)),
                    $lt: new Date(new Date().setUTCHours(0, 0, 0, 0))
                }
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: "$expense" },
              },
            }
          ])
          .toArray();

          return {
            category: cat.category,
            expense: result[0]?.total || 0
          }
      })
    );
    return { success: true, data: {expensesToday, expensesYesterday} };
  } catch (err: any) {
    console.log("Error:", err);
    set.status = 500;
    return { success: false, message: "Something went wrong!" };
  }
};
