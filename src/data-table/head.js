import {isPlainObject} from "../util/index";

function headRender(headRender: Function | Object, column, h, vm) {
    // Vue 模板组件
    if (isPlainObject(headRender)) {
        return h(headRender, {attrs: {column, tableVm: vm}});
    }
    // Vue jsx
    if (typeof headRender === "function") {
        return headRender.call(vm, h, column);
    }
}

export default {
    name: "TableHead",
    props: ["theads"],
    render(h) {
        return (
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
                                                {column.headRender ? headRender(column.headRender, column, h, this.$parent) : column.label}
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
        );
    }
};