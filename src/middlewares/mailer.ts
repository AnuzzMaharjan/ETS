import nodeMailer from "nodemailer";

const transporter = nodeMailer.createTransport({
    service: 'gmail',
    auth: {
        user: Bun.env.MAIL_EMAIL,
        pass: Bun.env.MAIL_APP_PASS
    }
})

export const sendMail = (to: string, subject: string, text: string) => {
    const mailOptions = {
        from: Bun.env.MAIL_EMAIL,
        to: to,
        subject: subject,
        text: text
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            throw new Error('Error sending mail: ', error);
        }
        console.log('Email sent: ', info.response);
        return 1;
    })
}

export const sendExcessExpenseMail = (diff: number, email: string, category:string = '') => {
    const cat  = category ? `for ${category}` : '';
    const subject = 'Notice: Excess Expense Alert!';
    const message = diff ===0 ? `You have reached your budget limit ${cat}` :`You have exceeded your budget ${cat} by - - - - ${diff}! Please be mindful of your expenses.`;
    sendMail(email, subject, message);
}