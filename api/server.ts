import express from 'express'
import cors from 'cors'
import { fetchContributions, Level } from './fetchContributions'

const app = express()

app.use(cors())

app.get('/', (_req, res) => {
  res.send(
    `<p>Welcome to the Week based GitHub contributions API!. Please visit <b>/username?weeks=x</b></p>
     <p>Example: <a href="/harryhighpants?weeks=2">/harryhighpants?weeks=2</a></p>`,
  )
})

type Request = express.Request<
  { username: string },
  Level[] | { error: string },
  {},
  { weeks?: string }
>
app.get('/:username', async (req: Request, res) => {
  const { username } = req.params
  const { weeks } = req.query

  if (!weeks || !parseInt(weeks)) {
    return res.status(400).send({
      error: "Query parameter 'weeks' must be an integer.",
    })
  }

  try {
    const levels = await fetchContributions(username, parseInt(weeks))
    return res.json(levels)
  } catch (error: any) {
    return res
      .status(500)
      .send({ error: error.message ?? 'Internal Server Error' })
  }
})

const server = app.listen(process.env.PORT ?? 8080, () =>
  console.log(
    `Server listening on http://localhost:${process.env.PORT || 8080}`,
  ),
)

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('SIGTERM - HTTP server closed')
  })
})
