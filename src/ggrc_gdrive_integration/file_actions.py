# Copyright (C) 2017 Google Inc.
# Licensed under http://www.apache.org/licenses/LICENSE-2.0 <see LICENSE file>

"""File action utitlities for GDrive module"""

from apiclient import discovery
from apiclient import http
from apiclient.errors import HttpError
from flask import json
from werkzeug.exceptions import (
    BadRequest, NotFound, InternalServerError, Unauthorized
)

from ggrc.converters.import_helper import read_csv_file
from ggrc_gdrive_integration import get_http_auth


def create_gdrive_file(csv_string, filename):
  """Post text/csv data to a gdrive file"""
  http_auth = get_http_auth()
  drive_service = discovery.build('drive', 'v3', http=http_auth)
  # make export to sheets
  file_metadata = {
      'name': filename,
      'mimeType': 'application/vnd.google-apps.spreadsheet'
  }
  media = http.MediaInMemoryUpload(csv_string,
                                   mimetype='text/csv',
                                   resumable=True)
  return drive_service.files().create(body=file_metadata,
                                      media_body=media,
                                      fields='id, name, parents').execute()


def get_gdrive_file(file_data):
  """Get text/csv data from gdrive file"""
  http_auth = get_http_auth()
  try:
    drive_service = discovery.build('drive', 'v3', http=http_auth)
    # check file type
    file_meta = drive_service.files().get(fileId=file_data['id']).execute()
    if file_meta.get("mimeType") == "text/csv":
      file_data = drive_service.files().get_media(
          fileId=file_data['id']).execute()
    else:
      file_data = drive_service.files().export_media(
          fileId=file_data['id'], mimeType='text/csv').execute()
    csv_data = read_csv_file(file_data.splitlines())
  except AttributeError:
    # when file_data has no splitlines() method
    raise BadRequest("Wrong file format.")
  except HttpError as e:
    message = json.loads(e.content).get("error").get("message")
    if e.resp.status == 404:
      raise NotFound(message)
    if e.resp.status == 401:
      raise Unauthorized("{} Try to reload /import page".format(message))
    if e.resp.status == 400:
      raise BadRequest(message + " Probably the file is of a wrong type.")
    raise InternalServerError(message)
  except:  # pylint: disable=bare-except
    raise InternalServerError("Import failed due to internal server error.")
  return csv_data
