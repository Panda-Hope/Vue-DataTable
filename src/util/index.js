// @flow
function isPlainObject (obj: any): boolean {
    return Object.prototype.toString.call(obj) === '[object Object]';
}

function dataMapWarn(type: string, el: Object) {
    if (el.headRender || el.render) {
        console.warn(`type=${type} 数据类型映射将会覆盖原有的 headRender & render`);
    }
}

function deepClone(obj: any): Object {
    let copy;

    if (null == obj || "object" !== typeof obj) return obj;

    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    if (obj instanceof Array) {
        copy = [];
        for (let i = 0, len = obj.length; i < len; i++) {
            copy[i] = deepClone(obj[i]);
        }
        return copy;
    }

    if (obj instanceof Object) {
        copy = {};
        for (let attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = deepClone(obj[attr]);
        }
        return copy;
    }
}

export {
    isPlainObject,
    dataMapWarn,
    deepClone
};