import React, { useEffect, useState, useCallback } from 'react';
import { useTenant } from '../../../hooks/useTenant';
import CompanyService from '../../../services/Company/CompanyService';
import { SWIMMING_STYLES, INTENSITIES, EQUIPMENT } from '../constants/trainingConstants';
import { formatDateDisplay } from '../../../utils/date';

/**
 * Dicionários para tradução de valores internos → labels de impressão
 */
const styleLabel = (val) => SWIMMING_STYLES.find(s => s.value === val)?.label || val || '';
const intensityObj = (val) => INTENSITIES.find(z => z.value === val) || null;
const equipLabel = (val) => EQUIPMENT.find(e => e.value === val)?.label || val || '';

/**
 * Gera o HTML completo de impressão do treino
 */
const buildPrintHTML = ({ workout, date, poolName, poolLength, companyName, logoUrl }) => {
    const totalDistance = (workout.sections || []).reduce((acc, section) => {
        return acc + (section.items || []).reduce((a, item) => {
            return a + ((parseInt(item.reps) || 0) * (parseInt(item.distance) || 0));
        }, 0);
    }, 0);

    const sectionRows = (workout.sections || []).map((section, si) => {
        const sectionDist = (section.items || []).reduce((a, item) => {
            return a + ((parseInt(item.reps) || 0) * (parseInt(item.distance) || 0));
        }, 0);

        const itemRows = (section.items || []).map((item, ii) => {
            const zone = intensityObj(item.intensity);
            const zoneColor = zone?.color || '#999';
            const reps = parseInt(item.reps) || 1;
            const dist = parseInt(item.distance) || 0;
            const total = reps * dist;
            const equips = Array.isArray(item.equipment) && item.equipment.length > 0
                ? item.equipment.map(equipLabel).join(', ')
                : '';
            const interval = item.interval && item.interval !== '0' ? `${item.interval}"` : '';

            return `
                <tr>
                    <td style="text-align:center;font-weight:600;width:70px;">${reps}x${dist}m</td>
                    <td>${item.exercise || styleLabel(item.style)}</td>
                    <td style="text-align:center;">${styleLabel(item.style)}</td>
                    <td style="text-align:center;">
                        <span style="display:inline-block;background:${zoneColor};color:#fff;padding:1px 8px;border-radius:3px;font-size:11px;font-weight:bold;">
                            ${item.intensity || '—'}
                        </span>
                    </td>
                    <td style="text-align:center;font-size:11px;color:#666;">${equips}</td>
                    <td style="text-align:center;">${interval}</td>
                    <td style="text-align:right;font-weight:600;">${total}m</td>
                </tr>
            `;
        }).join('');

        return `
            <tr class="section-header">
                <td colspan="6" style="font-weight:bold;text-transform:uppercase;font-size:12px;letter-spacing:0.5px;padding:8px 6px;background:#f0f3f7;border-top:2px solid #ccc;">
                    ${section.name || `Seção ${si + 1}`}
                </td>
                <td style="text-align:right;font-weight:bold;font-size:12px;padding:8px 6px;background:#f0f3f7;border-top:2px solid #ccc;">
                    ${sectionDist}m
                </td>
            </tr>
            ${itemRows}
        `;
    }).join('');

    // Legenda das zonas usadas
    const usedZones = new Set();
    (workout.sections || []).forEach(s => {
        (s.items || []).forEach(item => {
            if (item.intensity) usedZones.add(item.intensity);
        });
    });
    const zoneLegend = Array.from(usedZones).map(z => {
        const zone = intensityObj(z);
        if (!zone) return '';
        return `<span style="display:inline-flex;align-items:center;margin-right:12px;font-size:10px;">
            <span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:${zone.color};margin-right:4px;"></span>
            <strong>${zone.value}</strong>&nbsp;${zone.description || ''}
        </span>`;
    }).join('');

    const dateStr = date ? formatDateDisplay(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '';

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Treino - ${dateStr}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        @page { 
            size: A4 portrait; 
            margin: 12mm 10mm 15mm 10mm; 
        }
        body { 
            font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; 
            color: #222; 
            font-size: 12px;
            line-height: 1.4;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }

        /* HEADER */
        .header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
            margin-bottom: 12px;
        }
        .header-logo {
            height: 50px;
            max-width: 180px;
            object-fit: contain;
        }
        .header-info {
            text-align: right;
        }
        .header-title {
            font-size: 18px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .header-subtitle {
            font-size: 11px;
            color: #555;
            margin-top: 2px;
        }

        /* META INFO */
        .meta-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            gap: 10px;
            flex-wrap: wrap;
        }
        .meta-item {
            font-size: 11px;
            color: #444;
        }
        .meta-item strong {
            color: #111;
        }

        /* DESCRIPTION */
        .description {
            background: #f8f9fb;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            padding: 6px 10px;
            margin-bottom: 12px;
            font-size: 12px;
            font-style: italic;
            color: #333;
        }

        /* TABLE */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
        }
        thead th {
            background: #2c3e50;
            color: #fff;
            padding: 6px 6px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
            border: none;
        }
        tbody td {
            padding: 5px 6px;
            border-bottom: 1px solid #e8e8e8;
            font-size: 12px;
            vertical-align: middle;
        }
        tbody tr:hover { background: #fafafa; }

        /* TOTALS */
        .total-row {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            padding: 8px 0;
            border-top: 2px solid #333;
            margin-top: 4px;
        }
        .total-label {
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
            margin-right: 12px;
        }
        .total-value {
            font-size: 20px;
            font-weight: 800;
            color: #1a73e8;
        }

        /* ZONE LEGEND */
        .zone-legend {
            margin-top: 8px;
            padding: 6px 0;
            border-top: 1px dashed #ccc;
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
        }
        .zone-legend-title {
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            color: #888;
            width: 100%;
            margin-bottom: 2px;
        }

        /* FOOTER */
        .footer {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 9px;
            color: #999;
            padding: 6px 0;
            border-top: 1px solid #eee;
        }

        @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
        }
    </style>
</head>
<body>
    <!-- HEADER -->
    <div class="header">
        <div>
            ${logoUrl ? `<img src="${logoUrl}" class="header-logo" alt="Logo" />` : `<span style="font-size:16px;font-weight:bold;">${companyName || 'Swim Panel'}</span>`}
        </div>
        <div class="header-info">
            <div class="header-title">Treino de Natação</div>
            <div class="header-subtitle">${dateStr}</div>
        </div>
    </div>

    <!-- META -->
    <div class="meta-row">
        <div class="meta-item"><strong>Piscina:</strong> ${poolName || '—'} (${poolLength || 25}m)</div>
        <div class="meta-item"><strong>Volume Total:</strong> ${totalDistance}m</div>
    </div>

    ${workout.description ? `<div class="description">${workout.description}</div>` : ''}

    <!-- TABLE -->
    <table>
        <thead>
            <tr>
                <th style="width:70px;text-align:center;">Série</th>
                <th>Exercício</th>
                <th style="text-align:center;width:80px;">Nado</th>
                <th style="text-align:center;width:55px;">Zona</th>
                <th style="text-align:center;width:90px;">Material</th>
                <th style="text-align:center;width:50px;">Desc.</th>
                <th style="text-align:right;width:60px;">Dist.</th>
            </tr>
        </thead>
        <tbody>
            ${sectionRows}
        </tbody>
    </table>

    <!-- TOTAL -->
    <div class="total-row">
        <span class="total-label">Volume Total:</span>
        <span class="total-value">${totalDistance}m</span>
    </div>

    <!-- ZONE LEGEND -->
    <div class="zone-legend">
        <div class="zone-legend-title">Zonas de Intensidade</div>
        ${zoneLegend}
    </div>

    <!-- FOOTER -->
    <div class="footer">
        ${companyName || 'Swim Panel'} — Gerado em ${new Date().toLocaleDateString('pt-BR')}
    </div>

    <script>
        window.onload = function() { window.print(); };
    </script>
</body>
</html>
`;
};

/**
 * Componente wrapper + hook para impressão de treino
 */
export const useTrainingPrint = () => {
    const { idTenant } = useTenant();
    const [companyData, setCompanyData] = useState(null);

    useEffect(() => {
        const load = async () => {
            if (!idTenant) return;
            try {
                const data = await CompanyService.getCompanyData(idTenant);
                setCompanyData(data);
            } catch (e) {
                console.error("Erro ao carregar dados da empresa para impressão:", e);
            }
        };
        load();
    }, [idTenant]);

    const printWorkout = useCallback(({ sections, description, date, poolName, poolLength }) => {
        const workout = { sections, description };
        const html = buildPrintHTML({
            workout,
            date,
            poolName,
            poolLength,
            companyName: companyData?.name || '',
            logoUrl: companyData?.logo || null
        });

        const printWindow = window.open('', '_blank', 'width=800,height=1100');
        if (printWindow) {
            printWindow.document.write(html);
            printWindow.document.close();
        }
    }, [companyData]);

    return { printWorkout };
};

export default useTrainingPrint;
