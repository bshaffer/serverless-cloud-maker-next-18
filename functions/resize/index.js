// Copyright 2018 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const helpers = require('../helpers');
const decorator = require('../decorator');

const applyResize = (inFile, outFile, {width, height}) => {
    return helpers.resolveImageMagickConvert([
        inFile,
        '-resize',
        `${width}x${height}!`,
        outFile,
    ]);
};

const resizeTransform = decorator(applyResize);

resizeTransform.parameters = {
    outputBucketName: {
        defaultValue: null,
    },
    outputPrefix: {
        defaultValue: 'resized',
    },
    width: {
        defaultValue: 200,
        validate: (w) => !isNaN(w) && Number.isInteger(Number(w)),
    },
    height: {
        defaultValue: 200,
        validate: (h) => !isNaN(h) && Number.isInteger(Number(h)),
    },
};

resizeTransform.applyResize = applyResize;

module.exports = resizeTransform;
