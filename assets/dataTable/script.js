// ===============================================
// script.js - Javorderript for Data Table
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
    this.page = 1;
    this.currentPig = 0;
    this.pagLimit = 10;
    this.props = props;
    this.search = null;
    this.recentlyAdd = null;
    this.recentlyUpdate = null;
    this.recentlyRemove = null;
    this.defaultHide = this.props.defaultHide || [];

    this.init();
  }

  load(query, cb) {
    $("#loading").css("display", "inherit");
    var jqxhr = $.get(this.props.api, query);

    jqxhr.done(function (r) {
      cb(null, r);
    });
  }

  clearRecentStatus() {
    this.recentlyAdd = null;
    this.recentlyUpdate = null;
    this.recentlyRemove = null;
  }
  sortFromServer(key, order) {
    this.currentPig = 0;
    if (this.search && this.search !== "") {
      this.filter.search = this.search;
    }
    this.filter = {
      ...this.filter,
      orderby: key,
      order: order,
    };
    this.loadingTable();
    this.load(this.filter, (err, data) => {
      if (!err) {
        this.currentData = [...data];
        this.renderTable(this.currentData);
      }
    });
  }
  searchFromServer(word) {
    this.currentPig = 0;
    this.filter = {
      search: word,
    };
    this.loadingTable();
    this.load(this.filter, (err, data) => {
      if (!err) {
        this.currentData = [...data];
      }
      this.renderTable(this.currentData);
    });
  }
  loadMore() {
    this.clearRecentStatus();
    this.load({ ...this.filter, page: this.page + 1 }, (err, data) => {
      if (!err) {
        this.currentData = [...this.currentData, ...data];
      }
      this.page = this.page + 1;
      this.renderTable(this.currentData);
    });
  }

  changeWidth() {
    // console.log('change')
    var skeleton = $(".skeleton");
    skeleton.each(function () {
      var randomWidth = Math.floor(Math.random() * (100 - 50 + 1)) + 20;

      // Set the random values
      $(this).css({
        width: randomWidth + "%",
      });
    });
  }

  loadingTable() {
    this.clearRecentStatus();
    this.executeFunction = false;
    this.page = 1;
    this.renderTable(false), this.changeWidth();
  }
  updateIndex(index, data) {
    if (this.currentData[index]) {
      this.currentData[index] = { ...this.currentData[index], ...data };
      this.currentPig = Math.floor(index / this.pagLimit);
      this.clearRecentStatus();
      this.recentlyUpdate = index;
      this.renderTable(this.currentData);
    } else {
      console.log(`index [${index}] is not found`);
    }
  }

  addData(data) {
    this.currentData = [data, ...this.currentData];
    this.currentPig = 0;
    this.clearRecentStatus();
    this.recentlyAdd = 0;
    this.renderTable(this.currentData);
  }
  deleteIndex(indexToRemove) {
    this.currentPig = Math.floor(indexToRemove / this.pagLimit);
    this.clearRecentStatus();
    this.recentlyRemove = indexToRemove;
    this.renderTable(this.currentData);
    this.currentData.splice(indexToRemove, 1);
    setTimeout(() => {
      this.clearRecentStatus();
      this.renderTable(this.currentData);
    }, 1000);
  }
  renderTable(data) {
    // clearInterval(this.loadingTable().everysecond)
    var cols = [];
    var rows = $.isArray(data) ? data : [];

    const allKeys = rows.reduce((keys, obj) => {
      if (typeof obj === "object") {
        const objectKeys = Object.keys(obj);
        return keys.concat(
          objectKeys.filter((key) => typeof obj[key] !== "object")
        );
      }
      return keys;
    }, []);

    // Remove duplicates
    const uniqueKeys = [...new Set(allKeys)];
    // console.log(uniqueKeys)

    const startIndex = this.currentPig * this.pagLimit;
    const endIndex = Math.min(startIndex + this.pagLimit, rows.length);
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
            !this.defaultHide.includes(col.key) ? "checked" : ""
          } />
          <span>${col.label || col.key}</span>
        </label>
      `);

      $checkBox.addClass("noselect");
      $checkBox.on("change", () => {
        if (this.defaultHide.includes(col.key)) {
          this.defaultHide.splice(this.defaultHide.indexOf(col.key), 1);
        } else {
          this.defaultHide.push(col.key);
          console.log(this.defaultHide);
        }
        this.renderTable(data);
      });

      $columsToggle.append($checkBox);
    });

    const $searchform = $(
      `<form class="search"><button>&#128269;</button></form>`
    );
    const $searchInput = $(
      `<input type="search" placeholder="Search..." value="${
        this.filter.search || ""
      }">`
    );
    $searchInput.on("change", () => {
      this.search = $searchInput.val();
    });
    $searchform.html($searchInput);
    $searchform.on("submit", (event) => {
      event.preventDefault(); // Prevent the default form submission
      const inputValue = $searchform.find("input").val();
      this.searchFromServer(inputValue);
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
      if (!this.defaultHide || !this.defaultHide.includes(col.key)) {
        var label = col.label ? col.label : col.key;
        const css = col.css ? `style='${col.css}'` : "";
        const $th = $(`<th ${css} title="${label}">`).html(
          ` ${label} ${
            this.filter.orderby == col.key
              ? this.filter?.order == "asc"
                ? "&#8964"
                : "&#8963"
              : ""
          }`
        );
        // Attach sorting event listener
        if (col.sort && data) {
          $th.on("click", () =>
            this.sortFromServer(
              col.key,
              this.filter.order == "asc" ? "desc" : "asc"
            )
          );
        }
        $theadRow.append($th);
      }
    });
    $thead.html($theadRow);

    // tbodyထည့်
    if (data) {
      for (let i = startIndex; i < endIndex; i++) {
        const row = rows[i];
        const $tbodyRow = $(
          `<tr  
          ${this.recentlyAdd == i ? 'class="recentlyAdd"' : ""}
          ${this.recentlyUpdate == i ? 'class="recentlyUpdate"' : ""}
          ${this.recentlyRemove == i ? 'class="recentlyRemove"' : ""}
          
        ></tr>`
        );
        cols.forEach((col) => {
          if (!this.defaultHide.includes(col.key)) {
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
        const $tbodyRow = $(`<tr></tr>`);
        cols.forEach((col) => {
          if (!this.defaultHide.includes(col.key)) {
            const css = col.css ? `style='${col.css}'` : "";
            const className = col.className ? `class='${col.className}'` : "";
            const $td = $(`<td ${css} ${className}></td>`).html(
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
      this.clearRecentStatus();
      this.pagLimit = parseInt(e.target.value);
      this.renderTable(this.currentData);
    });

    $rowMonitor.html(
      `${startIndex + 1} - ${
        endIndex > rows.length ? rows.length : endIndex
      } of ${rows.length} rows`
    );

    $paganition.empty();
    var numOfPig = Math.ceil(rows.length / this.pagLimit) - 1;
    if (numOfPig > 6) {
      var show = [0];

      if (this.currentPig > 1) {
        show.push(this.currentPig - 1);
      }
      if (this.currentPig > 0 && this.currentPig < numOfPig) {
        show.push(this.currentPig);
      }
      if (this.currentPig < numOfPig - 1) {
        show.push(this.currentPig + 1);
      }
      show.push(numOfPig);

      show.forEach((p, i) => {
        const $pigBtn = $(
          `<li class="${this.currentPig == p && "active"}">${p + 1}</li>`
        );
        $pigBtn.on("click", () => {
          this.currentPig = p;
          this.clearRecentStatus();
          this.renderTable(this.currentData);
        });

        if (
          (i == show.length - 1 && this.currentPig < numOfPig - 2) ||
          (this.currentPig == p + 1 && this.currentPig > 2)
        ) {
          $pigBtn.html(`<small style="opacity:0.4">... ${p} </small>${p + 1}`);
        }
        $paganition.append($pigBtn);

        if (
          (i == 0 && this.currentPig > 2) ||
          (this.currentPig == p - 1 && this.currentPig < numOfPig - 2)
        ) {
          $pigBtn.html(
            `${p + 1}<small style="opacity:0.4"> ${p + 2} ...</small>`
          );
        }
      });
    } else {
      for (let i = 0; i <= numOfPig; i++) {
        const $pigBtn = $(
          `<li class="${this.currentPig == i && "active"}">${i + 1}</li>`
        );
        $pigBtn.on("click", () => {
          this.currentPig = i;
          this.clearRecentStatus();
          this.renderTable(this.currentData);
        });
        $paganition.append($pigBtn);
      }
    }

    const $loader = $(
      "<li id='loading' style='display:none'><span>|</span></li>"
    );
    const $btn = $("<li>... More</li>");
    $btn.on("click", () => this.loadMore());
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
    setInterval(this.changeWidth, 1000);
    this.load({}, (err, data) => {
      if (!err) {
        this.currentData = [...this.currentData, ...data];
      }
      this.renderTable(this.currentData);
    });
  }
}
