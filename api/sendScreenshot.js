// api/sendScreenshot.js
const sgMail = require('@sendgrid/mail');

// Set your SendGrid API Key as an environment variable
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { imageData } = req.body;

        const msg = {
            to: 'your-email@example.com', // Replace with your recipient email
            from: 'sender-email@example.com', // Replace with your verified sender email
            subject: 'Cart Screenshot from Customer',
            text: 'Here is the cart screenshot attached.',
            attachments: [
                {
                    content: imageData.split(',')[1], // Remove the base64 prefix
                    filename: 'cart_screenshot.png',
                    type: 'image/png',
                    disposition: 'attachment'
                }
            ]
        };

        try {
            await sgMail.send(msg);
            return res.status(200).json({ message: 'Screenshot email sent successfully!' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Failed to send email.' });
        }
    } else {
        return res.status(405).json({ message: 'Method not allowed' });
    }
}
