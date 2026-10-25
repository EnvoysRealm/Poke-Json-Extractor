# Pokémon Card Data Extractor

## 🚀 Overview

The Pokémon Card Data Extractor is a client-side web application designed to parse JSON files exported from [Pokécardmaker.net](https://pokecardmaker.net). It extracts detailed information from these JSON files and presents it in an organized, user-friendly table. This tool is particularly useful for cataloging custom Pokémon cards, analyzing card data, or preparing data for other uses.

The application runs entirely in your web browser, requiring no backend or server-side setup. It's built with HTML, CSS (including Tailwind CSS for utility classes and a custom theme), and vanilla JavaScript.

## ✨ Features

* **JSON File Upload:** Allows users to upload one or more `.json` or `.txt` files containing card data from Pokécardmaker.net.
* **Comprehensive Data Extraction:** Extracts a wide range of card details, including:
    * **General Info:** Name, Subname, Card Series, Supertype, Illustrator, Rarity Symbol, Art Variant, Card Number, Total in Set, Regulation Mark, Rotation Symbol, Set Name/Text.
    * **Pokémon Specifics:** HP, Primary Type, Card Subtype, Evolves From, Pokedex Data, Flavor Text, Weakness, Resistance, Retreat Cost, Abilities (Name & Effect), Attacks (Name, Cost, Damage & Effect).
    * **Trainer/Energy Specifics:** Trainer Type, Card Effect, Card Description.
* **Dynamic Column Generation:** Automatically creates new columns in the results table for any "other data" fields found in the JSON that are not part of the standard extraction set.
* **Collapsible Cell Content:** Long text fields (like card effects or descriptions) are truncated in the table with a "More" button to expand and view the full content, keeping the table layout clean. The preview length is adjustable in `script.js` (`MAX_CELL_LENGTH`).
* **Re-import Functionality:** Can process JSON files that were previously exported by this extractor tool (which are arrays of card objects).
* **Data Export:**
    * **Download as JSON:** Allows users to download all currently extracted card data as a single, well-formatted JSON file.
    * **Copy to Clipboard:** Provides an option to copy all extracted data to the clipboard.
* **Themed User Interface:** Features a custom dark theme with styled buttons and title, designed for a visually appealing experience.
* **Client-Side Operation:** Runs entirely in the browser; no internet connection is needed after the initial page load, and no data is sent to any server by default.

## 🛠️ How to Use

1.  **Download Files:**
    * Ensure you have the following three files in the same directory:
        * `index.html`
        * `style.css`
        * `script.js`
2.  **Open the Application:**
    * Open the `index.html` file in any modern web browser (e.g., Chrome, Firefox, Edge, Safari).
3.  **Upload JSON Files:**
    * Click the "Choose Files" (or similar) button in the "Upload JSON File(s)" section.
    * Select one or more `.json` (or `.txt` files containing valid JSON) exported from Pokécardmaker.net.
4.  **Extract Data:**
    * Click the "Extract Data" button.
5.  **View Results:**
    * The extracted data for each card will appear in the table below.
    * If new, previously unseen fields are found in the "otherData" section of your JSONs, new columns will be dynamically added to the end of the table.
    * For cells with long text, click the "More" button to expand the content and "Less" to collapse it.
6.  **Export Data (Optional):**
    * Use the "Download All as JSON" button to save all currently displayed card data to a local file.
    * Use the "Copy All to Clipboard" button to copy the data for pasting elsewhere.

## 📂 Project Files

* **`index.html`**:
    * The main HTML file that defines the structure and layout of the web application.
    * Includes references to Tailwind CSS (via CDN), `style.css`, and `script.js`.
* **`style.css`**:
    * Contains all custom CSS rules for the application.
    * Implements the dark theme, button styles, table formatting, fixed header/footer layout, and styles for collapsible content.
* **`script.js`**:
    * Houses all the client-side JavaScript logic. This includes:
        * File input handling and reading.
        * JSON parsing.
        * The core `extractCardData` function for processing individual card JSONs.
        * Logic for identifying different card types and extracting relevant fields.
        * Dynamic generation of table headers and rows.
        * Functionality for truncating and expanding long cell content.
        * Handling for re-importing previously exported data.
        * Event listeners for buttons (Extract, Download, Copy).

## 🔧 Customization & Potential Future Development

* **Text Preview Length:** The number of characters shown before truncating long text in table cells can be adjusted by changing the `MAX_CELL_LENGTH` constant at the top of `script.js`.
* **Styling:** The visual appearance can be further customized by modifying `style.css`.
* **Google Sheets Integration:** (Functionality discussed previously but removed from the current version) Could be re-added to allow users to push extracted data directly to a specified Google Sheet via a Google Apps Script web app. This would require setting up an Apps Script and providing its URL to the application.
* **Advanced Data Filtering/Sorting:** Future versions could include options to filter the displayed table data based on certain criteria (e.g., card type, HP) or sort columns.
* **Local Storage:** To persist data between sessions, browser local storage could be implemented.

---

This README should provide a comprehensive guide for anyone looking to use or understand your Pokémon Card Data Extractor.
