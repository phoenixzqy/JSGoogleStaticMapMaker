/**
 * Created by qiyuzhao on 2018-02-02.
 */

module.exports = {
  entry: './index.js',
  output: {
    path: './dist',
    filename: 'JSGoogleStaticMapMaker.js'
  },
  module: {
    // define loaders
    // define loaders
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: [
            ['env',
              {
                targets: {
                  "browsers": ["last 2 versions", "ie >= 9"]
                },
                "plugins": ["transform-flow-strip-types"]
              }]
          ]
        }
      }
    ]
  }
};