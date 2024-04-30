import fs from 'fs'
import PDFDocument from 'pdfkit'
import path from 'path'

function createInvoice(invoice, pathVar) {
    // Initialize a new PDF document
    let doc = new PDFDocument({ size: 'A4', margin: 50 });

    // Generate the header section of the invoice
    generateHeader(doc);

    // Generate the customer information section of the invoice
    generateCustomerInformation(doc, invoice);

    // Generate the invoice table section of the invoice
    generateInvoiceTable(doc, invoice);

    // Generate the footer section of the invoice

    doc.end(); // End the document

    // Save the PDF document to the specified file path
    doc.pipe(fs.createWriteStream(path.resolve(`./Files/${pathVar}`)));
}

function generateHeader(doc) {
    // Add company logo and details to the header
    doc
        .image('Icone.jpeg', 50, 45, { width: 50 })
        .fillColor('#444444') // Set fill color to black
        .fontSize(20) // Set font size to 20
        .text('Route', 110, 57) // Company name
        .fillColor('#09c') // Set fill color to blue
        .fontSize(10) // Set font size to 10
        .text('Route', 200, 50, { align: 'left' }) // Company address
        .text('6 tahrir street', 200, 65, { align: 'left' }) // Company address
        .text('Cairo,Egypt', 200, 80, { align: 'left' }) // Company address
        .moveDown(); // Move down
}

function generateCustomerInformation(doc, invoice) {
    // Add invoice title and customer information
    doc.fillColor('#444444').fontSize(20).text('Invoice', 50, 160);

    // Generate a horizontal line
    generateHr(doc, 185);

    // Define the top position for customer information
    const customerInformationTop = 200;

    // Add order code, invoice date, and shipping details
    doc
        .fontSize(10) // Set font size to 10
        .text('Order Code:', 50, customerInformationTop) // Order code label
        .font('Helvetica-Bold') // Set font to bold
        .text(invoice.orderCode, 150, customerInformationTop) // Order code value
        .font('Helvetica') // Set font back to normal
        .text('Invoice Date:', 50, customerInformationTop + 30) // Invoice date label
        .text(formatDate(new Date(invoice.date)), 150, customerInformationTop + 30) // Invoice date value
        .font('Helvetica-Bold') // Set font to bold
        .text(invoice.shipping.name, 300, customerInformationTop) // Shipping name
        .font('Helvetica') // Set font back to normal
        .text(invoice.shipping.address, 300, customerInformationTop + 15) // Shipping address
        .text(
            invoice.shipping.city +
            ', ' +
            invoice.shipping.state +
            ', ' +
            invoice.shipping.country,
            300,
            customerInformationTop + 30,
        ) // Shipping city, state, country

        .moveDown(); // Move down

    // Generate a horizontal line
    generateHr(doc, 252);
}

function generateInvoiceTable(doc, invoice) {
    // Define the top position for the invoice table
    const invoiceTableTop = 330;

    // Set font to bold for table headers
    doc.font('Helvetica-Bold');

    // Generate table headers
    generateTableRow(doc, invoiceTableTop, 'Item', 'Unit Cost', 'Quantity', 'Line Total');

    // Generate a horizontal line below headers
    generateHr(doc, invoiceTableTop + 20);

    // Set font back to normal for table content
    doc.font('Helvetica');

    // Iterate over invoice items and generate rows for each item
    if (invoice && invoice.items && invoice.items.length) {
        for (let i = 0; i < invoice.items.length; i++) {
            const item = invoice.items[i];
            const position = invoiceTableTop + (i + 1) * 30;
            generateTableRow(
                doc,
                position,
                item.title, // Product title
                formatCurrency(item.price), // Product price
                item.quantity, // Product quantity
                formatCurrency(item.finalPrice), // Product final price
            );

            // Generate a horizontal line below each row
            generateHr(doc, position + 20);
        }
    } else {
        // Handle the case when invoice.items is undefined or empty
        const position = invoiceTableTop + 30;
        doc.text('No items found in the invoice.', 50, position);
    }

    // Calculate and display subtotal and paid amount
    const subtotalPosition = invoiceTableTop + (invoice.items.length + 1) * 30;
    generateTableRow(
        doc,
        subtotalPosition,
        '',
        '',
        'Subtotal',
        '',
        formatCurrency(invoice.subTotal), // Order subtotal
    );

    const paidToDatePosition = subtotalPosition + 20;
    generateTableRow(
        doc,
        paidToDatePosition,
        '',
        '',
        'Paid Amount',
        '',
        formatCurrency(invoice.paidAmount), // Order paid amount
    );

    // Set font back to normal
    doc.font('Helvetica');
}

// Function to generate the footer of the invoice
function generateFooter(doc) {
    doc
        .fontSize(10) // Set font size to 10
        .text(
            'Payment is due within 15 days. Thank you for your business.', // Footer text
            50, // X position
            780, // Y position
            { align: 'center', width: 500 }, // Options: center alignment and width
        );
}

// Function to generate a row in the invoice table
function generateTableRow(
    doc,
    y,
    item,
    description,
    unitCost,
    quantity,
    lineTotal,
) {
    doc
        .fontSize(10) // Set font size to 10
        .text(item, 50, y) // Item column
        .text(description, 150, y) // Description column
        .text(unitCost, 280, y, { width: 90, align: 'right' }) // Unit Cost column
        .text(quantity, 370, y, { width: 90, align: 'right' }) // Quantity column
        .text(lineTotal, 0, y, { align: 'right' }); // Line Total column
}

// Function to generate a horizontal line
function generateHr(doc, y) {
    doc.strokeColor('#aaaaaa') // Set stroke color
        .lineWidth(1) // Set line width to 1
        .moveTo(50, y) // Move to starting point (50, y)
        .lineTo(550, y) // Draw line to ending point (550, y)
        .stroke(); // Stroke the line
}

// Function to format currency
function formatCurrency(cents) {
    return cents + 'EGP'; // Append 'EGP' to cents
}

// Function to format date
function formatDate(date) {
    const day = date.getDate(); // Get day
    const month = date.getMonth() + 1; // Get month (+1 because months are zero-based)
    const year = date.getFullYear(); // Get year

    return year + '/' + month + '/' + day; // Return formatted date string
}

export default createInvoice; // Export the createInvoice function
