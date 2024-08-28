import express, { ErrorRequestHandler } from 'express'
import cors from 'cors'
import compression from 'compression'

import {
  Response as ApiResponse,
  scrapeContributions,
  UserNotFoundError,
} from './scrape'

export interface ParsedQuery {
  weeks: number
}

interface Params {
  username: string
}

interface QueryParams {
  weeks?: string
}

type Request = express.Request<
  Params,
  ApiResponse | { error: string },
  {},
  QueryParams
>

const app = express()

app.use(cors())
app.use(compression())

app.get('/', (_req, res) => {
  res.send(
    '<p>Welcome to the Week based GitHub contributions API!. Please visit <b>/:username?weeks=x</b></p>',
  )
})

app.get('/:username', async (req: Request, res, next) => {
  const { username } = req.params
  const { weeks } = req.query

  if (!weeks) {
    return res.status(400).send({
      error: "Query parameter 'weeks' must be an integer.",
    })
  }

  try {
    const response = await scrapeContributions(username, parseInt(weeks))
    return res.json(response)
  } catch (error) {
    if (error instanceof UserNotFoundError) {
      return res.status(404).send({
        error: error.message,
      })
    }

    next(
      new Error(
        `Error scraping contribution data of '${username}': ${
          error instanceof Error ? error.message : 'Unknown error.'
        }`,
      ),
    )
  }
})

const errorHandler: ErrorRequestHandler = (error, _req, res, next) => {
  console.error(error)
  res.status(500).json({
    error: error.message,
  })
  next()
}

// This needs to be last to override the default Express.js error handler!
// The order of middleware does matter.
app.use(errorHandler)

export default app
