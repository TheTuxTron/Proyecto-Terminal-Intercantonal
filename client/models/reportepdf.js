const { PDFDocument } = PDFLib;

async function combinePDFs(matutinoPDFBytes, vespertinoPDFBytes, condensadoPDFBytes, valoresPDFBytes) {
    const combinedPdf = await PDFDocument.create();  // Crear un nuevo documento PDF combinado

    // Cargar el PDF del informe matutino
    const matutinoPdf = await PDFDocument.load(matutinoPDFBytes);
    const matutinoPages = await combinedPdf.copyPages(matutinoPdf, matutinoPdf.getPageIndices());
    matutinoPages.forEach(page => combinedPdf.addPage(page));  // Agregar las páginas del PDF matutino al PDF combinado

    // Cargar el PDF del informe vespertino
    const vespertinoPdf = await PDFDocument.load(vespertinoPDFBytes);
    const vespertinoPages = await combinedPdf.copyPages(vespertinoPdf, vespertinoPdf.getPageIndices());
    vespertinoPages.forEach(page => combinedPdf.addPage(page));  // Agregar las páginas del PDF vespertino al PDF combinado

    // Cargar el PDF del informe vespertino
    const condensadoPdf = await PDFDocument.load(condensadoPDFBytes);
    const condensadoPages = await combinedPdf.copyPages(condensadoPdf, condensadoPdf.getPageIndices());
    condensadoPages.forEach(page => combinedPdf.addPage(page));  // Agregar las páginas del PDF condensado al PDF combinado

    // Cargar el PDF del informe vespertino
    const valoresPdf = await PDFDocument.load(valoresPDFBytes);
    const valoresPages = await combinedPdf.copyPages(valoresPdf, valoresPdf.getPageIndices());
    valoresPages.forEach(page => combinedPdf.addPage(page));  // Agregar las páginas del PDF valores al PDF combinado

    // Guardar el PDF combinado
    const combinedPdfBytes = await combinedPdf.save();
    return combinedPdfBytes;  // Retornar los bytes del PDF combinado
}

document.getElementById('generarPDF').addEventListener('click', async () => {
    const matutinoElement = document.getElementById('informeMatutino');
    const vespertinoElement = document.getElementById('informeVespertino');
    const condensadoElement = document.getElementById('informeCondensado');
    const valoresElement = document.getElementById('valores');

    // Crear encabezados para los informes
    const matutinoHeader = document.createElement('div');
    matutinoHeader.innerHTML = `
        <div style="text-align: center;">
            <img src="../images/Membrete.jpg" alt="Logo" style="max-width: 100%; margin-bottom: 10px;" />
            <h1 style="font-size: 24px; margin: 0;">INFORME SEMANAL DEL TURNO DE LA MAÑANA</h1>
            <hr />
        </div>
    `;
    matutinoElement.insertBefore(matutinoHeader, matutinoElement.firstChild);

    const vespertinoHeader = document.createElement('div');
    vespertinoHeader.innerHTML = `
        <div style="text-align: center;">
            <img src="../images/Membrete.jpg" alt="Logo" style="max-width: 100%; margin-bottom: 10px;" />
            <h1 style="font-size: 24px; margin: 0;">INFORME SEMANAL DEL TURNO DE LA TARDE</h1>
            <hr />
        </div>
    `;
    vespertinoElement.insertBefore(vespertinoHeader, vespertinoElement.firstChild);

    const condensadoHeader = document.createElement('div');
    condensadoHeader.innerHTML = `
        <div style="text-align: center;">
            <img src="../images/Membrete.jpg" alt="Logo" style="max-width: 100%; margin-bottom: 10px;" />
            <h1 style="font-size: 24px; margin: 0;">INFORME CONDENSADO SEMANAL</h1>
            <hr />
        </div>
    `;
    condensadoElement.insertBefore(condensadoHeader, condensadoElement.firstChild);

    const valoresHeader = document.createElement('div');
    valoresHeader.innerHTML = `
        <div style="text-align: center;">
            <img src="../images/Membrete.jpg" alt="Logo" style="max-width: 100%; margin-bottom: 10px;" />
            <h1 style="font-size: 24px; margin: 0;">INFORME SEMANAL DE VALORES RECAUDADOS</h1>
            <hr />
        </div>
    `;
    valoresElement.insertBefore(valoresHeader, valoresElement.firstChild);

    // Configuraciones para la generación de PDF
    const options = {
        margin:       5,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { dpi: 192, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    const opt2 = {
        margin:       5,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { dpi: 192, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
    };

    // Generar PDFs con opciones
    const matutinoPDFBytes = await html2pdf().set(options).from(matutinoElement).toPdf().output('arraybuffer');
    const vespertinoPDFBytes = await html2pdf().set(options).from(vespertinoElement).toPdf().output('arraybuffer');
    const condensadoPDFBytes = await html2pdf().set(opt2).from(condensadoElement).toPdf().output('arraybuffer');
    const valoresPDFBytes = await html2pdf().set(opt2).from(valoresElement).toPdf().output('arraybuffer');
    // Combinar los PDFs
    const combinedPdfBytes = await combinePDFs(matutinoPDFBytes, vespertinoPDFBytes, condensadoPDFBytes, valoresPDFBytes);

    // Descargar el PDF combinado
    const blob = new Blob([combinedPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'INFORME_SEMANAL.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Eliminar encabezados después de generar los PDFs
    setTimeout(() => {
        matutinoElement.removeChild(matutinoHeader);
        vespertinoElement.removeChild(vespertinoHeader);
        condensadoElement.removeChild(condensadoHeader);
        valoresElement.removeChild(valoresHeader);
    }, 100);  // Pequeña espera para asegurar que los encabezados se hayan renderizado
});
