/* !
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

 import * as SnapshotUtils from '../../../plugins/utils/snapshot-utils';
 import Component from '../related-people-access-control-group';

 describe('GGRC.Components.relatedPeopleAccessControlGroup', () => {
   let vm;

   beforeEach(() => {
     vm = new (can.Map.extend(Component.prototype.viewModel));
     vm.attr('instance', {});
   });

   describe('canEdit prop', () => {
     it('returns "false" when instance is snapshot', () => {
       spyOn(Permission, 'is_allowed_for').and.returnValue(true);
       vm.instance.attr('archived', false);
       vm.attr('updatableGroupId', null);
       vm.attr('isNewInstance', false);

       spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(true);

       expect(vm.attr('canEdit')).toEqual(false);
     });

     it('returns "false" when instance is archived', () => {
       spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(false);
       spyOn(Permission, 'is_allowed_for').and.returnValue(true);
       vm.attr('updatableGroupId', null);
       vm.attr('isNewInstance', false);

       vm.instance.attr('archived', true);

       expect(vm.attr('canEdit')).toEqual(false);
     });

     it('returns "false" when there is updatableGroupId', () => {
       spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(false);
       vm.instance.attr('archived', false);
       vm.attr('isNewInstance', false);
       spyOn(Permission, 'is_allowed_for').and.returnValue(true);

       vm.attr('updatableGroupId', 'groupId');

       expect(vm.attr('canEdit')).toEqual(false);
     });

     it('returns "false" when user has no update permissions', () => {
       spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(false);
       vm.instance.attr('archived', false);
       vm.attr('updatableGroupId', null);
       vm.attr('isNewInstance', false);

       spyOn(Permission, 'is_allowed_for').and.returnValue(false);

       expect(vm.attr('canEdit')).toEqual(false);
     });

     it('returns "true" when new instance', () => {
       spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(false);
       spyOn(Permission, 'is_allowed_for').and.returnValue(false);
       vm.instance.attr('archived', false);
       vm.attr('updatableGroupId', null);

       vm.attr('isNewInstance', true);

       expect(vm.attr('canEdit')).toEqual(true);
     });

     it('returns "true" when user has update permissions', () => {
       spyOn(SnapshotUtils, 'isSnapshot').and.returnValue(false);
       vm.instance.attr('archived', false);
       vm.attr('updatableGroupId', null);
       vm.attr('isNewInstance', false);

       spyOn(Permission, 'is_allowed_for').and.returnValue(true);

       expect(vm.attr('canEdit')).toEqual(true);
     });
   });
 });
