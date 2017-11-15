/*
 Copyright (C) 2017 Google Inc.
 Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>
 */

const toBulkModel = (instances, targetProps)=> {
  var state = targetProps.state;
  return _.map(instances, (item)=> {
    return {
      id: item.id,
      state: state,
    };
  });
};

export default {
  update: function (model, instances, targetProps) {
    const url = '/api/' + model.table_plural;
    const dfd = can.Deferred();
    instances = toBulkModel(instances, targetProps);

    $.ajax({
      url: url,
      method: 'PATCH',
      data: JSON.stringify(instances),
      contentType: 'application/json',
    }).done(function (res) {
      dfd.resolve(res);
    }).fail(function (err) {
      dfd.reject(err);
    });
    return dfd;
  },
};
