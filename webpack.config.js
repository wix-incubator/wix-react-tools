const path = require('path');
const glob = require("glob");
const {testGlob} = require('./package.json');
const testFiles = glob.sync(testGlob);

const distPath = path.join(__dirname, 'dist');
const polyfills = ['core-js/es6/array', 'core-js/modules/es6.function.name', 'core-js/modules/es6.object.assign', 'core-js/modules/es6.set', 'core-js/modules/es6.string.starts-with', 'core-js/es6/number', 'core-js/es6/promise', 'core-js/es6/symbol'];


const testsSetup = polyfills.concat([path.join(__dirname, 'dist', 'test', 'setup.js')]);
module.exports = {
    devtool: 'eval',
    entry: {
        test: testsSetup.concat(testFiles),
        webtest: testsSetup.concat(testFiles.map(fileName => `mocha-loader!${fileName}`))
    },
    output: {
        path: distPath,
        filename: '[name].bundle.js',
        libraryTarget: 'umd',
        pathinfo: true
    },
    devServer: {
        contentBase: distPath,
        inline: true,
        hot: false
    },
    module: {
        noParse: [/\.min\.js$/, /\.bundle\.js$/],
        rules: [{
            test: /\.js$/,
            include: [
                path.join(__dirname, 'node_modules', 'postcss-nested' , 'node_modules' , 'chalk'),
                path.join(__dirname, 'node_modules', 'postcss-safe-parser' , 'node_modules' , 'chalk'),
                path.join(__dirname, 'node_modules', 'postcss-selector-matches' , 'dist'),
                path.join(__dirname, 'node_modules', 'enhanced-resolve' , 'lib'),
                path.join(__dirname, 'node_modules', 'ansi-styles'),
            ],
            loader: 'ts-loader',
            options: {
                // needed so it has a separate transpilation instance
                instance: 'lib-compat',
                transpileOnly: true
            }
        }]
    }
};
