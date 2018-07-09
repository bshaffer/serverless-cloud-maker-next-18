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


// Contains helpful methods that are shared by various functions.
const path = require('path');
const im = require('imagemagick')


const annotationToShape = (annotation, shape) => {
    const vertices = annotation.boundingPoly.vertices  

    const xValues = vertices.map((vertex) => vertex.x)
    const yValues = vertices.map((vertex) => vertex.y)

    const xMax = Math.max(...xValues)
    const xMin = Math.min(...xValues)

    const yMax = Math.max(...yValues)
    const yMin = Math.min(...yValues)

    const width = xMax - xMin
    const height = yMax - yMin

    if (shape == 'square') {
        const difference = Math.abs(width - height)
        const delta = Math.round(difference / 2)
        if (width > height) {
            return `${width - difference}x${height}+${xMin + delta}+${yMin}`
        }

        if (height > width) {
            return `${width}x${height - difference}+${xMin}+${yMin + delta}`
        }
    }

    if (shape == 'circle') {
        const difference = Math.abs(width - height)
        const delta = Math.round(difference / 2)
        if (width > height) {
            const newWidth = width - difference
            const newXMin = xMin + delta

            const radius = Math.round(newWidth / 2)

            const centerX = newXMin + radius
            const centerY = yMin + radius

            return `circle ${centerX},${centerY} ${newXMin},${centerY}`
        }

        if (height > width) {
            const newHeight = height - difference
            const newYMin = yMin + delta

            const radius = Math.round(newHeight / 2)

            const centerX = xMin + radius
            const centerY = newYMin + radius

            return `circle ${centerX},${centerY} ${xMin},${centerY}`
        }
    }

    return `${width}x${height}+${xMin}+${yMin}`
}

const annotationToPolygon = (annotation) =>
    annotation
        .boundingPoly
        .vertices
        .map(({x, y}) => [x, y].join(','))
        .join(' ')

const annotationsToPolygons = (annotations) =>
    annotations
        .map(annotationToPolygon)
        .map((polygon) => `polygon ${polygon}`)
        .join(' ')

const annotationToCoordinate = (annotation) => {
    const vertices = annotation.boundingPoly.vertices
    const xValues = vertices.map((vertex) => vertex.x)
    const yValues = vertices.map((vertex) => vertex.y)

    const xMax = Math.max(...xValues)
    const xMin = Math.min(...xValues)

    const yMax = Math.max(...yValues)
    const yMin = Math.min(...yValues)

    return `+${xMin}+${yMin}`
}

const annotationToDimensions = (annotation) => {
    const vertices = annotation.boundingPoly.vertices
    const xValues = vertices.map((vertex) => vertex.x)
    const yValues = vertices.map((vertex) => vertex.y)

    const xMax = Math.max(...xValues)
    const xMin = Math.min(...xValues)

    const yMax = Math.max(...yValues)
    const yMin = Math.min(...yValues)

    const width = xMax - xMin
    const height = yMax - yMin

    return `${width}x${height}`
}


// creates a the name of the file to be used for the
// result of the function. Must be distrinct from the
// input file name
const createOutputFileName = (fileName, {outputPrefix = '', extension = ''} = {}) =>
    changeExtension(
        outputPrefix
            // if a prefix was specified use that
            ? `${outputPrefix}-${path.parse(fileName).base}`
            // otherwise append .out
            : `${path.parse(fileName).base}.out`
        , extension
    )

const createTempFileName = (fileName) => `/tmp/${path.parse(fileName).base}`

const changeExtension = (fileName, extension) =>
    extension
    ? fileName.substr(0, fileName.lastIndexOf('.')) + extension
    : fileName

// Accept an array of arguments to be passed to imagemagick's convert method
// and return a promise the resolves when the transformation is complete.
const resolveImageMagickCommand = (cmd, args) =>
    new Promise(
        (resolve, reject) =>
            cmd(args, (err, result) => {
                if (err) {
                    console.error('ImageMagick command failed for arguments', args, err);
                    reject(err);
                    return
                } else {
                    console.log('ImageMagick command was successful.', args)
                    resolve(result)
                }
            })
    )

const resolveImageMagickIdentify = (args) =>
    resolveImageMagickCommand(im.identify, args)

const resolveImageMagickConvert = (args) =>
    resolveImageMagickCommand(im.convert, args)

// blur all of the polygons in an image
const blurPolygons = (inFile, outFile, {polygons}) =>
    resolveImageMagickConvert([
        inFile,
        '\(',
        '-clone', '0', '-fill', 'white', '-colorize', '100', '-fill', 'black',
        '-draw', polygons,
        '-alpha', 'off', '-write', 'mpr:mask', '+delete',
        '\)',
        '-mask', 'mpr:mask', '-blur', '0x5', '+mask', outFile,
    ])

// blur all of the polygons in an image and soften the edges
const softBlurPolygons = (inFile, outFile, {polygons}) =>
    resolveImageMagickConvert([
        inFile,
        '\(',
        '-clone', '0', '-fill', 'white', '-colorize', '100', '-fill', 'black',
        '-draw', polygons,
        '-alpha', 'off',
            // adding these two flags softens the edges
            '-blur', '0x5',
        '-write', 'mpr:mask', '+delete',
        '\)',
        '-mask', 'mpr:mask', '-blur', '0x5', '+mask', outFile,
    ])

module.exports = {
    // ImageMagick helpers
    resolveImageMagickConvert,
    resolveImageMagickIdentify,
    resolveImageMagickCommand,

    // ImageMagick commands to maniupulate polygons
    blurPolygons,
    softBlurPolygons,

    // helpers to manipulate file names
    createOutputFileName,
    createTempFileName,
    changeExtension,

    // helpers with annotatons from the Vision API
    annotationToPolygon,
    annotationsToPolygons,
    annotationToCoordinate,
    annotationToDimensions,
    annotationToShape,
}


