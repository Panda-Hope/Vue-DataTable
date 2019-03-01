import TableColgroup from "./colgroup";
import TableHead from "./head";
import TableBody from "./body";

/* Table Model 表格模式常量 */
const SingleTable = Symbol("SingleTable");              // 默认单表格结构
const SeparateTable = Symbol("SeparateTable");          // 固定头表格结构
const FixedTable = Symbol("FixedTable");                // 固定列表格结构
const CombineTable = Symbol("CombineTable");            // 固定头与列结构

/* 为固定列属性表格重新获取其专属 Head & Columns */
function getHeadAndColumns(columns: Array<Object>): {theads: Array<Object>, columns: Array<Object>}  {
    let table = [];                             // 表头数据格式
    let level = columns;

    while (level.length) {
        table.push(level);

        let nextLevel = [];
        for (let i=0;i<level.length;i++) {
            let el = level[i];

            if (Array.isArray(el.subs)) {
                for (let j=0;j<el.subs.length;j++) {
                    nextLevel.push(el.subs[j]);
                }
            }
        }
        level = nextLevel;
    }

    let dataColumns = [];
    getColumns(table[0] || [], dataColumns);

    return {
        theads: table,
        columns: dataColumns
    };
}

/* 执行后序遍历 */
function getColumns(level: Array<Object>, columns: Array<Object>): void {
    for (let i=0;i<level.length;i++) {
        let el = level[i];
        el.subs ? getColumns(el.subs, columns) : columns.push(el);
    }
}

/* 执行先序遍历，获取空白列属性，用于固定列结构 */
function getBlankColumn(el: Object, column: Object): void {
    column._rowspan = el._rowspan;
    column._colspan = el._colspan;
    column.width = el.width;

    if (Array.isArray(el.subs)) {
        column.subs = [];
        for (let i=0;i<el.subs.length;i++) {
            let subColumn = {};
            getBlankColumn(el.subs[i], subColumn);
            column.subs.push(subColumn);
        }
    }
}

/* 设置固定表格头部高度，执行DOM操作 */
function setHeadRowHeight(vm: Object, height: number): void {
    let children = vm.$el.children;
    let average = height/children.length;

    for (let i=0;i<children.length;i++) {
        let el = children[i];
        el.style = `height: ${average}px`;
    }
}

/* 设置固定表格行高度，执行DOM操作 */
function setTbodyRowHeight(vm: Object, referVm: Object): void {
    let children = referVm.$el.children;

    for (let i=0;i<children.length;i++) {
        let el = vm.$el.children[i];
        let height = children[i].offsetHeight;
        el.style = `height: ${height}px`;
    }
}

export default ({
    props: {
        scrollHeight: Number,
        rowClassName: String,
        data: {
            type: Array,
            required: true
        },
        border: Boolean
    },
    data: {
        TableMode: SingleTable,
        registeredFixedWatcher: false,
    },
    computed: {
        tableData() {
            return Array.isArray(this.data) ? this.data.map(i => i) : [];
        }
    },
    methods: {
        computeTableHeight() {
            let headHeight = this.$refs.thead.$el.offsetHeight;

            setHeadRowHeight(this.$refs.leftHead, headHeight);
            setHeadRowHeight(this.$refs.rightHead, headHeight);
            setTbodyRowHeight(this.$refs.leftTbody, this.$refs.tbody);
            setTbodyRowHeight(this.$refs.rightTbody, this.$refs.tbody);
        },
        registerFixedDataWatcher() {
            this.registeredFixedWatcher = true;
            this.$nextTick(function () {
                let thead = this.$refs.thead;
                let tbody = this.$refs.tbody;
                let updateHeadHeight = () => {
                    let headHeight = this.$refs.thead.$el.offsetHeight;
                    setHeadRowHeight(this.$refs.leftHead, headHeight);
                    setHeadRowHeight(this.$refs.rightHead, headHeight);
                };
                let updateRowHeight = () => {
                    setTbodyRowHeight(this.$refs.leftTbody, this.$refs.tbody);
                    setTbodyRowHeight(this.$refs.rightTbody, this.$refs.tbody);
                };

                thead.$options.updated ? thead.$options.updated.push(updateHeadHeight) : (thead.$options.updated = [updateHeadHeight]);
                tbody.$options.updated ? tbody.$options.updated.push(updateRowHeight) : (tbody.$options.updated = updateRowHeight);
            })
        }
    },
    render(h) {
        let leftFixed = [];
        let scrolls = [];
        let rightFixed = [];
        this.TableMode = this.scrollHeight ? SeparateTable : SingleTable;

        /* 将列根据固定属性重新分类 */
        this.propColumns.forEach(el => {
            if (el.fixed === "left") {
                leftFixed.push(el);
            }else if (el.fixed === "right") {
                rightFixed.push(el);
            }else {
                scrolls.push(el);
            }
        });

        let leftBlankColumns = leftFixed.map(el => {
            let blank = {};
            getBlankColumn(el, blank);
            return blank;
        });
        let rightBlankColumns = rightFixed.map(el => {
            let blank = {};
            getBlankColumn(el, blank);
            return blank;
        });

        scrolls = leftBlankColumns.concat(scrolls);
        scrolls = scrolls.concat(rightBlankColumns);

        if (leftFixed.length || rightFixed.length) {
            this.TableMode = this.TableMode === SingleTable ? FixedTable : CombineTable;
        }

        /* 对不同的表格结构模式匹配不同的模板 */
        switch (this.TableMode) {
            case SingleTable:
                this.registeredFixedWatcher = false;

                return (
                    <div class={["d-table-wrapper", this.border && "d-table-border"]}>
                        <table class="d-table">
                            <TableColgroup columns={this.columns}></TableColgroup>
                            <TableHead class="d-table-header" ref="thead" theads={this.theads}></TableHead>
                            <TableBody ref="tbody"
                                       class="d-table-tbody"
                                       rowClassName={this.rowClassName}
                                       tableData={this.tableData}
                                       columns={this.columns}>
                            </TableBody>
                        </table>
                    </div>
                );
            case SeparateTable:
                this.registeredFixedWatcher = false;

                return (
                    <div class={["d-table-wrapper", this.border && "d-table-border"]}>
                        <div class="d-table">
                            <div class="d-table-header">
                                <table>
                                    <TableColgroup columns={this.columns}></TableColgroup>
                                    <TableHead ref="thead" theads={this.theads}></TableHead>
                                </table>
                            </div>
                            <div class={["d-table-tbody", "scroll"]}
                                 style={{maxHeight: this.scrollHeight + "px"}}>
                                <table>
                                    <TableColgroup columns={this.columns}/>
                                    <TableBody ref="tbody"
                                               rowClassName={this.rowClassName}
                                               tableData={this.tableData}
                                               columns={this.columns}>
                                    </TableBody>
                                </table>
                            </div>
                        </div>
                    </div>
                );
            case FixedTable:
                let {theads: leftHeads, columns: leftColumns} = getHeadAndColumns(leftFixed);
                let {theads: scrollHeads, columns: scrollColumns} = getHeadAndColumns(scrolls);
                let {theads: rightHeads, columns: rightColumns} = getHeadAndColumns(rightFixed);

                /* 获取固定列表格高度信息，重新渲染视图，这里需要执行些DOM操作 */
                this.$nextTick(function () {
                    this.computeTableHeight();
                });
                /* 注册数据观察器，当表格数据变化时重新计算高度信息 */
                !this.registeredFixedWatcher && this.registerFixedDataWatcher();

                return (
                    <div class={["d-table-wrapper", this.border && "d-table-border"]}>
                        <div class="d-table-fixed-left">
                            <table class="d-table">
                                <TableColgroup columns={leftColumns}></TableColgroup>
                                <TableHead ref="leftHead" class="d-table-header" theads={leftHeads}></TableHead>
                                <TableBody class="d-table-tbody"
                                           rowClassName={this.rowClassName}
                                           tableData={this.tableData}
                                           ref="leftTbody"
                                           columns={leftColumns}>
                                </TableBody>
                            </table>
                        </div>
                        <div class="d-table-scroll">
                            <table class="d-table">
                                <TableColgroup columns={scrollColumns}></TableColgroup>
                                <TableHead class="d-table-header" ref="thead" theads={scrollHeads}></TableHead>
                                <TableBody ref="tbody"
                                           class="d-table-tbody"
                                           rowClassName={this.rowClassName}
                                           tableData={this.tableData}
                                           columns={scrollColumns}>
                                </TableBody>
                            </table>
                        </div>
                        <div class="d-table-fixed-right">
                            <table class="d-table">
                                <TableColgroup columns={rightColumns}></TableColgroup>
                                <TableHead class="d-table-header" ref="rightHead" theads={rightHeads}></TableHead>
                                <TableBody class="d-table-tbody"
                                           rowClassName={this.rowClassName}
                                           tableData={this.tableData}
                                           ref="rightTbody"
                                           columns={rightColumns}>
                                </TableBody>
                            </table>
                        </div>
                    </div>
                );
        }
    }
}: Object);