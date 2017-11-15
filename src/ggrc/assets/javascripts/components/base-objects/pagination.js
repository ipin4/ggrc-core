/*!
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

/**
 * A component that unifies pagination API
 * Usage: new Pagination()
 */
export default can.Map.extend({
  define: {
    current: {
      type: 'number',
      value: 1,
      set: function (newValue) {
        var disabled = this.attr('disabled');
        var count = this.attr('count');
        if (newValue >= 1 &&
          (_.isUndefined(count) || newValue <= count) &&
          !disabled) {
          return newValue;
        }
        return this.current;
      }
    },
    pageSize: {
      type: 'number',
      value: 5,
      set: function (newValue) {
        if (!this.attr('disabled') && newValue != this.pageSize) {
          this.attr('current', 1);
          return newValue;
        }
        return this.pageSize;
      },
    },
    pageSizeSelect: {
      value: [5, 10, 15]
    },
    disabled: {
      type: 'boolean',
      value: false
    },
    /**
     * Total pages count
     */
    count: {
      type: 'number',
      value: 0
    },
    /**
     * Array with 2 values: first and last element indexes for current page
     */
    limits: {
      type: can.List,
      get: function () {
        var first = 0;
        var last = 0;
        if (this.current && this.pageSize) {
          first = (this.current - 1) * this.pageSize;
          last = this.current * this.pageSize;
        }

        return [first, last];
      }
    },
    /**
     * Total items count
     */
    total: {
      type: 'number',
      set: function (itemsCount) {
        var count = Math.ceil(itemsCount / this.pageSize);
        this.attr('count', count);
        return itemsCount;
      }
    }
  }
});
