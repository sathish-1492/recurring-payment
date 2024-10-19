class TemplateParser {

    constructor(pageTemplate) {
        this.pageTemplate = pageTemplate
    }

    getIncludeContent(templatesContent, tempIdContent) {
        const includeRegex = /{%\s*include\s*"(.*?)"\s*%}/g;
        let match;
        let parsedContent = tempIdContent;

        while ((match = includeRegex.exec(tempIdContent)) !== null) {
            const includeTag = match[0];
            const includTemplateId = match[1];

            if (templatesContent[includTemplateId]) {
                const { htmlcontent } = templatesContent[includTemplateId];
                const includedContent = this.getIncludeContent(templatesContent, htmlcontent);
                parsedContent = parsedContent.replace(includeTag, includedContent);
            } else {
                throw new Error(`Include Template "${includTemplateId}" not found.`);
            }
        }

        return parsedContent;
    }

    getMacros(templateContent) {
        // Define a regular expression to capture the macro name and its content
        const macroRegex = /{%\s*macro\s+(\w+)\s*\(([^)]*)\)\s*%}(.*?)\{%\s*endmacro\s*%}/sg;
        let macros = "";

        // Perform the replacement
        templateContent.replace(macroRegex, (match, macroName, macroArgs, macroContent) => {
            let jsContent = this.parse(macroContent);
            jsContent = jsContent.replace(/[\t\r]+/g, ' ').replace(/\s\s+/g, ' ').trim();

            // Return the JavaScript function
            const convertStr = `\n function ${macroName}(models, ${macroArgs}) {
                \n let obj = ${macroArgs}.split('.')[0]; 
                \n if(obj) {
                \n    models = models[obj]
                \n}   
                ${jsContent};
            }\n\n`.trim();

            macros += convertStr;
        });

        // Remove macros and placeholders from HTML
        const htmlWithoutMacros = templateContent
            .replace(macroRegex, '')         // Remove macro definitions
            .trim();

        return {
            macros: macros,
            html: htmlWithoutMacros
        };
    }

    assignMents(match, name) {
        const fnRegex = /(\w+)\s*=\s*(\w+)\(([^)]*)\)/;
        const variableRegex = /(\w+)\s*=\s*([^)]*)/;

        const fnMatch = name.match(fnRegex);
        const varMatch = name.match(variableRegex);
        if (fnMatch) {
            const [fullMatch, variableName, functionName, args] = fnMatch;
            name = `${variableName} = ${functionName}(models, '${args}')`

            return "`;\nlet " + name + ";\ndata['" + variableName + "'] = " + variableName + "; output += `";
        } else if (varMatch) {
            const [fullMatch, variableName, variable] = varMatch;

            return "`\nlet " + variableName + " = getValue(models, '" + variable + "');`";
        }
    }

    getVariables(match, key) {
        // Handle {{ variable }} tags
        const fnRegex = /(\w+)\s*\(([^)]*)\)/;
        const fnMatch = key.match(fnRegex);

        let keyValue;
        if (fnMatch) {
            keyValue = `${fnMatch[1]}(models, '${fnMatch[2]}')`;

            return "${" + keyValue + "}";
        } else {
            keyValue = `'${key}'`;
            return "${getValue(models, " + keyValue + ")}";
        }
    }

    parseIfCondition(match, cond) {
        return this.parseCondition("if", cond)
    }

    parseELIFCondition(match, cond) {
        return this.parseCondition("} else if", cond)
    }

    parseCondition(type, cond) {

        const regex = /([a-zA-Z0-9_\-.]+)\s*([><=!]+)?\s*(['"][^'"]*['"]|[a-zA-Z0-9_\-.]+)?/;
        const typeofRegex = /typeof\s+(\w+)\s*([!=]=|===|!==)\s*(\w+)/;

        const condMatch = cond.match(regex);
        const typeofMatch = cond.match(typeofRegex);


        if (typeofMatch) {
            const [fullMatch, leftCondition, operator, rightCondition] = typeofMatch;
            return "`\n" + type + " ( typeof " + leftCondition + " " + operator + " " + rightCondition + " ) {\noutput += `";

        } else if (condMatch) {

            const [fullMatch, leftCondition, operator, rightCondition] = condMatch;

            if (operator && rightCondition) {
                // Check if rightCondition is a quoted string or a variable

                if (rightCondition && (rightCondition.startsWith('"') && rightCondition.endsWith('"') || rightCondition.startsWith("'") && rightCondition.endsWith("'"))) {

                    return "`\n" + type + " (getValue(models, '" + leftCondition + "') " + operator + " " + rightCondition + ") {\noutput += `";
                } else {
                    //right condition is varilable, get value from data
                    return "`\n" + type + " ((getValue(models, '" + leftCondition + "')) " + operator + " (getValue(models, '" + rightCondition + "'))) {\noutput += `";
                }
            
            } else if (cond.startsWith('!')) {

                return "`\n" + type + " (!getValue(models, '" + leftCondition + "')) {\noutput += `";

            } else {
                return "`\n" + type + " (getValue(models, '" + leftCondition + "')) {\noutput += `";
            }
        } else {
            return "`\n" + type + " (" + cond + ") {\noutput += `";
        }
    }

    parseArrayForOfLoop(match, key, property) {
        return "`;\nfor (let " + key + " of getValue(models, '" + property + "')) {\n models['" + key + "']=" + key + ";\noutput += `";  // Handle for loops
    }

    parseJSONForInLoop(match, key, property) {
        return "`;\nfor (let " + key + " in getValue(models, '" + property + "')) {\n models['" + key + "']=getValue(models, '" + property + "')[" + key + "];\noutput += `";  // Handle for loops
    }

    parseJSONKeyValueForInLoop(match, key, value, property) {
        return "`;\nfor (let [" + key + ", " + value + "] of Object.entries(getValue(models, '" + property + "'))) {\n models['" + key + "']=" + key + ";\n models['" + value + "']=" + value + " \noutput += `";  // Handle for loops

    }

    parseEndLoop() {
        return "`;\n}\noutput += `"; // Handle endfor
    }


    parseFilters(match, name, filterName) {

        let ftName;
        if (filterName.startsWith('date:')) {
            const format = filterName.replace('date:', '')
            ftName = `format, ${format}`;
        } else {
            ftName = filterName;
        }

        return "${getValue(models, '" + name + "', filters." + ftName + ")}";
    }

    parse(sourceContent) {

        let functionBody = "\nlet output = '';";

        functionBody += "\noutput += `" + sourceContent
            .replace(/`/g, '\\`') // Escape backticks in the template
            .replace(/{%\s*set\s*(.*?)\s*%}/g, this.assignMents.bind(this)) // Handle set conditions
            .replace(/{{\s*(.*?)\s*\|\s*([^}]+)\s*}}/g, this.parseFilters.bind(this)) // Handle variables
            .replace(/{{\s*(.*?)\s*}}/g, this.getVariables.bind(this)) // Handle variables
            .replace(/{%\s*if\s*(.*?)\s*%}/g, this.parseIfCondition.bind(this)) // Handle if conditions
            .replace(/{%\s*elif\s*(.*?)\s*%}/g, this.parseELIFCondition.bind(this)) // Handle elif conditions
            .replace(/{%\s*else\s*%}/g, "`;\n} else {\noutput += `") // Handle else conditions
            .replace(/{%\s*endif\s*%}/g, "`;\n}\noutput += `") // Handle endif
            .replace(/{%\s*for\s*(.*?)\s*of\s*(.*?)\s*%}/g, this.parseArrayForOfLoop.bind(this))
            .replace(/{%\s*for\s*(.*?),\s*(.*?)\s*in\s*(.*?)\s*%}/g, this.parseJSONKeyValueForInLoop.bind(this))
            .replace(/{%\s*for\s*(.*?)\s*in\s*(.*?)\s*%}/g, this.parseJSONForInLoop.bind(this))
            .replace(/{%\s*endfor\s*%}/g, this.parseEndLoop)
            + "`;\nreturn output.trim();";



        //console.info('parsedHTML', functionBody);
        return functionBody

    }

    parser() {

        const parsedContent = {};

        Object.entries(this.pageTemplate).forEach(([templateId, templateObject]) => {
            const { internal, htmlcontent } = templateObject;

            const includedContent = this.getIncludeContent(this.pageTemplate, htmlcontent);
            const { macros, html } = this.getMacros(includedContent);

            if (!internal) {
                var functionStr = macros + this.parse(html);
                parsedContent[templateId] = functionStr;
            }
            // console.log(`templateId: ${templateId}, parserHTMl ::: ${functionStr}`);
        });



        return parsedContent;
    }
}

module.exports = TemplateParser;