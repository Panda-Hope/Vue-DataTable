import {cellRender} from "../data-table/body";

function ascending(a, b) {
    return a - b;
}

function descending(a, b) {
    return b - a;
}

function getSortMethod(fn: Function) {
    return (a, b) => fn(a.val, b.val);
}

function sortable(el: Object): void {
    let originData;                                 // 保留原始数据序列
    let isFromSort = false;                         // 数据更新是否来源于排序
    let hasSorted = false;                          // 确保每次视图更新前仅触发一次排序
    let existRender = el.render;                    // 与原有render相兼容
    let rearrange = (vm, type?: string) => {
        el.order = type;
        isFromSort = true;
        vm.$refs.tbody.$forceUpdate();
    };

    el.headRender = function(h, column) {
        return (
            <div>
                <span>{column.label}</span>
                <button onClick={() => rearrange(this, "ascending")}>升序</button>
                <button onClick={() => rearrange(this, "descending")}>降序</button>
                <button onClick={() => rearrange(this)}>默认</button>
            </div>
        );
    };
    el.render = function(h, index, val, row) {
        if (!hasSorted) {
            /* 确保排序与渲染仅发生一次 */
            hasSorted = true;
            if (!isFromSort) originData = this.tableData.map(i => i);

            /* 对需要排序的数据进行映射 */
            let mapped = originData.map((item, index) => {
                return {
                    index,
                    val: item[el.prop]
                };
            });

            switch (el.order) {
                case "ascending":
                    mapped.sort(getSortMethod(ascending));
                    break;
                case "descending":
                    mapped.sort(getSortMethod(descending));
                    break;
                default:
                    if (typeof el.sortMethod === "function") mapped.sort(getSortMethod(el.sortMethod));
                    break;
            }

            /* 不直接修改Data避免在子组件直接修改父组件数据 */
            for (let i=0;i<this.tableData.length;i++) {
                this.tableData[i] = originData[mapped[i].index];
            }

            if (isFromSort) {
                isFromSort = false;
                this.$refs.tbody.$forceUpdate();                            // 渲染排序后数据
                this.$emit("sort-change", el.order, el);
                this.$nextTick(() => hasSorted = false);
            }else {
                /* 数据修改、初次绑定 在此重新渲染排序后数据 */
                this.$nextTick(function () {
                    this.$refs.tbody.$forceUpdate();
                    this.$nextTick(() => hasSorted = false);
                });
            }
        }

        return existRender ? cellRender(existRender, index, val, row, h, this) : val;
    }
}

export default sortable;