#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2), {
  alias: {
    o: 'output'
  }
})

const fs = require('fs')
const H = require('highland')
const csv = require('csv-parser')

if (!argv._ || argv._.length !== 1) {
  console.error('Please specify location of Oral History CSV dump')
  process.exit(1)
}

const filename = argv._[0]
var stream = fs.createReadStream(filename, 'utf8')
  .pipe(csv())

var collectionsById = {}
var collectionsByIdNotFound = {}
const collections = require('./data/collections.json')
collections.forEach((collection) => {
  collectionsById[collection.id] = collection
})

const replaceAll = (str, search, replacement) => str.replace(new RegExp(search, 'g'), replacement)

const dashCollection = (row) => Object.assign(row, {
  collection: replaceAll(row.collection, ' ', '-')
})

H(stream)
  .filter((row) => row.type === 'annotation')
  .map(dashCollection)
  .map((row) => ({
    collection_id: row.collection,
    id: row.id,
    data: {
      text: row.text,
      url: row.url,
      startMs: parseInt(row.start),
      endMs: parseInt(row.end),
      audioUrl: row.audio_url
    }
  }))
  .map((row) => {
    const collectionId = row.collection_id
    if (!collectionsById[collectionId] && !collectionsByIdNotFound[collectionId]) {
      console.error(`Collection not found: '${collectionId}'`)
      collectionsByIdNotFound[collectionId] = collectionId
    }

    return row
  })
  .map(JSON.stringify)
  .intersperse('\n')
  .pipe(argv.o ? fs.createWriteStream(argv.o, 'utf8') : process.stdout)
