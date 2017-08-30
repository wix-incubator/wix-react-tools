const path = require('path');
const glob = require("glob");
const {testGlob} = require('./package.json');
const testFiles = glob.sync(testGlob);
const webpack = require('webpack');

const distPath = path.join(__dirname, 'dist');


const testsSetup = [path.join(__dirname, 'dist', 'test', 'setup.js')];
module.exports = {
    devtool: 'eval',
    entry: {
        test: testsSetup.concat(testFiles),
        webtest: ['core-js/shim', ...testsSetup.concat(testFiles.map(fileName => `mocha-loader!${fileName}`))]
    },
    output: {
        path: distPath,
        filename: '[name].bundle.js',
        libraryTarget: 'umd',
        pathinfo: true
    },
    plugins:[new webpack.DefinePlugin({
        'process.env': {
            NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'production'),
        },
    })],
    devServer: {
        contentBase: distPath,
        inline: true,
        hot: false
    },
    module: {
        noParse: [/\.min\.js$/, /\.bundle\.js$/]
    }
};
