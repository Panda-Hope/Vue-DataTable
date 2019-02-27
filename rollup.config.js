import babel from 'rollup-plugin-babel';

export default {
    input: "./src/index.js",
    output: {
        file: "./dist/vue-datatable.js",
        format: "iife",
        name: "VueDataTable",
        globals: {
            vue: "Vue"
        }
    },
    external: ["vue"],
    plugins: [
        babel()
    ]
};