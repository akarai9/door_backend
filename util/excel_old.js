import CONSTANTS from './constants'
import { debuggerStatement } from 'babel-types';

const getFormatedNumber = number => +(parseFloat(Math.round(number * 100) / 100).toFixed(2))

const getDataSet = (jsonData, country, month, year, isRoyalty) => {
    let dataset             = [''],
        total_no_of_day     = 0,
        total_invoice_amount= 0,
        total_amount_in_eur = 0,
        total_amount_in_usd = 0,
        royalty_due_in_eur  = 0,
        royalty_due_in_usd  = 0,
        excelHeader;

    excelHeader = ['customer', 'industry', 'country', 'invoice_number', 'english_description_of_course', 'number_of_days', 'invoice_amount', 'currency_code', 'category', 'curriculum_n_program', 'xrate_eur', 'total_amount_in_eur', 'xrate_usd', 'total_amount_in_usd']
    if (isRoyalty){
        excelHeader.splice(8, 0, 'royalty')
        excelHeader.push('royalty_due_in_eur', 'royalty_due_in_usd')
    }

    for (let i = 0; i < jsonData.length; i++) {
        let clientDetail = {};
        for (let j = 0; j < excelHeader.length; j++) {
            clientDetail[excelHeader[j]] = jsonData[i][j] ? jsonData[i][j] : ''
        }
        dataset.push(clientDetail)
        total_no_of_day     += +jsonData[i][5]
        total_invoice_amount+= +jsonData[i][6]
        total_amount_in_eur += +jsonData[i][isRoyalty?12:11]
        total_amount_in_usd += +jsonData[i][isRoyalty?14:13]
        royalty_due_in_eur  += +jsonData[i][15]
        royalty_due_in_usd  += +jsonData[i][16]
    }

    // Add Total 
    let excelTotal = {},
        excelHeaderValue;

    excelHeaderValue = ['', '', '', '', '', `Total: ${getFormatedNumber(total_no_of_day)}`, `Total: ${getFormatedNumber(total_invoice_amount)}`, '', '', '', '', `Total: €${getFormatedNumber(total_amount_in_eur)}`, '', `Total: $${getFormatedNumber(total_amount_in_usd)}`]
    if (isRoyalty){
        excelHeaderValue.splice(8, 0, '')
        excelHeaderValue.push(`Total: €${getFormatedNumber(royalty_due_in_eur)}`, `Total: $${getFormatedNumber(royalty_due_in_usd)}`)
    }
    
    for (let i = 0; i < excelHeader.length; i++) {
        excelTotal[excelHeader[i]] = excelHeaderValue[i]
    }
    dataset.push(excelTotal)
    return dataset
}

const getHeading = (country, currency_code, month, year, user) => {
    let title               = { value: 'Partner Details', style: CONSTANTS.setExcelStyle('FFFFFFFF', 12, false, '48689a', 'center') },
        nameKey             = { value: 'Name:',         style: CONSTANTS.setExcelStyle('00000000', 10, true, 'c7d5da', 'left') },
        nameValue           = { value: user.name,      style: CONSTANTS.setExcelStyle('00000000', 10, false, 'c7d5da', 'left') },
        countryNameKey      = { value: 'Country:',      style: CONSTANTS.setExcelStyle('00000000', 10, true, 'c7d5da', 'left') },
        countryNameValue    = { value: country,         style: CONSTANTS.setExcelStyle('00000000', 10, false, 'c7d5da', 'left') },
        currencyCodeKey     = { value: 'Currency Code:',style: CONSTANTS.setExcelStyle('00000000', 10, true, 'c7d5da', 'left') },
        currencyCodeValue   = { value: currency_code,           style: CONSTANTS.setExcelStyle('00000000', 10, false, 'c7d5da', 'left') },
    
        reportHeading = { value: `${CONSTANTS.monthName[month]}, ${year}`, style: CONSTANTS.setExcelStyle('FFFFFFFF', 14, false, '48689a', 'left') };

    return [
        ['', '', title],[],
        ['', '', nameKey, '', nameValue],
        ['', '', countryNameKey, '', countryNameValue],
        ['', '', currencyCodeKey, '', currencyCodeValue],
        [],[],
        [reportHeading],
        []
    ];
}

const getMerge = (isRoyalty) => {
    let columnLength = isRoyalty ? 17 : 14
    // let merges = [{ start: { row: 1, column: 3 }, end: { row: 2, column: 5 } }]
    let merges = []
    merges.push({ start: { row: 1, column: 3 }, end: { row: 2, column: 7 } })
    merges.push({ start: { row: 3, column: 3 }, end: { row: 3, column: 4 } })
    merges.push({ start: { row: 3, column: 5 }, end: { row: 3, column: 7 } })
    merges.push({ start: { row: 4, column: 3 }, end: { row: 4, column: 4 } })
    merges.push({ start: { row: 4, column: 5 }, end: { row: 4, column: 7 } })    
    merges.push({ start: { row: 5, column: 3 }, end: { row: 5, column: 4 } })
    merges.push({ start: { row: 5, column: 5 }, end: { row: 5, column: 7 } })

    merges.push({ start: { row: 8, column: 1 }, end: { row: 9, column: columnLength } })
    
    for (let i = 1; i <= columnLength; i++)
        merges.push({ start: { row: 10, column: i }, end: { row: 11, column: i } })
    return merges
}

const getSpecification = isRoyalty => {
    let specification = {}
    specification['customer'] = {
        displayName: 'Customer',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "left")
        },
        width: 100
    }
    specification['industry'] = {
        displayName: 'Industry',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "left")
        },
        /* cellFormat: function (value, row) {
            return (value == 1) ? 'Active' : '';
        }, */
        width: 80
    }
    specification['country'] = {
        displayName: 'Country',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "left")
        },
        width: 80
    }
    specification['invoice_number'] = {
        displayName: 'Invoice number',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "left")
        },
        width: 100
    }
    specification['english_description_of_course'] = {
        displayName: 'English description of course',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "left")
        },
        width: 160
    }
    specification['number_of_days'] = {
        displayName: 'Number of days',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return (value && value.toString().toLowerCase().includes('total:')) ?
                CONSTANTS.setExcelStyle("FFFFFFFF", 10, true, "48689a") :
                CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "right")
        },
        width: 50
    }
    specification['invoice_amount'] = {
        displayName: 'Invoice amount',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return (value && value.toString().toLowerCase().includes('total:')) ?
                CONSTANTS.setExcelStyle("FFFFFFFF", 10, true, "48689a") :
                CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "right", "0.00")
        },
        width: 100
    }
    specification['currency_code'] = {
        displayName: 'Currency code',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "left")
        },
        width: 50
    }
    if (isRoyalty) {
        specification['royalty'] = {
            displayName: 'Royalty',
            headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
            cellStyle: (value, row) => {
                return CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "left")
            },
            width: 90
        }
    }
    specification['category'] = {
        displayName: 'Category',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "left")
        },
        width: 50
    }
    specification['curriculum_n_program'] = {
        displayName: 'Curriculum & Program',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "left")
        },
        width: 80
    }
    specification['xrate_eur'] = {
        displayName: 'Xrate',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "right")
        },
        width: 50
    }
    specification['total_amount_in_eur'] = {
        displayName: 'Total amount in EUR',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return (value && value.toString().toLowerCase().includes('total:')) ?
                CONSTANTS.setExcelStyle("FFFFFFFF", 10, true, "48689a") :
                CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "right", "€ 0.00")
        },
        width: 100
    }
    specification['xrate_usd'] = {
        displayName: 'Xrate',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "right")
        },
        width: 50
    }
    specification['total_amount_in_usd'] = {
        displayName: 'Total amount in USD',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return (value && value.toString().toLowerCase().includes('total:')) ?
                CONSTANTS.setExcelStyle("FFFFFFFF", 10, true, "48689a") :
                CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "right", "$ 0.00")
        },
        width: 100
    }
    if (isRoyalty) {
        specification['royalty_due_in_eur'] = {
            displayName: 'Royalty due in EUR',
            headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
            cellStyle: (value, row) => {
                return (value && value.toString().toLowerCase().includes('total:')) ?
                    CONSTANTS.setExcelStyle("FFFFFFFF", 10, true, "48689a") :
                    CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "right", "€ 0.00")
            },
            width: 100
        }
        specification['royalty_due_in_usd'] = {
            displayName: 'Royalty due in USD',
            headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
            cellStyle: (value, row) => {
                return (value && value.toString().toLowerCase().includes('total:')) ?
                    CONSTANTS.setExcelStyle("FFFFFFFF", 10, true, "48689a") :
                    CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "right", "$ 0.00")
            },
            width: 100
        }
    }
    return specification
}

const getPILDataSet = (jsonData, country, month, year) => {
    let dataset = [],
        total_no_of_day = 0,
        total_invoice_amount = 0,
        total_amount_in_eur = 0,
        total_amount_in_usd = 0,
        royalty_due_in_eur = 0,
        royalty_due_in_usd = 0,
        excelHeader;

    excelHeader = ['customer', 'track', 'invoiceNumber', 'facilitatorName', 'numberOfPerson', 'perQuantityCost', 'plfCost', 'workshopDeliveryDay', 'workshopDeliveryAmount', 'accountabilityDays', 'accountabilityAmount', 'pax', 'amountBilled']
// if (isRoyalty) {
    //     excelHeader.splice(8, 0, 'royalty')
    //     excelHeader.push('royalty_due_in_eur', 'royalty_due_in_usd')
    // }
    for (let i = 0; i < jsonData.length; i++) {
        let clientDetail = {};
        for (let j = 0; j < excelHeader.length; j++) {
            clientDetail[excelHeader[j]] = jsonData[i][j] ? jsonData[i][j] : ''
        }
        dataset.push(clientDetail)
        // total_no_of_day += +jsonData[i][5]
        // total_invoice_amount += +jsonData[i][6]
        // total_amount_in_eur += +jsonData[i][isRoyalty ? 12 : 11]
        // total_amount_in_usd += +jsonData[i][isRoyalty ? 14 : 13]
        // royalty_due_in_eur += +jsonData[i][15]
        // royalty_due_in_usd += +jsonData[i][16]
    }
    

    // Add Total 
    let excelTotal = {},
        excelHeaderValue;

     excelHeaderValue = ['', '', '', '', '', `Total: ${11}`, `Total: ${33}`, '', '', '', '', `Total: €${44}`, '', `Total: $${55}`]
    // if (isRoyalty) {
    //     excelHeaderValue.splice(8, 0, '')
    //     excelHeaderValue.push(`Total: €${getFormatedNumber(royalty_due_in_eur)}`, `Total: $${getFormatedNumber(royalty_due_in_usd)}`)
    // }

    for (let i = 0; i < excelHeader.length; i++) {
        excelTotal[excelHeader[i]] = excelHeaderValue[i]
    }
    dataset.push(excelTotal)
    return dataset
}
const getPILHeading = (country, month, year)=> {
    // let title = { value: 'Partner Details', style: CONSTANTS.setExcelStyle('FFFFFFFF', 12, false, '48689a', 'center') },
    //     nameKey = { value: 'Name:', style: CONSTANTS.setExcelStyle('00000000', 10, true, 'c7d5da', 'left') },
    //     nameValue = { value: user.name, style: CONSTANTS.setExcelStyle('00000000', 10, false, 'c7d5da', 'left') },
    //     countryNameKey = { value: 'Country:', style: CONSTANTS.setExcelStyle('00000000', 10, true, 'c7d5da', 'left') },
    //     countryNameValue = { value: country, style: CONSTANTS.setExcelStyle('00000000', 10, false, 'c7d5da', 'left') },
    //     currencyCodeKey = { value: 'Currency Code:', style: CONSTANTS.setExcelStyle('00000000', 10, true, 'c7d5da', 'left') },
    //     currencyCodeValue = { value: currency_code, style: CONSTANTS.setExcelStyle('00000000', 10, false, 'c7d5da', 'left') },
    let period = { value: 'Period', style: CONSTANTS.setExcelStyle('FFFFFFFF', 10, false, '48689a', 'left') };
      let  reportMonthYear = { value: `${CONSTANTS.monthName[month]}, ${year}`, style: CONSTANTS.setExcelStyle('FFFFFFFF', 10, false, '48689a', 'left') };
    let reportHeading = { value: 'Monthly PIL Turnover Report DOOR', style: CONSTANTS.setExcelStyle('FFFFFFFF', 14, false, '48689a', 'left') }
    
    // return [
    //     ['', '', title], [],
    //     ['', '', nameKey, '', nameValue],
    //     ['', '', countryNameKey, '', countryNameValue],
    //     ['', '', currencyCodeKey, '', currencyCodeValue],
    //     [], [],
    //     [reportHeading],
    //     []
    // ];
    return [
        [period ,reportMonthYear, '', '','','',''],
        ['', '', reportHeading , '', '', '', ''],
        ['Country', country,'',
            ' Participants License Fee Cost(PLFs), excluding material cost(sec. 5.02)',
            ' Workshop Delivery Fee',
            , 'Accountability Coaching/Consulting'
            , 'Internal Certification Fees collected']
    ]
}
const getPILMerge = () => {
    let columnLength = 13;
    // let merges = [{ start: { row: 1, column: 3 }, end: { row: 2, column: 5 } }]
    let merges = []
    merges.push({ start: { row: 1, column: 3 }, end: { row: 2, column: 7 } })
    merges.push({ start: { row: 3, column: 3 }, end: { row: 3, column: 4 } })
    merges.push({ start: { row: 3, column: 5 }, end: { row: 3, column: 7 } })
    merges.push({ start: { row: 4, column: 3 }, end: { row: 4, column: 4 } })
    merges.push({ start: { row: 4, column: 5 }, end: { row: 4, column: 7 } })
    merges.push({ start: { row: 5, column: 3 }, end: { row: 5, column: 4 } })
    merges.push({ start: { row: 5, column: 5 }, end: { row: 5, column: 7 } })

    merges.push({ start: { row: 8, column: 1 }, end: { row: 9, column: columnLength } })

    for (let i = 1; i <= columnLength; i++)
        merges.push({ start: { row: 10, column: i }, end: { row: 11, column: i } })
    return merges
}
const getPILSpecification = () => {
    let specification = {}
    
    specification['customer'] = {
        displayName: 'Client',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "left")
        },
        width: 100
    }
    specification['invoiceNumber'] = {
        displayName: 'Invoice#',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "left")
        },
        /* cellFormat: function (value, row) {
            return (value == 1) ? 'Active' : '';
        }, */
        width: 80
    }
    specification['track'] = {
        displayName: 'Track',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "left")
        },
        width: 80
    }
    specification['facilitatorName'] = {
        displayName: 'Facilitator Name',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "left")
        },
        width: 100
    }
    specification['numberOfPerson'] = {
        displayName: 'Number/Quantity',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "left")
        },
        width: 160
    }
    specification['perQuantityCost'] = {
        displayName: 'Per PLF in US$',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "left")
        },
        width: 160
    }
    specification['plfCost'] = {
        displayName: 'PLF Cost in US$',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "left")
        },
        width: 160
    }
    specification['workshopDeliveryDay'] = {
        displayName: 'Days',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "left")
        },
        width: 160
    }
    specification['workshopDeliveryAmount'] = {
        displayName: 'Amount in US$',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "left")
        },
        width: 160
    }
    specification['accountabilityDays'] = {
        displayName: 'Days',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "left")
        },
        width: 160
    }
    specification['accountabilityAmount'] = {
        displayName: 'Billed Amount in US$',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "left")
        },
        width: 160
    }
    specification['pax'] = {
        displayName: 'Pax',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "left")
        },
        width: 160
    }
    specification['amountBilled'] = {
        displayName: 'Billed Amount in US$',
        headerStyle: CONSTANTS.setExcelStyle('FFFFFFFF', 10, true, '48689a', 'center'),
        cellStyle: (value, row) => {
            return CONSTANTS.setExcelStyle("00000000", 10, false, "c7d5da", "left")
        },
        width: 160
    }
    return specification
}
var excel = {
    getDataSet,
    getHeading,
    getMerge,
    getSpecification,
    getPILHeading,
    getPILDataSet,
    getPILMerge,
    getPILSpecification
};

module.exports = excel;