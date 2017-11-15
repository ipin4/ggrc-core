# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""Unit tests for Snapshot block converter class."""

import urllib
import mock
import flask

from integration.ggrc import TestCase
import ggrc_gdrive_integration as gi


class TestAuthorizationFlow(TestCase):
  """Unit tests for gDrive authorization flow."""

  # flake8: noqa pylint: disable=no-self-use
  def test_gdrive_authorization(self):
    """Test authorization routines work correctly"""
    line = "http://some_test_redirect_url/export?model_type=Assessment&relevant_type=Person&relevant_id=150"
    flask.request.url = line
    redirect = gi.authorize_app()
    assert "state=" + urllib.quote_plus(line) in redirect.location

    with mock.patch("ggrc_gdrive_integration.client.OAuth2WebServerFlow") as mocked_flow:
      # after the first step:
      code = "1234567890"
      flask.request.args = {"code": code}
      # after the first step state is already in request.args
      flask.request.args.update({"state": line})
      gi.authorize_app()
      # assert step2 called
      mocked_flow.return_value.step2_exchange.assert_called_once_with(code)
