/**
 * Created by qiyuzhao on 2018-02-02.
 */
const path = require('path');
const webpack = require("webpack");

const config = {
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'JSGoogleStaticMapMaker.min.js',
    library: 'GSMMaker'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['babel-preset-env'],
            plugins: [require('babel-plugin-transform-flow-strip-types')]
          }
        }
      }
    ]
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, 'src/')
    }
  },
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      include: /\.min\.js$/,
      minimize: true
    })
  ]
};


module.exports = config;