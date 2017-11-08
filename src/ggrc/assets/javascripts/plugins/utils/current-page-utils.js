/* !
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

import * as TreeViewUtils from './tree-view-utils';
import {
  isSnapshotRelated,
  transformQuery,
} from './snapshot-utils';
import './query-api-utils';

/**
 * Util methods for work with Current Page.
 */

var relatedToCurrentInstance = new can.Map({
  define: {
    initialized: {
      type: 'boolean',
      value: false,
    },
  },
});

var widgetsCounts = new can.Map({
  defined: {
    isInitialized: {
      value: false,
    },
  },
});

var QueryAPI = GGRC.Utils.QueryAPI;

let CUSTOM_COUNTERS = {
  MY_WORK: () => _getCurrentUser().getWidgetCountForMyWorkPage(),
  ALL_OBJECTS: () => _getCurrentUser().getWidgetCountForAllObjectPage(),
};

function initMappedInstances() {
  var currentPageInstance = GGRC.page_instance();
  var models = GGRC.Mappings.getMappingList(currentPageInstance.type);
  var reqParams = [];

  relatedToCurrentInstance.attr('initialized', true);
  models = can.makeArray(models);

  models.forEach(function (model) {
    var query = QueryAPI.buildRelevantIdsQuery(
      model,
      {},
      {
        type: currentPageInstance.type,
        id: currentPageInstance.id,
        operation: 'relevant',
      });
    if (isSnapshotRelated(currentPageInstance.type, model)) {
      query = transformQuery(query);
    }
    reqParams.push(QueryAPI.batchRequests(query));
  });

  return can.when.apply(can, reqParams)
    .then(function () {
      var response = can.makeArray(arguments);

      models.forEach(function (model, idx) {
        var ids = response[idx][model] ?
          response[idx][model].ids :
          response[idx].Snapshot.ids;
        var map = ids.reduce(function (mapped, id) {
          mapped[id] = true;
          return mapped;
        }, {});
        relatedToCurrentInstance.attr(model, map);
      });
      return relatedToCurrentInstance;
    });
}

// To identify pages like My Work, My Assessments and Admin Dashboard on the Server-side
// was defined variable GGRC.pageType, because for all of them GGRC.page_instance().type = 'Person'.
// For other pages using GGRC.page_instance() object.
function getPageType() {
  return GGRC.pageType ? GGRC.pageType : GGRC.page_instance().type;
}

function isMyAssessments() {
  return getPageType() === 'MY_ASSESSMENTS';
}

function isMyWork() {
  return getPageType() === 'MY_WORK';
}

function isAllObjects() {
  return getPageType() === 'ALL_OBJECTS';
}

function isAdmin() {
  return getPageType() === 'ADMIN';
}

/**
 *
 * @return {boolean} False for My Work, All Objects and My Assessments pages and True for the rest.
 */
function isObjectContextPage() {
  return !GGRC.pageType;
}

/**
 * Should return list of widgets required for rendering
 * @param {String} modelName - Page Object Model Name
 * @param {String} path - Application location path
 * @return {Object} - widget list object
 */
function getWidgetList(modelName, path) {
  var widgetList = {};
  var isAssessmentsView;

  if (!modelName) {
    return widgetList;
  }
  widgetList = GGRC.WidgetList.get_widget_list_for(modelName);
  // Needs refactoring: Should be removed and replaced with Routing!!!
  isAssessmentsView = /^\/assessments_view/.test(path);

  // the assessments_view only needs the Assessments widget
  if (isAssessmentsView) {
    widgetList = {
      assessment: widgetList.Assessment,
    };
    widgetList.assessment.treeViewDepth = 0;
  }

  return widgetList;
}

function getWidgetModels(modelName, path) {
  var widgetList = getWidgetList(modelName, path);
  var defaults = getDefaultWidgets(widgetList, path);

  return defaults.map(function (widgetName) {
    var isObjectVersion = GGRC.Utils.ObjectVersions
      .isObjectVersion(widgetName);

    if (isObjectVersion) {
      return widgetName;
    }

    return widgetList[widgetName]
      .content_controller_options.model.shortName;
  });
}

function getDefaultWidgets(widgetList, path) {
  var defaults = Object.keys(widgetList);
  // Needs refactoring: Should be removed and replaced with Routing!!!
  var isObjectBrowser = /^\/objectBrowser\/?$/.test(path);

  // Remove info tab from object-browser list of tabs
  if (isObjectBrowser) {
    defaults.splice(defaults.indexOf('info'), 1);
  }
  return defaults;
}

/**
 * Counts for related objects.
 *
 * @return {can.Map} Promise which return total count of objects.
 */
function getCounts() {
  return widgetsCounts;
}

function initWidgetCounts(widgets, type, id) {
  let result;

  // custom endpoint we use only in order to initialize counts for all tabs.
  // In order to update counter for individual tab need to use Query API
  if (widgets.length !== 1 && CUSTOM_COUNTERS[getPageType()]) {
    result = CUSTOM_COUNTERS[getPageType()]();
  } else {
    result = _initWidgetCounts(widgets, type, id);
  }

  return result.then((countsMap) => {
    const counts = getCounts();
    counts.attr(countsMap);
    if (!counts.attr('isInitialized')) {
      counts.attr('isInitialized', true);
    }
  });
}

/**
 * Update Page Counts
 * @param {Array|Object} widgets - list of widgets
 * @param {String} type - Type of parent object
 * @param {Number} id - ID of parent object
 * @return {can.Deferred} - resolved deferred object
 */
function _initWidgetCounts(widgets, type, id) {
  // Request params generation logic should be moved in
  // a separate place
  var widgetsObject = GGRC.Utils.ObjectVersions
    .getWidgetConfigs(can.makeArray(widgets));

  var params = widgetsObject.map(function (widgetObject) {
    var param;
    var expression = TreeViewUtils
      .makeRelevantExpression(widgetObject.name, type, id);

    if (isSnapshotRelated(type, widgetObject.name)) {
      param = QueryAPI.buildParam('Snapshot', {}, expression, null,
        GGRC.query_parser.parse('child_type = ' + widgetObject.name));
    } else {
      param = QueryAPI.buildParam(widgetObject.responseType,
        {}, expression, null,
        widgetObject.additionalFilter ?
          GGRC.query_parser.parse(widgetObject.additionalFilter) :
          null
        );
    }

    param.type = 'count';
    return param;
  });

  // Perform requests only if params are defined
  if (!params.length) {
    return can.Deferred().resolve();
  }

  return QueryAPI.makeRequest({
    data: params,
  }).then(function (data) {
    var countsMap = {};
    data.forEach(function (info, i) {
      var widget = widgetsObject[i];
      var name = widget.responseType;
      var countsName = widget.countsName || widget.name;

      if (isSnapshotRelated(type, name)) {
        name = 'Snapshot';
      }
      countsMap[countsName] = info[name].total;
    });
    return countsMap;
  });
}

function refreshCounts() {
  var pageInstance = GGRC.page_instance();
  var widgets;
  var location = window.location.pathname;

  if (!pageInstance) {
    return can.Deferred().resolve();
  }

  widgets = getWidgetModels(pageInstance.constructor.shortName, location);

  return _initWidgetCounts(widgets, pageInstance.type, pageInstance.id);
}

function _getCurrentUser() {
  let userId = GGRC.current_user.id;

  return CMS.Models.Person.findInCacheById(userId);
}

export {
  relatedToCurrentInstance as related,
  initMappedInstances,
  getPageType,
  isMyAssessments,
  isMyWork,
  isAllObjects,
  isAdmin,
  isObjectContextPage,
  getWidgetList,
  getWidgetModels,
  getDefaultWidgets,
  getCounts,
  initWidgetCounts as initCounts,
  refreshCounts,
};
