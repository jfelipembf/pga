/**
 * Utilitário para exportação de dados para CSV
 */
export const exportToCSV = (data, fileName, headers = []) => {
    if (!data || !data.length) return;

    // Se não houver headers, pega as chaves do primeiro objeto
    const columnHeaders = headers.length ? headers : Object.keys(data[0]);

    // Constrói o conteúdo do CSV
    const csvRows = [];

    // Adiciona o cabeçalho
    csvRows.push(columnHeaders.join(','));

    // Adiciona as linhas
    for (const row of data) {
        const values = columnHeaders.map(header => {
            const val = row[header] === null || row[header] === undefined ? '' : row[header];
            // Escapa aspas e vírgulas
            const escaped = ('' + val).replace(/"/g, '""');
            return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
    }

    // Cria o Blob e o link para download
    const csvString = '\uFEFF' + csvRows.join('\n'); // BOM para Excel reconhecer caracteres especiais
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
