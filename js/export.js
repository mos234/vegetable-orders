/**
 * Vegetable Orders Management - Excel Export Module
 * Uses SheetJS (xlsx) library for Excel file generation.
 */

/**
 * Exports monthly report to Excel file with two sheets.
 * @param {Array} orders - Array of order objects
 * @param {number} month - Month number (1-12)
 * @param {number} year - Year
 */
function exportMonthlyReport(orders, month, year) {
    if (!orders || orders.length === 0) {
        alert('אין נתונים לייצוא');
        return;
    }

    // Check if XLSX library is loaded
    if (typeof XLSX === 'undefined') {
        alert('שגיאה: ספריית Excel לא נטענה');
        console.error('XLSX library not loaded');
        return;
    }

    try {
        // Create workbook
        const workbook = XLSX.utils.book_new();

        // Create Summary sheet
        const summaryData = createSummarySheet(orders, month, year);
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

        // Set column widths for summary
        summarySheet['!cols'] = [
            { wch: 25 }, // Column A
            { wch: 20 }, // Column B
        ];

        XLSX.utils.book_append_sheet(workbook, summarySheet, 'סיכום');

        // Create Orders Detail sheet
        const detailData = createDetailSheet(orders);
        const detailSheet = XLSX.utils.aoa_to_sheet(detailData);

        // Set column widths for detail
        detailSheet['!cols'] = [
            { wch: 12 }, // Order Number
            { wch: 20 }, // Supplier
            { wch: 12 }, // Order Date
            { wch: 12 }, // Delivery Date
            { wch: 20 }, // Item Name
            { wch: 10 }, // Quantity
            { wch: 10 }, // Unit
            { wch: 12 }, // Price
            { wch: 12 }, // Total
            { wch: 10 }, // Status
        ];

        XLSX.utils.book_append_sheet(workbook, detailSheet, 'פירוט הזמנות');

        // Generate filename
        const monthStr = String(month).padStart(2, '0');
        const filename = `vegetable_report_${monthStr}_${year}.xlsx`;

        // Save file
        XLSX.writeFile(workbook, filename);

        console.log(`Excel file exported: ${filename}`);
        return true;
    } catch (error) {
        console.error('Error exporting Excel:', error);
        alert('שגיאה בייצוא הקובץ');
        return false;
    }
}

/**
 * Creates the summary sheet data.
 * @param {Array} orders - Array of orders
 * @param {number} month - Month
 * @param {number} year - Year
 * @returns {Array} 2D array for sheet
 */
function createSummarySheet(orders, month, year) {
    const monthNames = [
        'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
        'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];

    const totalOrders = orders.length;
    const totalAmount = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrder = totalOrders > 0 ? totalAmount / totalOrders : 0;

    // Group by supplier
    const supplierTotals = {};
    orders.forEach(order => {
        const name = order.supplierName || 'ספק לא ידוע';
        if (!supplierTotals[name]) {
            supplierTotals[name] = { count: 0, total: 0 };
        }
        supplierTotals[name].count++;
        supplierTotals[name].total += order.total || 0;
    });

    // Build summary data
    const data = [
        ['דו"ח חודשי - ניהול הזמנות ירקות', ''],
        ['', ''],
        ['חודש:', `${monthNames[month - 1]} ${year}`],
        ['', ''],
        ['סיכום כללי', ''],
        ['──────────────────', '──────────────────'],
        ['סה"כ הזמנות:', totalOrders],
        ['סה"כ הוצאות:', `₪${totalAmount.toFixed(2)}`],
        ['ממוצע להזמנה:', `₪${avgOrder.toFixed(2)}`],
        ['ספקים פעילים:', Object.keys(supplierTotals).length],
        ['', ''],
        ['פירוט לפי ספק', ''],
        ['──────────────────', '──────────────────'],
        ['שם ספק', 'סה"כ'],
    ];

    // Add supplier breakdown
    Object.entries(supplierTotals)
        .sort((a, b) => b[1].total - a[1].total)
        .forEach(([name, info]) => {
            data.push([name, `₪${info.total.toFixed(2)} (${info.count} הזמנות)`]);
        });

    // Add footer
    data.push(['', '']);
    data.push(['──────────────────', '──────────────────']);
    data.push(['נוצר בתאריך:', new Date().toLocaleDateString('he-IL')]);

    return data;
}

/**
 * Creates the detail sheet data.
 * @param {Array} orders - Array of orders
 * @returns {Array} 2D array for sheet
 */
function createDetailSheet(orders) {
    // Header row
    const data = [
        ['מס\' הזמנה', 'ספק', 'תאריך הזמנה', 'תאריך אספקה', 'פריט', 'כמות', 'יחידה', 'מחיר', 'סה"כ שורה', 'סטטוס']
    ];

    // Status translations
    const statusText = {
        draft: 'טיוטה',
        sent: 'נשלח',
        delivered: 'סופק',
        cancelled: 'בוטל'
    };

    // Add order details
    orders.forEach(order => {
        const orderNumber = order.orderNumber || '-';
        const supplier = order.supplierName || '-';
        const orderDate = formatDateForExcel(order.orderDate);
        const deliveryDate = formatDateForExcel(order.deliveryDate);
        const status = statusText[order.status] || 'טיוטה';

        if (order.items && order.items.length > 0) {
            // Add each item as a row
            order.items.forEach((item, index) => {
                data.push([
                    index === 0 ? orderNumber : '', // Only show order number on first row
                    index === 0 ? supplier : '',
                    index === 0 ? orderDate : '',
                    index === 0 ? deliveryDate : '',
                    item.name || '-',
                    item.quantity || 0,
                    item.unit || '-',
                    item.price || 0,
                    item.total || 0,
                    index === 0 ? status : ''
                ]);
            });

            // Add order total row
            data.push([
                '', '', '', '',
                'סה"כ הזמנה:',
                '', '', '',
                order.total || 0,
                ''
            ]);

            // Add empty row between orders
            data.push(['', '', '', '', '', '', '', '', '', '']);
        } else {
            // Order without items
            data.push([
                orderNumber,
                supplier,
                orderDate,
                deliveryDate,
                '(אין פריטים)',
                '',
                '',
                '',
                order.total || 0,
                status
            ]);
        }
    });

    // Add grand total
    const grandTotal = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    data.push(['', '', '', '', '', '', '', '', '', '']);
    data.push(['', '', '', '', 'סה"כ כללי:', '', '', '', grandTotal, '']);

    return data;
}

/**
 * Formats date for Excel display.
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} Formatted date
 */
function formatDateForExcel(dateStr) {
    if (!dateStr) return '-';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
}

/**
 * Exports a simple orders list to Excel.
 * @param {Array} orders - Array of orders
 * @param {string} filename - Output filename
 */
function exportOrdersToExcel(orders, filename = 'orders_export.xlsx') {
    if (!orders || orders.length === 0) {
        alert('אין נתונים לייצוא');
        return;
    }

    if (typeof XLSX === 'undefined') {
        alert('שגיאה: ספריית Excel לא נטענה');
        return;
    }

    try {
        const data = [
            ['מס\' הזמנה', 'ספק', 'טלפון', 'תאריך הזמנה', 'תאריך אספקה', 'פריטים', 'סה"כ', 'סטטוס']
        ];

        const statusText = {
            draft: 'טיוטה',
            sent: 'נשלח',
            delivered: 'סופק',
            cancelled: 'בוטל'
        };

        orders.forEach(order => {
            data.push([
                order.orderNumber || '-',
                order.supplierName || '-',
                order.supplierPhone || '-',
                formatDateForExcel(order.orderDate),
                formatDateForExcel(order.deliveryDate),
                order.items ? order.items.length : 0,
                order.total || 0,
                statusText[order.status] || 'טיוטה'
            ]);
        });

        const workbook = XLSX.utils.book_new();
        const sheet = XLSX.utils.aoa_to_sheet(data);

        sheet['!cols'] = [
            { wch: 12 },
            { wch: 20 },
            { wch: 15 },
            { wch: 12 },
            { wch: 12 },
            { wch: 8 },
            { wch: 12 },
            { wch: 10 },
        ];

        XLSX.utils.book_append_sheet(workbook, sheet, 'הזמנות');
        XLSX.writeFile(workbook, filename);

        return true;
    } catch (error) {
        console.error('Error exporting Excel:', error);
        alert('שגיאה בייצוא הקובץ');
        return false;
    }
}

/**
 * Exports suppliers list to Excel.
 * @param {Array} suppliers - Array of suppliers
 */
function exportSuppliersToExcel(suppliers) {
    if (!suppliers || suppliers.length === 0) {
        alert('אין ספקים לייצוא');
        return;
    }

    if (typeof XLSX === 'undefined') {
        alert('שגיאה: ספריית Excel לא נטענה');
        return;
    }

    try {
        const data = [
            ['שם הספק', 'טלפון', 'הערות', 'תאריך הוספה']
        ];

        suppliers.forEach(supplier => {
            data.push([
                supplier.name || '-',
                supplier.phone || '-',
                supplier.notes || '-',
                supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString('he-IL') : '-'
            ]);
        });

        const workbook = XLSX.utils.book_new();
        const sheet = XLSX.utils.aoa_to_sheet(data);

        sheet['!cols'] = [
            { wch: 25 },
            { wch: 15 },
            { wch: 30 },
            { wch: 15 },
        ];

        XLSX.utils.book_append_sheet(workbook, sheet, 'ספקים');
        XLSX.writeFile(workbook, 'suppliers_export.xlsx');

        return true;
    } catch (error) {
        console.error('Error exporting suppliers:', error);
        alert('שגיאה בייצוא הקובץ');
        return false;
    }
}
