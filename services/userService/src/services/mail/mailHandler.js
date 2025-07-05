const nodemailer = require('nodemailer');
const axios = require("axios");
const Handlebars = require('handlebars');

/*
  TemplateId:
  2 -> Welcome + email verification template

*/

const {
  SMTP_HOST,
  SMTP_PORT,
  SMTP_SECURITY,
  SMTP_USERNAME,
  SMTP_PASSWORD,
  BREVO_API_KEY
} = process.env;

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: parseInt(SMTP_PORT, 10),
  secure: SMTP_SECURITY === 'true',
  auth: {
    user: SMTP_USERNAME,
    pass: SMTP_PASSWORD,
  },
});

const getTemplateDetails = async (templateId) => {
  try {
    const response = await axios.get(`https://api.brevo.com/v3/smtp/templates/${templateId}`, {
      headers: {
        accept: "application/json",
        "api-key": BREVO_API_KEY,
      },
    });
    // console.log("36: ", response);
    return response.data;
  } catch (error) {
    console.error("Error getting Template details:", error?.response?.data || error.message);
    return null;
  }
};

exports.sendMail = async (templateId, data) => {
  try {

    const source = await getTemplateDetails(templateId);
    if (!source?.htmlContent) {
      console.log(`No template content found for templateId: ${templateId}`);
      return false;
    }
    const template = Handlebars.compile(source?.htmlContent);
    const htmlContent = template(data);

    const mailOptions = {
      to: data.to,
      subject: data?.subject ?? source.subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`Email sent to ${data.to}: ${info.messageId}`);

    return info ? true : false;
  } catch (error) {
    console.error("Error sending email:", error.message);
    // throw error;
    return false;
  }
}


