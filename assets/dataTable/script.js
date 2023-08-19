// ===============================================
// script.js - JavaScript for Data Table
// ===============================================
//
// This script provides functionality for a data table.
//
// Author: Hein Soe
// GitHub: https://github.com/hheinsoee/table
// Date: 2023-08-15
// Version: 2.0.0
//
// ===============================================
// Define the TheTable component
class TheTable {
  constructor(props) {
    this.filter = {};
    this.currentData = [];
    this.sort = {
      key: null,
      asc: false,
    };
    this.page = 1;
    this.currentPig = 0;
    this.pagLimit = 10;
    this.props = props;

    this.init();
  }

  load(query, cb) {
    $("#loading").css("display", "inherit");
    var jqxhr = $.get(this.props.api, query);

    jqxhr.done(function (r) {
      cb(null, r);
    });
  }

  clear() {
    this.currentData = [];
  }
  sortFromServer(key, asc) {
    this.currentPig = 0;
    this.sort = {
      key: key,
      asc: asc,
    };
    this.loadingTable();
    this.load(
      {
        sortby: key,
        asc: asc,
      },
      (err, data) => {
        if (!err) {
          this.currentData = [...data];
          this.renderTable(this.currentData);
        }
      }
    );
  }

  loadingTable() {
    this.executeFunction = false;
    this.page = 1;
    function changeWidth() {
      var skeleton = $(".skeleton");
      skeleton.each(function () {
        var randomWidth = Math.floor(Math.random() * (100 - 50 + 1)) + 20;

        // Set the random values
        $(this).css({
          width: randomWidth + "%",
        });
      });
    }
    this.renderTable(false), changeWidth(), setInterval(changeWidth, 1000);
  }

  renderTable(data) {
    var defaultHide = this.props.defaultHide || [];
    var cols = [];
    var rows = $.isArray(data) ? data : [];

    const allKeys = rows.reduce((keys, obj) => {
      return keys.concat(Object.keys(obj));
    }, []);

    const startIndex = this.currentPig * this.pagLimit;
    const endIndex = Math.min(startIndex + this.pagLimit, rows.length);
    console.log("currentPig", this.currentPig);
    console.log("start", startIndex);
    console.log("end", endIndex);
    console.log("all", rows.length);
    console.log('page limit ', this.pagLimit)

    // Remove duplicates
    const uniqueKeys = [...new Set(allKeys)];

    uniqueKeys.forEach((key) => {
      var colSetting =
        this.props.cols && this.props.cols.find((col) => col.key == key);
      colSetting
        ? cols.push({
            ...colSetting,
            sort:
              colSetting.sort == undefined ||
              colSetting.sort == null ||
              colSetting.sort,
          })
        : cols.push({
            key: key,
          });
    });
    this.props.cols?.forEach((col) => {
      if (!uniqueKeys.includes(col.key)) {
        cols.push(col);
      }
    });

    //////////
    ///TOP////
    //////////
    const $topPanel = $(`<div class="topPanel"></div>`);
    const $columsToggle = $(`<div class="columsToggle"></div>`);
    //toggle ထည်ရန်
    cols.forEach((col) => {
      const $checkBox = $(`
        <label title="${col.label || col.key}">
          <input type="checkbox" ${
            !defaultHide.includes(col.key) ? "checked" : ""
          } />
          <span>${col.label || col.key}</span>
        </label>
      `);

      $checkBox.addClass("noselect");
      $checkBox.on("change", () => {
        if (defaultHide.includes(col.key)) {
          defaultHide.splice(defaultHide.indexOf(col.key), 1);
        } else {
          defaultHide.push(col.key);
        }
        this.renderTable(data);
      });

      $columsToggle.append($checkBox);
    });

    const $searchform = $(
      `<form class="search"><input type="search" placeholder="Search..." value="${
        this.filter.search || ""
      }"><button>&#128269;</button></form>`
    );
    $searchform.on("submit", (event) => {
      event.preventDefault(); // Prevent the default form submission
      const inputValue = $searchform.find("input").val();
      this.currentPig = 0;
      this.filter = {
        search: inputValue,
      };
      this.loadingTable();
      this.load(this.filter, (err, data) => {
        if (!err) {
          this.currentData = [...data];
        }
        this.renderTable(this.currentData);
      });
    });
    $topPanel.append($columsToggle, $searchform);

    ///////////
    ///TABLE///
    ///////////
    const $table = $(`<table class="theTable"></table>`);
    const $thead = $(`<thead></thead>`);
    const $tbody = $(`<tbody></tbody>`);
    // thead ထည့်ရန်
    const $theadRow = $("<tr>");
    cols.forEach((col) => {
      // console.log(sort.key,col.key)
      if (!defaultHide || !defaultHide.includes(col.key)) {
        var label = col.label ? col.label : col.key;
        const css = col.css ? `style='${col.css}'` : "";
        const $th = $(`<th ${css} title="${label}">`).html(
          ` ${label} ${
            this.sort.key == col.key
              ? this.sort?.asc
                ? "&#8964"
                : "&#8963"
              : ""
          }`
        );
        // Attach sorting event listener
        if (col.sort && data) {
          $th.on("click", () => this.sortFromServer(col.key, !this.sort.asc));
        }
        $theadRow.append($th);
      }
    });
    $thead.html($theadRow);

    // tbodyထည့်
    if (data) {
      for (let i = startIndex; i < endIndex; i++) {
        const row = rows[i];
        const $tbodyRow = $("<tr></tr>");
        cols.forEach((col) => {
          if (!defaultHide.includes(col.key)) {
            const cell = col.render ? col.render(row) : row[col.key];
            const css = col.css ? `style='${col.css}'` : "";
            const $td = $(`<td ${css}></td>`).html(cell);
            $tbodyRow.append($td);
          }
        });
        $tbody.append($tbodyRow);
      }
    } else {
      for (let i = 0; i < this.pagLimit; i++) {
        const $tbodyRow = $("<tr></tr>");
        cols.forEach((col) => {
          if (!defaultHide.includes(col.key)) {
            const css = col.css ? `style='${col.css}'` : "";
            const $td = $(`<td ${css}></td>`).html(
              "<div class='skeleton'></div>"
            );
            $tbodyRow.append($td);
          }
        });
        $tbody.append($tbodyRow);
      }
    }
    const $caption = this.props.caption
      ? `<caption>${this.props.caption}</caption>`
      : "";
    $table.append($caption, $thead, $tbody);

    ////////////
    ///Bottom///
    ////////////

    const $bottomPanel = $(`<div class="bottomPanel"></div>`);
    const $rowsperpage = $("<div>").addClass("rowsperpage");
    const $rowMonitor = $("<div>");
    const $paganition = $("<ul>").addClass("paganition");

    const $select = $("<select>");
    [10, 20, 50, 100].forEach((c) => {
      $select.append(
        `<option value="${c}" ${
          c == this.pagLimit ? "selected" : ""
        }>${c}</option>`
      );
    });
    $select.on("change", (e) => {
      this.currentPig = 0;
      this.pagLimit = parseInt(e.target.value);
      this.renderTable(this.currentData);
    });

    $rowMonitor.html(
      `${startIndex + 1} - ${
        endIndex > rows.length ? rows.length : endIndex
      } of ${rows.length} rows`
    );

    $paganition.empty();
    for (let i = 0; i <= Math.floor(rows.length / this.pagLimit); i++) {
      const $pigBtn = $(
        `<li class="${this.currentPig == i && "active"}">${i + 1}</li>`
      );
      $pigBtn.on("click", () => {
        this.currentPig = i;
        this.renderTable(this.currentData);
      });
      $paganition.append($pigBtn);
    }

    const $loader = $(
      "<li id='loading' style='display:none'><span>|</span></li>"
    );
    const $btn = $("<li>...More</li>");
    $btn.on("click", () => {
      console.log(this.filter);
      this.load({ ...this.filter, page: this.page + 1 }, (err, data) => {
        if (!err) {
          this.currentData = [...this.currentData, ...data];
        }
        this.page = this.page + 1;
        this.renderTable(this.currentData);
      });
    });
    $paganition.append($loader, $btn);
    $rowsperpage.append($select, $rowMonitor);
    $bottomPanel.append($rowsperpage, $paganition);

    $(this.props.element).empty();
    $(this.props.element).addClass("theTableContainer");
    $(this.props.element).append($topPanel, $table, $bottomPanel);
    // console.log(currentData);
  }

  init() {
    this.loadingTable();
    this.load({}, (err, data) => {
      if (!err) {
        this.currentData = [...this.currentData, ...data];
      }
      this.renderTable(this.currentData);
    });
  }
}
