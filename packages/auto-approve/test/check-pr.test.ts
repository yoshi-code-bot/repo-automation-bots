// Copyright 2021 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import {describe, it} from 'mocha';
import assert from 'assert';
import * as fs from 'fs';
import * as checkPR from '../src/check-pr';
import {checkFilePathsMatch} from '../src/utils-for-pr-checking';
import nock from 'nock';
import {resolve} from 'path';
import yaml from 'js-yaml';
import {File, ValidPr} from '../src/interfaces';
import sinon from 'sinon';

const {Octokit} = require('@octokit/rest');
nock.disableNetConnect();

const fetch = require('node-fetch');

const octokit = new Octokit({
  auth: 'mypersonalaccesstoken123',
  request: {fetch},
});
const fixturesPath = resolve(__dirname, '../../test/fixtures');

function listChangedFilesPR(status: number, response: File[]) {
  return nock('https://api.github.com')
    .get('/repos/testOwner/testRepo/pulls/1/files')
    .reply(status, response);
}

describe('check pr against config', async () => {
  beforeEach(() => {
    sinon.stub(Date, 'now').returns(1623280558000);
  });

  afterEach(() => {
    sinon.restore();
  });
  describe('checks that files match at least one of the patterns', () => {
    it('should return true if the file list is empty', () => {
      const prFiles = [
        'packages/spell-check/a.js',
        'packages/spell-check/b.js',
      ];
      const validPr: ValidPr = {
        author: 'yoshi-bot@',
        title: 'chore: autogenerated yadayada',
      };
      assert.ok(
        checkFilePathsMatch(
          prFiles,
          validPr.changedFiles?.map(x => RegExp(x))
        )
      );
    });

    it('should return true if each file matches at least one of the patterns', () => {
      const prFiles = [
        'packages/spell-check/package.json',
        'packages/spell-check/CHANGELOG.md',
      ];
      const validPr: ValidPr = {
        author: 'yoshi-bot@',
        title: 'chore: autogenerated yadayada',
        changedFiles: ['package.json$', 'CHANGELOG.md$'],
      };
      assert.ok(
        checkFilePathsMatch(
          prFiles,
          validPr.changedFiles?.map(x => RegExp(x))
        )
      );
    });

    it('should return false if one file matches does not match any of the patterns', () => {
      const prFiles = [
        'packages/spell-check/package.json',
        'packages/spell-check/CHANGELOG',
      ];
      const validPr: ValidPr = {
        author: 'yoshi-bot@',
        title: 'chore: autogenerated yadayada',
        changedFiles: ['package.json$', 'CHANGELOG.md$'],
      };
      assert.strictEqual(
        checkFilePathsMatch(
          prFiles,
          validPr.changedFiles?.map(x => RegExp(x))
        ),
        false
      );
    });

    it('should return false if no files match any patterns', () => {
      const prFiles = [
        'packages/spell-check/anythingElse',
        'packages/spell-check/CHANGELOG',
      ];
      const validPr: ValidPr = {
        author: 'yoshi-bot@',
        title: 'chore: autogenerated yadayada',
        changedFiles: ['package.json$', 'CHANGELOG.md$'],
      };
      assert.strictEqual(
        checkFilePathsMatch(
          prFiles,
          validPr.changedFiles?.map(x => RegExp(x))
        ),
        false
      );
    });
  });

  describe('main pr functioning', async () => {
    const validPR = yaml.load(
      fs.readFileSync(
        resolve(fixturesPath, 'config', 'valid-schemas', 'valid-schema1.yml'),
        'utf8'
      )
    ) as {rules: ValidPr[]};

    it('should get the base repo info to do its checking, not the head repo', async () => {
      const validPR = yaml.load(
        fs.readFileSync(
          resolve(fixturesPath, 'config', 'valid-schemas', 'valid-schema5.yml'),
          'utf8'
        )
      ) as {rules: ValidPr[]};

      const fileRequest = nock('https://api.github.com')
        .get('/repos/GoogleCloudPlatform/python-docs-samples-1/pulls/1/files')
        .reply(200, [{filename: 'requirements.txt', sha: '1234'}]);

      const pr = require(resolve(
        fixturesPath,
        'events',
        'pull_request_opened_fork'
      ));

      await checkPR.checkPRAgainstConfig(validPR, pr, octokit);

      fileRequest.done();
    });

    it('should return false if PR does not match author in validPRConfig', async () => {
      const pr = require(resolve(
        fixturesPath,
        'events',
        'pull_request_opened'
      ));

      const prMatchesConfig = await checkPR.checkPRAgainstConfig(
        validPR,
        pr,
        octokit
      );
      assert.strictEqual(prMatchesConfig, false);
    });

    it('should return false if PR does not match title', async () => {
      const pr = require(resolve(
        fixturesPath,
        'events',
        'pull_request_opened_right_author_wrong_title'
      ));

      const prMatchesConfig = await checkPR.checkPRAgainstConfig(
        validPR,
        pr,
        octokit
      );
      assert.strictEqual(prMatchesConfig, false);
    });

    it('should return false if PR changed files do not match allowed changed files in config', async () => {
      const pr = require(resolve(
        fixturesPath,
        'events',
        'pull_request_opened_right_author_and_title'
      ));

      const scopes = listChangedFilesPR(200, [
        {filename: 'changedFile1', sha: '1234'},
        {filename: 'changedFile2', sha: '1234'},
      ]);

      const prMatchesConfig = await checkPR.checkPRAgainstConfig(
        validPR,
        pr,
        octokit
      );

      scopes.done();
      assert.strictEqual(prMatchesConfig, false);
    });

    it('should return false if number of changed files does not match allowed number of changed files', async () => {
      const pr = require(resolve(
        fixturesPath,
        'events',
        'pull_request_opened_right_author_and_title'
      ));

      const scopes = listChangedFilesPR(200, [
        {filename: 'README.md', sha: '1234'},
        {filename: '.github/readme/synth.metadata/synth.metadata', sha: '1234'},
        {filename: 'README.md', sha: '1234'},
      ]);

      const prMatchesConfig = await checkPR.checkPRAgainstConfig(
        validPR,
        pr,
        octokit
      );

      scopes.done();
      assert.strictEqual(prMatchesConfig, false);
    });

    it('should return true if all elements of PR match', async () => {
      const pr = require(resolve(
        fixturesPath,
        'events',
        'pull_request_opened_right_author_and_title_file_count'
      ));

      const scopes = listChangedFilesPR(200, [
        {filename: 'README.md', sha: '1234'},
        {filename: '.github/readme/synth.metadata/synth.metadata', sha: '1234'},
      ]);

      const prMatchesConfig = await checkPR.checkPRAgainstConfig(
        validPR,
        pr,
        octokit
      );

      scopes.done();
      assert.ok(prMatchesConfig);
    });

    it('should return true if all elements of PR match, and some are left blank in the config', async () => {
      const validPR = yaml.load(
        fs.readFileSync(
          resolve(fixturesPath, 'config', 'valid-schemas', 'valid-schema2.yml'),
          'utf8'
        )
      ) as {rules: ValidPr[]};

      const pr = require(resolve(
        fixturesPath,
        'events',
        'pull_request_opened_right_author_and_title_partial_schema'
      ));

      const scopes = listChangedFilesPR(200, [
        {filename: 'README.md', sha: '1234'},
        {filename: '.github/readme/synth.metadata/synth.metadata', sha: '1234'},
      ]);

      const prMatchesConfig = await checkPR.checkPRAgainstConfig(
        validPR,
        pr,
        octokit
      );
      scopes.done();
      assert.ok(prMatchesConfig);
    });
  });

  describe('additional validation checks', async () => {
    it('should correctly identify and pass a PR that requires additional validation with a release process', async () => {
      const validPR = yaml.load(
        fs.readFileSync(
          resolve(fixturesPath, 'config', 'valid-schemas', 'valid-schema4.yml'),
          'utf8'
        )
      ) as {rules: ValidPr[]};

      const pr = require(resolve(
        fixturesPath,
        'events',
        'pull_request_opened_special_validation'
      ));

      const scopes = listChangedFilesPR(200, [
        {
          filename: 'package.json',
          sha: '1234',
          patch:
            '@@ -1,7 +1,7 @@\n' +
            ' {\n' +
            '   "name": "@google-cloud/kms",\n' +
            '   "description": "Google Cloud Key Management Service (KMS) API client for Node.js",\n' +
            '-  "version": "2.3.0",\n' +
            '+  "version": "2.3.1",\n' +
            '   "license": "Apache-2.0",\n' +
            '   "author": "Google LLC",\n' +
            '   "engines": {',
          changes: 2,
          additions: 1,
          deletions: 1,
        },
        {filename: 'CHANGELOG.md', sha: '1234'},
        {filename: 'samples/package.json', sha: '1234'},
      ]);

      const prMatchesConfig = await checkPR.checkPRAgainstConfig(
        validPR,
        pr,
        octokit
      );

      scopes.done();
      assert.ok(prMatchesConfig);
    });

    it('should correctly identify and pass a PR that requires additional validation with a dependency process', async () => {
      const validPR = yaml.load(
        fs.readFileSync(
          resolve(fixturesPath, 'config', 'valid-schemas', 'valid-schema5.yml'),
          'utf8'
        )
      ) as {rules: ValidPr[]};

      const pr = require(resolve(
        fixturesPath,
        'events',
        'pull_request_opened_special_validation_dependency_update'
      ));

      const scopes = listChangedFilesPR(200, [
        {
          filename: 'package.json',
          sha: '1234',
          patch:
            '@@ -1,7 +1,7 @@\n' +
            ' {\n' +
            '   "name": "@google-cloud/kms",\n' +
            '   "description": "Google Cloud Key Management Service (KMS) API client for Node.js",\n' +
            '-  "@octokit/auth-app": "2.3.0",\n' +
            '+  "@octokit/auth-app": "2.3.1",\n' +
            '   "license": "Apache-2.0",\n' +
            '   "author": "Google LLC",\n' +
            '   "engines": {',
          changes: 2,
          additions: 1,
          deletions: 1,
        },
      ]);

      const prMatchesConfig = await checkPR.checkPRAgainstConfig(
        validPR,
        pr,
        octokit
      );

      scopes.done();
      assert.ok(prMatchesConfig);
    });

    it('should correctly identify and pass a PR that requires additional validation with a dependency process for multiple files', async () => {
      const validPR = yaml.load(
        fs.readFileSync(
          resolve(fixturesPath, 'config', 'valid-schemas', 'valid-schema5.yml'),
          'utf8'
        )
      ) as {rules: ValidPr[]};

      const pr = require(resolve(
        fixturesPath,
        'events',
        'pull_request_opened_special_validation_dependency_update'
      ));

      const scopes = listChangedFilesPR(200, [
        {
          filename: 'package.json',
          sha: '1234',
          patch:
            '@@ -1,7 +1,7 @@\n' +
            ' {\n' +
            '   "name": "@google-cloud/kms",\n' +
            '   "description": "Google Cloud Key Management Service (KMS) API client for Node.js",\n' +
            '-  "@octokit/auth-app": "2.3.0",\n' +
            '+  "@octokit/auth-app": "2.3.1",\n' +
            '   "license": "Apache-2.0",\n' +
            '   "author": "Google LLC",\n' +
            '   "engines": {',
          changes: 2,
          additions: 1,
          deletions: 1,
        },
        {
          filename: 'samples/package.json',
          sha: '1234',
          patch:
            '@@ -1,7 +1,7 @@\n' +
            ' {\n' +
            '   "name": "@google-cloud/kms",\n' +
            '   "description": "Google Cloud Key Management Service (KMS) API client for Node.js",\n' +
            '-  "@octokit/auth-app": "2.3.0",\n' +
            '+  "@octokit/auth-app": "2.3.1",\n' +
            '   "license": "Apache-2.0",\n' +
            '   "author": "Google LLC",\n' +
            '   "engines": {',
          changes: 2,
          additions: 1,
          deletions: 1,
        },
      ]);

      const prMatchesConfig = await checkPR.checkPRAgainstConfig(
        validPR,
        pr,
        octokit
      );

      scopes.done();
      assert.ok(prMatchesConfig);
    });

    it('should fail a PR that requires additional validation with a dependency process for multiple files that do not all conform to the rules', async () => {
      const validPR = yaml.load(
        fs.readFileSync(
          resolve(fixturesPath, 'config', 'valid-schemas', 'valid-schema5.yml'),
          'utf8'
        )
      ) as {rules: ValidPr[]};

      const pr = require(resolve(
        fixturesPath,
        'events',
        'pull_request_opened_special_validation_dependency_update'
      ));

      const scopes = listChangedFilesPR(200, [
        {
          filename: 'package.json',
          sha: '1234',
          patch:
            '@@ -1,7 +1,7 @@\n' +
            ' {\n' +
            '   "name": "@google-cloud/kms",\n' +
            '   "description": "Google Cloud Key Management Service (KMS) API client for Node.js",\n' +
            '-  "@the-wrong-dependency!": "2.3.0",\n' +
            '+  "@the-wrong-dependency!": "2.3.1",\n' +
            '   "license": "Apache-2.0",\n' +
            '   "author": "Google LLC",\n' +
            '   "engines": {',
          changes: 2,
          additions: 1,
          deletions: 1,
        },
        {
          filename: 'samples/package.json',
          sha: '1234',
          patch:
            '@@ -1,7 +1,7 @@\n' +
            ' {\n' +
            '   "name": "@google-cloud/kms",\n' +
            '   "description": "Google Cloud Key Management Service (KMS) API client for Node.js",\n' +
            '-  "@octokit/auth-app": "2.3.0",\n' +
            '+  "@octokit/auth-app": "2.3.1",\n' +
            '   "license": "Apache-2.0",\n' +
            '   "author": "Google LLC",\n' +
            '   "engines": {',
          changes: 2,
          additions: 1,
          deletions: 1,
        },
      ]);

      const prMatchesConfig = await checkPR.checkPRAgainstConfig(
        validPR,
        pr,
        octokit
      );

      scopes.done();
      assert.strictEqual(prMatchesConfig, false);
    });

    it('should fail a renovate-bot PR that requires additional validation rules without having all files conform to rules', async () => {
      const validPR = yaml.load(
        fs.readFileSync(
          resolve(fixturesPath, 'config', 'valid-schemas', 'valid-schema5.yml'),
          'utf8'
        )
      ) as {rules: ValidPr[]};

      const pr = require(resolve(
        fixturesPath,
        'events',
        'pull_request_opened_special_validation_dependency_update'
      ));

      const scopes = listChangedFilesPR(200, [
        {
          filename: 'package.json',
          sha: '1234',
          patch:
            '@@ -1,7 +1,7 @@\n' +
            ' {\n' +
            '   "name": "@google-cloud/kms",\n' +
            '   "description": "Google Cloud Key Management Service (KMS) API client for Node.js",\n' +
            '-  "@octokit/auth-app": "2.3.0",\n' +
            '+  "@octokit/auth-app": "2.3.1",\n' +
            '   "license": "Apache-2.0",\n' +
            '   "author": "Google LLC",\n' +
            '   "engines": {',
          changes: 2,
          additions: 1,
          deletions: 1,
        },
        {
          filename: 'repo/MaliciousFolder/package.json',
          sha: '1234',
          patch: 'malicious code',
          changes: 2,
          additions: 1,
          deletions: 1,
        },
      ]);

      const prMatchesConfig = await checkPR.checkPRAgainstConfig(
        validPR,
        pr,
        octokit
      );

      scopes.done();
      assert.strictEqual(prMatchesConfig, false);
    });
  });

  describe('additional validation checks for Java', async () => {
    it('should correctly identify and pass a Java PR', async () => {
      const validPR = yaml.load(
        fs.readFileSync(
          resolve(fixturesPath, 'config', 'valid-schemas', 'valid-schema6.yml'),
          'utf8'
        )
      ) as {rules: ValidPr[]};

      const pr = require(resolve(
        fixturesPath,
        'events',
        'pull_request_opened_special_validation_dependency_update_java'
      ));

      const scopes = listChangedFilesPR(200, [
        {
          sha: '21605df5d70e3a374e168e31a0d8c96902e3d039',
          filename: 'datacatalog/quickstart/pom.xml',
          additions: 1,
          deletions: 1,
          changes: 2,
          patch:
            '@@ -39,7 +39,7 @@\n' +
            '         <dependency>\n' +
            '             <groupId>com.google.cloud</groupId>\n' +
            '             <artifactId>google-cloud-datacatalog</artifactId>\n' +
            '-            <version>1.4.1</version>\n' +
            '+            <version>1.4.2</version>\n' +
            '         </dependency>\n' +
            ' \n' +
            '         <!-- Test dependencies -->',
        },
      ]);

      const prMatchesConfig = await checkPR.checkPRAgainstConfig(
        validPR,
        pr,
        octokit
      );

      scopes.done();
      assert.ok(prMatchesConfig);
    });

    it('should correctly identify and pass a Java PR with rev', async () => {
      const validPR = yaml.load(
        fs.readFileSync(
          resolve(fixturesPath, 'config', 'valid-schemas', 'valid-schema6.yml'),
          'utf8'
        )
      ) as {rules: ValidPr[]};

      const pr = require(resolve(
        fixturesPath,
        'events',
        'pull_request_opened_special_validation_dependency_update_java'
      ));

      const scopes = listChangedFilesPR(200, [
        {
          sha: '1349c83bf3c20b102da7ce85ebd384e0822354f3',
          filename: 'iam/api-client/pom.xml',
          additions: 1,
          deletions: 1,
          changes: 2,
          patch:
            '@@ -71,7 +71,7 @@\n' +
            '     <dependency>\n' +
            '       <groupId>com.google.cloud</groupId>\n' +
            '       <artifactId>google-cloud-datacatalog</artifactId>\n' +
            '-      <version>v1-rev20210319-1.31.5</version>\n' +
            '+      <version>v1-rev20210319-1.32.1</version>\n' +
            '     </dependency>\n',
        },
      ]);

      const prMatchesConfig = await checkPR.checkPRAgainstConfig(
        validPR,
        pr,
        octokit
      );

      scopes.done();
      assert.ok(prMatchesConfig);
    });
  });
});
