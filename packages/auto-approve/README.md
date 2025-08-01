# ⛔️ DEPRECATED : auto-approve

This bot is deprecated and is planned for shutdown August 4, 2025.

---

Auto-approve is a bot that approves and tags pull requests to automatically merge. Pull requests are approved and tagged if they match
the settings in the configuration file for that repository, and if that configuration file meets guidelines detailed below. 

This bot checks incoming pull requests against the `.github/auto-approve.yml` file that lives in the same repository.

## Using the bot
To use the bot, start by [enabling it on your repository](https://github.com/apps/auto-approve).  It is on automatically for the `googleapis` org.

## Latest Release Notes (11/23/21):

As of 11/23/21, we are refactoring auto-approve to make the configuration file less complicated.

The `.github/auto-approve.yml` will now only accept the following values:

```yaml
processes:
  - "UpdateDiscoveryArtifacts"
  - "RegenerateReadme"
  - "DiscoveryDocUpdate"
  - "PythonDependency"
  - "PythonSampleDependency"
  - "NodeDependency"
  - "NodeRelease"
  - "JavaApiaryCodegen"
  - "JavaDependency"
  - "OwlBotTemplateChanges"
  - "OwlBotAPIChanges"
  - "PHPApiaryCodegen"
  - "DockerDependency"
  - "GoDependency"
  - "GoApiaryCodegen"
  - "PythonSampleAppDependency"
  - "JavaSampleAppDependency"
  - "NodeGeneratorDependency"
  - "OwlBotTemplateChangesNode"
  - "OwlBotPRsNode"
  - "RubyApiaryCodegen"
```

These processes represent different workflows for what auto-approve will approve and merge in a given repository. To see their logic in full, see the corresponding file in /src/process-checks.

Below is what each process checks for:

* UpdateDiscoveryArtifacts:
  - Checks that the author is 'yoshi-code-bot'
  - Checks that the title of the PR starts with 'chore: Update discovery artifacts'
  - Max 2 files changed in the PR
  - Each file path must match one of these regexps:
    - /^docs\/dyn\/index\.md$/
    - /^docs\/dyn\/.*\.html$/
    - /^googleapiclient\/discovery_cache\/documents\/.*\.json$/
* RegenerateReadme:
  - Checks that the author is 'yoshi-automation'
  - Checks that the title of the PR is 'chore: regenerate README'
  - Max 2 files changed in the PR
  - Each file path must match one of these regexps:
    - /^README.md$/
    - /\.github\/readme\/synth.metadata\/synth\.metadata$/
* DiscoveryDocUpdate
  - Checks that the author is 'googleapis-publisher'
  - Checks that the title of the PR starts with 'chore: autogenerated discovery document update'
* PythonDependency:
  - Checks that the author is 'renovate-bot'
  - Checks that the title of the PR matches the regexp: /^(fix|chore)\(deps\): update dependency (@?\S*) to v(\S*)$/
  - Each file path must match one of these regexps:
    - /requirements.txt$/
    - /^samples/**/requirements*.txt$/
  - All files must: 
    - Match this regexp: /requirements.txt$/
    - Increase the package version of a dependency (major or nonmajor)
    - Only change one dependency
    - Change the dependency that was there previously, and that is on the title of the PR
* PythonSampleDependency:
  - Checks that the author is 'renovate-bot' or 'dependabot'
  - Checks that the title of the PR matches the regexp: /^(fix|chore)\(deps\): update dependency (@?\S*) to v(\S*)$/
  or /^(chore)\(deps\): bump (@?\S*) from \S* to (\S*) in \S/
  - Each file path must match one of these regexps:
    - /requirements.txt$/
  - All files must: 
    - Match this regexp: /requirements.txt$/
    - Increase the non-major package version of a dependency
    - Only change one dependency
    - Change the dependency that was there previously, and that is on the title of the PR
    - Not match any regexes in the 'excluded' list
* NodeDependency:
  - Checks that the author is 'renovate-bot'
  - Checks that the title of the PR matches the regexp: /^(fix|chore)\(deps\): update dependency (@?\S*) to v(\S*)$/
  - Each file path must match one of these regexps:
    - /package\.json$/
  - All files must: 
    - Match this regexp:
      - /package.json$/
    - Increase the non-major package version of a dependency
    - Only change one dependency
    - Change the dependency that was there previously, and that is on the title of the PR
* NodeRelease:
  - Checks that the author is 'release-please'
  - Checks that the title of the PR matches the regexp: /^chore: release/
  - Max 2 files changed in the PR
  - Each file path must match one of these regexps:
    - /^package.json$/
    - /^CHANGELOG.md$/
  - At least one file must: 
    - Match either this regexp: /^package.json$/
    - Increase the non-major package version
    - Only change the top-level package
    - Approve on a day between Mon - Thurs PST (so as to not trigger a weekend release)
* JavaApiaryCodegen
  - Checks that the author is 'yoshi-code-bot'
  - Checks that the title of the PR matches the regexp: /^Regenerate .* client$/
* JavaDependency:
  - Checks that the author is 'renovate-bot'
  - Checks that the title of the PR matches the regexp: /^(fix|chore)\(deps\): update dependency (@?\S*) to v(\S*)$/
  - Max 50 files changed in the PR
  - Each file path must match one of these regexps:
    - /pom.xml$/ or /build.gradle$/
  - All files must: 
    - Match this regexp: /pom.xml$/ or /build.gradle$/
    - Increase the non-major package version of a dependency
    - Only change one dependency
    - Change the dependency that was there previously, and that is on the title of the PR, and is a Google or grpc dependency
* OwlBotTemplateChanges:
  - Checks that the author is 'gcf-owl-bot[bot]'
  - Checks that the title of the PR does NOT include feat, fix, or !
  - Checks that the title of the PR contains `[autoapprove]` somewhere inside it
  - Checks that the body of the PR does not contain 'PiperOrigin-RevId'
  - Checks that the .repo-metadata.json of the repo contains "library_type": "GAPIC_AUTO"
* OwlBotAPIChanges:
  - Checks that the author is 'gcf-owl-bot[bot]'
  - Checks that the title of the PR does NOT include breaking, BREAKING, or !
  - Checks that the body of the PR DOES contain 'PiperOrigin-RevId'
  - Checks that the .repo-metadata.json of the repo contains "library_type": "GAPIC_AUTO"
  - Checks that there are no other PRs in that repository that have been opened by gcf-owl-bot[bot]
  - Checks that the PR does not have any commits from any other authors other than gcf-owl-bot[bot]
* PHPApiaryCodegen
  - Checks that the author is 'yoshi-code-bot'
  - Checks that the title of the PR matches the regexp: /^Regenerate .* client$/
* DockerDependency
  - Checks that the author is 'renovate-bot'
  - Checks that the title of the PR matches the regexp: /^(fix|chore)\(deps\): update (\D[^:?]*).* docker (digest|tag) to (.*)$/
  - Each file path must match this regexp:
    - /Dockerfile$/
  - All files must: 
    - Match this regexp: /Dockerfile$/
    - Increase the non-major package version of a dependency or the tag
    - Only change one dependency
    - Change the dependency that was there previously, and that is on the title of the PR
* GoApiaryCodegen
  - Checks that the author is 'yoshi-automation'
  - Checks that the title of the PR matches the regexp: /^feat\(all\): auto-regenerate discovery clients$/
* GoDependency
  - Checks that the author is 'renovate-bot'
  - Checks that the title of the PR matches the regexp: /^(fix|chore)\(deps\): update (?:module (\D*?)|(\D*?) digest) to v?(\S*)$/
  - Each file path must match one of these regexp:
    - /go\.sum$/
    - /go\.mod$/
  - All files must: 
    - Match this regexp: /go\.mod$/ (if it's go.sum, there are no additional checks, but it passes)
    - Increase the non-major package version of a dependency or digest
    - Change the dependency that was there previously, and that is on the title of the PR
* PythonSampleAppDependency
  - Checks that the author is 'renovate-bot'
  - Checks that the title of the PR matches the regexp: /^(fix|chore)\(deps\): update dependency (@?\S*) to v(\S*)$/
  - Each file path must match one of these regexp:
    - /requirements\.txt$/
    - /requirements\.in$/
  - All files must: 
    - Match this regexp: /requirements.txt$/ or /requirements\.in$/
    - Increase the non-major package version of a dependency or digest
    - Change the dependency that was there previously, and that is on the title of the PR
* JavaSampleAppDependency:
  - Checks that the author is 'renovate-bot'
  - Checks that the title of the PR matches the regexp: /^(fix|chore)\(deps\): update dependency (@?\S*) to v(\S*)$/
  - Max 50 files changed in the PR
  - Each file path must match one of these regexps:
    - /pom.xml$/
  - All files must: 
    - Match this regexp: /pom.xml$/
    - Increase the non-major package version of a dependency
    - Only change one dependency
    - Change the dependency that was there previously, and that is on the title of the PR
* NodeGeneratorDependency:
 - Checks that the author is 'renovate-bot'
  - Checks that the title of the PR matches the regexp: /^(fix|chore)\(deps\): update dependency (@?\S*) to v?\^?~?(\S*)$/
  - Each file path must match one of these regexps:
    - [/package\.json$/, /\.bzl$/, /pnpm-lock\.yaml$/]
  - All files must: 
    - Match this regexp:
      - /package.json$/, /\.bzl$/, or /pnpm-lock\.yaml$/
    - Increase the non-major package version of a dependency
    - Change the dependency that was there previously, and that is on the title of the PR
* OwlBotTemplateChangesNode:
  - Checks that the author is 'gcf-owl-bot[bot]'
  - Checks that the title of the PR does NOT include BREAKING, feat, fix, !
  - Checks that the title of the PR starts with chore, build, test, refactor
  - Checks that the body of the PR does not contain 'PiperOrigin-RevId'
  - Checks that the PR is the first of owlbot PRs in the repo (so that they are not merged out of order)
  - Checks that there are no other commit authors other than owlbot on the repo
* OwlBotPRsNode:
  - Checks that the author is 'gcf-owl-bot[bot]'
  - Checks that the title of the PR does NOT include BREAKING, !
  - Checks that the title of the PR starts with chore, build, test, refactor, feat, fix,
  - Checks that the body of the PR DOES contain 'PiperOrigin-RevId'
  - Checks that the PR is the first of owlbot PRs in the repo (so that they are not merged out of order)
  - Checks that there are no other commit authors other than owlbot on the repo
* RubyApiaryCodegen
  - Checks that the author is 'yoshi-code-bot'
  - Checks that the title of the PR matches the regexp: /^feat: Automated regeneration of .* client$/

This change in configuration permits the following:
* Allows for more complete testing as described by c8, by codifying the logic in TS as opposed to the JSON validation schema
* Reduces the possibility of human error in the config, and creates a more secure process to adding logic (by requiring code review through the github automation team)
* Allows for different use cases to start branching out and requiring distinct conditions without further refactor
* Allows for tests to be specific to languages and use cases
* Still allows for users to self-select if they'd like to use auto-approve, and specify a use case that is specific to their
repo's needs.

As before, a repo may select one or more of these processes if they are relevant to the repository.

If you'd like to petition for a new workflow, please submit a bug in this directory with the label `bot: auto-approve`.

Furthermore, the bot still requires a CODEOWNERS file to look like so:

There should be a CODEWONERS file, under `.github/CODEOWNERS` in your repository. You must add a line that adds the Github Automation team as a codeowner for the `auto-approve.yml` file you have created, and they will be alerted anytime there is a change to the file. See the example below.

```
# Code owners file.
# This file controls who is tagged for review for any given pull request.
#
# For syntax help see:
# https://help.github.com/en/github/creating-cloning-and-archiving-repositories/about-code-owners#codeowners-syntax


.github/auto-approve.yml                 @googleapis/github-automation
```

The bot will continue to work for the old configuration style (see below). However, new processes will be added to the configuration as described above.

## Previous configuration style (pre 11/23/21):

Create a file in `.github/auto-approve.yml` in your repository.  The complete options supported include:

```yaml
rules:
# Currently we allow a small subset of valid types of PRs to get merged.  The following three
# rules can be used altogether or any subset. The bot confirms that incoming pull requests'
# author match the authors below, and subsequently, the allowed title of the pull requests.
# `changedFiles` are allowed patterns for the file paths that are changed in a PR, and 
# `maxFiles` are the maximum amount of files that are allowed to be changed in that PR. Neither
# changedFiles nor maxFiles are required, but they will be enforced on a PR if they are set.
# Each rule only has the allowed values listed below; there is no mixing of values between rules,
# nor can any values be replaced. To understand the full set of rules for the JSON file, check out
# src/valid-pr-schema.json

# Option 1: incoming PRs from googleapis publisher
- author: "googleapis-publisher"

# Title for PRs from googleapis-publisher MUST start with `chore: autogenerated discovery document update`.
# Title must be regex.
  title: "^chore: autogenerated discovery document update"

# Option 2: incoming PRs from yoshi-automation
- author: "yoshi-automation"

# Title for PRs from yoshi-automation MUST be exactly `chore: regenerate README`, but it is required
# to configure the title in regex.
  title: "^chore: regenerate README$"

# (Optional) The only changed file paths in an incoming PR MUST be exactly `README.md` or 
# `.github/readme/synth.metadata/synth.metadata`. These are listed in regex. If this property 
# is omitted, auto-approve bot will allow PRs that match the author and title to merge, without
# checking the file paths. 
  changedFiles:
  - "^README.md$"
  - "^\\.github/readme/synth\\.metadata/synth\\.metadata$"

# (Optional) The max amount of files changed in a PR. 
  maxFiles: 2

# Option 3: incoming PRs from release-please[bot] for Node
- author: "release-please[bot]"

# Title for PRs from yoshi-code-bot MUST start with `chore: release`.
  title: "^chore: release"

# (Optional) The only changed file paths in an incoming PR MUST end with `package.json` or 
# `CHANGELOG.md`. These are listed in regex. If this property 
# is omitted, auto-approve bot will allow PRs that match the author and title to merge, without
# checking the file paths. 
  changedFiles:
  - "package\\.json$"
  - "CHANGELOG\\.md$"

# (Optional) The max amount of files changed in a PR. 
  maxFiles: 3

# Option 4: incoming PRs from yoshi-code-bot
- author: "yoshi-code-bot"

# Title for PRs from yoshi-code-bot MUST start with `chore: Update discovery artifacts`.
# Title must be regex.
  title: "^chore: Update discovery artifacts"

# (Optional) The only changed file paths in an incoming PR MUST be exactly
# `"^docs/dyn/index.md$"` or follow either one of these patterns `"docs/dyn/*.html"`
# or `"googleapiclient/discovery_cache/documents/*.json"` . These are
# listed in regex. If this property is omitted, auto-approve bot will allow PRs
# that match the author and title to merge, without checking the file paths.
  changedFiles:
  - "^docs/dyn/index.md$"
  - "^docs/dyn/.*\\.html$"
  - "^googleapiclient/discovery_cache/documents/.*\\.json$"

# Option 5: incoming PRs from renovate-bot
- author: "renovate-bot"

# Title for PRs from renovate-bot MUST start with `fix(deps):` or `chore(deps)"`.
  title: "^(fix|chore)\\(deps\\):"

# (Optional) The only changed file paths in an incoming PR MUST end with `package.json`. These are listed in regex. If this property 
# is omitted, auto-approve bot will allow PRs that match the author and title to merge, without
# checking the file paths. 
  changedFiles:
  - "package\\.json$"
  - "pom\\.xml$"
  - "requirements\\.txt"

# (Optional) The max amount of files changed in a PR. 
  maxFiles: 50
```
Next, create a CODEWONERS file, under `.github/CODEOWNERS` in your repository. You must add a line that adds the Github Automation team as a codeowner for the `auto-approve.yml` file you have created, and they will be alerted anytime there is a change to the file. See the example below.

```
# Code owners file.
# This file controls who is tagged for review for any given pull request.
#
# For syntax help see:
# https://help.github.com/en/github/creating-cloning-and-archiving-repositories/about-code-owners#codeowners-syntax


.github/auto-approve.yml                 @googleapis/github-automation
```

The bot is triggered every time a PR is opened, reopened, or edited.

This bot uses nock for mocking requests to GitHub, and snap-shot-it for capturing responses; This allows updates to the API surface to be treated as a visual diff, rather than tediously asserting against each field.

## Running tests:

`npm test`

## Contributing

If you have suggestions for how auto-approve could be improved, or want to report a bug, open an issue! We'd love all and any contributions.

For more, check out the Contributing Guide.

License
Apache 2.0 © 2019 Google LLC.
