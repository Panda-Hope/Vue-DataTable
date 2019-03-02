/* Table Model 表格模式常量 */
const SingleTable = Symbol("SingleTable");              // 默认单表格结构
const SeparateTable = Symbol("SeparateTable");          // 固定头表格结构
const FixedTable = Symbol("FixedTable");                // 固定列表格结构
const CombineTable = Symbol("CombineTable");            // 固定头与列结构

export {SingleTable, SeparateTable, FixedTable, CombineTable};