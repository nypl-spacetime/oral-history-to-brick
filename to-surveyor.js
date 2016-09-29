#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const H = require('highland')

const surveyorDb = require('to-surveyor')

const PROVIDER = 'nypl'
const DATA_DIR = path.join(__dirname, 'data')

const collections = require(path.join(DATA_DIR, 'collections.json'))
  .map((collection) => Object.assign({
    provider: PROVIDER,
    submissions_needed: 1,
    tasks: [
      'geotag-text'
    ]
  }, collection))

surveyorDb.addCollections(collections, (err) => {
  if (err) {
    console.error(`Error adding collections: ${err.message}`)
  } else {
    console.log(`Done adding ${collections.length} collections`)
      H(fs.createReadStream(path.join(DATA_DIR, 'items.ndjson')))
        .split()
        .compact()
        .map(JSON.parse)
        .map((item) => Object.assign({
          provider: PROVIDER
        }, item))
        .toArray((items) => {
          surveyorDb.addItems(items, (err) => {
            if (err) {
              console.error(`Error adding items: ${err.message}`)
            } else {
              console.log(`Done adding ${items.length} items`)
            }
          })
        })
  }
})
