//importar bibliotecas e funções
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { NextRequest, NextResponse } from 'next/server';

//função principal
const execAsync = promisify(exec);
export async function POST(req: NextRequest) {

  //definir as constantes
  let tempDir = ``;
  let inputPath = ``;
  let outputPath = ``;
  let redactionsPath = ``;
  let pythonScriptPath = ``;

  try {

    //receber os dados do formulário
    const formData = await req.formData();
    const pdfFile = formData.get(`pdfFile`) as File;
    const redactionsData = formData.get(`redactions`) as string;
    const acordaoNumber = formData.get(`acordaoNumber`) as string;
    const rvNumber = formData.get(`rvNumber`) as string;
    if (!pdfFile || !redactionsData) return NextResponse.json({ error: `Arquivo PDF e redactions são obrigatórios!` }, { status: 400 });

    //criar diretório temporário único
    const timestamp = Date.now();
    tempDir = path.join(process.cwd(), `tmp`, `pymupdf_${timestamp}`);
    await mkdir(tempDir, { recursive: true });

    //salvar o arquivo PDF
    inputPath = path.join(tempDir, `input.pdf`);
    const pdfBuffer = await pdfFile.arrayBuffer();
    await writeFile(inputPath, Buffer.from(pdfBuffer));

    //preparar dados de redação no formato PyMuPDF
    const redactions = JSON.parse(redactionsData);
    redactionsPath = path.join(tempDir, `redactions.json`);
    await writeFile(redactionsPath, JSON.stringify(redactions, null, 2));

    //criar script Python baseado no redact-pdf.md
    pythonScriptPath = path.join(tempDir, `redact_pdf.py`);
    const pythonScript = `import sys
import json
import fitz  # PyMuPDF

def clean_metadata(doc):
    """Remove metadados desnecessários."""
    try:
        # Limpar metadados do documento
        doc.set_metadata({})
    except:
        pass

def redact_pdf(input_pdf, output_pdf, redactions_json):
    doc = fitz.open(input_pdf)
    with open(redactions_json, 'r', encoding='utf-8') as f:
        redactions = json.load(f)

    # Tentar abordagem minimalista: redação + recompressão inteligente
    for r in redactions:
        page = doc[r['page'] - 1]
        rect = fitz.Rect(r['x'], r['y'], r['x'] + r['width'], r['y'] + r['height'])
        
        # Aplicar redação individual imediatamente
        page.add_redact_annot(rect, fill=(0, 0, 0))
        page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)  # Não processar imagens

    # Salvar com configurações mínimas
    doc.save(output_pdf, 
             garbage=4,      # Remove objetos não utilizados
             deflate=True    # Compressão básica
             )
    doc.close()

if __name__ == "__main__":
    input_pdf = sys.argv[1]
    output_pdf = sys.argv[2]
    redactions_json = sys.argv[3]
    redact_pdf(input_pdf, output_pdf, redactions_json)
    `;

    await writeFile(pythonScriptPath, pythonScript);

    //definir caminho de saída
    outputPath = path.join(tempDir, `output.pdf`);

    //executar script Python
    const command = `python "${pythonScriptPath}" "${inputPath}" "${outputPath}" "${redactionsPath}"`;
    const { stdout, stderr } = await execAsync(command);
    if (stderr) console.warn(`Python stderr:`, stderr);

    //verificar se o arquivo foi criado
    if (!fs.existsSync(outputPath)) throw new Error(`PDF anonimizado não foi gerado pelo PyMuPDF`);

    //ler o arquivo processado
    const processedBuffer = await fs.promises.readFile(outputPath);

    //definir nome do arquivo
    const filename = acordaoNumber && rvNumber ? `Acórdão ${acordaoNumber} RV ${rvNumber} Anonimizado.pdf` : `Documento Selecionado Anonimizado.pdf`;

    //retornar o arquivo anonimizado
    return new NextResponse(processedBuffer, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"` } });

  } catch (error) {
    console.error(`Erro na anonimização com PyMuPDF:`, error);
    return NextResponse.json({ error: error instanceof Error ? error.message : `Erro na anonimização com PyMuPDF`, details: error instanceof Error ? error.stack : undefined }, { status: 500 });
  } finally {
    //limpar os arquivos temporários
    try {
      if (inputPath && fs.existsSync(inputPath)) await unlink(inputPath);
      if (outputPath && fs.existsSync(outputPath)) await unlink(outputPath);
      if (redactionsPath && fs.existsSync(redactionsPath)) await unlink(redactionsPath);
      if (pythonScriptPath && fs.existsSync(pythonScriptPath)) await unlink(pythonScriptPath);
      if (tempDir && fs.existsSync(tempDir)) await fs.promises.rmdir(tempDir);
    } catch (cleanupError) {
      console.warn(`Erro na limpeza:`, cleanupError);
    };
  };
};