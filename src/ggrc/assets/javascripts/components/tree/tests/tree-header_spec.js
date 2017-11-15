/*
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import Component from '../tree-header';

describe('GGRC.Components.treeHeader', function () {
  'use strict';

  let vm;

  function generateColumns(names) {
    return names.map(function (name) {
      return {
        attr_name: name,
      };
    });
  }

  beforeEach(function () {
    vm = new (can.Map.extend(Component.prototype.viewModel));
  });

  describe('setColumns() method', function () {
    let method;
    beforeEach(function () {
      method = vm.setColumns.bind(vm);
    });

    it('dispatches "updateColumns" event with selected columns', function () {
      vm.attr('columns', {
        col1: true,
        col2: false,
        col3: true,
        col4: true,
        col5: false,
        col6: true,
      });

      spyOn(vm, 'dispatch');

      method();

      expect(vm.dispatch).toHaveBeenCalledWith({
        type: 'updateColumns',
        columns: ['col1', 'col3', 'col4', 'col6'],
      });
    });
  });

  describe('initializeColumns() method', function () {
    let method;
    beforeEach(function () {
      method = vm.initializeColumns.bind(vm);
    });

    it('dispatches "updateColumns" event with selected columns', function () {
      vm.attr('availableColumns',
        generateColumns(['col1', 'col2', 'col3', 'col4', 'col5']));
      vm.attr('selectedColumns', generateColumns(['col1', 'col3']));

      method();

      expect(vm.attr('columns').serialize()).toEqual({
        col1: true,
        col2: false,
        col3: true,
        col4: false,
        col5: false,
      });
    });
  });

  describe('onOrderChange() method', function () {
    it('dipatches sort event with field and direction', function () {
      const orderBy = {
        field: 'field',
        direction: 'asc',
      };
      spyOn(vm, 'dispatch');
      vm.attr('orderBy', orderBy);
      vm.onOrderChange();

      expect(vm.dispatch).toHaveBeenCalledWith({
        type: 'sort',
        field: orderBy.field,
        sortDirection: orderBy.direction,
      });
    });
  });

  describe('events', function () {
    let events;

    beforeEach(function () {
      events = Component.prototype.events;
    });

    describe('"{viewModel.orderBy} change"() event', function () {
      let event;

      beforeEach(function () {
        event = events['{viewModel.orderBy} change'].bind({
          viewModel: vm,
        });
      });

      it('calls onOrderChange', function () {
        spyOn(vm, 'onOrderChange');
        event();
        expect(vm.onOrderChange).toHaveBeenCalled();
      });
    });
  });
});
