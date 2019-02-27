import {dataMapWarn} from "../util/index";

function checkAll(control: Object, unitBoxs: Array<Object>): void {
    let checked = control.checked === true;
    unitBoxs.forEach(box => {
        if (box.disabled) return;
        box.checked = box.row._checked = checked;
    });
}

function checkControl(control: Object, unitBoxs: Array<Object>): void {
    let checkedCount = 0;

    unitBoxs.forEach(box => {
        if (box.checked === true) checkedCount++;
    });
    if (checkedCount === unitBoxs.length) {
        control.checked = true;
    }else if (checkedCount > 0) {
        control.checked = "intermediate";
    }else {
        control.checked = false;
    }
}

function getAllSelectedRows(checked, boxs) {
    let selectedRows = [];

    if (checked) {
        boxs.forEach(box => {
            if (!box.disabled) selectedRows.push(box.row);
        });
    }
    return selectedRows;
}

function getSelectedRows(boxs) {
    let selectedRows = [];

    boxs.forEach(box => {
        if (box.checked === true && !box.disabled) {
            selectedRows.push(box.row);
        }
    });
    return selectedRows;
}

function selection(el: Object): void {
    dataMapWarn("selection", el);

    let controlBox;
    let unitBoxs = [];
    let isFlushing = false;

    el.headRender = {
        name: "ControlBox",
        props: ["column"],
        mounted() {
            controlBox = this;
        },
        render(h) {
            return (
                <input ref="controlBox" type="checkbox" disabled={this.disabled} onChange={this.selectAll} checked={this.checked} />
            );
        },
        data() {
            return {
                disabled: false,
                checked: false
            };
        },
        methods: {
            selectAll() {
                if (this.disabled) return;
                this.checked = this.checked !== true;
                checkAll(controlBox, unitBoxs);
                this.$parent.$emit("select-all", getAllSelectedRows(this.checked, unitBoxs), el);
            }
        }
    };
    el.render = {
        name: "UintBox",
        props: ["index", "val", "row"],
        mounted() {
            unitBoxs.push(this);
        },
        render(h) {
            if (typeof el.checkIfDisabled === "function") {
                this.disabled = el.checkIfDisabled(this.index, this.val, this.row) === true;

                /* 检测总控制Selection是否需要Disable */
                if (!isFlushing) {
                    isFlushing = true;
                    this.$nextTick(function () {
                        isFlushing = false;

                        let disableCount = true;
                        unitBoxs.find(box => {
                            if (box.disabled !== true) {
                                disableCount = false;
                                return true;
                            }
                        });
                        controlBox.disabled = disableCount;
                    });
                }
            }

            this.checked = !!this.row._checked;
            return (
                <input ref="unitBox" type="checkbox" disabled={this.disabled} onChange={this.select} checked={this.checked} />
            );
        },
        data() {
            return {
                disabled: false,
                checked: false
            };
        },
        methods: {
            select() {
                if (this.disabled) return;
                this.checked = this.row._checked = !this.checked;
                checkControl(controlBox, unitBoxs);
                this.$parent.$emit("select", getSelectedRows(unitBoxs), el);
            }
        }
    };
}

export default selection;