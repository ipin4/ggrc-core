/*
    Copyright (C) 2017 Google Inc.
    Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import template from './issue-unmap-item.mustache';
import Pagination from '../base-objects/pagination';

const queryApi = GGRC.Utils.QueryAPI;

export default GGRC.Components('issueUnmapItem', {
  tag: 'issue-unmap-item',
  template: template,
  viewModel: {
    define: {
      paging: {
        value() {
          return new Pagination({pageSizeSelect: [5, 10, 15]});
        },
      },
      relationship: {
        get() {
          const sourceIds = _.union(
            _.pluck(this.attr('issueInstance.related_sources'), 'id'),
            _.pluck(this.attr('issueInstance.related_destinations'), 'id'));
          const destinationIds = _.union(
            _.pluck(this.attr('target.related_sources'), 'id'),
            _.pluck(this.attr('target.related_destinations'), 'id'));

          let relId = _.intersection(sourceIds, destinationIds);
          let relationship = CMS.Models.Relationship.findInCacheById(relId);

          return relationship;
        },
      },
    },
    issueInstance: {},
    target: {},
    modalTitle: 'Unmapping',
    showRelatedObjects: false,
    isLoading: false,
    relatedSnapshots: [],
    relatedAudit: {},
    total: null,
    modalState: {
      open: false,
    },
    canUnmap() {
      return GGRC.Utils.allowed_to_map(this.attr('issueInstance'),
        this.attr('target'), {isIssueUnmap: true});
    },

    processRelatedSnapshots() {
      this.loadRelatedObjects().done(()=> {
        if (this.attr('total')) {
          this.showModal();
        } else {
          this.unmap();
        }
      });
    },
    buildQuery(type) {
      return GGRC.Utils.QueryAPI.buildParam(
        type,
        this.attr('paging'),
        null,
        null,
        {
          expression: {
            op: {name: 'cascade_unmappable'},
            issue: {id: this.attr('issueInstance.id')},
            assessment: {id: this.attr('target.id')},
          },
        }
      );
    },
    loadRelatedObjects() {
      const snapshotsQuery = this.buildQuery('Snapshot');
      const auditsQuery = this.buildQuery('Audit');

      this.attr('isLoading', true);
      return queryApi.makeRequest({data: [snapshotsQuery, auditsQuery]})
        .done((resp)=> {
          const snapshots = resp[0].Snapshot;
          const audits = resp[1].Audit;
          this.attr('total', snapshots.total + audits.total);
          this.attr('relatedAudit', audits.values[0]);
          this.attr('relatedSnapshots', snapshots.values);
          this.attr('paging.total', snapshots.total);
        })
        .fail(()=> {
          GGRC.Errors.notifier(
            'error',
            'There was a problem with retrieving related objects.');
        })
        .always(()=> {
          this.attr('isLoading', false);
        });
    },
    showModal() {
      const total = this.attr('total');
      const title = 'Unmapping (' + total +
        (total > 1 ? ' objects' : ' object') + ')';
      this.attr('modalTitle', title);
      this.attr('modalState.open', true);
    },
    openObject(relatedObject) {
      let model;
      let type;
      let url;
      let objectType = relatedObject.type;
      let id = relatedObject.id;

      if (relatedObject.type === 'Snapshot') {
        objectType = relatedObject.child_type;
        id = relatedObject.child_id;
      }

      model = CMS.Models[objectType];
      type = model.root_collection;
      url = '/' + type + '/' + id;

      window.open(url, '_blank');
    },
    unmap() {
      const currentObject = GGRC.page_instance();
      const relationship = this.attr('relationship');

      this.attr('isLoading', true);

      relationship
       .refresh()
       .then(()=> {
         return relationship.unmap(true);
       })
       .done(()=> {
        if (currentObject === this.attr('issueInstance')) {
          GGRC.navigate(this.attr('issueInstance.viewLink'));
        } else {
          this.attr('modalState.open', false);
        }
       })
       .fail(()=> {
         GGRC.Errors.notifier('error', 'There was a problem with unmapping.');
       })
       .always(()=> {
         this.attr('isLoading', false);
       });
    },
    showNoRelationhipError() {
      const issueTitle = this.attr('issueInstance.title');
      const targetTitle = this.attr('target.title');
      const targetType = this.attr('target').class.title_singular;

      GGRC.Errors.notifier('error',
        `Unmapping cannot be performed. 
        Please unmap Issue (${issueTitle}) 
        from ${targetType} version (${targetTitle}), 
        then mapping with original object will be automatically reverted.`);
    },
  },
  events: {
    click(el, ev) {
      ev.preventDefault();
      if (!this.viewModel.attr('relationship')) {
        // if there is no relationship it mean that user try to unmap
        // original object from Issue automapped to snapshot via assessment
        this.viewModel.showNoRelationhipError();
      } else if (this.viewModel.attr('target.type') === 'Assessment' &&
        !this.viewModel.attr('issueInstance.allow_unmap_from_audit')) {
        // In this case we should show modal with related objects.
        this.viewModel.processRelatedSnapshots();
      } else {
        this.viewModel.dispatch('unmapIssue');
      }
    },
    '{viewModel.paging} current'() {
      this.viewModel.loadRelatedObjects();
    },
    '{viewModel.paging} pageSize'() {
      this.viewModel.loadRelatedObjects();
    },
  },
});
