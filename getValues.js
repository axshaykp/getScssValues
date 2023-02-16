import fs from "fs";
import glob from "glob";
import cheerio from "cheerio";
// Set the directory path where your .astro files are stored
const directoryPath = "./src";
// Define an array of custom class prefixes to extract
const customClassPrefixes = ["pt-", "pb", "mt-", "mb-"];
// Define a function to extract classes from a single .astro file
function extractClassesFromFile(filePath, filterStrings) {
    // Load the .astro file into Cheerio
    const html = fs.readFileSync(filePath, "utf-8");
    const $ = cheerio.load(html);
    // Find all elements with a "class" attribute
    const elementsWithClass = $("[class]");
    // Extract the classes from each element and add them to an array
    const classes = [];
    elementsWithClass.each(function () {
        const elementClasses = $(this).attr("class").split(" ");
        classes.push(...elementClasses);
    });
    // Filter out any classes that don't start with the filter strings and remove the filter strings from the class names
    const filteredClasses = classes
        .filter((className) => {
            for (const filterString of filterStrings) {
                if (className.startsWith(filterString)) {
                    return true;
                }
            }
            return false;
        })
        .map((className) => {
            for (const filterString of filterStrings) {
                if (className.startsWith(filterString)) {
                    return className.replace(filterString, "");
                }
            }
        });
    // Return the array of filtered classes
    return filteredClasses;
}
// Define a function to extract classes for all custom class prefixes in the directory
function extractClassesForCustomClassPrefixes(directoryPath, customClassPrefixes) {
    // Loop through each custom class prefix and extract the classes
    const classesByPrefix = {};
    customClassPrefixes.forEach((prefix) => {
        const customClasses = extractClassesFromDirectory(directoryPath, prefix);
        classesByPrefix[prefix] = customClasses;
    });
    // Return an object with each custom class prefix and its corresponding array of unique filtered classes
    return classesByPrefix;
}
// Define a function to extract classes from all .astro files in a directory for a single custom class prefix
function extractClassesFromDirectory(directoryPath, filterString) {
    // Use glob to get a list of all .astro files in the directory and its subdirectories
    const fileNames = glob.sync(`${directoryPath}/**/*.astro`);
    // Loop through each file and extract the classes
    const classes = [];
    fileNames.forEach((fileName) => {
        classes.push("0");
        classes.push(...extractClassesFromFile(fileName, [filterString]));
    });
    // Filter out any duplicate classes and return the array of unique filtered classes
    const uniqueClasses = [...new Set(classes)].filter((className) => {
        // Only include elements that don't contain any alphabets
        return /^[0-9]+$/i.test(className);
    });
    return uniqueClasses;
}
// Call the function to extract classes for all custom class prefixes in the directory
const classesByPrefix = extractClassesForCustomClassPrefixes(directoryPath, customClassPrefixes);
// Loop through each custom class prefix and output the unique filtered classes as an SCSS variable to a file
fs.unlinkSync("./src/scss/partials/_values.scss");
for (const [prefix, customClasses] of Object.entries(classesByPrefix)) {
    const scssVariable = `$${prefix}values: ${customClasses.join(", ")};`;
    fs.appendFileSync("./src/scss/partials/_values.scss", `${scssVariable}\n`);
}
