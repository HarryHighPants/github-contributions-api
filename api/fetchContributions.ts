export interface GitHubApiJson<Data> {
  data?: Data
  message?: string
  errors?: { type: string; message: string }[]
}
export interface ContributionCalendarResult {
  user: {
    contributionsCollection: {
      contributionCalendar: {
        weeks: {
          days: ContributionDay[]
        }[]
      }
    }
  }
}
export interface ContributionDay {
  contributionLevel: `${ContributionLevel}`
}
export const enum ContributionLevel {
  Null = 'Null',
  NONE = 'NONE',
  FIRST_QUARTILE = 'FIRST_QUARTILE',
  SECOND_QUARTILE = 'SECOND_QUARTILE',
  THIRD_QUARTILE = 'THIRD_QUARTILE',
  FOURTH_QUARTILE = 'FOURTH_QUARTILE',
}

// -1 is padded days that haven't occured this week
export type Level = -1 | 0 | 1 | 2 | 3 | 4

const GITHUB_ACCESS_TOKEN = process.env.GITHUB_ACCESS_TOKEN
const GITHUB_GRAPHQL_API_URL = 'https://api.github.com/graphql'

export async function fetchContributions(
  username: string,
  weeks: number,
): Promise<Level[]> {
  const currentDate = new Date()
  const daysToPad = 6 - currentDate.getDay()
  const fromDate = new Date(
    new Date().setDate(new Date().getDate() - 7 * weeks + daysToPad + 1),
  )
  console.log(fromDate)
  const query = `
        {
          user(login: "${username}") {
            contributionsCollection(from: "${fromDate.toISOString()}", to: "${new Date().toISOString()}") {
              contributionCalendar {
                total: totalContributions
                weeks {
                  days: contributionDays {
                    date
                    contributionLevel
                    weekday
                    contributionCount
                  }
                }
              }
            }
          }
        }
      `

  const res = await fetch(GITHUB_GRAPHQL_API_URL, {
    method: 'POST',
    body: JSON.stringify({
      query,
    }),
    headers: {
      Authorization: `Bearer ${GITHUB_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    throw new Error(`fetch error: ${res.statusText}.`)
  }
  const resJson =
    (await res.json()) as GitHubApiJson<ContributionCalendarResult>

  if (!resJson.data?.user) {
    throw new Error(resJson.message)
  }
  const days =
    resJson.data.user.contributionsCollection.contributionCalendar.weeks.flatMap(
      (w) => w.days,
    )

  console.log(days)
  const levels = days.map((day) => getDayLevel(day))
  levels.push(...Array(daysToPad).fill(-1))
  console.log(levels)
  return levels
}

const getDayLevel = (day: ContributionDay): Level => {
  switch (day.contributionLevel) {
    case ContributionLevel.Null:
      return -1
    case ContributionLevel.NONE:
      return -0
    case ContributionLevel.FIRST_QUARTILE:
      return 1
    case ContributionLevel.SECOND_QUARTILE:
      return 2
    case ContributionLevel.THIRD_QUARTILE:
      return 3
    case ContributionLevel.FOURTH_QUARTILE:
      return 4
  }
  return -1
}
