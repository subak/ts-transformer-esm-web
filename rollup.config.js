import typescript from '@rollup/plugin-typescript'
import nodeResolve from '@rollup/plugin-node-resolve'

export default {
  external: ['typescript', 'path', 'minimatch'],
  input: "index.ts",
  output: {
    dir: `./`,
    entryFileNames: `[name].cjs`,
    format: 'cjs',
    exports: "auto"
  },
  plugins: [typescript({
    allowSyntheticDefaultImports: true,
    include: ["**/*"],
    exclude: []
  }), nodeResolve()]
}
