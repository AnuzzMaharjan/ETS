import {MongoClient} from 'mongodb';

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

try{
    await client.connect();
}catch(error : unknown){
    throw new Error('Error Connecting database: ' + error);
}
const db = client.db('expense_tracking');

export const users = db.collection('users');
export const categories = db.collection('categories');
export const expenses = db.collection('expenses');
export const budgets = db.collection('budget');
export const otps = db.collection('otps');
export const notifications = db.collection('notifications');