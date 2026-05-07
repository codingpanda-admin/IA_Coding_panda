// utils/directory.init.js
const fs = require('fs');
const path = require('path');

const initializeDirectories = (baseDir) => {
    const uploadDirs = [
        'uploads', 
        'uploads/images', 
        'uploads/audio', 
        'uploads/video', 
        'uploads/documents', 
        'uploads/generated'
    ];

    uploadDirs.forEach(dir => {
        const fullPath = path.join(baseDir, dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            console.log(`[INIT] Directorio creado: ${fullPath}`);
        }
    });
};

module.exports = initializeDirectories;