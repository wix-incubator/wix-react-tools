const path = require('path');
const glob = require("glob");
const {testGlob} = require('./package.json');
const testFiles = glob.sync(testGlob);

const distPath = path.join(__dirname, 'dist');
const polyfills = ['core-js/es6/array', 'core-js/modules/es6.object.assign', 'core-js/es6/number', 'core-js/es6/promise', 'core-js/es6/symbol'];


const testsSetup = polyfills.concat([path.join(__dirname, 'dist', 'test', 'setup.js')]);
module.exports = {
    devtool: 'eval',
    entry: {
        test : testsSetup.concat(testFiles),
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
        noParse: [/\.min\.js$/, /\.bundle\.js$/]
    }
};
