// services/qwen/extractor.service.js
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');
const officeParser = require('officeparser');

const extractDocumentContent = async (filePath, ext) => {
    switch (ext) {
        case '.txt': case '.md': case '.csv':
            return fs.readFileSync(filePath, 'utf-8');
        case '.json':
            return JSON.stringify(JSON.parse(fs.readFileSync(filePath, 'utf-8')), null, 2);
        case '.pdf':
            return (await pdfParse(fs.readFileSync(filePath))).text || '';
        case '.docx': case '.doc':
            return (await mammoth.extractRawText({ path: filePath })).value || '';
        case '.xlsx': case '.xls':
            const workbook = XLSX.readFile(filePath);
            return workbook.SheetNames.map(name => `\n--- Hoja: ${name} ---\n${XLSX.utils.sheet_to_csv(workbook.Sheets[name])}`).join('\n');
        case '.pptx': case '.ppt':
            return new Promise((resolve, reject) => {
                officeParser.parseOffice(filePath, (data, err) => err ? reject(err) : resolve(data || ''));
            });
        default:
            throw new Error(`Extractor no disponible para: ${ext}`);
    }
};

module.exports = { extractDocumentContent };