// ===============================================
// script.js - JavaScript for Data Table
// ===============================================
//
// This script provides functionality for a data table.
//
// Author: Hein Soe
// GitHub: https://github.com/hheinsoee
// Date: 2023-08-15
//
// ===============================================

const TheTable = (props) => {
  var cols = [];
  var loading = !$.isArray(props.data);
  var rows = $.isArray(props.data) ? props.data : [];
  var pagLimit = 10;

  const allKeys = rows.reduce((keys, obj) => {
    return keys.concat(Object.keys(obj));
  }, []);
  var currentPig = 0;
  // Remove duplicates
  const uniqueKeys = [...new Set(allKeys)];

  uniqueKeys.forEach((key) => {
    var colSetting = props.cols && props.cols.find((col) => col.key == key);
    colSetting
      ? cols.push({ ...colSetting, show: true })
      : cols.push({
          key: key,
        });
  });
  if (props.cols) {
    props.cols.forEach((p) => {
      if (!cols.find((col) => col.key == p.key)) {
        p.show = true;
        p.sort = false;
        cols.push(p);
        // console.log(p)
      }
    });
  }

  const $topPanel = $("<div>").addClass("topPanel");
  const $tableContainer = $("<div>").addClass("tableContainer");
  const $bottomPanel = $("<div>").addClass("bottomPanel");

  const $searchForm = $("<form>");
  const $columsToggle = $("<div>").addClass("columsToggle");

  const $rowsperpage = $("<div>").addClass("rowsperpage");
  const $rowMonitor = $("<div>");
  const $paganition = $("<ul>").addClass("paganition");

  const $select = $("<select>");
  [10, 20, 50, 100].forEach((c) => {
    $select.append(`<option value="${c}">${c}</option>`);
  });
  $select.on("change", (e) => {
    currentPig = 0;
    pagLimit = e.target.value;
    renderTable();
  });
  $rowsperpage.append($select);
  $rowsperpage.append($rowMonitor);

  $bottomPanel.append($rowsperpage);
  $bottomPanel.append($paganition);

  $topPanel.append($columsToggle);
  $topPanel.append($searchForm);
  $(props.element).empty();
  $(props.element).addClass("theTableContainer");
  $(props.element).append($topPanel, $tableContainer, $bottomPanel);

  //search form start
  const $searchInput = $("<input>").attr({
    type: "search",
    placeholder: "Search...",
  });
  $searchInput.on("input", (event) => {
    mySearch(event.target.value);
  });
  $searchForm.append($searchInput);
  //search form end

  //colum toggle start
  cols.forEach((c, i) => {
    const $checkBox = $("<label>").html(
      `<input type="checkbox" ${c.show && "checked"}/><span>${
        c.label || c.key
      }</span>`
    );
    $checkBox.addClass("noselect");
    $checkBox.on(
      "change",
      () => ((cols[i].show = !cols[i].show), renderTable())
    );
    $columsToggle.append($checkBox);
  });
  //colum toggl eend

  //table
  const renderTable = () => {
    $paganition.empty();
    for (let i = 0; i <= Math.floor(rows.length / pagLimit); i++) {
      const $pigBtn = $(
        `<li class="${currentPig == i && "active"}">${i + 1}</li>`
      );
      $pigBtn.on("click", () => {
        currentPig = i;
        renderTable();
      });
      $paganition.append($pigBtn);
    }

    var startIndex = pagLimit * currentPig;
    var endIndex = startIndex * 1 + pagLimit * 1;

    $rowMonitor.html(
      `${startIndex + 1} - ${
        endIndex > rows.length ? rows.length : endIndex
      } of ${rows.length} rows`
    );

    const $table = $("<table>").addClass("theTable");
    const $caption = $("<caption>").text(props.name);
    $table.append($caption);

    const $thead = $("<thead>");
    const $theadRow = $("<tr>");
    cols.forEach((col) => {
      if (col.show) {
        const $th = $(`<th ${col.css ? `style=${col.css}` : ""}>`).html(
          `${col.label ? col.label : col.key} ${
            sort.key == col.key ? (sort.asc ? "&#8964" : "&#8963") : ""
          }`
        );
        // Attach sorting event listener
        if (col.sort == undefined && col.sort == null){
          $th.on("click", () => mySort(col.key, !sort.asc))
        }else{
          col.sort && $th.on("click", () => mySort(col.key, !sort.asc))
        };
        $theadRow.append($th);
      }
    });

    $thead.append($theadRow);
    $table.append($thead);

    const $tbody = $("<tbody>");
    if (loading) {
      console.log("loading");
      for (let i = 0; i <= pagLimit; i++) {
        const $tbodyRow = $("<tr>");
        cols.forEach((col) => {
          if (col.show) {
            const $td = $(`<td>`).html("<div class='skeleton'></div>");
            $tbodyRow.append($td);
          }
        });
        $tbody.append($tbodyRow);
      }
    } else {
      rows.forEach((row, i) => {
        if (i >= startIndex && i < endIndex) {
          const $tbodyRow = $("<tr>");
          cols.forEach((col) => {
            if (col.show) {
              const $td = $(
                `<td 
              ${col.className ? `class=${col.className}` : ""} 
              ${col.css ? `style="${col.css}"` : ""}>`
              ).html(col.render ? col.render(row) : row[col.key]);
              $tbodyRow.append($td);
            }
          });
          $tbody.append($tbodyRow);
        }
      });
    }

    $table.append($tbody);
    $tableContainer.empty().append($table);

    var skeleton = $(".skeleton");
    function changeWidth() {
      skeleton.each(function () {
        var randomWidth = Math.floor(Math.random() * (100 - 50 + 1)) + 20;

        // Set the random values
        $(this).css({
          width: randomWidth + "%",
        });
      });
    }
    changeWidth();
    setInterval(changeWidth, 1000);
  };

  //function
  var sort = { key: null, asc: true };
  function mySort(key, asc) {
    var sortData = [...rows]; // Make a copy of the data array

    // Define sorting function based on ascending or descending order
    const sortingFunction = (a, b) => {
      const aValue = a[key];
      const bValue = b[key];

      // Handle cases where aValue or bValue are undefined
      if (aValue === undefined && bValue === undefined) {
        return 0; // Both values are undefined, no change in order
      } else if (aValue === undefined) {
        return asc ? 1 : -1; // a[key] is undefined, it's considered greater if ascending
      } else if (bValue === undefined) {
        return asc ? -1 : 1; // b[key] is undefined, it's considered greater if descending
      }

      // Compare normal values
      return asc ? (aValue < bValue ? 1 : -1) : aValue > bValue ? 1 : -1;
    };

    // Apply the sorting function to sort the data
    sortData.sort(sortingFunction);

    // Update the sort configuration
    sort = { key: key, asc: asc };

    // Update the rows with the sorted data
    rows = sortData;

    // Call renderTable() to update the table content
    return renderTable();
  }

  var allRows = rows;
  const mySearch = (word) => {
    const filteredList = allRows.filter((row) =>
      cols.some((col) => {
        const cellValue = row[col.key];
        if (cellValue !== undefined && cellValue !== null) {
          return cellValue
            .toString()
            .toLowerCase()
            .includes(word.toLowerCase());
        }
        return false;
      })
    );
    rows = filteredList;
    return renderTable();
  };

  return renderTable();
};
