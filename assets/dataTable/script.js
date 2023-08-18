// ===============================================
// script.js - JavaScript for Data Table
// ===============================================
//
// This script provides functionality for a data table.
//
// Author: Hein Soe
// GitHub: https://github.com/hheinsoee/table
// Date: 2023-08-15
// Version: 1.0.1
//
// ===============================================
// Define the TheTable component
const TheTable = (props) => {
  var filter = {};
  var currentData = [];
  let sort = {
    key: null,
    asc: false,
  };
  let page = 1;
  let currentPig = 0;
  let pagLimit = 10;

  function load(query, cb) {
    $("#loading").css("display", "inherit");
    var jqxhr = $.get(props.api, query);

    jqxhr.done(function (r) {
      cb(null, r);
    });
  }
  function clear() {
    currentData = [];
  }
  function renderTable(data) {
    var defaultHide = props.defaultHide || [];
    var cols = [];
    var loading = !$.isArray(data);
    var rows = $.isArray(data) ? data : [];

    const allKeys = rows.reduce((keys, obj) => {
      return keys.concat(Object.keys(obj));
    }, []);

    const startIndex = currentPig * pagLimit;
    const endIndex = Math.min(startIndex + pagLimit, rows.length);

    // Remove duplicates
    const uniqueKeys = [...new Set(allKeys)];

    uniqueKeys.forEach((key) => {
      var colSetting = props.cols && props.cols.find((col) => col.key == key);
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
    props.cols?.forEach((col) => {
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
        renderTable(data);
      });

      $columsToggle.append($checkBox);
    });

    $searchform = $(
      `<form class="search"><input type="search" placeholder="Search..." value="${
        filter.search || ""
      }"><button>&#128269;</button></form>`
    );
    $searchform.on("submit", function (event) {
      event.preventDefault(); // Prevent the default form submission
      const inputValue = $searchform.find("input").val();
      searchFromServer(inputValue);
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
      if (!defaultHide || !defaultHide.includes(col.key)) {
        var label = col.label ? col.label : col.key;
        const css = col.css ? `style='${col.css}'` : "";
        const $th = $(`<th ${css} title="${label}">`).html(` ${label}`);
        // Attach sorting event listener
        if (col.sort) {
          $th.on("click", () => sortFromServer(col.key, !sort.asc));
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
      for (let i = 0; i < pagLimit; i++) {
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
    $table.append($thead, $tbody);

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
        `<option value="${c}" ${c == pagLimit ? "selected" : ""}>${c}</option>`
      );
    });
    $select.on("change", (e) => {
      currentPig = 0;
      pagLimit = e.target.value;
      renderTable(currentData);
    });

    $rowMonitor.html(
      `${startIndex + 1} - ${
        endIndex > rows.length ? rows.length : endIndex
      } of ${rows.length} rows`
    );

    $paganition.empty();
    for (let i = 0; i <= Math.floor(rows.length / pagLimit); i++) {
      const $pigBtn = $(
        `<li class="${currentPig == i && "active"}">${i + 1}</li>`
      );
      $pigBtn.on("click", () => {
        currentPig = i;
        renderTable(currentData);
      });
      $paganition.append($pigBtn);
    }

    const $loader = $(
      "<li id='loading' style='display:none'><span>|</span></li>"
    );
    const $btn = $("<li>...More</li>");
    $btn.on("click", () => loadMore());
    $paganition.append($loader, $btn);
    $rowsperpage.append($select, $rowMonitor);
    $bottomPanel.append($rowsperpage, $paganition);

    $(props.element).empty();
    $(props.element).addClass("theTableContainer");
    $(props.element).append($topPanel, $table, $bottomPanel);
    console.log(currentData);
  }

  ////////////////////////////
  /////////////////////////////
  ////////////////////////////

  const loadMore = () => {
    load({ page: page + 1 }, (err, data) => {
      if (!err) {
        currentData = [...currentData, ...data];
      }
      page = page + 1;
      renderTable(currentData);
    });
  };

  const sortFromServer = (key, asc) => {
    loadingTable();
    load(
      {
        sortby: key,
        asc: asc,
      },
      (err, data) => {
        if (!err) {
          currentData = [...data];
        }
        renderTable(currentData);
      }
    );
  };
  const searchFromServer = (words) => {
    filter = {
      search: words,
    };
    loadingTable();
    load(filter, (err, data) => {
      if (!err) {
        currentData = [...data];
      }
      renderTable(currentData);
    });
  };
  // initial

  const loadingTable = () => {
    page = 1;
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
    renderTable(false), changeWidth(), setInterval(changeWidth, 1000);
  };

  loadingTable();
  load({}, (err, data) => {
    if (!err) {
      currentData = [...currentData, ...data];
    }
    renderTable(currentData);
  });
};
