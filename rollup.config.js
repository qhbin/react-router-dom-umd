import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser'; // 更新导入
import babel from '@rollup/plugin-babel';
import replace from '@rollup/plugin-replace';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';

const isProduction = process.env.NODE_ENV === 'production';

export default {
  input: './node_modules/react-router-dom/dist/index.js',
  output: {
    file: 'dist/react-router-dom.umd.js',
    format: 'umd',
    name: 'ReactRouterDOM',
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
    sourcemap: true,
    exports: 'auto'
  },
  onwarn(warning, warn) {
    // 忽略 use client 警告
    if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && 
        warning.message.includes('use client')) {
      return;
    }
    // 保持默认警告行为
    warn(warning);
  },
  external: [
    'react',
    'react-dom',
  ],
  plugins: [
    replace({
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env': '{}',
      preventAssignment: true
    }),
    resolve({
      browser: true
    }),
    commonjs(),
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: [
        ['react-app', { targets: { browsers: ['> 0.5% in CN', 'last 2 versions'] } }]
      ]
    }),
    // 只在开发模式下启用 serve 和 livereload
    !isProduction && serve({
      port: 3000,
      contentBase: ['dist', '.'],
      open: true,
      openPage: '/index.html'
    }),
    !isProduction && livereload({
      watch: ['dist', 'index.html'],
      verbose: false
    }),
    isProduction && terser() // 使用新的 terser 插件
  ]
};