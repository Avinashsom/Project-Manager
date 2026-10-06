import { text } from "express";
import Mailgen from "mailgen";
import nodemailer from "nodemailer"

//it can putting the branding on mailgen 
const sendEmail = async (options) => {
    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "Task Manager",
            link: "https://taskmanagerlink.com"
        }
    })

    const emailTextual = mailGenerator.generatePlaintext(options.mailgenContent) //generatePlaintext -> it can generate mail for user who doesn't support HTML

    const emailHtml = mailGenerator.generate(options.mailgenContent) //generate -> it can generate mail for user who support HTML

    //it can send the mail -> nodemailer
    const transporter = nodemailer.createTransport({
        host:process.env.MAILTRAP_SMTP_HOST,
        port:process.env.MAILTRAP_SMTP_PORT,
        auth: {
            user:process.env.MAILTRAP_SMTP_USER,
            pass:process.env.MAILTRAP_SMTP_PASS
        }
    })

    const mail = {
        from: "mail.taskmanager.com",
        to: options.email,
        subject: options.subject,
        text: emailTextual,
        html: emailHtml //if browser support html, it send automatically
    }

    try {
        await transporter.sendMail(mail)
    } catch (error) {
        console.error("email send error , mailtrap auth provide ")
        console.error("Error : ", error)
    }
}




const emailVerificationMailgenContent = (username, verficationUrl) => {
    return {
        body: {
            name: username,
            intro: "welcome to our app! we are exicted to yoou on board",
            action: {
                instructions: "To verify your email, click on following button",
                button: {
                    color: "#18ae59",
                    text: "verify your email",
                    link: verficationUrl
                },
            },
            outro: "Need help, just reply to this email",
        }
    }
}

const forgetPasswordMailgenContent = (username, passwordResetUrl) => {
    return {
        body: {
            name: username,
            intro: "we got a reqest to reset password",
            action: {
                instructions: "To reset your email, click on following button",
                button: {
                    color: "#0d6533",
                    text: "reset password",
                    link: passwordResetUrl
                },
            },
            outro: "Need help, just reply to this email",
        }
    };
};

export {
    emailVerificationMailgenContent,
    forgetPasswordMailgenContent,
    sendEmail
}