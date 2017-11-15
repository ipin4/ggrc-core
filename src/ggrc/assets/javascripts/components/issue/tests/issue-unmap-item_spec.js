/*
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/
import component from '../issue-unmap-item';

describe('GGRC.Components.IssueUnmapRelatedSnapshots', ()=> {
  let viewModel;
  let events;
  beforeEach(()=> {
    viewModel = new (can.Map.extend(component.prototype.viewModel));
    events = component.prototype.events;
  });

  describe('relationship get() method', ()=> {
    beforeEach(()=> {
      viewModel.attr('issueInstance', {});
      viewModel.attr('target', {});
      spyOn(CMS.Models.Relationship, 'findInCacheById').and
        .callFake((ids)=> ids[0]);
    });

    it('retruns relationship issue->target direction', ()=> {
      viewModel.attr('issueInstance.related_sources', [
        {id: 111},
        {id: 222},
      ]);
      viewModel.attr('target.related_destinations', [
        {id: 333},
        {id: 111},
      ]);

      let relationship = viewModel.attr('relationship');

      expect(CMS.Models.Relationship.findInCacheById)
        .toHaveBeenCalledWith([111]);

      expect(relationship).toBe(111);
    });

    it('retruns relationship target->issue direction', ()=> {
      viewModel.attr('issueInstance.related_destinations', [
        {id: 111},
        {id: 222},
      ]);
      viewModel.attr('target.related_sources', [
        {id: 333},
        {id: 111},
      ]);

      let relationship = viewModel.attr('relationship');

      expect(CMS.Models.Relationship.findInCacheById)
        .toHaveBeenCalledWith([111]);

      expect(relationship).toBe(111);
    });
  });

  describe('paging value', ()=> {
    it('returns Pagination object with [5, 10, 15] pagination', ()=> {
      let pagination = viewModel.attr('paging');
      expect(pagination.attr('pageSizeSelect').serialize())
        .toEqual([5, 10, 15]);
    });
  });

  describe('buildQuery() method', ()=> {
    it('sets object_name to passed type', ()=> {
      let type = 'Type';
      let query = viewModel.buildQuery(type);
      expect(query.object_name).toBe(type);
    });

    it('sets limit to [0, 5]', ()=> {
      let query = viewModel.buildQuery('Type');
      expect(query.limit).toEqual([0, 5]);
    });

    describe('configures filters.expression namely', ()=> {
      it('sets assessment.id from viewModel.target.id', ()=> {
        let query;
        let id = 1234567;

        viewModel.attr('target.id', id);
        query = viewModel.buildQuery('Type');

        expect(query.filters.expression.assessment.id).toBe(id);
      });

      it('sets issue.id from viewModel.issueInstance.id', ()=> {
        let query;
        let id = 1234567;

        viewModel.attr('issueInstance.id', id);
        query = viewModel.buildQuery('Type');

        expect(query.filters.expression.issue.id).toBe(id);
      });

      it('sets op.name to "cascade_unmappable" string', ()=> {
        let operationName = 'cascade_unmappable';
        let query = viewModel.buildQuery('Type');
        expect(query.filters.expression.op.name).toBe(operationName);
      });
    });
  });

  describe('processRelatedSnapshots() method', ()=> {
    beforeEach(()=> {
      spyOn(viewModel, 'loadRelatedObjects')
        .and.returnValue(can.Deferred().resolve());
      spyOn(viewModel, 'showModal');
      spyOn(viewModel, 'unmap');
    });

    it('shows modal if there are items to unmap', ()=> {
      viewModel.attr('total', 2);

      viewModel.processRelatedSnapshots();

      expect(viewModel.showModal).toHaveBeenCalled();
      expect(viewModel.unmap).not.toHaveBeenCalled();
    });

    it('unmaps issue if there are no related items', ()=> {
      viewModel.attr('total', 0);

      viewModel.processRelatedSnapshots();

      expect(viewModel.showModal).not.toHaveBeenCalled();
      expect(viewModel.unmap).toHaveBeenCalledWith();
    });
  });

  describe('loadRelatedObjects() method', ()=> {
    let reqDeferred;
    let response;

    beforeEach(()=> {
      response = [{
        Snapshot: {
          values: [{}, {}],
          total: 10,
        },
      }, {
        Audit: {
          values: [{}],
          total: 1,
      }}];
      reqDeferred = can.Deferred();
      spyOn(viewModel, 'buildQuery').and.returnValue(['query']);
      spyOn(GGRC.Utils.QueryAPI, 'makeRequest').and.returnValue(reqDeferred);
      spyOn($.prototype, 'trigger');
    });

    it('should change "isLoading" flag in case of success', ()=> {
      viewModel.attr('isLoading', false);

      viewModel.loadRelatedObjects();
      expect(viewModel.attr('isLoading')).toBeTruthy();

      reqDeferred.resolve(response);
      expect(viewModel.attr('isLoading')).toBeFalsy();
    });

    it('should change "isLoading" flag in case of error', ()=> {
      viewModel.attr('isLoading', false);

      viewModel.loadRelatedObjects();
      expect(viewModel.attr('isLoading')).toBeTruthy();

      reqDeferred.reject();
      expect(viewModel.attr('isLoading')).toBeFalsy();
    });

    it('should load snapshots correctly', ()=> {
      viewModel.loadRelatedObjects();
      reqDeferred.resolve(response);

      expect(viewModel.attr('total')).toBe(11);
      expect(viewModel.attr('relatedSnapshots.length')).toBe(2);
      expect(viewModel.attr('paging.total')).toBe(10);
    });

    it('should handle server errors correctly', ()=> {
      viewModel.loadRelatedObjects();
      reqDeferred.reject();

      expect($.prototype.trigger).toHaveBeenCalledWith('ajax:flash', {
        error: 'There was a problem with retrieving related objects.',
      });
    });
  });

  describe('showModal() method', ()=> {
    it('updates singular title', ()=> {
      viewModel.attr('total', 1);

      viewModel.showModal();

      expect(viewModel.attr('modalTitle')).toBe('Unmapping (1 object)');
    });

    it('updates plural title', ()=> {
      viewModel.attr('total', 5);

      viewModel.showModal();

      expect(viewModel.attr('modalTitle')).toBe('Unmapping (5 objects)');
    });

    it('changes modal state', ()=> {
      viewModel.attr('modalState.open', false);

      viewModel.showModal();

      expect(viewModel.attr('modalState.open')).toBe(true);
    });
  });

  describe('openObject() method', ()=> {
    let relatedObject;
    let originalModels;
    let getParam;
    let ARGS;

    beforeAll(()=> {
      getParam = function (spy, index) {
        return spy.calls.argsFor(0)[index];
      };
      ARGS = {
        FIRST: 0,
        SECOND: 1,
      };
      originalModels = CMS.Models;
    });

    afterAll(()=> {
      CMS.Models = originalModels;
    });

    beforeEach(()=> {
      relatedObject = {
        id: 123,
        type: 'Type',
      };

      CMS.Models = {};
      CMS.Models[relatedObject.type] = {
        root_collection: 'rootCollectionType',
      };

      spyOn(window, 'open');
    });

    it('calls window.open with second "_blank" param', ()=> {
      let secondParam;
      viewModel.openObject(relatedObject);
      secondParam = getParam(window.open, ARGS.SECOND);
      expect(secondParam).toBe('_blank');
    });

    describe('sets url as a first param where', ()=> {
      let buildUrl;

      beforeAll(()=> {
        buildUrl = function (type, id) {
          return '/' + type + '/' + id;
        };
      });

      it(`url consists of root_collection from appopriate model and id 
        based on passed related object`, ()=> {
        let rootCollectionType = CMS.Models[relatedObject.type].root_collection;
        let expectedUrl;

        viewModel.openObject(relatedObject);
        expectedUrl = buildUrl(rootCollectionType, relatedObject.id);

        expect(getParam(window.open, ARGS.FIRST)).toBe(expectedUrl);
      });

      it(`url consists of type and id from relatet object's child_type and 
        child_id props if a type of related object equals to "Snapshot"`, ()=> {
        let relatedObjectType = 'Snapshot';
        let rootCollectionType = CMS.Models[relatedObject.type].root_collection;
        let oldRelatedObjectType = relatedObject.type;
        let expectedUrl;

        _.extend(relatedObject, {
          type: relatedObjectType,
          child_type: oldRelatedObjectType,
          child_id: 54321,
        });
        viewModel.openObject(relatedObject);
        expectedUrl = buildUrl(
          rootCollectionType,
          relatedObject.child_id
        );

        expect(getParam(window.open, ARGS.FIRST)).toBe(expectedUrl);
      });
    });
  });

  describe('unmap() method', ()=> {
    let refreshDfd;
    let unmapDfd;
    let pageInstance;

    beforeEach(()=> {
      let relationship;
      pageInstance = new can.Map({viewLink: 'temp url'});
      unmapDfd = can.Deferred();
      refreshDfd = can.Deferred();
      relationship = {
        refresh: ()=> {
          return refreshDfd;
        },
        unmap: ()=> {
          return unmapDfd;
        },
      };
      spyOn($.prototype, 'trigger');
      spyOn(CMS.Models.Relationship, 'findInCacheById')
        .and.returnValue(relationship);
      spyOn(GGRC, 'page_instance')
        .and.returnValue(pageInstance);
      spyOn(GGRC, 'navigate');
    });

    it('should change "isLoading" flag in case of success', ()=> {
      viewModel.attr('isLoading', false);

      viewModel.unmap();
      expect(viewModel.attr('isLoading')).toBeTruthy();

      refreshDfd.resolve();
      unmapDfd.resolve();
      expect(viewModel.attr('isLoading')).toBeFalsy();
    });

    it('should change "isLoading" flag in case of error', ()=> {
      viewModel.attr('isLoading', false);

      viewModel.unmap();
      expect(viewModel.attr('isLoading')).toBeTruthy();

      refreshDfd.reject();
      expect(viewModel.attr('isLoading')).toBeFalsy();
    });

    it('should unmap issue correctly', ()=> {
      viewModel.attr('issueInstance', {});
      viewModel.attr('issueInstance.related_sources', [
        {id: 1}, {id: 2}, {id: 3}]);
      viewModel.attr('target.related_destinations', [
        {id: 4}, {id: 4}, {id: 3}]);

      viewModel.unmap();
      refreshDfd.resolve();
      unmapDfd.resolve();

      expect(viewModel.attr('showRelatedSnapshots')).toBeFalsy();
    });

    it('should unmap from issue correctly', ()=> {
      viewModel.attr('issueInstance', pageInstance);
      viewModel.attr('issueInstance.related_sources', [
        {id: 1}, {id: 2}, {id: 3}]);
      viewModel.attr('target.related_destinations', [
        {id: 4}, {id: 4}, {id: 3}]);

      viewModel.unmap();
      refreshDfd.resolve();
      unmapDfd.resolve();

      expect(GGRC.navigate).toHaveBeenCalledWith('temp url');
    });

    it('should handle server errors correctly', ()=> {
      viewModel.unmap();
      refreshDfd.reject();

      expect($.prototype.trigger).toHaveBeenCalledWith('ajax:flash', {
        error: 'There was a problem with unmapping.',
      });
    });
  });

  describe('showNoRelationhipError() method', ()=> {
    const issueTitle = 'TEST_ISSUE_TITLE';
    const targetType = 'TEST_TARGET_TYPE';
    const targetTitle = 'TEST_TARGET_TITLE';

    beforeEach(()=> {
      viewModel.attr('issueInstance', {
        title: issueTitle,
      });
      viewModel.attr('target', {
        title: targetTitle,
        'class': {
          title_singular: targetType,
        },
      });
      spyOn(GGRC.Errors, 'notifier');
    });

    it('shows correct message', ()=> {
      viewModel.showNoRelationhipError();

      expect(GGRC.Errors.notifier).toHaveBeenCalledWith('error',
        `Unmapping cannot be performed. 
        Please unmap Issue (${issueTitle}) 
        from ${targetType} version (${targetTitle}), 
        then mapping with original object will be automatically reverted.`);
    });
  });

  describe('"click" event', ()=> {
    let handler;
    let event;
    let relationshipStub;
    beforeEach(()=> {
      handler = events.click.bind({viewModel: viewModel});
      event = jasmine.createSpyObj(['preventDefault']);
      spyOn(viewModel, 'processRelatedSnapshots');
      spyOn(viewModel, 'showNoRelationhipError');
      spyOn(viewModel, 'dispatch');
      relationshipStub = spyOn(CMS.Models.Relationship, 'findInCacheById');
    });

    it('prevents default action of the event', ()=> {
      handler(null, event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('shows error if there is no relationship', ()=> {
      relationshipStub.and.returnValue(null);

      handler(null, event);

      expect(viewModel.showNoRelationhipError).toHaveBeenCalled();
    });

    it(`calls processRelatedSnapshots() if target is assessment and 
      not allowed to unmap issue from audit`, ()=> {
      relationshipStub.and.returnValue({test: 'true'});
      viewModel.attr('target.type', 'Assessment');
      viewModel.attr('issueInstance.allow_unmap_from_audit', false);

      handler(null, event);

      expect(viewModel.processRelatedSnapshots).toHaveBeenCalled();
      expect(viewModel.dispatch).not.toHaveBeenCalled();
    });

    it('dispatches "unmapIssue" event if target', ()=> {
      relationshipStub.and.returnValue({test: 'true'});
      viewModel.attr('target.type', 'Control');
      viewModel.attr('issueInstance.allow_unmap_from_audit', true);

      handler(null, event);

      expect(viewModel.processRelatedSnapshots).not.toHaveBeenCalled();
      expect(viewModel.dispatch).toHaveBeenCalledWith('unmapIssue');
    });
  });

  describe('"{viewModel.paging} current" event', ()=> {
    let handler;
    beforeEach(()=> {
      handler = events['{viewModel.paging} current']
        .bind({viewModel: viewModel});
    });

    it('call loadRelatedObjects() method', ()=> {
      spyOn(viewModel, 'loadRelatedObjects');

      handler();

      expect(viewModel.loadRelatedObjects).toHaveBeenCalled();
    });
  });

  describe('"{viewModel.paging} pageSize" event', ()=> {
    let handler;
    beforeEach(()=> {
      handler = events['{viewModel.paging} pageSize']
        .bind({viewModel: viewModel});
    });

    it('call loadRelatedObjects() method', ()=> {
      spyOn(viewModel, 'loadRelatedObjects');

      handler();

      expect(viewModel.loadRelatedObjects).toHaveBeenCalled();
    });
  });
});
