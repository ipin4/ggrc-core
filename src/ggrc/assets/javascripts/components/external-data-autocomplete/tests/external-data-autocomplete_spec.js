/*
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import Component from '../external-data-autocomplete';

describe('GGRC.Components.externalDataAutocomplete', ()=> {
  let viewModel;
  beforeEach(()=> {
    viewModel = new (can.Map.extend(Component.prototype.viewModel));
  });

  describe('viewModel', ()=> {
    describe('renderResults get()', ()=> {
      describe('returns true', ()=> {
        it(`when "showResults" flag is turned on
            and "searchCriteria" length is greather than "minLength"`, ()=> {
            viewModel.attr('showResults', true);
            viewModel.attr('minLength', 2);
            viewModel.attr('searchCriteria', 'test');

            let result = viewModel.attr('renderResults');

            expect(result).toBe(true);
        });
      });

      describe('returns false', ()=> {
        it(`when "showResults" flag is turned off
            and "searchCriteria" length is greather than "minLength"`, ()=> {
            viewModel.attr('showResults', false);
            viewModel.attr('minLength', 2);
            viewModel.attr('searchCriteria', 'test');

            let result = viewModel.attr('renderResults');

            expect(result).toBe(false);
        });

        it(`when "showResults" flag is turned on
            and "searchCriteria" length is less than "minLength"`, ()=> {
            viewModel.attr('showResults', true);
            viewModel.attr('minLength', 2);
            viewModel.attr('searchCriteria', '');

            let result = viewModel.attr('renderResults');

            expect(result).toBe(false);
        });

        it(`when "showResults" flag is turned off
            and "searchCriteria" length is less than "minLength"`, ()=> {
            viewModel.attr('showResults', false);
            viewModel.attr('minLength', 2);
            viewModel.attr('searchCriteria', '');

            let result = viewModel.attr('renderResults');

            expect(result).toBe(false);
        });
      });
    });

    describe('openResults() method', ()=> {
      it('turnes on "showResults" flag', ()=> {
        viewModel.attr('showResults', false);

        viewModel.openResults();

        expect(viewModel.attr('showResults')).toBe(true);
      });
    });

    describe('closeResults() method', ()=> {
      it('turnes off "showResults" flag', ()=> {
        viewModel.attr('showResults', true);

        viewModel.closeResults();

        expect(viewModel.attr('showResults')).toBe(false);
      });
    });

    describe('setSearchCriteria() method', ()=> {
      let element = {
        val: jasmine.createSpy().and.returnValue('criteria'),
      };

      it('updates "searchCriteria" property', (done)=> {
        viewModel.attr('searchCriteria', null);

        viewModel.setSearchCriteria(element);

        setTimeout(()=> {
          expect(viewModel.attr('searchCriteria')).toBe('criteria');
          done();
        }, 500);
      });

      it('dispatches "criteriaChanged" event', (done)=> {
        spyOn(viewModel, 'dispatch');

        viewModel.setSearchCriteria(element);

        setTimeout(()=> {
          expect(viewModel.dispatch).toHaveBeenCalledWith({
            type: 'criteriaChanged',
            value: 'criteria',
          });
          done();
        }, 500);
      });
    });

    describe('onItemPicked() method', ()=> {
      let saveDfd;
      let item;
      beforeEach(()=> {
        saveDfd = can.Deferred();
        item = {
          test: true,
        };
        spyOn(viewModel, 'createOrGet').and.returnValue(saveDfd);
      });

      it('turns on "saving" flag', ()=> {
        viewModel.attr('saving', false);

        viewModel.onItemPicked(item);

        expect(viewModel.attr('saving')).toBe(true);
      });

      it('call createOrGet() method', ()=> {
        viewModel.onItemPicked(item);

        expect(viewModel.createOrGet).toHaveBeenCalledWith(item);
      });

      it('dispatches event when istance was saved', ()=> {
        spyOn(viewModel, 'dispatch');

        viewModel.onItemPicked(item);

        saveDfd.resolve(item).then(()=> {
          expect(viewModel.dispatch).toHaveBeenCalledWith({
            type: 'itemSelected',
            selectedItem: item,
          });
        });
      });

      it('turns off "saving" flag', ()=> {
        viewModel.attr('saving', true);

        viewModel.onItemPicked(item);

        saveDfd.resolve().then(()=> {
          expect(viewModel.attr('saving')).toBe(false);
        });
      });

      it('cleans search criteria if "autoClean" is turned on', ()=> {
        viewModel.attr('searchCriteria', 'someText');
        viewModel.attr('autoClean', true);

        viewModel.onItemPicked(item);

        saveDfd.resolve().then(()=> {
          expect(viewModel.attr('searchCriteria')).toBe('');
        });
      });

      it('does not clean search criteria if "autoClean" is turned on', ()=> {
        viewModel.attr('searchCriteria', 'someText');
        viewModel.attr('autoClean', false);

        viewModel.onItemPicked(item);

        saveDfd.resolve().then(()=> {
          expect(viewModel.attr('searchCriteria')).toBe('someText');
        });
      });
    });

    describe('createOrGet() method', ()=> {
      let originalModels;
      let createDfd;
      let item;
      let response;
      let model;
      beforeAll(()=> originalModels = CMS.Models);
      afterAll(()=> CMS.Models = originalModels);

      beforeEach(()=> {
        createDfd = can.Deferred();
        item = new can.Map({test: true});
        viewModel.attr('type', 'TestType');
        CMS.Models.TestType = can.Map.extend({
          create: jasmine.createSpy().and.returnValue(createDfd),
          root_object: 'test',
          cache: {},
        }, {});
        model = {
          id: 'testId',
        };
        response = [[201,
          {
            test: model,
          },
        ]];
      });

      it('make call to create model', ()=> {
        viewModel.createOrGet(item);

        expect(CMS.Models.TestType.create).toHaveBeenCalledWith(item);
      });

      it('creates model with empty context', ()=> {
        item.attr('context', 'test');
        viewModel.createOrGet(item);

        let model = CMS.Models.TestType.create.calls.argsFor(0)[0];
        expect(model.attr('context')).toBe(null);
      });

      it('creates model with "external" flag', ()=> {
        item.attr('external', false);
        viewModel.createOrGet(item);

        let model = CMS.Models.TestType.create.calls.argsFor(0)[0];
        expect(model.attr('external')).toBe(true);
      });

      it('returns new model if there is no value in cache', (done)=> {
        let resultDfd = viewModel.createOrGet(item);

        createDfd.resolve(response);

        resultDfd.then((resultModel)=> {
          expect(resultModel.attr('id')).toBe('testId');
          expect(resultModel instanceof CMS.Models.TestType).toBe(true);
          done();
        });
      });

      it('returns cached model if there is value in cache', (done)=> {
        CMS.Models.TestType.cache['testId'] = {cached: true};

        let resultDfd = viewModel.createOrGet(item);

        createDfd.resolve(response);

        resultDfd.then((resultModel)=> {
          expect(resultModel).toBe(CMS.Models.TestType.cache['testId']);
          done();
        });
      });
    });
  });
});

