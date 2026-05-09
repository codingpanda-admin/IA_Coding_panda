const XLSX = require('xlsx');

let latestExcelData = [];
let latestExcelMetadata = null;

exports.handleExcelUpload = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No se subió ningún archivo'
      });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    const data = XLSX.utils.sheet_to_json(sheet, {
      defval: null
    });

    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    latestExcelData = data;

    latestExcelMetadata = {
      originalName: req.file.originalname,
      storedName: req.file.filename,
      sheetName,
      rows: data.length,
      columns,
      uploadedAt: new Date().toISOString()
    };

    console.log('[EXCEL] Archivo procesado:', latestExcelMetadata);

    return res.json({
      success: true,
      message: 'Archivo Excel procesado correctamente',
      metadata: latestExcelMetadata,
      sample: data.slice(0, 10)
    });

  } catch (error) {
    console.error('[EXCEL ERROR]', error);

    return res.status(500).json({
      success: false,
      error: 'Error procesando Excel',
      details: error.message
    });
  }
};

exports.getLatestExcelData = () => {
  return {
    metadata: latestExcelMetadata,
    data: latestExcelData
  };
};