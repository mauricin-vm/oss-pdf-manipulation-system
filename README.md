# PDF Processing System

System developed to process PDF files from winning votes, extract specific pages and merge them with complete court decisions. Features advanced OCR-powered anonymization for LGPD compliance.

## 🚀 Features

- **PDF Upload**: Intuitive interface for uploading PDF files
- **Page Selection**: Specify the page range of the winning vote
- **Automatic Search**: Automatically locates the complete court decision based on decision number and RV
- **File Merging**: Merges the complete court decision with the winning vote pages
- **OCR Text Extraction**: Advanced OCR using Google Cloud Vision API for scanned documents
- **AI-Powered Anonymization**: Uses Gemini AI to anonymize sensitive data while preserving legal content
- **LGPD Compliance**: Automatically removes CPF, names, addresses, and financial information
- **Automatic Download**: Generates and downloads the final merged PDF

## 📋 Prerequisites

- Node.js 18+ 
- NPM or Yarn

## 🛠️ Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd anonymization-system
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

4. Edit the `.env.local` file and configure the required services:
```env
# Google Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Google Cloud Vision API (for OCR on scanned PDFs)
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json

# Directory for court decisions
ACCORDES_DIRECTORY=./accordes
```

### Setting up Google Cloud Vision API (for OCR):

1. Create a Google Cloud Project: https://console.cloud.google.com/
2. Enable the Vision API: https://console.cloud.google.com/apis/library/vision.googleapis.com
3. Create a service account:
   - Go to "IAM & Admin" > "Service Accounts"
   - Click "Create Service Account"
   - Give it a name and add the "Cloud Vision API User" role
4. Generate and download the JSON key file
5. Update `GOOGLE_APPLICATION_CREDENTIALS` in `.env.local` with the path to your JSON file

### Setting up Gemini AI:

1. Visit https://aistudio.google.com/app/apikey
2. Generate an API key
3. Add it to `GEMINI_API_KEY` in your `.env.local` file

5. Create the folder for court decisions:
```bash
mkdir accordes
```

## 🚦 How to Use

### 1. Run the application
```bash
npm run dev
```

### 2. Access the interface
Open your browser at `http://localhost:3000`

### 3. Prepare the complete court decisions
- Place the complete court decision PDF files in the `accordes/` folder
- Name the files following the pattern: `Acórdão XXXX-XXXX RV XXXX-XXXX.pdf`

### 4. Process a winning vote
1. Upload the PDF containing the winning vote
2. Select the page range of the vote (e.g., page 15 to 25)
3. Enter the court decision number (e.g., 1234-2024)
4. Enter the RV number (e.g., 5678-2024)
5. Click "Process and Merge PDF"

### 5. Anonymize the document (optional)
1. After merging, click "Anonymize PDF with AI + OCR"
2. The system will:
   - Use OCR to extract text from scanned documents
   - Apply AI-powered anonymization to remove sensitive data
   - Generate a new anonymized PDF

### 6. Result
- **For PDF merging**: Downloads the merged court decision + winning vote
- **For anonymization**: 
  - ✅ **Success**: Downloads anonymized PDF with sensitive data removed
  - ⚠️ **OCR Failed**: Downloads original merged PDF with notification that OCR couldn't extract text
  - ⚠️ **AI Error**: Downloads original merged PDF if anonymization process failed

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── process-pdf/    # PDF merging endpoint
│   │   └── anonymize-pdf/  # OCR + anonymization endpoint
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Application layout
│   └── page.tsx           # Main interface
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── FileUpload.tsx     # File upload component
│   └── PageRangeSelector.tsx # Page range selector
└── lib/
    ├── file-service.ts    # File system operations
    ├── pdf-service.ts     # PDF manipulation
    ├── ocr-service.ts     # Google Cloud Vision OCR
    └── gemini-service.ts  # AI-powered anonymization
```

## ⚙️ Advanced Configuration

### Directory Configuration
Change the `ACCORDES_DIRECTORY` variable in `.env.local` to point to your court decisions folder.

## 🐛 Troubleshooting

### PDF Merging Issues

#### Error: "Court decision not found"
- Check if the file is in the `accordes/` folder
- Confirm the file name follows the correct pattern
- Verify the court decision number and RV are correct

#### Upload error
- Confirm the file is a valid PDF
- Check if the file doesn't exceed 50MB
- Try with a smaller file

#### Page range error
- Ensure page numbers are within the PDF's page count
- Check that start page is not greater than end page
- Use valid page numbers (greater than 0)

### OCR and Anonymization Issues

#### OCR not working
- Verify Google Cloud Vision API is properly configured
- Check that `GOOGLE_APPLICATION_CREDENTIALS` points to a valid JSON file
- Ensure the service account has the "Cloud Vision API User" role
- Check the Google Cloud console for API usage and quota limits

#### Gemini AI errors
- Verify your `GEMINI_API_KEY` is correct and active
- Check rate limits on the Gemini API
- Large documents may take several minutes to process

#### Files downloaded without anonymization
- This means either OCR failed to extract text (scanned PDF issue) or AI processing failed
- Check browser console and server logs for specific error messages
- For scanned PDFs, ensure image quality is sufficient for OCR

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the project
2. Create a branch for your feature
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📞 Support

For technical support or questions about the system, please open an issue in the project repository.
