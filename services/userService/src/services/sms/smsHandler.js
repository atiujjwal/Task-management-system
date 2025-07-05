const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_FROM_PHONE_NUMBER
} = process.env;

const twilio = require("twilio");

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);


exports.sendSms = async (data) => {
    try {
        const response = await client.messages.create({
            from: TWILIO_FROM_PHONE_NUMBER,
            to: data.mobile,
            body: data.body
        })
        // console.log("78: ", response);
        
        if (response.body) {
            console.log(`SMS sent successfully with messageId: ${response.sid}`);  
            return true;
        }
        console.log(`Failed to send message to : ${data.mobile}`);
        return false;

    } catch (error) {
        console.log("Error sending SMS: ", error);
        return false;
    }
}
