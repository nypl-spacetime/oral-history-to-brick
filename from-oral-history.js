#!/usr/bin/env node

var argv = require('minimist')(process.argv.slice(2), {
  alias: {
    o: 'output'
  }
})

const fs = require('fs')
const path = require('path')
const R = require('ramda')
const H = require('highland')
const csv = require('csv-parser')

if (!argv._ || argv._.length !== 1) {
  console.error('Please specify location of Oral History CSV dump')
  process.exit(1)
}

const filename = argv._[0]
var stream = fs.createReadStream(filename, 'utf8')
  .pipe(csv())

const PROVIDER = 'nypl-oral-history'

var collectionsById = {}
var collectionsByIdNotFound = {}
const collections = require('./data/collections.json')
collections.forEach((collection) => {
  collectionsById[collection.id] = collection
})

String.prototype.replaceAll = function(search, replacement) {
  var target = this
  return target.replace(new RegExp(search, 'g'), replacement)
}

const dashCollection = (row) => Object.assign(row, {
  collection: row.collection.replaceAll(' ', '-')
})

H(stream)
  .filter((row) => row.type === 'annotation')
  .map(dashCollection)
  .map((row) => ({
    provider: PROVIDER,
    id: row.id,
    title: row.text,
    url: row.url,
    image_urls: [],
    meta: {
      startMs: row.start,
      endMs: row.end,
      audioUrl: row.audio_url
    },
    collection_id: row.collection
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