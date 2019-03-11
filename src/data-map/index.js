// @flow
import selection from "./selection";
import sortable from "./sortable";

const dataMapNames: {[string]: Function} = {};

function addDataMap(name: string, fn: Function) {
    if (typeof fn !== 'function') {
        console.warn("数据映射类型操作必须是函数类型");
        return;
    }
    if (!dataMapNames[name]) {
        dataMapNames[name] = fn;
    }
}

function resolveDataMap(el: Object, vm: Object): void {
    if (el.type && dataMapNames[el.type]) dataMapNames[el.type](el, vm);
}

/* 注册内置数据映射 */
function registerDataMap() {
    const dataMaps = {selection, sortable};

    for (let map in dataMaps) {
        addDataMap(map, dataMaps[map]);
    }
}

registerDataMap();

export {addDataMap, resolveDataMap};