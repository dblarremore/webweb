module.exports = {
  target: 'node',
  node: {
      fs: 'empty'
  },
  mode: 'development',
  entry: './webweb.v6.js',
  output: {
    path: __dirname,
    filename: 'webweb.bundle.js',
    libraryTarget: 'var',
    library: 'Webweb'
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
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
    ]
  }
};
