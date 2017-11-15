/*!
  Copyright (C) 2017 Google Inc.
  Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
*/

import Pagination from '../pagination';

describe('Pagination', function () {
  'use strict';

  var paginationViewModel;

  describe('current property', function () {
    beforeEach(function () {
      paginationViewModel = new Pagination();
    });
    it('returns 1 when was not set previously', function () {
      var result;
      result = paginationViewModel.attr('current');
      expect(result).toEqual(1);
    });
    it('was not updated when out of pages range', function () {
      var result;
      paginationViewModel.attr('current', 2);
      result = paginationViewModel.attr('current');
      expect(result).toEqual(1);
    });
    it('was not updated when pagination was disabled', function () {
      var result;
      paginationViewModel.attr('count', 10);
      paginationViewModel.attr('disabled', true);
      paginationViewModel.attr('current', 3);
      result = paginationViewModel.attr('current');
      expect(result).toEqual(1);
    });
    it('was updated correctly', function () {
      var result;
      paginationViewModel.attr('count', 10);
      paginationViewModel.attr('current', 3);
      result = paginationViewModel.attr('current');
      expect(result).toEqual(3);
    });
  });
  describe('pageSize property', function () {
    beforeEach(function () {
      paginationViewModel = new Pagination();
    });
    it('returns default value when was not updated', function () {
      var result;
      result = paginationViewModel.attr('pageSize');
      expect(result).toEqual(5);
    });
    it('was not updated when pagination was disabled', function () {
      var result;
      paginationViewModel.attr('disabled', true);
      paginationViewModel.attr('pageSize', 10);
      result = paginationViewModel.attr('pageSize');
      expect(result).toEqual(5);
    });
    it('was updated correctly', function () {
      var result;
      paginationViewModel.attr('pageSize', 10);
      result = paginationViewModel.attr('pageSize');
      expect(result).toEqual(10);
    });
    it('update should reset current page', function () {
      var result;
      paginationViewModel.attr('count', 3);
      paginationViewModel.attr('current', 2);
      paginationViewModel.attr('pageSize', 10);
      result = paginationViewModel.attr('current');
      expect(result).toEqual(1);
    });
    it('does not update current page when pageSize does not changed',
    function () {
      var result;
      paginationViewModel.attr('count', 3);
      paginationViewModel.attr('current', 2);
      paginationViewModel.attr('pageSize', 5); // set the same pageSize value
      result = paginationViewModel.attr('current');
      expect(result).toEqual(2);
    });
  });
  describe('limits property', function () {
    beforeEach(function () {
      paginationViewModel = new Pagination();
    });
    it('returns info about items range for current page', function () {
      var result;
      result = paginationViewModel.attr('limits');
      expect(result).toEqual([0, 5]);
    });
    it('returns an empty range for current page', function () {
      var result;
      paginationViewModel.attr('pageSize', 0);
      result = paginationViewModel.attr('limits');
      expect(result).toEqual([0, 0]);
    });
    it('returns an empty range for page #0', function () {
      var result;
      paginationViewModel.attr('current', 0);
      result = paginationViewModel.attr('limits');
      expect(result).toEqual([0, 5]);
    });
  });
  describe('total property', function () {
    beforeEach(function () {
      paginationViewModel = new Pagination();
    });
    it('returns undefined when was not initialized previously', function () {
      var result;
      result = paginationViewModel.attr('total');
      expect(result).not.toBeDefined();
    });
    it('returns correct items count and updates pages count when initialized',
    function () {
      var itemsCount;
      var pagesCount;
      paginationViewModel.attr('total', 10);
      itemsCount = paginationViewModel.attr('total');
      pagesCount = paginationViewModel.attr('count');
      expect(itemsCount).toEqual(10);
      expect(pagesCount).toEqual(2);
    });
  });
});
