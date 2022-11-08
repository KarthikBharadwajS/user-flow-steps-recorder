import path from "path";
import CopyPlugin from "copy-webpack-plugin";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  mode: 'production',
  entry: {
    script: './src/script.ts',
    background: './src/Background/index.ts',
    index: './src/index.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: { rules: [{ test: /\.ts$/, use: ['ts-loader',] }] },
  resolve: { extensions: ['.ts'], },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: "./src/index.html" },
        { from: "./src/manifest.json" }
      ],
    }),
  ],
  stats: { warnings: false }
};