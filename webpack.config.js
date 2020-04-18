var path = require('path');
const dev = process.env.NODE_ENV !== 'production';

module.exports = {
  entry: {
    'main': ['@babel/polyfill', './src/main'],
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  devtool: dev ? 'inline-source-map' : 'source-map',
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env']
        }
      }
    }, {
      test: /\.css$/i,
      use: ['style-loader', 'css-loader'],
    }, {
      test: /\.(woff2?|ttf|eot|jpe?g|png|gif|svg)$/,
      loader: 'file-loader'
    }]
  },
  resolve: {
    extensions: ['.js']
  },
  devServer: {
    writeToDisk: true
  }
};
