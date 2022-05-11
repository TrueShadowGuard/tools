const {generateTemplateFiles} = require('generate-template-files');
const path = require("path");

generateTemplateFiles([
    {
        option: 'Create React component',
        entry: {
            folderPath: path.join(__dirname, 'templates', 'ReactComponent', '__name__')
        },
        stringReplacers: ['__name__'],
        output: {
            path: path.join(process.cwd(), "__name__")
        }
    },
    {
        option: 'Create Redux Reduce',
        defaultCase: '(pascalCase)',
        entry: {
            folderPath: './tools/templates/__store__Reducer.ts',
        },
        stringReplacers: ['__store__', '__model__'],
        output: {
            path: './src/stores/__store__/__store__(pascalCase)Reducer.ts',
            pathAndFileNameDefaultCase: '(kebabCase)',
        },
    },
]);