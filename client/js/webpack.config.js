module.exports = {
  mode: 'development',
  entry: './webweb.v5.js',
  output: {
    path: __dirname,
    filename: 'webweb.bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};
