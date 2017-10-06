/*!
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import template from './templates/tree-header.mustache';

var viewModel = can.Map.extend({
  define: {
    cssClasses: {
      type: String,
      get: function () {
        var classes = [];

        if (this.isActiveActionArea()) {
          classes.push('active-action-area');
        }

        return classes.join(' ');
      }
    },
    selectableSize: {
      type: Number,
      get: function () {
        var attrCount = this.attr('selectedColumns').length;
        var result = 3;

        if (attrCount < 4) {
          result = 1;
        } else if (attrCount < 7) {
          result = 2;
        }
        return result;
      }
    }
  },
  model: null,
  columns: {},
  selectedColumns: [],
  availableColumns: [],
  disableConfiguration: null,
  mandatory: [],
  sortingInfo: null,
  currentDisplayQueue: [],
  /**
   * Dispatches the event with names of selected columns.
   *
   * @fires updateColumns
   */
  setColumns: function () {
    var selectedNames = [];
    var currentDisplayQueue = this.attr('currentDisplayQueue');

    currentDisplayQueue.forEach(function (item) {
      item.display_status = true;
      selectedNames.push(item.attr_name);
    });
    this.attr('selectedColumns', currentDisplayQueue);
    this.dispatch({
      type: 'updateColumns',
      columns: currentDisplayQueue,
      names: selectedNames,
    });
  },
  onChange: function (event, attr) {
    var columns = this.attr('columns').serialize();
    var currentDisplayQueue = this.attr('currentDisplayQueue');
    var deleteIndex;

    if (event.target.checked) {
      attr.display_queue = currentDisplayQueue.length;
      currentDisplayQueue.push(attr);
    } else {
      currentDisplayQueue.map(function (item, index) {
        if (item.attr_name == attr.attr_name) {
          deleteIndex = index;
        }
      });
      currentDisplayQueue.splice(deleteIndex, 1);
    }

    columns[attr.attr_name] = !columns[attr.attr_name];
    this.columns.attr(columns);
  },
  moveItem: function (event, context, direction) {
    var currentDisplayQueue = this.attr('currentDisplayQueue');
    event.stopPropagation();
    if (direction== 'up') {
      context.display_queue--;
      currentDisplayQueue[context.display_queue].display_queue++;
    } else {
      context.display_queue++;
      currentDisplayQueue[context.display_queue].display_queue--;
    }
    currentDisplayQueue.sort(function (a, b) {
      return a.display_queue - b.display_queue;
    });
  },
  onOrderChange: function ($element) {
    var field = $element.data('field');

    this.dispatch({
      type: 'sort',
      field: field
    });
  },
  initializeColumns: function () {
    var selectedColumns = this.attr('selectedColumns');
    var availableColumns = this.attr('availableColumns');
    var newArr = new can.List([]);
    var columns;

    if (selectedColumns.length && availableColumns.length) {
      this.attr('selectedColumns').forEach(function (item, index) {
        item.display_queue = index;
        newArr.push(item);
      });
      this.attr('currentDisplayQueue', newArr);
      columns = GGRC.Utils.TreeView
        .createSelectedColumnsMap(availableColumns, selectedColumns);

      this.attr('columns', columns);
    }
  },
  isActiveActionArea: function () {
    var modelName = this.attr('model').shortName;

    return modelName === 'CycleTaskGroupObjectTask' || modelName === 'Cycle';
  },
  init: function () {
    this.initializeColumns();
  }
});

GGRC.Components('treeHeader', {
  tag: 'tree-header',
  template: template,
  viewModel: viewModel,
  events: {
    '{viewModel} availableColumns': function () {
      this.viewModel.initializeColumns();
    },
    '{viewModel} selectedColumns': function () {
      this.viewModel.initializeColumns();
    },
  },
  helpers: {
    sortIcon: function (attr, sortBy, sortDirection) {
      var iconClass = '';
      attr = Mustache.resolve(attr);
      sortBy = Mustache.resolve(sortBy);
      sortDirection = Mustache.resolve(sortDirection);

      if (!sortBy) {
        iconClass = 'sort';
      } else if (sortBy === attr) {
        iconClass = 'sort-' + sortDirection;
      }

      return iconClass;
    }
  }
});
