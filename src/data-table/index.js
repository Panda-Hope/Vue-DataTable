import TableColgroup from "./colgroup";
import TableHead from "./head";
import TableBody from "./body";
import {SingleTable, SeparateTable, FixedTable, CombineTable} from "../util/const";

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

function addEvent(el: Object, event: string, fn: (e, index?: number) => void) {
    let els = el && el.length ? el : [el];

    for (let i=0;i<els.length;i++) {
        els[i].addEventListener(event, e => fn(e, i));
    }
}

export default ({
    props: {
        scrollHeight: Number,
        scrollWidth: Number,
        rowClassName: String,
        data: {
            type: Array,
            required: true
        },
        border: Boolean
    },
    data: {

    },
    computed: {
        tableData() {
            return Array.isArray(this.data) ? this.data.map(i => i) : [];
        }
    },
    methods: {
        computeTableHeight() {
            this.$nextTick(function () {
                let headHeight = this.$refs.thead.$el.offsetHeight;

                setHeadRowHeight(this.$refs.leftHead, headHeight);
                setHeadRowHeight(this.$refs.rightHead, headHeight);
                setTbodyRowHeight(this.$refs.leftTbody, this.$refs.tbody);
                setTbodyRowHeight(this.$refs.rightTbody, this.$refs.tbody);
            });
        },
        /* 确保固定列表格高度一致 */
        registerFixedDataWatcher() {
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
                tbody.$options.updated ? tbody.$options.updated.push(updateRowHeight) : (tbody.$options.updated = [updateRowHeight]);
            })
        },
        /* 确保固定列表格样式一致 */
        registerStyleWatcher() {
            this.$nextTick(function () {
                let leftColumns = this.$refs.leftTbody.$el.children;
                let columns = this.$refs.tbody.$el.children;
                let rightColumns = this.$refs.rightTbody.$el.children;
                let mouseover = (e, index) => {
                    leftColumns[index].classList.add("hover");
                    columns[index].classList.add("hover");
                    rightColumns[index].classList.add("hover");
                };
                let mouseout = (e, index) => {
                    leftColumns[index].classList.remove("hover");
                    columns[index].classList.remove("hover");
                    rightColumns[index].classList.remove("hover");
                };

                let isScrolling = false;
                let scroll = () => {
                    if (!isScrolling) {
                        isScrolling = true;

                        this.$refs.leftWrapper.classList.add("scroll");
                        this.$refs.rightWrapper.classList.add("scroll");

                        setTimeout(() => {
                            isScrolling = false;

                            if (this.$refs.scrollWrapper.scrollLeft === 0) {
                                this.$refs.leftWrapper.classList.remove("scroll");
                            } else if (this.$refs.scrollWrapper.scrollLeft + this.$refs.scrollWrapper.offsetWidth === this.$refs.scrollWrapper.children[0].offsetWidth) {
                                this.$refs.rightWrapper.classList.remove("scroll");
                            }
                        }, 300);
                    }
                };

                addEvent(leftColumns, "mouseover", mouseover);
                addEvent(columns, "mouseover", mouseover);
                addEvent(rightColumns, "mouseover", mouseover);

                addEvent(leftColumns, "mouseout", mouseout);
                addEvent(columns, "mouseout", mouseout);
                addEvent(rightColumns, "mouseout", mouseout);

                addEvent(this.$refs.scrollWrapper, "scroll", scroll);                     // 监测表格水平滚动
            });
        },
        /* 确保固定表格同步滚动 */
        registerScrollWatcher() {
            this.$nextTick(function () {
                let ticking = false;
                let scrollTo = () => {
                    let leftWrapper = this.$refs.leftHorScrollWrapper;
                    let rightWrapper = this.$refs.rightHorScrollWrapper;
                    let wrapper = this.$refs.horScrollWrapper;

                    if (leftWrapper.scrollTop < wrapper.scrollTop) {
                        leftWrapper.scrollTop = rightWrapper.scrollTop = --wrapper.scrollTop;
                        window.requestAnimationFrame(scrollTo);
                    }else if (leftWrapper.scrollTop > wrapper.scrollTop) {
                        leftWrapper.scrollTop = rightWrapper.scrollTop = ++wrapper.scrollTop;
                        window.requestAnimationFrame(scrollTo);
                    }

                    ticking = false;
                };
                let scroll = () => {

                    if (!ticking) {
                        window.requestAnimationFrame(scrollTo);
                        ticking = true;
                    }
                };

                addEvent(this.$refs.horScrollWrapper, "scroll", scroll);
            });
        }
    },
    render(h) {
        let leftFixed = [];
        let scrolls = [];
        let rightFixed = [];
        let TableMode = this.TableMode = this.scrollHeight ? SeparateTable : SingleTable;

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

        if (leftFixed.length || rightFixed.length) {
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
            TableMode = this.TableMode = TableMode === SingleTable ? FixedTable : CombineTable;
        }

        /* 对不同的表格结构模式匹配不同的模板 */
        switch (TableMode) {
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
            case CombineTable:
                if (TableMode === CombineTable && !this.scrollWidth) {
                    console.warn("固定列表格需要执行 \"scrollWidth\" 值");
                }

                let {theads: leftHeads, columns: leftColumns} = getHeadAndColumns(leftFixed);
                let {theads: scrollHeads, columns: scrollColumns} = getHeadAndColumns(scrolls);
                let {theads: rightHeads, columns: rightColumns} = getHeadAndColumns(rightFixed);

                /* 获取固定列表格高度信息，重新渲染视图，这里需要执行些DOM操作 */
                this.computeTableHeight();

                /* 注册固定列表格相关观察器 */
                if (!this.registeredFixedWatcher) {
                    this.registeredFixedWatcher = true;

                    this.registerFixedDataWatcher();
                    this.registerStyleWatcher();
                    this.TableMode === CombineTable && this.registerScrollWatcher();           // 固定列与表头时同步表格滚动
                }

                /* 返回相应的字符模板 */
                let template;

                if (TableMode === FixedTable) {
                    template = (
                        <div class={["d-table-wrapper", this.border && "d-table-border"]}>
                            <div class="d-table-fixed-left" ref="leftWrapper">
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
                            <div class="d-table-scroll" ref="scrollWrapper">
                                <table class="d-table" style={{width: this.scrollWidth + "px"}}>
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
                            <div class="d-table-fixed-right scroll" ref="rightWrapper">
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
                }else {
                    template = (
                        <div class={["d-table-wrapper", this.border && "d-table-border"]}>
                            <div class="d-table-fixed-left" ref="leftWrapper">
                                <div class="d-table">
                                    <div class="d-table-header">
                                        <table>
                                            <TableColgroup columns={leftColumns}></TableColgroup>
                                            <TableHead ref="leftHead" theads={leftHeads}></TableHead>
                                        </table>
                                    </div>
                                    <div class="d-table-tbody scroll" ref="leftHorScrollWrapper" style={{maxHeight: this.scrollHeight + "px"}}>
                                        <table>
                                            <TableColgroup columns={leftColumns}></TableColgroup>
                                            <TableBody
                                                rowClassName={this.rowClassName}
                                                tableData={this.tableData}
                                                ref="leftTbody"
                                                columns={leftColumns}>
                                            </TableBody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            <div class="d-table-scroll" ref="scrollWrapper">
                                <div class="d-table" style={{width: this.scrollWidth + "px"}}>
                                    <div class="d-table-header">
                                        <table>
                                            <TableColgroup columns={scrollColumns}></TableColgroup>
                                            <TableHead ref="thead" theads={scrollHeads}></TableHead>
                                        </table>
                                    </div>
                                    <div class="d-table-tbody scroll" ref="horScrollWrapper" style={{maxHeight: this.scrollHeight + "px"}}>
                                        <table>
                                            <TableColgroup columns={scrollColumns}></TableColgroup>
                                            <TableBody ref="tbody"
                                                       rowClassName={this.rowClassName}
                                                       tableData={this.tableData}
                                                       columns={scrollColumns}>
                                            </TableBody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            <div class="d-table-fixed-right scroll" ref="rightWrapper">
                                <div class="d-table">
                                    <div class="d-table-header">
                                        <table>
                                            <TableColgroup columns={rightColumns}></TableColgroup>
                                            <TableHead  ref="rightHead" theads={rightHeads}></TableHead>
                                        </table>
                                    </div>
                                    <div class="d-table-tbody scroll" ref="rightHorScrollWrapper" style={{maxHeight: this.scrollHeight + "px"}}>
                                        <table>
                                            <TableColgroup columns={rightColumns}></TableColgroup>
                                            <TableBody ref="rightTbody"
                                                       rowClassName={this.rowClassName}
                                                       tableData={this.tableData}
                                                       columns={rightColumns}>
                                            </TableBody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                }
                return template
        }
    }
}: Object);