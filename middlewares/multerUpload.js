import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Define the storage destination and filename
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Create the directory if it doesn't exist
        const dir = 'public/images/profile-pictures';
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        // Create a unique filename to prevent overwrites
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + fileExtension);
    }
});

// File filter to allow only images
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed!'), false);
    }
};

const multerUpload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB file size limit
    },
    fileFilter: fileFilter
});

export default multerUpload;