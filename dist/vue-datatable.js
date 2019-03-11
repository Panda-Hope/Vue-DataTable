var VueDataTable = (function (Vue) {
    'use strict';

    Vue = Vue && Vue.hasOwnProperty('default') ? Vue['default'] : Vue;

    var TableColgroup = {
      name: "TableColgroup",
      props: ["columns"],
      render: function render(h) {
        return h("colgroup", [this.columns.map(function (column) {
          return h("col", {
            "style": {
              width: column.width
            }
          });
        })]);
      }
    };

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
            column: column,
            tableVm: vm
          }
        });
      } // Vue jsx


      if (typeof headRender === "function") {
        return headRender.call(vm, h, column);
      }
    }

    var TableHead = {
      name: "TableHead",
      props: ["theads"],
      render: function render(h) {
        var _this = this;

        return h("thead", [this.theads.map(function (row) {
          return h("tr", [row.map(function (column) {
            return h("th", {
              "attrs": {
                "rowSpan": column._rowspan,
                "colSpan": column._colspan
              }
            }, [h("div", {
              "class": "d-table-cell"
            }, [column.headRender ? headRender(column.headRender, column, h, _this.$parent) : column.label])]);
          })]);
        })]);
      }
    };

    function cellRender(render, index, val, row, h, vm) {
      // Vue 模板组件
      if (isPlainObject(render)) {
        return h(render, {
          attrs: {
            index: index,
            val: val,
            row: row,
            tableVm: vm
          }
        });
      } // Vue jsx


      if (typeof render === "function") {
        return render.call(vm, h, index, val, row);
      }
    }
    var TableBody = {
      name: "TableBody",
      props: ["tableData", "columns", "rowClassName"],
      render: function render(h) {
        var _this = this;

        return h("tbody", [this.tableData.map(function (row, index) {
          return h("tr", {
            "class": [_this.rowClassName]
          }, [_this.columns.map(function (column) {
            return h("td", [h("div", {
              "class": "d-table-cell"
            }, [column.render ? cellRender(column.render, index, row[column.prop], row, h, _this.$parent) : row[column.prop]])]);
          })]);
        })]);
      }
    };

    /* Table Model 表格模式常量 */
    var SingleTable = Symbol("SingleTable"); // 默认单表格结构

    var SeparateTable = Symbol("SeparateTable"); // 固定头表格结构

    var FixedTable = Symbol("FixedTable"); // 固定列表格结构

    var CombineTable = Symbol("CombineTable"); // 固定头与列结构

    /* 为固定列属性表格重新获取其专属 Head & Columns */

    function getHeadAndColumns(columns) {
      var table = []; // 表头数据格式

      var level = columns;

      while (level.length) {
        table.push(level);
        var nextLevel = [];

        for (var i = 0; i < level.length; i++) {
          var el = level[i];

          if (Array.isArray(el.subs)) {
            for (var j = 0; j < el.subs.length; j++) {
              nextLevel.push(el.subs[j]);
            }
          }
        }

        level = nextLevel;
      }

      var dataColumns = [];
      getColumns(table[0] || [], dataColumns);
      return {
        theads: table,
        columns: dataColumns
      };
    }
    /* 执行后序遍历 */


    function getColumns(level, columns) {
      for (var i = 0; i < level.length; i++) {
        var el = level[i];
        el.subs ? getColumns(el.subs, columns) : columns.push(el);
      }
    }
    /* 执行先序遍历，获取空白列属性，用于固定列结构 */


    function getBlankColumn(el, column) {
      column._rowspan = el._rowspan;
      column._colspan = el._colspan;
      column.width = el.width;

      if (Array.isArray(el.subs)) {
        column.subs = [];

        for (var i = 0; i < el.subs.length; i++) {
          var subColumn = {};
          getBlankColumn(el.subs[i], subColumn);
          column.subs.push(subColumn);
        }
      }
    }
    /* 设置固定表格头部高度，执行DOM操作 */


    function setHeadRowHeight(vm, height) {
      var children = vm.$el.children;
      var average = height / children.length;

      for (var i = 0; i < children.length; i++) {
        var el = children[i];
        el.style = "height: ".concat(average, "px");
      }
    }
    /* 设置固定表格行高度，执行DOM操作 */


    function setTbodyRowHeight(vm, referVm) {
      var children = referVm.$el.children;

      for (var i = 0; i < children.length; i++) {
        var el = vm.$el.children[i];
        var height = children[i].offsetHeight;
        el.style = "height: ".concat(height, "px");
      }
    }

    function addEvent(el, event, fn) {
      var els = el && el.length ? el : [el];

      var _loop = function _loop(i) {
        els[i].addEventListener(event, function (e) {
          return fn(e, i);
        });
      };

      for (var i = 0; i < els.length; i++) {
        _loop(i);
      }
    }

    var DataTable = {
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
      data: {},
      computed: {
        tableData: function tableData() {
          return Array.isArray(this.data) ? this.data.map(function (i) {
            return i;
          }) : [];
        }
      },
      methods: {
        computeTableHeight: function computeTableHeight() {
          this.$nextTick(function () {
            var headHeight = this.$refs.thead.$el.offsetHeight;
            setHeadRowHeight(this.$refs.leftHead, headHeight);
            setHeadRowHeight(this.$refs.rightHead, headHeight);
            setTbodyRowHeight(this.$refs.leftTbody, this.$refs.tbody);
            setTbodyRowHeight(this.$refs.rightTbody, this.$refs.tbody);
          });
        },

        /* 确保固定列表格高度一致 */
        registerFixedDataWatcher: function registerFixedDataWatcher() {
          this.$nextTick(function () {
            var _this = this;

            var thead = this.$refs.thead;
            var tbody = this.$refs.tbody;

            var updateHeadHeight = function updateHeadHeight() {
              var headHeight = _this.$refs.thead.$el.offsetHeight;
              setHeadRowHeight(_this.$refs.leftHead, headHeight);
              setHeadRowHeight(_this.$refs.rightHead, headHeight);
            };

            var updateRowHeight = function updateRowHeight() {
              setTbodyRowHeight(_this.$refs.leftTbody, _this.$refs.tbody);
              setTbodyRowHeight(_this.$refs.rightTbody, _this.$refs.tbody);
            };

            thead.$options.updated ? thead.$options.updated.push(updateHeadHeight) : thead.$options.updated = [updateHeadHeight];
            tbody.$options.updated ? tbody.$options.updated.push(updateRowHeight) : tbody.$options.updated = [updateRowHeight];
          });
        },

        /* 确保固定列表格样式一致 */
        registerStyleWatcher: function registerStyleWatcher() {
          this.$nextTick(function () {
            var _this2 = this;

            var leftColumns = this.$refs.leftTbody.$el.children;
            var columns = this.$refs.tbody.$el.children;
            var rightColumns = this.$refs.rightTbody.$el.children;

            var mouseover = function mouseover(e, index) {
              leftColumns[index].classList.add("hover");
              columns[index].classList.add("hover");
              rightColumns[index].classList.add("hover");
            };

            var mouseout = function mouseout(e, index) {
              leftColumns[index].classList.remove("hover");
              columns[index].classList.remove("hover");
              rightColumns[index].classList.remove("hover");
            };

            var isScrolling = false;

            var scroll = function scroll() {
              if (!isScrolling) {
                isScrolling = true;

                _this2.$refs.leftWrapper.classList.add("scroll");

                _this2.$refs.rightWrapper.classList.add("scroll");

                setTimeout(function () {
                  isScrolling = false;

                  if (_this2.$refs.scrollWrapper.scrollLeft === 0) {
                    _this2.$refs.leftWrapper.classList.remove("scroll");
                  } else if (_this2.$refs.scrollWrapper.scrollLeft + _this2.$refs.scrollWrapper.offsetWidth === _this2.$refs.scrollWrapper.children[0].offsetWidth) {
                    _this2.$refs.rightWrapper.classList.remove("scroll");
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
            addEvent(this.$refs.scrollWrapper, "scroll", scroll); // 监测表格水平滚动
          });
        },

        /* 确保固定表格同步滚动 */
        registerScrollWatcher: function registerScrollWatcher() {
          this.$nextTick(function () {
            var _this3 = this;

            var ticking = false;

            var scrollTo = function scrollTo() {
              var leftWrapper = _this3.$refs.leftHorScrollWrapper;
              var rightWrapper = _this3.$refs.rightHorScrollWrapper;
              var wrapper = _this3.$refs.horScrollWrapper;

              if (leftWrapper.scrollTop < wrapper.scrollTop) {
                leftWrapper.scrollTop = rightWrapper.scrollTop = --wrapper.scrollTop;
                window.requestAnimationFrame(scrollTo);
              } else if (leftWrapper.scrollTop > wrapper.scrollTop) {
                leftWrapper.scrollTop = rightWrapper.scrollTop = ++wrapper.scrollTop;
                window.requestAnimationFrame(scrollTo);
              }

              ticking = false;
            };

            var scroll = function scroll() {
              if (!ticking) {
                window.requestAnimationFrame(scrollTo);
                ticking = true;
              }
            };

            addEvent(this.$refs.horScrollWrapper, "scroll", scroll);
          });
        }
      },
      render: function render(h) {
        var leftFixed = [];
        var scrolls = [];
        var rightFixed = [];
        var TableMode = this.TableMode = this.scrollHeight ? SeparateTable : SingleTable;
        /* 将列根据固定属性重新分类 */

        this.propColumns.forEach(function (el) {
          if (el.fixed === "left") {
            leftFixed.push(el);
          } else if (el.fixed === "right") {
            rightFixed.push(el);
          } else {
            scrolls.push(el);
          }
        });

        if (leftFixed.length || rightFixed.length) {
          var leftBlankColumns = leftFixed.map(function (el) {
            var blank = {};
            getBlankColumn(el, blank);
            return blank;
          });
          var rightBlankColumns = rightFixed.map(function (el) {
            var blank = {};
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
            return h("div", {
              "class": ["d-table-wrapper", this.border && "d-table-border"]
            }, [h("table", {
              "class": "d-table"
            }, [h(TableColgroup, {
              "attrs": {
                "columns": this.columns
              }
            }), h(TableHead, {
              "class": "d-table-header",
              "ref": "thead",
              "attrs": {
                "theads": this.theads
              }
            }), h(TableBody, {
              "ref": "tbody",
              "class": "d-table-tbody",
              "attrs": {
                "rowClassName": this.rowClassName,
                "tableData": this.tableData,
                "columns": this.columns
              }
            })])]);

          case SeparateTable:
            this.registeredFixedWatcher = false;
            return h("div", {
              "class": ["d-table-wrapper", this.border && "d-table-border"]
            }, [h("div", {
              "class": "d-table"
            }, [h("div", {
              "class": "d-table-header"
            }, [h("table", [h(TableColgroup, {
              "attrs": {
                "columns": this.columns
              }
            }), h(TableHead, {
              "ref": "thead",
              "attrs": {
                "theads": this.theads
              }
            })])]), h("div", {
              "class": ["d-table-tbody", "scroll"],
              "style": {
                maxHeight: this.scrollHeight + "px"
              }
            }, [h("table", [h(TableColgroup, {
              "attrs": {
                "columns": this.columns
              }
            }), h(TableBody, {
              "ref": "tbody",
              "attrs": {
                "rowClassName": this.rowClassName,
                "tableData": this.tableData,
                "columns": this.columns
              }
            })])])])]);

          case FixedTable:
          case CombineTable:
            if (TableMode === CombineTable && !this.scrollWidth) {
              console.warn("固定列表格需要执行 \"scrollWidth\" 值");
            }

            var _getHeadAndColumns = getHeadAndColumns(leftFixed),
                leftHeads = _getHeadAndColumns.theads,
                leftColumns = _getHeadAndColumns.columns;

            var _getHeadAndColumns2 = getHeadAndColumns(scrolls),
                scrollHeads = _getHeadAndColumns2.theads,
                scrollColumns = _getHeadAndColumns2.columns;

            var _getHeadAndColumns3 = getHeadAndColumns(rightFixed),
                rightHeads = _getHeadAndColumns3.theads,
                rightColumns = _getHeadAndColumns3.columns;
            /* 获取固定列表格高度信息，重新渲染视图，这里需要执行些DOM操作 */


            this.computeTableHeight();
            /* 注册固定列表格相关观察器 */

            if (!this.registeredFixedWatcher) {
              this.registeredFixedWatcher = true;
              this.registerFixedDataWatcher();
              this.registerStyleWatcher();
              this.TableMode === CombineTable && this.registerScrollWatcher(); // 固定列与表头时同步表格滚动
            }
            /* 返回相应的字符模板 */


            var template;

            if (TableMode === FixedTable) {
              template = h("div", {
                "class": ["d-table-wrapper", this.border && "d-table-border"]
              }, [h("div", {
                "class": "d-table-fixed-left",
                "ref": "leftWrapper"
              }, [h("table", {
                "class": "d-table"
              }, [h(TableColgroup, {
                "attrs": {
                  "columns": leftColumns
                }
              }), h(TableHead, {
                "ref": "leftHead",
                "class": "d-table-header",
                "attrs": {
                  "theads": leftHeads
                }
              }), h(TableBody, {
                "class": "d-table-tbody",
                "attrs": {
                  "rowClassName": this.rowClassName,
                  "tableData": this.tableData,
                  "columns": leftColumns
                },
                "ref": "leftTbody"
              })])]), h("div", {
                "class": "d-table-scroll",
                "ref": "scrollWrapper"
              }, [h("table", {
                "class": "d-table",
                "style": {
                  width: this.scrollWidth + "px"
                }
              }, [h(TableColgroup, {
                "attrs": {
                  "columns": scrollColumns
                }
              }), h(TableHead, {
                "class": "d-table-header",
                "ref": "thead",
                "attrs": {
                  "theads": scrollHeads
                }
              }), h(TableBody, {
                "ref": "tbody",
                "class": "d-table-tbody",
                "attrs": {
                  "rowClassName": this.rowClassName,
                  "tableData": this.tableData,
                  "columns": scrollColumns
                }
              })])]), h("div", {
                "class": "d-table-fixed-right scroll",
                "ref": "rightWrapper"
              }, [h("table", {
                "class": "d-table"
              }, [h(TableColgroup, {
                "attrs": {
                  "columns": rightColumns
                }
              }), h(TableHead, {
                "class": "d-table-header",
                "ref": "rightHead",
                "attrs": {
                  "theads": rightHeads
                }
              }), h(TableBody, {
                "class": "d-table-tbody",
                "attrs": {
                  "rowClassName": this.rowClassName,
                  "tableData": this.tableData,
                  "columns": rightColumns
                },
                "ref": "rightTbody"
              })])])]);
            } else {
              template = h("div", {
                "class": ["d-table-wrapper", this.border && "d-table-border"]
              }, [h("div", {
                "class": "d-table-fixed-left",
                "ref": "leftWrapper"
              }, [h("div", {
                "class": "d-table"
              }, [h("div", {
                "class": "d-table-header"
              }, [h("table", [h(TableColgroup, {
                "attrs": {
                  "columns": leftColumns
                }
              }), h(TableHead, {
                "ref": "leftHead",
                "attrs": {
                  "theads": leftHeads
                }
              })])]), h("div", {
                "class": "d-table-tbody scroll",
                "ref": "leftHorScrollWrapper",
                "style": {
                  maxHeight: this.scrollHeight + "px"
                }
              }, [h("table", [h(TableColgroup, {
                "attrs": {
                  "columns": leftColumns
                }
              }), h(TableBody, {
                "attrs": {
                  "rowClassName": this.rowClassName,
                  "tableData": this.tableData,
                  "columns": leftColumns
                },
                "ref": "leftTbody"
              })])])])]), h("div", {
                "class": "d-table-scroll",
                "ref": "scrollWrapper"
              }, [h("div", {
                "class": "d-table",
                "style": {
                  width: this.scrollWidth + "px"
                }
              }, [h("div", {
                "class": "d-table-header"
              }, [h("table", [h(TableColgroup, {
                "attrs": {
                  "columns": scrollColumns
                }
              }), h(TableHead, {
                "ref": "thead",
                "attrs": {
                  "theads": scrollHeads
                }
              })])]), h("div", {
                "class": "d-table-tbody scroll",
                "ref": "horScrollWrapper",
                "style": {
                  maxHeight: this.scrollHeight + "px"
                }
              }, [h("table", [h(TableColgroup, {
                "attrs": {
                  "columns": scrollColumns
                }
              }), h(TableBody, {
                "ref": "tbody",
                "attrs": {
                  "rowClassName": this.rowClassName,
                  "tableData": this.tableData,
                  "columns": scrollColumns
                }
              })])])])]), h("div", {
                "class": "d-table-fixed-right scroll",
                "ref": "rightWrapper"
              }, [h("div", {
                "class": "d-table"
              }, [h("div", {
                "class": "d-table-header"
              }, [h("table", [h(TableColgroup, {
                "attrs": {
                  "columns": rightColumns
                }
              }), h(TableHead, {
                "ref": "rightHead",
                "attrs": {
                  "theads": rightHeads
                }
              })])]), h("div", {
                "class": "d-table-tbody scroll",
                "ref": "rightHorScrollWrapper",
                "style": {
                  maxHeight: this.scrollHeight + "px"
                }
              }, [h("table", [h(TableColgroup, {
                "attrs": {
                  "columns": rightColumns
                }
              }), h(TableBody, {
                "ref": "rightTbody",
                "attrs": {
                  "rowClassName": this.rowClassName,
                  "tableData": this.tableData,
                  "columns": rightColumns
                }
              })])])])])]);
            }

            return template;
        }
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
      var boxsLength = unitBoxs.length;
      unitBoxs.forEach(function (box) {
        if (box.disabled) return boxsLength--;
        if (box.checked === true) checkedCount++;
      });

      if (checkedCount === boxsLength) {
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
        props: ["column", "tableVm"],
        mounted: function mounted() {
          controlBox = this;
        },
        render: function render(h) {
          return h("label", {
            "class": ["checkbox-wrapper", this.checked && (this.checked === true ? "checked" : "intermediate"), this.disabled && "disabled"]
          }, [h("span", {
            "class": "checkbox"
          }, [h("input", {
            "class": "input",
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
          }), h("span", {
            "class": "checkbox-inner"
          })])]);
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
            this.tableVm.$emit("select-all", getAllSelectedRows(this.checked, unitBoxs), el);
          }
        }
      };
      el.render = {
        name: "UintBox",
        props: ["index", "val", "row", "tableVm"],
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
          return h("label", {
            "class": ["checkbox-wrapper", this.checked && "checked", this.disabled && "disabled"]
          }, [h("span", {
            "class": "checkbox"
          }, [h("input", {
            "class": "input",
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
          }), h("span", {
            "class": "checkbox-inner"
          })])]) // <input ref="unitBox" type="checkbox" disabled={this.disabled} onChange={this.select} checked={this.checked} />
          ;
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
            this.tableVm.$emit("select", getSelectedRows(unitBoxs), el);
          }
        }
      };
    }

    function strcmp(a, b) {
      var i = 0;
      var n = Math.max(a.length, b.length);

      for (; i < n && a.charAt(i) === b.charAt(i); ++i) {
      }

      if (i === n) return 0;
      return a.charAt(i) > b.charAt(i) ? 1 : -1;
    }

    function ascending(a, b) {
      if (typeof a === "number") {
        return a - b;
      } else if (typeof a === "string") {
        var dateA = new Date(a);
        var dateB = new Date(b);

        if (dateA != "Invalid Date") {
          return dateA - dateB;
        }

        return strcmp(a, b);
      }
    }

    function descending(a, b) {
      if (typeof a === "number") {
        return b - a;
      } else if (typeof a === "string") {
        var dateA = new Date(a);
        var dateB = new Date(b);

        if (dateA != "Invalid Date") {
          return dateB - dateA;
        }

        return strcmp(b, a);
      }
    }

    function getSortMethod(fn) {
      return function (a, b) {
        return fn(a.val, b.val);
      };
    }

    function sortable(el, vm) {
      var originData; // 保留原始数据序列

      var isFromSort = false; // 数据更新是否来源于排序

      var hasSorted = false; // 确保每次视图更新前仅触发一次排序

      var existRender = el.render; // 与原有render相兼容

      var rearrange = function rearrange(vm, type) {
        el.order = el.order !== type ? type : undefined;
        isFromSort = true;
        vm.sortingColumn = el.prop; // 设置当前排序列

        vm.sortingColumns.forEach(function (column) {
          if (column.prop !== el.prop) {
            column.order = undefined;
          }
        });
        vm.$refreshTableData();
      };
      /* 收集同一表格中排序列对象 */


      if (!vm.sortingColumns) vm.sortingColumns = [];
      vm.sortingColumns.push(el);
      /* 将Order设置成响应式数据 */

      Vue.set(el, "order", el.order);

      el.headRender = function (h, column) {
        var _this = this;

        return [h("span", [column.label]), h("span", {
          "class": "caret-wrapper"
        }, [h("i", {
          "class": ["up-caret", column.order === "ascending" && "active"],
          "on": {
            "click": function click() {
              return rearrange(_this, "ascending");
            }
          }
        }), h("i", {
          "class": ["down-caret", column.order === "descending" && "active"],
          "on": {
            "click": function click() {
              return rearrange(_this, "descending");
            }
          }
        })])];
      };

      el.render = function (h, index, val, row) {
        if (!hasSorted && this.sortingColumn === el.prop) {
          /* 确保排序与渲染仅发生一次 */
          hasSorted = true;
          if (!originData) originData = this.data.map(function (i) {
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
            this.$refreshTableData(); // 渲染排序后数据

            this.$emit("sort-change", el.order, el);
            this.$nextTick(function () {
              return hasSorted = false;
            });
          } else {
            /* 数据修改、初次绑定 在此重新渲染排序后数据 */
            this.$nextTick(function () {
              this.$refreshTableData();
              this.$nextTick(function () {
                return hasSorted = false;
              });
            });
          }
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

    function resolveDataMap(el, vm) {
      if (el.type && dataMapNames[el.type]) dataMapNames[el.type](el, vm);
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
      var level = table[0] || [];
      var maxRowspan = table.length;
      setGridAttr(level, maxRowspan, columns);
      return {
        table: table,
        columns: columns
      };
    }
    /* 对表格列数据进行层级遍历，将其转换成表格标题视图映射所需的数据结构 */


    function formatColumns(columns, vm) {
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
            resolveDataMap(el, vm); // 处理特殊数据类型到视图的映射
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
        return;
      }

      var DataTableOptions = deepClone(DataTable); // 确保每次Create都是从模板创建一个新的类

      var tableData = DataTableOptions.data;

      DataTableOptions.data = function () {
        var copyProps = deepClone(props); // 确保表格实例化所得的每个对象是从模板所得的副本, 而不是参数对象本身

        var _formatColumns = formatColumns(copyProps, this),
            theads = _formatColumns.theads,
            columns = _formatColumns.columns;

        var dataOptions = {
          theads: theads,
          columns: columns,
          propColumns: copyProps
        };
        return Object.assign(dataOptions, tableData);
      };

      var VueDataTable = Vue.extend(DataTableOptions);
      /* 可扩展列API */

      VueDataTable.prototype.$scaledTable = function (fn) {
        if (typeof fn === "function") fn(this.propColumns);
        var columnObj = formatColumns(this.propColumns, this);
        this.theads = columnObj.theads;
        this.columns = columnObj.columns;
      };
      /* 表格数据刷新API */


      VueDataTable.prototype.$refreshTableData = function () {
        if (!this.TableMode || !this.$refs) return;

        if (this.TableMode === SingleTable || this.TableMode === SeparateTable) {
          this.$refs.tbody.$forceUpdate();
        } else {
          /* 固定列表格刷新全部子表格 */
          this.$refs.tbody.$forceUpdate();
          this.$refs.leftTbody.$forceUpdate();
          this.$refs.rightTbody.$forceUpdate();
        }
      };

      return VueDataTable;
    }

    var DataTable$1 = {
      Create: Create,
      addDataMap: addDataMap
    };

    return DataTable$1;

}(Vue));
