var VueDataTable = (function (Vue) {
  'use strict';

  Vue = Vue && Vue.hasOwnProperty('default') ? Vue['default'] : Vue;

  function _typeof(obj) {
    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function isPlainObject(obj) {
    return Object.prototype.toString.call(obj) === '[object Object]';
  }

  function dataMapWarn(type, el) {
    if (el.headRender || el.render) {
      console.warn("type=".concat(type, " \u6570\u636E\u7C7B\u578B\u6620\u5C04\u5C06\u4F1A\u8986\u76D6\u539F\u6709\u7684 headRender & render"));
    }
  }

  function deepClone(obj) {
    var copy;
    if (null == obj || "object" !== _typeof(obj)) return obj;

    if (obj instanceof Date) {
      copy = new Date();
      copy.setTime(obj.getTime());
      return copy;
    }

    if (obj instanceof Array) {
      copy = [];

      for (var i = 0, len = obj.length; i < len; i++) {
        copy[i] = deepClone(obj[i]);
      }

      return copy;
    }

    if (obj instanceof Object) {
      copy = {};

      for (var attr in obj) {
        if (obj.hasOwnProperty(attr)) copy[attr] = deepClone(obj[attr]);
      }

      return copy;
    }
  }

  function headRender(headRender, column, h, vm) {
    // Vue 模板组件
    if (isPlainObject(headRender)) {
      return h(headRender, {
        attrs: {
          column: column
        }
      });
    } // Vue jsx


    if (typeof headRender === "function") {
      return headRender.call(vm, h, column);
    }
  }

  function cellRender(render, index, val, row, h, vm) {
    // Vue 模板组件
    if (isPlainObject(render)) {
      return h(render, {
        attrs: {
          index: index,
          val: val,
          row: row
        }
      });
    } // Vue jsx


    if (typeof render === "function") {
      return render.call(vm, h, index, val, row);
    }
  }
  var DataTable = {
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
      tableData: function tableData() {
        return this.data.map(function (i) {
          return i;
        });
      }
    },
    render: function render(h) {
      var _this = this;

      return h("div", {
        "class": ["d-table-wrapper", this.border && "d-table-border"]
      }, [h("div", {
        "class": "d-table"
      }, [h("div", {
        "class": "d-table-header"
      }, [h("table", [h("colgroup", [this.columns.map(function (column) {
        return h("col", {
          "style": {
            width: column.width
          }
        });
      })]), h("thead", [this.theads.map(function (row) {
        return h("tr", [row.map(function (column) {
          return h("th", {
            "attrs": {
              "rowSpan": column._rowspan,
              "colSpan": column._colspan
            }
          }, [h("div", {
            "class": "d-table-cell"
          }, [column.headRender ? headRender(column.headRender, column, h, _this) : column.label])]);
        })]);
      })])])]), h("div", {
        "class": ["d-table-tbody", this.scrollHeight && "scroll"],
        "style": {
          maxHeight: this.scrollHeight + "px"
        }
      }, [h("table", [h("colgroup", [this.columns.map(function (column) {
        return h("col", {
          "style": {
            width: column.width
          }
        });
      })]), h("tbody", [Array.isArray(this.tableData) && this.tableData.map(function (row, index) {
        return h("tr", {
          "class": [_this.rowClassName]
        }, [_this.columns.map(function (column) {
          return h("td", [h("div", {
            "class": "d-table-cell"
          }, [column.render ? cellRender(column.render, index, row[column.prop], row, h, _this) : row[column.prop]])]);
        })]);
      })])])])])]);
    }
  };

  function checkAll(control, unitBoxs) {
    var checked = control.checked === true;
    unitBoxs.forEach(function (box) {
      if (box.disabled) return;
      box.checked = box.row._checked = checked;
    });
  }

  function checkControl(control, unitBoxs) {
    var checkedCount = 0;
    unitBoxs.forEach(function (box) {
      if (box.checked === true) checkedCount++;
    });

    if (checkedCount === unitBoxs.length) {
      control.checked = true;
    } else if (checkedCount > 0) {
      control.checked = "intermediate";
    } else {
      control.checked = false;
    }
  }

  function getAllSelectedRows(checked, boxs) {
    var selectedRows = [];

    if (checked) {
      boxs.forEach(function (box) {
        if (!box.disabled) selectedRows.push(box.row);
      });
    }

    return selectedRows;
  }

  function getSelectedRows(boxs) {
    var selectedRows = [];
    boxs.forEach(function (box) {
      if (box.checked === true && !box.disabled) {
        selectedRows.push(box.row);
      }
    });
    return selectedRows;
  }

  function selection(el) {
    dataMapWarn("selection", el);
    var controlBox;
    var unitBoxs = [];
    var isFlushing = false;
    el.headRender = {
      name: "ControlBox",
      props: ["column"],
      mounted: function mounted() {
        controlBox = this;
      },
      render: function render(h) {
        return h("input", {
          "ref": "controlBox",
          "attrs": {
            "type": "checkbox",
            "disabled": this.disabled
          },
          "on": {
            "change": this.selectAll
          },
          "domProps": {
            "checked": this.checked
          }
        });
      },
      data: function data() {
        return {
          disabled: false,
          checked: false
        };
      },
      methods: {
        selectAll: function selectAll() {
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
      mounted: function mounted() {
        unitBoxs.push(this);
      },
      render: function render(h) {
        if (typeof el.checkIfDisabled === "function") {
          this.disabled = el.checkIfDisabled(this.index, this.val, this.row) === true;
          /* 检测总控制Selection是否需要Disable */

          if (!isFlushing) {
            isFlushing = true;
            this.$nextTick(function () {
              isFlushing = false;
              var disableCount = true;
              unitBoxs.find(function (box) {
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
        return h("input", {
          "ref": "unitBox",
          "attrs": {
            "type": "checkbox",
            "disabled": this.disabled
          },
          "on": {
            "change": this.select
          },
          "domProps": {
            "checked": this.checked
          }
        });
      },
      data: function data() {
        return {
          disabled: false,
          checked: false
        };
      },
      methods: {
        select: function select() {
          if (this.disabled) return;
          this.checked = this.row._checked = !this.checked;
          checkControl(controlBox, unitBoxs);
          this.$parent.$emit("select", getSelectedRows(unitBoxs), el);
        }
      }
    };
  }

  function ascending(a, b) {
    return a - b;
  }

  function descending(a, b) {
    return b - a;
  }

  function getSortMethod(fn) {
    return function (a, b) {
      return fn(a.val, b.val);
    };
  }

  function sortable(el) {
    var originData; // 保留原始数据序列

    var isFromSort = false; // 数据更新是否来源于排序

    var hasSorted = false; // 确保每次视图更新前仅触发一次排序

    var existRender = el.render; // 与原有render相兼容

    var rearrange = function rearrange(vm, type) {
      el.order = type;
      isFromSort = true;
      vm.$forceUpdate();
    };

    el.headRender = function (h, column) {
      var _this = this;

      return h("div", [h("span", [column.label]), h("button", {
        "on": {
          "click": function click() {
            return rearrange(_this, "ascending");
          }
        }
      }, ["\u5347\u5E8F"]), h("button", {
        "on": {
          "click": function click() {
            return rearrange(_this, "descending");
          }
        }
      }, ["\u964D\u5E8F"]), h("button", {
        "on": {
          "click": function click() {
            return rearrange(_this);
          }
        }
      }, ["\u9ED8\u8BA4"])]);
    };

    el.render = function (h, index, val, row) {
      if (!hasSorted) {
        if (!isFromSort) originData = this.tableData.map(function (i) {
          return i;
        });
        /* 对需要排序的数据进行映射 */

        var mapped = originData.map(function (item, index) {
          return {
            index: index,
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


        for (var i = 0; i < this.tableData.length; i++) {
          this.tableData[i] = originData[mapped[i].index];
        }

        if (isFromSort) {
          isFromSort = false;
          this.$emit("sort-change", el.order, el);
        }

        hasSorted = true;
        this.$forceUpdate(); // 刷新排序后数据

        this.$nextTick(function () {
          return hasSorted = false;
        });
      }

      return existRender ? cellRender(existRender, index, val, row, h, this) : val;
    };
  }

  var dataMapNames = {};

  function addDataMap(name, fn) {
    if (typeof fn !== 'function') {
      console.warn("数据映射类型操作必须是函数类型");
      return;
    }

    if (!dataMapNames[name]) {
      dataMapNames[name] = fn;
    }
  }

  function resolveDataMap(el) {
    if (el.type && dataMapNames[el.type]) dataMapNames[el.type](el);
  }
  /* 注册内置数据映射 */


  function registerDataMap() {
    var dataMaps = {
      selection: selection,
      sortable: sortable
    };

    for (var map in dataMaps) {
      addDataMap(map, dataMaps[map]);
    }
  }

  registerDataMap();

  function setGridAttr(level, rowspan, columns) {
    var colspan = 0;

    for (var i = 0; i < level.length; i++) {
      var el = level[i];

      if (el.subs) {
        el._rowspan = 1;
        el._colspan = setGridAttr(el.subs, rowspan - 1, columns);
        colspan += el._colspan;
      } else {
        columns.push(el);
        el._rowspan = rowspan;
        el._colspan = 1;
        colspan += 1;
      }
    }

    return colspan;
  }
  /* 递归后序遍历表格化数据，生成表格网状结构并生成表格数据列数组 */


  function makeGrid(table) {
    var columns = [];
    var level = table[0];
    var maxRowspan = table.length;
    setGridAttr(level, maxRowspan, columns);
    return {
      table: table,
      columns: columns
    };
  }
  /* 对表格列数据进行层级遍历，将其转换成表格标题视图映射所需的数据结构 */


  function formatColumns(columns) {
    var table = []; // 表头数据格式

    var level = columns;

    while (level.length) {
      table.push(level);
      var nextLevel = [];

      for (var i = 0; i < level.length; i++) {
        var el = level[i];
        if (isPlainObject(el.subs)) el.subs = [el.subs];

        if (Array.isArray(el.subs)) {
          for (var j = 0; j < el.subs.length; j++) {
            nextLevel.push(el.subs[j]);
          }
        } else {
          resolveDataMap(el); // 处理特殊数据类型到视图的映射
        }
      }

      level = nextLevel;
    }

    var tableObj = makeGrid(table);
    return {
      theads: tableObj.table,
      columns: tableObj.columns
    };
  }
  /* 创建一个新的表格组件 */


  function Create(props) {
    if (!Array.isArray(props)) {
      console.error("props 只能接受数组列对象");
    }

    var DataTableOptions = deepClone(DataTable); // 确保每次Create都是从模板创建一个新的类

    DataTableOptions.data = function () {
      var copyProps = deepClone(props); // 确保表格实例化所得的每个对象是从模板所得的副本, 而不是参数对象本身

      var _formatColumns = formatColumns(copyProps),
          theads = _formatColumns.theads,
          columns = _formatColumns.columns;

      return {
        theads: theads,
        columns: columns,
        propColumns: copyProps
      };
    };

    var VueDataTable = Vue.extend(DataTableOptions);

    VueDataTable.prototype.$scaledTable = function (fn) {
      if (typeof fn === "function") fn(this.propColumns);
      var columnObj = formatColumns(this.propColumns);
      this.theads = columnObj.theads;
      this.columns = columnObj.columns;
    };

    return VueDataTable;
  }

  var DataTable$1 = {
    Create: Create,
    addDataMap: addDataMap
  };

  return DataTable$1;

}(Vue));
