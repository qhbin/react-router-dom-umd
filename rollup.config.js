import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import babel from '@rollup/plugin-babel';
import replace from '@rollup/plugin-replace';
import serve from 'rollup-plugin-serve';
import livereload from 'rollup-plugin-livereload';
import MagicString from 'magic-string';

const isProduction = process.env.NODE_ENV === 'production';
function postReplace() {
  return {
    name: 'post-replace',
    renderChunk(code, chunk, options) {
      const magicString = new MagicString(code);
      const pattern = /import\(/g;
      let match;
      
      // 查找所有匹配项并替换
      while ((match = pattern.exec(code))) {
        const start = match.index;
        const end = start + 7; // 'import('.length
        magicString.overwrite(start, end, 'window.import(');
      }
      
      // 只有当代码被修改时才返回新的 sourcemap
      if (magicString.hasChanged()) {
        return {
          code: magicString.toString(),
          map: magicString.generateMap({ hires: true })
        };
      }
      
      return null; // 没有修改，返回 null
    }
  };
}

export default {
  input: './node_modules/react-router-dom/dist/index.mjs',
  output: {
    file: 'dist/react-router-dom.umd.js',
    format: 'umd',
    name: 'ReactRouterDOM',
    globals: {
      react: 'React',
      'react-dom': 'ReactDOM',
    },
    sourcemap: true,
    exports: 'auto',
     intro: `
     if(!window.import && window.dynamicImportPolyfill) {
      window.dynamicImportPolyfill.initialize();
      window.import = window.__import__;
     }
      `.trim()
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
    postReplace(),
    resolve({
      browser: true
    }),
    commonjs(),
    babel({
      babelHelpers: 'runtime',
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