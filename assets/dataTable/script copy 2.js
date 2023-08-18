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
  // Destructure props and set default values
  const { defaultHide = [], data = [], cols = [], name = "", element } = props;

  // Set initial values and state
  let currentPig = 0;
  let pagLimit = 10;
  let sort = { key: null, asc: true };
  let rows = data.slice(); // Create a copy of the data

  // Create HTML elements using template literals
  const $topPanel = $('<div class="topPanel"></div>');
  const $tableContainer = $('<div class="tableContainer"></div>');
  const $bottomPanel = $('<div class="bottomPanel"></div>');
  const $searchForm = $("<form></form>");
  const $columsToggle = $('<div class="columsToggle"></div>');
  const $rowsPerPage = $('<div class="rowsPerPage"></div>');
  const $rowMonitor = $("<div></div>");
  const $pagination = $('<ul class="pagination"></ul>');
  const $select = $("<select></select>");

  // Populate rows per page selector
  [10, 20, 50, 100].forEach((c) => {
    $select.append(`<option value="${c}">${c}</option>`);
  });

  // Handle rows per page change
  $select.on("change", (e) => {
    currentPig = 0;
    pagLimit = parseInt(e.target.value, 10);
    renderTable();
  });

  // Append elements to their respective containers
  $rowsPerPage.append($select, $rowMonitor);
  $bottomPanel.append($rowsPerPage, $pagination);
  $topPanel.append($columsToggle, $searchForm);

  const $table = $('<table class="theTable"></table>');
  const $caption = $("<caption></caption>").text(name);
  const $thead = $("<thead></thead>");
  const $tbody = $("<tbody></tbody>");

  // Attach search input to search form
  const $searchInput = $('<input type="search" placeholder="Search...">');
  $searchInput.on("input", (event) => {
    mySearch(event.target.value);
  });
  $searchForm.append($searchInput);

  // Process columns for rendering
  const processedCols = cols.map((col) => {
    const colSetting = col.key
      ? props.cols.find((c) => c.key === col.key)
      : null;
    return {
      ...colSetting,
      key: col.key,
      sort: colSetting ? colSetting.sort !== false : true,
    };
  });

  // Render columns toggle
  processedCols.forEach((col) => {
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
      renderTable();
    });

    $columsToggle.append($checkBox);
  });

  // Append elements to the container element
  $(element).empty();
  $(element).addClass("theTableContainer");
  $(element).append($topPanel, $tableContainer, $bottomPanel);

  // Function to render the table
  const renderTable = () => {
    // Calculate pagination range
    const startIndex = currentPig * pagLimit;
    const endIndex = Math.min(startIndex + pagLimit, rows.length);

    // Update row monitor
    $rowMonitor.text(`${startIndex + 1} - ${endIndex} of ${rows.length} rows`);

    // Update pagination buttons
    $pagination.empty();
    for (let i = 0; i < Math.ceil(rows.length / pagLimit); i++) {
      const $pageBtn = $(
        `<li class="${currentPig === i ? "active" : ""}">${i + 1}</li>`
      );
      $pageBtn.on("click", () => {
        currentPig = i;
        renderTable();
      });
      $pagination.append($pageBtn);
    }

    // Render table header
    const $theadRow = $("<tr></tr>");
    processedCols.forEach((col) => {
      if (!defaultHide.includes(col.key)) {
        const label = col.label || col.key;
        const $th = $(`<th title="${label}">${label}</th>`);

        // Attach sorting event listener
        if (col.sort) {
          $th.on("click", () => mySort(col.key, !sort.asc));
          // Add sorting indicator
          if (col.key === sort.key) {
            $th.append(sort.asc ? "&#8964;" : "&#8963;");
          }
        }

        $theadRow.append($th);
      }
    });
    $thead.html($theadRow);

    // Render table body
    $tbody.empty();
    for (let i = startIndex; i < endIndex; i++) {
      const row = rows[i];
      const $tbodyRow = $("<tr></tr>");
      processedCols.forEach((col) => {
        if (!defaultHide.includes(col.key)) {
          const cell = col.render ? col.render(row) : row[col.key];
          const $td = $("<td></td>").html(cell);
          $tbodyRow.append($td);
        }
      });
      $tbody.append($tbodyRow);
    }

    // Update table content
    $table.append($thead, $tbody);
    $tableContainer.empty().append($table);
  };

  // Sort the data based on the given column and order
  const mySort = (key, asc) => {
    rows.sort((a, b) => {
      const aValue = a[key];
      const bValue = b[key];
      if (aValue === undefined) return asc ? 1 : -1;
      if (bValue === undefined) return asc ? -1 : 1;
      return asc ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });

    sort.key = key;
    sort.asc = asc;
    renderTable();
  };

  // Search function
  const mySearch = (word) => {
    rows = data.filter((row) =>
      processedCols.some((col) => {
        const cellValue = row[col.key];
        return (
          cellValue &&
          cellValue.toString().toLowerCase().includes(word.toLowerCase())
        );
      })
    );
    renderTable();
  };

  // Initial rendering
  renderTable();
};
