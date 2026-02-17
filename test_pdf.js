const pdfLib = require('pdf-parse');
const fs = require('fs');

console.log('Type of require("pdf-parse"):', typeof pdfLib);
console.log('Keys:', Object.keys(pdfLib));

if (pdfLib.PDFParse) {
    console.log('Type of PDFParse:', typeof pdfLib.PDFParse);
    try {
        console.log('Trying new PDFParse()...');
        const instance = new pdfLib.PDFParse();
        console.log('Instance creation successful');
        console.log('Instance keys:', Object.keys(instance));
    } catch (e) {
        console.log('Error creating instance:', e.message);
    }
}

// Create a dummy PDF buffer (empty or minimal)
const dummyBuffer = Buffer.from('%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/MediaBox [0 0 612 792]\n/Resources <<\n/Font <<\n/F1 <<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\n>>\n>>\n/Contents 4 0 R\n>>\nendobj\n4 0 obj\n<<\n/Length 12\n>>\nstream\nHello World\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000259 00000 n \ntrailer\n<<\n/Size 5\n/Root 1 0 R\n>>\nstartxref\n308\n%%EOF');

async function test() {
    try {
        console.log('Attemping usage as function: pdfLib(buffer)');
        await pdfLib(dummyBuffer);
        console.log('Success as function');
    } catch (e) {
        console.log('Failed as function:', e.message);
    }

    if (pdfLib.default) {
        try {
            console.log('Attemping usage as pdfLib.default(buffer)');
            await pdfLib.default(dummyBuffer);
            console.log('Success as pdfLib.default');
        } catch (e) {
            console.log('Failed as pdfLib.default:', e.message);
        }
    }
}

test();
