// --- Global state for extracted data ---
let allExtractedCardsData = [];
let dynamicHeaders = []; // To store headers generated from "Other Data"

// --- Constants ---
const MAX_CELL_LENGTH = 60; // Adjusted: Max characters before truncating (approx. 3 lines)
const EXPANDABLE_CELL_CLASS = 'expandable-cell'; // CSS class for cells with "More" button

// --- Helper Functions ---
function getSafeValue(dataObj, keyPath, defaultValue = null) {
    if (typeof dataObj !== 'object' || dataObj === null) return defaultValue;
    const keys = keyPath.split('.');
    let val = dataObj;
    for (const key of keys) {
        if (typeof val === 'object' && val !== null && key in val) {
            val = val[key];
        } else {
            return defaultValue;
        }
        if (val === null && keys.indexOf(key) < keys.length - 1) {
            return defaultValue;
        }
    }
    return val === undefined ? defaultValue : val;
}

function formatEnergyCost(energyCostList, typeMap) {
    if (!energyCostList || !Array.isArray(energyCostList) || energyCostList.length === 0) {
        return "N/A";
    }
    const parts = [];
    for (const costItem of energyCostList) {
        const amount = costItem.amount || 0;
        const typeId = costItem.typeId;
        const typeName = typeMap[typeId] || `TypeID:${typeId}`;
        parts.push(`${typeName} x${amount}`);
    }
    return parts.length > 0 ? parts.join(", ") : "N/A";
}

const EXCLUDED_FIELDS_FROM_DYNAMIC_COLUMNS = [
    'images', 'src', 'file', 
    'baseSet', 'supertype', 'type', 'subtype', 'rarityIcon', 'regulationMark',
    'weaknessType', 'resistanceType', 'trainerType', 'rotationIcon', 'rarity', 
    'moves', 
    'energyCost', 
    'types', 
    'colors', 'styles', 'logic', 'baseSetDependencies', 'baseSetOverwrites', 'customStyles', 
    'backgroundColor', 
    'name', 'subname', 'hitpoints', 'cardNumber', 'totalInSet', 'illustrator',
    'weaknessAmount', 'weaknessModifier', 'resistanceAmount', 'resistanceModifier',
    'retreatCost', 'prevolveName', 'dexStats', 'dexEntry', 'customSetIconText', 'setIcon',
    'rules', 
    'description', 
    'baseSetId', 'supertypeId', 'typeId', 'subtypeId', 'rarityIconId', 'regulationMarkId',
    'weaknessTypeId', 'resistanceTypeId', 'trainerTypeId', 'rotationIconId', 'rarityId', 'setIconId'
];


function extractCardData(jsonData, fileName) {
    if (typeof jsonData !== 'object' || jsonData === null) {
        console.error("Invalid JSON data provided for file:", fileName);
        return null;
    }

    const typeMap = {};
    if (Array.isArray(jsonData.types)) {
        for (const typeEntry of jsonData.types) {
            if (typeof typeEntry === 'object' && typeEntry !== null && 'id' in typeEntry) {
                typeMap[typeEntry.id] = typeEntry.slug || typeEntry.displayName || `ID:${typeEntry.id}`;
            }
        }
    }
    for (const key of ['type', 'weaknessType', 'resistanceType']) {
        const typeInfo = getSafeValue(jsonData, key);
         if (typeof typeInfo === 'object' && typeInfo !== null && 'id' in typeInfo && ('slug'in typeInfo || 'displayName' in typeInfo)) {
            if (!typeMap[typeInfo.id]) { 
                 typeMap[typeInfo.id] = typeInfo.slug || typeInfo.displayName;
            }
        }
    }

    const cardDetails = {
        "File Name": fileName,
        "Name": getSafeValue(jsonData, 'name', "N/A"),
        "Subname": getSafeValue(jsonData, 'subname', ""),
        "Card Series": getSafeValue(jsonData, 'baseSet.displayName', getSafeValue(jsonData, 'baseSet.slug', "N/A")),
        "Supertype": getSafeValue(jsonData, 'supertype.displayName', getSafeValue(jsonData, 'supertype.slug', "N/A")),
        "Illustrator": getSafeValue(jsonData, 'illustrator', "N/A"),
        "Rarity Symbol": getSafeValue(jsonData, 'rarityIcon.displayName', getSafeValue(jsonData, 'rarityIcon.slug', "N/A")),
        "Art Variant": getSafeValue(jsonData, 'rarity.displayName', ""),
        "Card Number": getSafeValue(jsonData, 'cardNumber', "N/A"),
        "Total in Set": getSafeValue(jsonData, 'totalInSet', "N/A"),
        "Regulation Mark": getSafeValue(jsonData, 'regulationMark.displayName', getSafeValue(jsonData, 'regulationMark.slug', "N/A")),
        "Rotation Symbol": getSafeValue(jsonData, 'rotationIcon.displayName', getSafeValue(jsonData, 'rotationIcon.slug', "")),
        "Set Name/Text": getSafeValue(jsonData, 'customSetIconText', getSafeValue(jsonData, 'setIcon.displayName', "N/A")),
        
        "HP": "", "Primary Type": "", "Card Subtype": "", "Evolves From": "",
        "Pokedex Data": "", "Flavor Text": "", "Weakness": "", "Resistance": "",
        "Retreat Cost": "", "Ability Name": "", "Ability Effect": "",
        "Attack 1 Name": "", "Attack 1 Cost": "", "Attack 1 Damage": "", "Attack 1 Effect": "",
        "Attack 2 Name": "", "Attack 2 Cost": "", "Attack 2 Damage": "", "Attack 2 Effect": "",
        "Trainer Type": "", "Card Effect": "", "Card Description": "",
        otherData: {} 
    };

    if (jsonData.description !== undefined) {
        cardDetails["Card Description"] = String(jsonData.description);
    }

    const supertypeSlug = getSafeValue(jsonData, 'supertype.slug', '').toLowerCase();

    if (supertypeSlug === 'pokemon') {
        cardDetails["HP"] = getSafeValue(jsonData, 'hitpoints', "N/A");
        cardDetails["Primary Type"] = getSafeValue(jsonData, 'type.displayName', getSafeValue(jsonData, 'type.slug', "N/A"));
        cardDetails["Card Subtype"] = getSafeValue(jsonData, 'subtype.displayName', getSafeValue(jsonData, 'subtype.slug', "N/A"));
        cardDetails["Evolves From"] = getSafeValue(jsonData, 'prevolveName', "");
        cardDetails["Pokedex Data"] = getSafeValue(jsonData, 'dexStats', "");
        cardDetails["Flavor Text"] = getSafeValue(jsonData, 'dexEntry', "");

        const weaknessTypeName = typeMap[getSafeValue(jsonData, 'weaknessType.id')] || getSafeValue(jsonData, 'weaknessType.displayName', getSafeValue(jsonData, 'weaknessType.slug'));
        const weaknessAmount = getSafeValue(jsonData, 'weaknessAmount');
        if (weaknessTypeName && weaknessAmount !== null && weaknessAmount !== undefined) {
            cardDetails["Weakness"] = `${weaknessTypeName} ${weaknessAmount}`.trim();
        } else { cardDetails["Weakness"] = "None"; }

        const resistanceTypeName = typeMap[getSafeValue(jsonData, 'resistanceType.id')] || getSafeValue(jsonData, 'resistanceType.displayName', getSafeValue(jsonData, 'resistanceType.slug'));
        let resistanceAmount = getSafeValue(jsonData, 'resistanceAmount');
        const resistanceModifier = getSafeValue(jsonData, 'resistanceModifier', '');
        if (resistanceTypeName && resistanceAmount !== null && resistanceAmount !== undefined) {
            cardDetails["Resistance"] = (typeof resistanceAmount === 'string' && (resistanceAmount.includes("-") || resistanceAmount.includes("+"))) ? `${resistanceTypeName} ${resistanceAmount}`.trim() : `${resistanceTypeName} ${resistanceModifier}${resistanceAmount}`.trim();
        } else { cardDetails["Resistance"] = "None"; }
        
        const retreatCostVal = getSafeValue(jsonData, 'retreatCost');
        cardDetails["Retreat Cost"] = (retreatCostVal !== null && retreatCostVal !== undefined) ? retreatCostVal : 0;

        const moves = getSafeValue(jsonData, 'moves', []);
        let ability = null; const attacks = [];
        if (Array.isArray(moves)) {
            for (const move of moves) {
                if (typeof move !== 'object' || move === null) continue;
                if (move.isAbility) { if (!ability) ability = { name: move.name || "N/A", effect: move.description || "N/A" }; }
                else { if (attacks.length < 2) attacks.push({ name: move.name || "N/A", cost: formatEnergyCost(move.energyCost, typeMap), damage: `${move.damageAmount || ''}${move.damageModifier || ''}`.trim() || "N/A", effect: move.description || "N/A" });}
            }
        }
        cardDetails["Ability Name"] = ability ? ability.name : ""; cardDetails["Ability Effect"] = ability ? ability.effect : "";
        for (let i = 0; i < 2; i++) {
            if (i < attacks.length) {
                cardDetails[`Attack ${i+1} Name`] = attacks[i].name; cardDetails[`Attack ${i+1} Cost`] = attacks[i].cost;
                cardDetails[`Attack ${i+1} Damage`] = attacks[i].damage; cardDetails[`Attack ${i+1} Effect`] = attacks[i].effect;
            }
        }
    } else if (supertypeSlug === 'trainer' || supertypeSlug === 'stadium' || supertypeSlug === 'item' || supertypeSlug === 'supporter' || supertypeSlug === 'tool') {
        cardDetails["Trainer Type"] = getSafeValue(jsonData, 'trainerType.displayName', getSafeValue(jsonData, 'trainerType.slug', supertypeSlug));
        
        let effectText = "";
        const moves = getSafeValue(jsonData, 'moves', []);
        if (Array.isArray(moves) && moves.length > 0 && moves[0].description) {
            effectText = moves[0].description;
        } else {
            const rules = getSafeValue(jsonData, 'rules');
            if (Array.isArray(rules)) effectText = rules.join('\n');
            else if (typeof rules === 'string') effectText = rules;
        }
        if (!cardDetails["Card Description"] && !effectText) { 
            cardDetails["Flavor Text"] = getSafeValue(jsonData, 'dexEntry', ""); 
        }
        cardDetails["Card Effect"] = effectText;

    } else if (supertypeSlug === 'energy') {
        cardDetails["Primary Type"] = getSafeValue(jsonData, 'type.displayName', getSafeValue(jsonData, 'type.slug', "N/A"));
        let effectText = "";
        const moves = getSafeValue(jsonData, 'moves', []);
        if (Array.isArray(moves) && moves.length > 0 && moves[0].description) {
            effectText = moves[0].description;
        } else {
            const rules = getSafeValue(jsonData, 'rules');
            if (Array.isArray(rules)) effectText = rules.join('\n');
            else if (typeof rules === 'string') effectText = rules;
        }
        cardDetails["Card Effect"] = effectText;
        if (!cardDetails["Card Description"] && !effectText) { 
             cardDetails["Flavor Text"] = getSafeValue(jsonData, 'dexEntry', "");
        }
    }
    
    for (const key in jsonData) {
        if (Object.hasOwnProperty.call(jsonData, key) && !EXCLUDED_FIELDS_FROM_DYNAMIC_COLUMNS.includes(key)) {
            const value = jsonData[key];
            if (typeof value !== 'function' && 
                (typeof value !== 'object' || value === null || 
                (Array.isArray(value) && value.length < 3 && value.every(item => typeof item !== 'object' && typeof item !== 'function')) ||
                (!Array.isArray(value) && Object.keys(value).length < 3 && Object.values(value).every(item => typeof item !== 'object' && typeof item !== 'function')))
            ) {
                cardDetails.otherData[key] = value;
            }
        }
    }
    return cardDetails;
}

const fileInput = document.getElementById('jsonFiles');
const processButton = document.getElementById('processButton');
const resultsTable = document.getElementById('resultsTable');
const tableHead = resultsTable.querySelector('thead');
const tableBody = resultsTable.querySelector('tbody');
const messageArea = document.getElementById('messageArea');
const downloadJsonButton = document.getElementById('downloadJsonButton');
const copyJsonButton = document.getElementById('copyJsonButton');

const BASE_TABLE_HEADERS = [
    "File Name", "Name", "Subname", "Card Series", "Supertype", "Primary Type", "Card Subtype",
    "HP", "Evolves From", "Trainer Type", "Card Effect", "Card Description", "Weakness", "Resistance", "Retreat Cost",
    "Ability Name", "Ability Effect", "Attack 1 Name", "Attack 1 Cost", "Attack 1 Damage", "Attack 1 Effect",
    "Attack 2 Name", "Attack 2 Cost", "Attack 2 Damage", "Attack 2 Effect",
    "Pokedex Data", "Flavor Text", "Illustrator", "Rarity Symbol", "Art Variant", "Card Number", "Total in Set",
    "Regulation Mark", "Rotation Symbol", "Set Name/Text"
];

function displayMessage(message, type = 'info') { 
    messageArea.textContent = message;
    messageArea.className = 'mb-4'; 
    if (type === 'error') {
        messageArea.classList.add('error');
    } else if (type === 'success') {
        messageArea.classList.add('success');
    } else {
        messageArea.classList.add('info');
    }
}

function setupTableHeaders(currentDynamicHeaders) {
    tableHead.innerHTML = '';
    const headerRow = tableHead.insertRow();
    const finalHeaders = [...BASE_TABLE_HEADERS, ...currentDynamicHeaders];
    finalHeaders.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
}

function addCardDataToTable(cardData, currentDynamicHeaders) {
    if (!cardData) return;
    
    const finalHeaders = [...BASE_TABLE_HEADERS, ...currentDynamicHeaders];
    const row = tableBody.insertRow();

    finalHeaders.forEach(header => {
        const cell = row.insertCell();
        let cellValue = "";
        let isExpandable = false; // Flag to mark if this cell type should be expandable

        // Identify columns that typically contain long text
        const expandableHeaderNames = [
            "Card Effect", "Card Description", "Ability Effect", 
            "Attack 1 Effect", "Attack 2 Effect", 
            "Pokedex Data", "Flavor Text"
        ];

        if (BASE_TABLE_HEADERS.includes(header)) {
            cellValue = cardData[header] !== null && cardData[header] !== undefined ? String(cardData[header]) : "";
            if (expandableHeaderNames.includes(header)) {
                isExpandable = true;
            }
        } else if (cardData.otherData && cardData.otherData[header] !== undefined) {
            cellValue = String(cardData.otherData[header]);
            isExpandable = true; // Assume dynamic "other data" columns might be long
        }

        if (isExpandable && cellValue.length > MAX_CELL_LENGTH) {
            cell.classList.add(EXPANDABLE_CELL_CLASS); // Add class for potential styling (e.g., min-width)
            
            const shortContentSpan = document.createElement('span');
            shortContentSpan.textContent = cellValue.substring(0, MAX_CELL_LENGTH) + "... ";
            shortContentSpan.classList.add('short-cell-content');
            
            const fullContentSpan = document.createElement('span');
            fullContentSpan.textContent = cellValue;
            fullContentSpan.style.display = 'none'; 
            fullContentSpan.classList.add('full-cell-content');

            const toggleButton = document.createElement('button');
            toggleButton.textContent = "More";
            toggleButton.classList.add('toggle-content-btn');
            toggleButton.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent row click or other events
                if (fullContentSpan.style.display === 'none') {
                    shortContentSpan.style.display = 'none';
                    fullContentSpan.style.display = 'inline';
                    toggleButton.textContent = "Less";
                    cell.classList.add('expanded');
                } else {
                    shortContentSpan.style.display = 'inline';
                    fullContentSpan.style.display = 'none';
                    toggleButton.textContent = "More";
                    cell.classList.remove('expanded');
                }
            });

            cell.appendChild(shortContentSpan);
            cell.appendChild(toggleButton);
            cell.appendChild(fullContentSpan);
        } else {
            cell.textContent = cellValue;
            // If it's an expandable type of header but content is short, still add the class for consistent width
            if (isExpandable || (!BASE_TABLE_HEADERS.includes(header) && cardData.otherData && cardData.otherData[header] !== undefined)) {
                 cell.classList.add(EXPANDABLE_CELL_CLASS);
            }
        }
    });
}

function updateActionButtonsState() {
    const hasData = allExtractedCardsData.length > 0;
    downloadJsonButton.disabled = !hasData;
    copyJsonButton.disabled = !hasData;
}

processButton.addEventListener('click', async () => {
    processButton.classList.add('clicked');
    setTimeout(() => processButton.classList.remove('clicked'), 150);

    const files = fileInput.files;
    if (!files.length) {
        displayMessage("Please select one or more JSON files to process.", 'error');
        return;
    }
    tableBody.innerHTML = ''; 
    allExtractedCardsData = []; 
    dynamicHeaders = []; 
    
    displayMessage("Processing files...", 'info');

    let filesProcessedCount = 0; 
    let errorsEncountered = false;
    const tempExtractedData = []; 

    for (const file of files) {
        if (file.type !== "application/json") {
            displayMessage(`Skipping non-JSON file: ${file.name}. Only .json files are accepted.`, 'error');
            errorsEncountered = true; continue;
        }
        try {
            const fileContent = await file.text();
            const parsedJson = JSON.parse(fileContent);

            if (Array.isArray(parsedJson)) { 
                displayMessage(`Re-importing ${parsedJson.length} card(s) from ${file.name}...`, 'info');
                parsedJson.forEach(cardObject => {
                    if (typeof cardObject === 'object' && cardObject !== null && cardObject.Name) {
                        if (!cardObject.otherData) cardObject.otherData = {}; // Ensure otherData exists
                        // If re-importing, we need to flatten its "otherData" if it exists from a previous dynamic column setup
                        // For simplicity now, we'll assume re-imported data is already in the desired flat structure for export
                        // or that the 'otherData' property will be handled correctly by the dynamic column generation.
                        // This might need refinement if the re-imported structure is complex.
                        tempExtractedData.push(cardObject); 
                        filesProcessedCount++;
                    } else {
                        console.warn("Skipping invalid object in re-imported array:", cardObject);
                    }
                });
            } else { 
                const extractedData = extractCardData(parsedJson, file.name);
                if (extractedData) { 
                    tempExtractedData.push(extractedData);
                    filesProcessedCount++; 
                } else { 
                    displayMessage(`Could not extract data from ${file.name}. Check console.`, 'error'); 
                    errorsEncountered = true; 
                }
            }
        } catch (error) {
            console.error(`Error processing file ${file.name}:`, error);
            displayMessage(`Error processing file ${file.name}: ${error.message}. Check console.`, 'error');
            errorsEncountered = true;
        }
    }

    const allOtherDataKeys = new Set();
    tempExtractedData.forEach(card => {
        if (card.otherData && typeof card.otherData === 'object') {
            Object.keys(card.otherData).forEach(key => allOtherDataKeys.add(key));
        }
        // Also check top-level properties for re-imported data that might not have been nested under 'otherData'
        // but are not part of BASE_TABLE_HEADERS.
        Object.keys(card).forEach(key => {
            if (!BASE_TABLE_HEADERS.includes(key) && 
                key !== 'otherData' && 
                key !== 'File Name' && // Already handled
                !EXCLUDED_FIELDS_FROM_DYNAMIC_COLUMNS.includes(key) // Check against general exclusions
            ) {
                allOtherDataKeys.add(key);
            }
        });
    });
    dynamicHeaders = Array.from(allOtherDataKeys).sort(); 

    allExtractedCardsData = tempExtractedData.map(card => {
        const newCard = { ...card }; // Start with existing properties
        if (card.otherData && typeof card.otherData === 'object') {
            for (const key of dynamicHeaders) {
                if (card.otherData.hasOwnProperty(key)) {
                    newCard[key] = card.otherData[key]; // Promote to top level
                }
            }
        }
        // For re-imported data, ensure dynamic header fields are directly on newCard
        for (const key of dynamicHeaders) {
            if (card.hasOwnProperty(key) && !newCard.hasOwnProperty(key)) {
                 newCard[key] = card[key];
            }
        }
        // delete newCard.otherData; // We no longer need the nested otherData after promotion
        return newCard;
    });


    setupTableHeaders(dynamicHeaders); 
    allExtractedCardsData.forEach(card => addCardDataToTable(card, dynamicHeaders));


    if (filesProcessedCount > 0 && !errorsEncountered) displayMessage(`Successfully processed data from ${filesProcessedCount} source(s).`, 'success');
    else if (filesProcessedCount > 0 && errorsEncountered) displayMessage(`Processed data from ${filesProcessedCount} source(s) with some errors. Check messages.`, 'success');
    else if (errorsEncountered) displayMessage("Finished processing with errors. No data was successfully extracted.", 'error');
    else displayMessage("No JSON files were processed or files were empty.", 'info');
    
    updateActionButtonsState();
});

downloadJsonButton.addEventListener('click', () => {
    downloadJsonButton.classList.add('clicked');
    setTimeout(() => downloadJsonButton.classList.remove('clicked'), 150);

    if (allExtractedCardsData.length === 0) { displayMessage("No data to download.", 'error'); return; }
    try {
        // For export, we ensure all dynamic header fields are present at the top level.
        // The mapping in processButton already does this promotion.
        const exportData = allExtractedCardsData.map(card => {
            const finalCard = {};
            const allHeadersForExport = [...BASE_TABLE_HEADERS, ...dynamicHeaders];
            allHeadersForExport.forEach(header => {
                if (card.hasOwnProperty(header)) {
                    finalCard[header] = card[header];
                }
            });
            // Include any remaining properties from the original card that weren't headers (should be minimal)
            // This logic might need refinement if original cards have many non-header, non-otherData fields
            for (const key in card) {
                if (card.hasOwnProperty(key) && !finalCard.hasOwnProperty(key) && key !== 'otherData') {
                    finalCard[key] = card[key];
                }
            }
            return finalCard;
        });

        const jsonDataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonDataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = 'pokemon_cards_export.json';
        document.body.appendChild(a); a.click();
        document.body.removeChild(a); URL.revokeObjectURL(url);
        displayMessage("Data downloaded as pokemon_cards_export.json", 'success');
    } catch (error) { displayMessage("Failed to download JSON. " + error.message, 'error'); }
});

copyJsonButton.addEventListener('click', () => {
    copyJsonButton.classList.add('clicked');
    setTimeout(() => copyJsonButton.classList.remove('clicked'), 150);

    if (allExtractedCardsData.length === 0) { displayMessage("No data to copy.", 'error'); return; }
    try {
        const exportData = allExtractedCardsData.map(card => {
            const finalCard = {};
            const allHeadersForExport = [...BASE_TABLE_HEADERS, ...dynamicHeaders];
            allHeadersForExport.forEach(header => {
                if (card.hasOwnProperty(header)) {
                    finalCard[header] = card[header];
                }
            });
             for (const key in card) {
                if (card.hasOwnProperty(key) && !finalCard.hasOwnProperty(key) && key !== 'otherData') {
                    finalCard[key] = card[key];
                }
            }
            return finalCard;
        });
        const jsonDataStr = JSON.stringify(exportData, null, 2);
        navigator.clipboard.writeText(jsonDataStr)
            .then(() => displayMessage("All card data copied to clipboard!", 'success'))
            .catch(err => displayMessage("Failed to copy. " + err.message, 'error'));
    } catch (error) { displayMessage("Failed to prepare JSON for clipboard. " + error.message, 'error'); }
});

// Initial setup
setupTableHeaders(dynamicHeaders); 
updateActionButtonsState();
displayMessage("Upload your JSON files and click 'Extract Data'.", 'info');
