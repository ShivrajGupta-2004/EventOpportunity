const transporter = require('../config/emailConfig');

const sendSelectionEmail = async (userEmail, userName, eventName, eventDetails, status) => {
    const subject = status === 'approved'
        ? `🎉 Congratulations! Selected for ${eventName}`
        : status === 'rejected'
        ? `Application Update - ${eventName}`
        : `Application Status - ${eventName}`;

    let htmlContent = '';

    if (status === 'approved') {
        // ✅ APPROVED EMAIL - Modern Green Design
        htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh;">
    
    <!-- Main Container -->
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
        <tr>
            <td align="center">
                
                <!-- Email Card -->
                <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
                    
                    <!-- Success Banner -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 50px 40px; text-align: center;">
                            <div style="background: rgba(255,255,255,0.2); width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                                <span style="font-size: 60px;">✅</span>
                            </div>
                            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">Congratulations!</h1>
                            <p style="color: rgba(255,255,255,0.95); margin: 10px 0 0; font-size: 18px; font-weight: 500;">You've Been Selected! 🎊</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            
                            <!-- Greeting -->
                            <h2 style="color: #2d3748; margin: 0 0 15px; font-size: 24px; font-weight: 600;">Dear ${userName},</h2>
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.8; margin: 0 0 30px;">
                                We are thrilled to inform you that you have been <strong style="color: #38ef7d;">successfully selected</strong> for 
                                <strong style="color: #11998e;">${eventName}</strong>! 🌟 Your participation will make this event truly special.
                            </p>
                            
                            <!-- Event Details Card -->
                            <div style="background: linear-gradient(135deg, #f6f8fb 0%, #e9ecef 100%); border-radius: 15px; padding: 30px; margin: 30px 0; border: 2px solid #e2e8f0;">
                                <h3 style="color: #11998e; margin: 0 0 25px; font-size: 20px; font-weight: 700; display: flex; align-items: center;">
                                    <span style="background: #11998e; color: white; width: 35px; height: 35px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 18px;">📅</span>
                                    Event Information
                                </h3>
                                
                                <table width="100%" cellpadding="8" cellspacing="0">
                                    <tr>
                                        <td style="color: #718096; font-weight: 600; font-size: 14px; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">🆔 Event ID</td>
                                        <td style="color: #2d3748; font-weight: 600; padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                                            <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-family: 'Courier New', monospace;">${eventDetails.id || 'N/A'}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="color: #718096; font-weight: 600; font-size: 14px; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">📌 Event Name</td>
                                        <td style="color: #2d3748; font-weight: 700; padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-size: 15px;">${eventDetails.name || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #718096; font-weight: 600; font-size: 14px; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">📆 Date</td>
                                        <td style="color: #2d3748; font-weight: 600; padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${new Date(eventDetails.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #718096; font-weight: 600; font-size: 14px; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">⏰ Time</td>
                                        <td style="color: #2d3748; font-weight: 600; padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${eventDetails.timing || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #718096; font-weight: 600; font-size: 14px; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">📍 Location</td>
                                        <td style="color: #2d3748; font-weight: 600; padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${eventDetails.location || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #718096; font-weight: 600; font-size: 14px; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">🎭 Event Type</td>
                                        <td style="color: #2d3748; font-weight: 600; padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${eventDetails.type || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #718096; font-weight: 600; font-size: 14px; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">👥 Participants</td>
                                        <td style="color: #2d3748; font-weight: 600; padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${eventDetails.participants || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #718096; font-weight: 600; font-size: 14px; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">👔 Dress Code</td>
                                        <td style="color: #2d3748; font-weight: 600; padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${eventDetails.dressCode || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #718096; font-weight: 600; font-size: 14px; padding: 12px 0;">💰 Payment</td>
                                        <td style="color: #11998e; font-weight: 700; padding: 12px 0; text-align: right; font-size: 18px;">₹${eventDetails.payment || 0}</td>
                                    </tr>
                                </table>
                                
                                ${eventDetails.description ? `
                                <div style="margin-top: 25px; padding-top: 20px; border-top: 2px dashed #cbd5e0;">
                                    <p style="color: #718096; font-weight: 700; margin: 0 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">📝 Description</p>
                                    <p style="color: #4a5568; margin: 0; line-height: 1.7; font-size: 14px;">${eventDetails.description}</p>
                                </div>
                                ` : ''}
                            </div>
                            
                            <!-- Important Notice -->
                            <div style="background: linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%); border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 5px solid #f39c12;">
                                <p style="margin: 0; color: #6c5214; font-size: 14px; line-height: 1.6; font-weight: 500;">
                                    <strong style="font-size: 20px; display: block; margin-bottom: 8px;">⚠️ Important Reminder</strong>
                                    Please arrive at the venue 15 minutes before the scheduled time. Bring a valid ID and this confirmation email. For any queries, contact the event administrator.
                                </p>
                            </div>
                            
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: #f7fafc; padding: 30px 40px; text-align: center; border-top: 3px solid #e2e8f0;">
                            <p style="color: #11998e; margin: 0 0 10px; font-size: 16px; font-weight: 700;">✨ Best Wishes for the Event! ✨</p>
                            <p style="color: #a0aec0; margin: 0; font-size: 13px; line-height: 1.6;">
                                This is an automated email notification. Please do not reply to this message.<br>
                                <span style="color: #cbd5e0;">© ${new Date().getFullYear()} Event Management System</span>
                            </p>
                        </td>
                    </tr>
                    
                </table>
                
            </td>
        </tr>
    </table>
    
</body>
</html>
        `;
    } else if (status === 'rejected') {
        // ❌ REJECTED EMAIL - Modern Red Design
        htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); min-height: 100vh;">
    
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px;">
        <tr>
            <td align="center">
                
                <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
                    
                    <!-- Header Banner -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); padding: 50px 40px; text-align: center;">
                            <div style="background: rgba(255,255,255,0.2); width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 60px;">📋</span>
                            </div>
                            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">Application Update</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            
                            <h2 style="color: #2d3748; margin: 0 0 15px; font-size: 24px; font-weight: 600;">Dear ${userName},</h2>
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.8; margin: 0 0 30px;">
                                Thank you for your interest in <strong style="color: #eb3349;">${eventName}</strong>. We truly appreciate the time and effort you invested in your application. However, we regret to inform you that your application has <strong style="color: #eb3349;">not been selected</strong> at this time.
                            </p>
                            
                            <!-- Event Details -->
                            <div style="background: linear-gradient(135deg, #f6f8fb 0%, #e9ecef 100%); border-radius: 15px; padding: 30px; margin: 30px 0; border: 2px solid #e2e8f0;">
                                <h3 style="color: #eb3349; margin: 0 0 25px; font-size: 20px; font-weight: 700;">
                                    <span style="background: #eb3349; color: white; width: 35px; height: 35px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 18px;">📅</span>
                                    Event Details
                                </h3>
                                
                                <table width="100%" cellpadding="8" cellspacing="0">
                                    <tr>
                                        <td style="color: #718096; font-weight: 600; font-size: 14px; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">Event ID</td>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">
                                            <span style="background: #fee; color: #c53030; padding: 6px 14px; border-radius: 8px; font-size: 13px; font-family: 'Courier New', monospace; font-weight: 600;">${eventDetails.id || 'N/A'}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="color: #718096; font-weight: 600; font-size: 14px; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">Event Name</td>
                                        <td style="color: #2d3748; font-weight: 700; padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${eventDetails.name || 'N/A'}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #718096; font-weight: 600; font-size: 14px; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">Date</td>
                                        <td style="color: #2d3748; font-weight: 600; padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${new Date(eventDetails.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #718096; font-weight: 600; font-size: 14px; padding: 12px 0;">Location</td>
                                        <td style="color: #2d3748; font-weight: 600; padding: 12px 0; text-align: right;">${eventDetails.location || 'N/A'}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Encouragement Box -->
                            <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); border-radius: 12px; padding: 25px; margin: 25px 0; border-left: 5px solid #4299e1;">
                                <p style="margin: 0; color: #2c5282; font-size: 15px; line-height: 1.7; font-weight: 500;">
                                    <strong style="font-size: 20px; display: block; margin-bottom: 10px;">💙 Don't Give Up!</strong>
                                    We see your enthusiasm and dedication. This is just one opportunity among many. Keep applying, keep growing, and success will follow. We encourage you to participate in our upcoming events!
                                </p>
                            </div>
                            
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: #f7fafc; padding: 30px 40px; text-align: center; border-top: 3px solid #e2e8f0;">
                            <p style="color: #718096; margin: 0 0 5px; font-size: 14px;">Thank you for your interest and participation.</p>
                            <p style="color: #cbd5e0; margin: 0; font-size: 12px;">This is an automated notification. Please do not reply.</p>
                        </td>
                    </tr>
                    
                </table>
                
        </tr>
    </table>
    
</body>
</html>
        `;
    } else {
        // PENDING OR OTHER
        htmlContent = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 20px;">
    <div style="background: white; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 10px;">
        <h2 style="color: #333;">Dear ${userName},</h2>
        <p style="font-size: 16px; color: #555;">
            Your application for <strong>${eventName}</strong> is currently: <strong style="color: #007bff;">${status}</strong>
        </p>
        <p style="color: #777;">Event ID: <code>${eventDetails.id}</code></p>
    </div>
</body>
</html>
        `;
    }

    const mailOptions = {
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: userEmail,
        subject,
        html: htmlContent
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email successfully sent to: ${userEmail}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return { success: false, error: error.message };
    }
};

// Payment Email Function with Download Receipt Button
const sendPaymentEmail = async (userEmail, userName, eventName, eventDetails, paymentDetails) => {
    const subject = `💰 Payment Confirmation - ${eventName}`;


    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f7fa;">
    
    <!-- Main Container -->
    <table width="100%" cellpadding="0" cellspacing="0" style="padding: 40px 20px; background-color: #f5f7fa;">
        <tr>
            <td align="center">
                
                <!-- Email Card -->
                <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 20px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); overflow: hidden;">
                    
                    <!-- Success Banner -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 50px 40px; text-align: center;">
                            <div style="background: rgba(255,255,255,0.2); width: 100px; height: 100px; border-radius: 50%; margin: 0 auto 20px; display: inline-block; line-height: 100px;">
                                <span style="font-size: 60px;">💰</span>
                            </div>
                            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">Payment Received!</h1>
                            <p style="color: rgba(255,255,255,0.95); margin: 10px 0 0; font-size: 18px; font-weight: 500;">Transaction Successful ✅</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            
                            <!-- Greeting -->
                            <h2 style="color: #2d3748; margin: 0 0 15px; font-size: 24px; font-weight: 600;">Dear ${userName},</h2>
                            <p style="color: #4a5568; font-size: 16px; line-height: 1.8; margin: 0 0 30px;">
                                Your payment for <strong style="color: #667eea;">${eventName}</strong> has been <strong style="color: #10b981;">successfully received and processed</strong>! 🎉 Thank you for your participation.
                            </p>
                            
                            
                            <!-- Transaction Summary Card -->
                            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 15px; padding: 30px; margin: 30px 0; border: 2px solid #86efac;">
                                <h3 style="color: #059669; margin: 0 0 25px; font-size: 20px; font-weight: 700;">
                                    <span style="background: #10b981; color: white; width: 35px; height: 35px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 18px;">💳</span>
                                    Transaction Details
                                </h3>
                                
                                <table width="100%" cellpadding="8" cellspacing="0">
                                    <tr>
                                        <td style="color: #065f46; font-weight: 600; font-size: 14px; padding: 12px 0; border-bottom: 1px solid #86efac;">🆔 Transaction ID</td>
                                        <td style="padding: 12px 0; border-bottom: 1px solid #86efac; text-align: right;">
                                            <span style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-family: 'Courier New', monospace; font-weight: 700;">${paymentDetails.transactionId}</span>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="color: #065f46; font-weight: 600; font-size: 14px; padding: 12px 0; border-bottom: 1px solid #86efac;">💰 Amount Paid</td>
                                        <td style="color: #059669; font-weight: 700; padding: 12px 0; border-bottom: 1px solid #86efac; text-align: right; font-size: 24px;">₹${paymentDetails.paymentAmount.toLocaleString('en-IN')}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #065f46; font-weight: 600; font-size: 14px; padding: 12px 0; border-bottom: 1px solid #86efac;">💳 Payment Mode</td>
                                        <td style="color: #2d3748; font-weight: 600; padding: 12px 0; border-bottom: 1px solid #86efac; text-align: right;">${paymentDetails.paymentMode}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #065f46; font-weight: 600; font-size: 14px; padding: 12px 0; border-bottom: 1px solid #86efac;">📅 Payment Date</td>
                                        <td style="color: #2d3748; font-weight: 600; padding: 12px 0; border-bottom: 1px solid #86efac; text-align: right;">${new Date(paymentDetails.paymentDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #065f46; font-weight: 600; font-size: 14px; padding: 12px 0;">✅ Status</td>
                                        <td style="padding: 12px 0; text-align: right;">
                                            <span style="background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; font-size: 13px; font-weight: 700; text-transform: uppercase;">Completed</span>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Event Details Card -->
                            <div style="background: linear-gradient(135deg, #f6f8fb 0%, #e9ecef 100%); border-radius: 15px; padding: 30px; margin: 30px 0; border: 2px solid #e2e8f0;">
                                <h3 style="color: #667eea; margin: 0 0 25px; font-size: 20px; font-weight: 700;">
                                    <span style="background: #667eea; color: white; width: 35px; height: 35px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-right: 12px; font-size: 18px;">📅</span>
                                    Event Information
                                </h3>
                                
                                <table width="100%" cellpadding="8" cellspacing="0">
                                    <tr>
                                        <td style="color: #718096; font-weight: 600; font-size: 14px; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">Event ID</td>
                                        <td style="color: #2d3748; font-weight: 600; padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;"><code style="background: #e2e8f0; padding: 4px 8px; border-radius: 4px;">${eventDetails.id}</code></td>
                                    </tr>
                                    <tr>
                                        <td style="color: #718096; font-weight: 600; font-size: 14px; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">Event Name</td>
                                        <td style="color: #2d3748; font-weight: 700; padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${eventDetails.name}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #718096; font-weight: 600; font-size: 14px; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">Event Date</td>
                                        <td style="color: #2d3748; font-weight: 600; padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${new Date(eventDetails.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</td>
                                    </tr>
                                    <tr>
                                        <td style="color: #718096; font-weight: 600; font-size: 14px; padding: 12px 0;">Location</td>
                                        <td style="color: #2d3748; font-weight: 600; padding: 12px 0; text-align: right;">${eventDetails.location}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Important Notice -->
                            <div style="background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); border-radius: 12px; padding: 20px; margin: 25px 0; border-left: 5px solid #3b82f6;">
                                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6; font-weight: 500;">
                                    <strong style="font-size: 16px; display: block; margin-bottom: 8px;">📌 Important</strong>
                                    Please keep this email as proof of payment. If you have any questions regarding your payment, please contact the event administrator with your transaction ID.
                                </p>
                            </div>
                            
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: #f7fafc; padding: 30px 40px; text-align: center; border-top: 3px solid #e2e8f0;">
                            <p style="color: #667eea; margin: 0 0 10px; font-size: 16px; font-weight: 700;">✨ Thank You for Your Payment! ✨</p>
                            <p style="color: #a0aec0; margin: 0; font-size: 13px; line-height: 1.6;">
                                This is an automated payment confirmation. Please do not reply to this message.<br>
                                <span style="color: #cbd5e0;">© ${new Date().getFullYear()} Event Management System</span>
                            </p>
                        </td>
                    </tr>
                    
                </table>
                
            </td>
        </tr>
    </table>
    
</body>
</html>
    `;

    const mailOptions = {
        from: process.env.EMAIL_USER || 'your-email@gmail.com',
        to: userEmail,
        subject,
        html: htmlContent
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Payment confirmation email sent to: ${userEmail}`);
        return { success: true };
    } catch (error) {
        console.error('❌ Payment email failed:', error);
        return { success: false, error: error.message };
    }
};

// Export both functions
module.exports = { sendSelectionEmail, sendPaymentEmail };