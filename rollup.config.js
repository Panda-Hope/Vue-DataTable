import babel from 'rollup-plugin-babel';

export default {
    input: "./src/index.js",
    output: {
        file: "./dist/vue-datatable.js",
        // file: "./dist/vue-datatable.common.js",
        format: "iife",
        // format: "cjs",
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