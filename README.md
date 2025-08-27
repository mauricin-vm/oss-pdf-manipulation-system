# PDF Processing System

System developed to process PDF files from winning votes, extract specific pages and merge them with complete court decisions. Features interactive anonymization for LGPD compliance.

## 🚀 Features

- **PDF Upload**: Intuitive interface for uploading PDF files
- **Page Selection**: Specify the page range of the winning vote
- **Automatic Search**: Automatically locates the complete court decision based on decision number and RV
- **File Merging**: Merges the complete court decision with the winning vote pages
- **Interactive Anonymization**: Select specific areas on PDF pages to redact using PyMuPDF
- **Precise Redaction**: Uses PyMuPDF for permanent black redaction blocks over selected areas
- **LGPD Compliance**: Manual selection ensures complete control over sensitive data removal
- **Automatic Download**: Generates and downloads the final merged PDF

## 📋 Prerequisites

- Node.js 18+ 
- NPM or Yarn
- Python 3.7+
- PyMuPDF (installed via pip)

## 🛠️ Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd anonymization-system
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Install Python dependencies:
```bash
pip install PyMuPDF
```

4. Configure environment variables:
```bash
cp .env.example .env.local
```

5. Edit the `.env.local` file and configure the required services:
```env
# Directory for court decisions
ACCORDES_DIRECTORY=./accordes
```

6. Create the folder for court decisions:
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

### 5. Anonymize the document (interactive)
1. After merging, the system displays the PDF with interactive selection
2. Click and drag to select areas containing sensitive information
3. Selected areas will be highlighted in red
4. Click "Anonimizar" to apply permanent black redactions using PyMuPDF
5. The system will:
   - Convert selected areas to PyMuPDF redaction format
   - Apply permanent black redaction blocks
   - Generate a new anonymized PDF with the specified areas blacked out

### 6. Result
- **For PDF merging**: Downloads the merged court decision + winning vote
- **For anonymization**: Downloads anonymized PDF with permanent black redactions over selected areas

## 📁 Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── anonymize/
│   │       ├── process-pdf/         # PDF merging endpoint
│   │       └── pymupdf-anonymize/   # PyMuPDF redaction endpoint
│   ├── globals.css         # Global styles
│   ├── layout.tsx          # Application layout
│   └── page.tsx           # Main interface
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── FileUpload.tsx     # File upload component
│   └── PageRangeSelector.tsx # Page range selector
└── lib/
    ├── file-service.ts    # File system operations
    └── pdf-service.ts     # PDF manipulation
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

### PyMuPDF Anonymization Issues

#### Python not found
- Ensure Python 3.7+ is installed and available in PATH
- Try running `python --version` or `python3 --version` in terminal
- On Windows, make sure Python is added to system PATH

#### PyMuPDF not installed
- Install PyMuPDF using: `pip install PyMuPDF`
- On some systems, you may need: `pip3 install PyMuPDF`
- Verify installation with: `python -c "import fitz; print('PyMuPDF installed')"`

#### Redaction not working
- Ensure areas are properly selected on the PDF viewer
- Check browser console for JavaScript errors during area selection
- Verify the PDF is not corrupted or password-protected

#### Permission errors
- Ensure the application has write permissions in the temp directory
- On Linux/Mac, check file permissions for the project folder

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
