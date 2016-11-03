#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const H = require('highland')

const brickDb = require('to-brick')

const ORGANIZATION_ID = 'nypl'
const DATA_DIR = path.join(__dirname, 'data')

const TASKS = [
  {
    id: 'geotag-text',
    submissionsNeeded: 2
  }
]

const collections = require(path.join(DATA_DIR, 'collections.json'))
  .map((collection) => ({
    organization_id: ORGANIZATION_ID,
    tasks: TASKS,
    id: collection.id,
    title: collection.title,
    url: collection.url
  }))


H(fs.createReadStream(path.join(DATA_DIR, 'items.ndjson')))
  .split()
  .compact()
  .map(JSON.parse)
  .map((item) => Object.assign({
    organization_id: ORGANIZATION_ID
  }, item))
  .toArray((items) => {
    const tasks = TASKS
      .map((task) => ({
        id: task.id
      }))

    brickDb.addAll(tasks, collections, items, true)
  })
