/*
  Copyright (C) 2017 Google Inc., authors, and contributors
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

describe('GGRC.Components.objectStateToolbar', function () {
  let vm;

  beforeEach(function () {
    vm = GGRC.Components.getViewModel('objectStateToolbar');
  });

  describe('hasPreviousState() method', function () {
    it('returns true if instance has previous state', function () {
      vm.attr('instance.previousStatus', 'In Progress');
      expect(vm.hasPreviousState()).toBe(true);
    });

    it('returns false if instance has not previous state', function () {
      vm.attr('instance.previousStatus', undefined);
      expect(vm.hasPreviousState()).toBe(false);
    });
  });
});
