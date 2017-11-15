/*
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Component from '../bulk-update-button';
import updateService from '../../../plugins/utils/bulk-update-service';

describe('GGRC.Components.bulkUpdateButton', function () {
  var viewModel;
  var events;

  beforeAll(function () {
    viewModel = new (can.Map.extend(Component.prototype.viewModel));
    events = Component.prototype.events;
    events.viewModel = viewModel;
  });

  describe('button click event', function () {
    var event;
    beforeAll(function () {
      event = events['a click'].bind(events);
      spyOn(viewModel, 'openBulkUpdateModal');
    });

    it('should open ObjectBulkUpdate modal', function () {
      var type = 'some model';
      var element = {};
      viewModel.attr('model', {
        model_singular: type,
      });

      event(element);

      expect(viewModel.openBulkUpdateModal).toHaveBeenCalledWith(type);
    });
  });

  describe('updateObjects callback', function () {
    var updateDfd;
    var context;
    var args;
    var resMessage;

    beforeEach(function () {
      context = {
        closeModal: jasmine.createSpy(),
      };
      args = {
        selected: [1],
        options: {},
      };

      viewModel.attr('model', {
        name_singular: 'Some Model',
      });
      resMessage = 'items updated';
      updateDfd = can.Deferred();
      event = events.updateObjects.bind(events);

      spyOn(can, 'trigger');
      spyOn(GGRC.Errors, 'notifier');
      spyOn(updateService, 'update')
        .and.returnValue(updateDfd);

      spyOn(events, 'getResultNotification')
        .and.returnValue(resMessage);

      event(context, args);
    });

    it('closes ObjectBulkUpdate modal', function () {
      expect(context.closeModal).toHaveBeenCalled();
    });

    it('shows notification about bulk progress', function () {
      expect(GGRC.Errors.notifier)
        .toHaveBeenCalledWith('progress',
          'Some Model update is in progress. This may take several minutes.');
    });

    it('shows notification about bulk update result', function () {
      updateDfd.resolve([{status: 'updated'}]);

      expect(events.getResultNotification)
        .toHaveBeenCalledWith(viewModel.attr('model'), 1);
      expect(GGRC.Errors.notifier)
       .toHaveBeenCalledWith('info', resMessage);
    });

    it('triggers TreeView refresh when some items updated', function () {
      updateDfd.resolve([{status: 'updated'}]);

      expect(can.trigger)
        .toHaveBeenCalledWith(jasmine.any(Object), 'refreshTree');
    });

    it('does not trigger TreeView refresh when no item was updated',
      function () {
        updateDfd.resolve([]);

        expect(can.trigger)
          .not.toHaveBeenCalled();
      });

    it('does not show notification when update failed', function () {
      updateDfd.reject();

      expect(events.getResultNotification)
        .not.toHaveBeenCalled();
      expect(GGRC.Errors.notifier)
        .not.toHaveBeenCalledWith('info', jasmine.any(String));
    });
  });

  describe('getResultNotification event', function () {
    var model = {
      name_singular: 'Task',
      name_plural: 'Tasks',
    };
    var event;

    beforeAll(function () {
      event = events.getResultNotification;
    });

    it('returns correct message when no objects were updated', function () {
      var expected = 'No tasks were updated.';
      var actual = event(model, 0);

      expect(actual).toEqual(expected);
    });

    it('returns correct message when 1 object was updated', function () {
      var expected = '1 task was updated successfully.';
      var actual = event(model, 1);

      expect(actual).toEqual(expected);
    });

    it('returns correct message when multiple objects were updated',
      function () {
        var expected = '4 tasks were updated successfully.';
        var actual = event(model, 4);

        expect(actual).toEqual(expected);
      });
  });
});
