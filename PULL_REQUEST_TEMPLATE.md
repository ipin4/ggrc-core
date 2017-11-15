# Issue description

*Explain the issue that the changes in the pull request solve.*

# Steps to test the changes

*Include steps to test or reproduce (in case of a bugfix) the changes in the pull request. This section should help the reviewer verify your changes.*

# Solution description

*Briefly explain the solution or add a link to the technical design document (this will help the reviewer confirm the code does what you intend). Feel free to also mention alternative approaches that didn't work out.*

# Sanity checklist

- [ ] I have clicked through the app to make sure my changes work and not break the app.
- [ ] I have applied the correct milestone and labels.
- [ ] My changes fix the issue described in the description (and do nothing else). 🤞
- [ ] My changes are covered by tests.
- [ ] My changes follow our [performance guidelines](https://github.com/google/ggrc-core/blob/dev/docs/source/contributing/performance.rst).
- [ ] My changes follow our [js](https://github.com/google/ggrc-core/blob/dev/docs/source/contributing/javascript.rst) and/or [python](https://github.com/google/ggrc-core/blob/dev/docs/source/contributing/python.rst) guidelines.
- [ ] My commits follow our [commit guidelines](https://github.com/google/ggrc-core/blob/dev/docs/source/contributing/git/how_to_write_a_commit_message.rst).

<!-- If your PR includes a migration include the additional checklist items
# Migration checklist
- [ ] db_reset runs without errors or warnings.
- [ ] db_reset ggrc-qa.sql runs without errors or warnings.
-->

# PR Review checklist

- [ ] The changes fix the issue and don't cause any apparent regressions.
- [ ] Labels and milestone are correctly set.
- [ ] The solution description matches the changes in the code.
- [ ] There is no apparent way to improve the performance & design of the new code.
- [ ] The pull request is opened against the correct base branch.
- [ ] Upon merging, the Jira ticket's fixversion is correctly set and the ticket is moved to "QA - In Progress".

<!-- If your code is not finished yet can include a TODO check list
# TODO

- [ ] First item on the TODO
-->

<!-- If your PR depends on other tickets or PRs, you can list them here
# Dependencies

This PR is `on hold` until the dependencies are merged:

- [ ] GGRC-1234
- [ ] #1234
-->
