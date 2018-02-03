/**
 * Created by qiyuzhao on 2018-02-02.
 */
const path = require('path');

const config = {
  entry: './index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'JSGoogleStaticMapMaker.js'
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
  }
};


module.exports = config;