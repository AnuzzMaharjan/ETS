export type JwtPayload = {
    id: string;
    email:string;
    role: string;
}

export type QueryParams = {
    page: number;
    limit: number;
    startDate?: string;
    endDate?: string;
    for?: string;
}

export type OTPEntry = {
    code: string;
    expiresAt: number;
}

export type ExpenseBody = {
    expense: number;
    category: string;
    description: string;
}

type NotificationType = 'info' | 'warning' | 'error';
export type NotificationCreate = {
    userId: string;
    message: string;
    createdAt: Date;
    read: boolean;
    type: NotificationType;
}