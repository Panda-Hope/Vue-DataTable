import {isPlainObject} from "../util/index";

function cellRender(render: Function | Object, index, val, row, h, vm) {
    // Vue 模板组件
    if (isPlainObject(render)) {
        return h(render, {
            attrs: {index, val, row, tableVm: vm}
        });
    }
    // Vue jsx
    if (typeof render === "function") {
        return render.call(vm, h, index, val, row);
    }
}

export {cellRender};
export default {
    name: "TableBody",
    props: ["tableData", "columns", "rowClassName"],
    render(h) {
        return (
            <tbody>
            {
                this.tableData.map((row, index) => {
                    return (
                        <tr class={[this.rowClassName]}>
                            {
                                this.columns.map(column => {
                                    return (
                                        <td>
                                            <div class="d-table-cell">
                                                {column.render ? cellRender(column.render, index, row[column.prop], row, h, this.$parent) : row[column.prop]}
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
        );
    }
};