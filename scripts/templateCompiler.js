const fs = require('fs');
const cheerio = require('cheerio');
const path = require('path');
const TemplateParser = require('./templateParser');

const base_dir = '../';

const templateConfig = {

    libraryFile: '/js/library.js', //Will DO laters
    pages: {
        admin: {
            sourceFiles: [
                '/template/admin.template'
            ],
            outputFile: '/template/admin.templates.min.js',
            libraryOutputFile: '/js/library.admin.min.js'
        },
        dashboard: {
            sourceFiles: [
                '/template/dashboard.template'
            ],
            outputFile: '/template/dashboard.templates.min.js',
            libraryOutputFile: '/js/library.dashboard.min.js'
        }
    }
}


const templatesDir = path.join(__dirname, base_dir);

// Function to read and combine content from the given list of files
function readAndCombinePageTemplates(page) {

    console.info('Template source Files ', page.sourceFiles);

    let combinedContent = '';

    page.sourceFiles.forEach(file => {
        const filePath = path.join(templatesDir, file);
        try {
            const fileContent = fs.readFileSync(filePath, 'utf8');
            combinedContent += fileContent + '\n';  // Add newline for separation between templates
        } catch (err) {
            console.error(`Error reading file "${file}":`, err);
        }
    });


    var templateIdWithparsed = {};
    const $ = cheerio.load(combinedContent);

    // Find all <script type="text/template"> tags
    $('script[type="text/template"]').each((i, element) => {
        const templateId = $(element).attr('id');
        const isInternal = $(element).attr('internal') || false;
        const templateContent = $(element).html().trim();

        try {
            templateIdWithparsed[templateId] =  { 
                internal : isInternal,
                htmlcontent :  templateContent
            };

        } catch (err) {
            console.error(`Error compiling template "${templateId}":`, err);
        }
    });

   // console.log('templateIdWithparsed', templateIdWithparsed);

    const parser = new TemplateParser(templateIdWithparsed);
    const parsedContent = parser.parser();

    const buiderScript = `const templateCache = ${JSON.stringify(parsedContent, null, 4)}`;

    try {
        fs.writeFileSync(path.join(templatesDir, page.outputFile), buiderScript, 'utf8');
        console.log(`Successfully wrote to template script file "${page.outputFile}"`);
    } catch (err) {
        console.error(`Error writing file "${page.outputFile}":`, err);
    }

    const libSource = [
        templateConfig.libraryFile,
        page.outputFile
    ]

    combineFiles(libSource, page.libraryOutputFile);
}

// Function to read, combine, and write files
async function combineFiles(filePaths, outputPath) {
    try {

        console.info("")
        console.info("Compine source files", filePaths)
        // Read all files concurrently
        const fileContents = await Promise.all(
            filePaths.map(filePath => fs.readFileSync(path.join(__dirname, base_dir, filePath), 'utf8'))
        );

        // Combine file contents into one string
        const combinedData = fileContents.join('\n'); // Add a newline between each file's content

        // Write the combined data to the output file
        await fs.writeFileSync(path.join(__dirname, base_dir, outputPath), combinedData);
        console.info("Files have been successfully combined and written to", outputPath);
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}


//compine template files and parse to each page  
readAndCombinePageTemplates(templateConfig.pages.dashboard);
readAndCombinePageTemplates(templateConfig.pages.admin);
