// routes/receiptRoutes.js
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit'); // Install: npm install pdfkit

router.get('/download', async (req, res) => {
    try {
        const { txn, email } = req.query;
        
        // Database se payment details fetch karo
        const payment = await Payment.findOne({ 
            transactionId: txn, 
            userEmail: email 
        });
        
        if (!payment) {
            return res.status(404).json({ error: 'Receipt not found' });
        }

        // PDF Generate karo
        const doc = new PDFDocument();
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=receipt-${txn}.pdf`);
        
        // PDF stream start
        doc.pipe(res);
        
        // PDF Content
        doc.fontSize(20).text('Payment Receipt', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Transaction ID: ${payment.transactionId}`);
        doc.text(`Amount: ₹${payment.paymentAmount}`);
        doc.text(`Date: ${new Date(payment.paymentDate).toLocaleDateString('en-IN')}`);
        doc.text(`Payment Mode: ${payment.paymentMode}`);
        doc.text(`Event: ${payment.eventName}`);
        
        // PDF finalize
        doc.end();
        
    } catch (error) {
        console.error('Receipt download error:', error);
        res.status(500).json({ error: 'Failed to generate receipt' });
    }
});

module.exports = router;