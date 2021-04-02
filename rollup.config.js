import nodeResolve from '@rollup/plugin-node-resolve'

export default {
  external: ['typescript', 'path', 'minimatch'],
  input: "ts-transformer-esm-web",
  output: {
    dir: __dirname,
    entryFileNames: `[name].cjs`,
    format: 'cjs'
  },
  plugins: [nodeResolve()]
}
