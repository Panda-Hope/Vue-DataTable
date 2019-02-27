import {isPlainObject} from "../util/index";

function headRender(headRender: Function | Object, column, h, vm) {
    // Vue 模板组件
    if (isPlainObject(headRender)) {
        return h(headRender, {attrs: {column}});
    }
    // Vue jsx
    if (typeof headRender === "function") {
        return headRender.call(vm, h, column);
    }
}

function cellRender(render: Function | Object, index, val, row, h, vm) {
    // Vue 模板组件
    if (isPlainObject(render)) {
        return h(render, {
            attrs: {index, val, row}
        });
    }
    // Vue jsx
    if (typeof render === "function") {
        return render.call(vm, h, index, val, row);
    }
}

export {cellRender};
export default ({
    props: {
        scrollHeight: Number,
        maxHeight: Number,
        rowClassName: String,
        data: {
            type: Array,
            required: true
        },
        border: Boolean
    },
    computed: {
        tableData() {
            return this.data.map(i => i);
        }
    },
    render(h) {
        return (
            <div class={["d-table-wrapper", this.border && "d-table-border"]}>
                <div class="d-table">
                    <div class="d-table-header">
                        <table>
                            <colgroup>
                                {
                                    this.columns.map(column => {
                                        return (
                                            <col style={{width: column.width}} />
                                        );
                                    })
                                }
                            </colgroup>
                            <thead>
                            {
                                this.theads.map(row => {
                                    return (
                                        <tr>
                                            {
                                                row.map(column => {
                                                    return (
                                                        <th rowSpan={column._rowspan} colSpan={column._colspan}>
                                                            <div class="d-table-cell">
                                                                {column.headRender ? headRender(column.headRender, column, h, this) : column.label}
                                                            </div>
                                                        </th>
                                                    );
                                                })
                                            }
                                        </tr>
                                    );
                                })
                            }
                            </thead>
                        </table>
                    </div>
                    <div class={["d-table-tbody", this.scrollHeight && "scroll"]} style={{maxHeight: this.scrollHeight + "px"}}>
                        <table>
                            <colgroup>
                                {
                                    this.columns.map(column => {
                                        return (
                                            <col style={{width: column.width}} />
                                        );
                                    })
                                }
                            </colgroup>
                            <tbody>
                            {
                                Array.isArray(this.tableData) && this.tableData.map((row, index) => {
                                    return (
                                        <tr class={[this.rowClassName]}>
                                            {
                                                this.columns.map(column => {
                                                    return (
                                                        <td>
                                                            <div class="d-table-cell">
                                                                {column.render ? cellRender(column.render, index, row[column.prop], row, h, this) : row[column.prop]}
                                                            </div>
                                                        </td>
                                                    );
                                                })
                                            }
                                        </tr>
                                    );
                                })
                            }
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }
}: Object);