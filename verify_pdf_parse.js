const pdfParse = require('pdf-parse');
console.log('Type of pdf-parse:', typeof pdfParse);
if (typeof pdfParse === 'function') {
    console.log('SUCCESS: pdf-parse is a function');
} else {
    console.log('FAIL: pdf-parse is ' + typeof pdfParse);
}
