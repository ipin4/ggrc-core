/*!
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import '../tree/tree-header-selector';
import tmpl from './templates/mapper-results-columns-configuration.mustache';
import * as TreeViewUtils from '../../plugins/utils/tree-view-utils';

(function (can, GGRC, CMS) {
  'use strict';

  GGRC.Components('mapperResultsColumnsConfiguration', {
    tag: 'mapper-results-columns-configuration',
    template: tmpl,
    viewModel: {
      define: {
        selectedColumns: {
          set: function (newValue, setValue) {
            setValue(newValue);
            this.initializeColumns();
          }
        },
        availableColumns: {
          set: function (newValue, setValue) {
            setValue(newValue);
            this.initializeColumns();
          }
        }
      },
      modelType: '',
      selectedColumns: [],
      availableColumns: [],
      columns: {},
      displayPrefs: null,
      init: function () {
        var self = this;
        this.initializeColumns();
        CMS.Models.DisplayPrefs.getSingleton().then(function (displayPrefs) {
          self.attr('displayPrefs', displayPrefs);
        });
      },
      getModel: function () {
        return CMS.Models[this.attr('modelType')];
      },
      initializeColumns: function () {
        var selectedColumns = this.attr('selectedColumns');
        var availableColumns = this.attr('availableColumns');
        var columns = TreeViewUtils
          .createSelectedColumnsMap(availableColumns, selectedColumns);

        this.attr('columns', columns);
      },
      onSelect: function (attr) {
        var columns = this.columns;
        var value = {};
        value[attr.attr_name] = !columns[attr.attr_name];
        this.columns.attr(value);
      },
      isSelected: function (attr) {
        var columns = this.attr('columns');
        return columns[attr.attr_name];
      },
      setColumns: function () {
        var selectedNames = [];
        var columns;

        can.each(this.attr('columns'), function (v, k) {
          if (v) {
            selectedNames.push(k);
          }
        });

        columns =
          TreeViewUtils.setColumnsForModel(
            this.getModel().model_singular,
            selectedNames,
            this.attr('displayPrefs')
          );

        this.attr('selectedColumns', columns.selected);
      },
      stopPropagation: function (context, el, ev) {
        ev.stopPropagation();
      }
    }
  });
})(window.can, window.GGRC, window.CMS);
