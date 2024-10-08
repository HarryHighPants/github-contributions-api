import { fromURL } from 'cheerio'

import { Element } from 'domhandler'

// -1 is padded days that haven't occured this week
type Level = -1 | 0 | 1 | 2 | 3 | 4
export type Response = Level[]

const requestOptions = (username: string) =>
  ({
    method: 'GET',
    headers: {
      referer: `https://github.com/${username}`,
      'x-requested-with': 'XMLHttpRequest',
    },
  }) as const

/**
 * @throws Error if scraping of GitHub profile fails
 */
export async function scrapeContributions(
  username: string,
  weeks: number,
): Promise<Response> {
  const url = `https://github.com/users/${username}/contributions`
  const $ = await fromURL(url, { requestOptions: requestOptions(username) })

  const days = $('.js-calendar-graph-table .ContributionCalendar-day')
  const sortedDays = days.get().sort((a, b) => {
    const dateA = a.attribs['data-date'] ?? ''
    const dateB = b.attribs['data-date'] ?? ''

    return dateA.localeCompare(dateB, 'en')
  })

  // Pad the days left in the week to make sure we have full weeks
  // E.g if today is Thursday, we need to pad 2 days so that the last item in the array is always a Saturday
  // Sun, Mon, Tues, Wed, Thurs, Fri, Sat
  const today = new Date(sortedDays[sortedDays.length - 1].attribs['data-date'])
  const daysToPad = 6 - today.getDay()
  const relevantDays = sortedDays.slice(-weeks * 7 + daysToPad)
  var parsedDays = relevantDays.map((day) => parseDay(day))
  parsedDays.push(...Array(daysToPad).fill(-1))

  return parsedDays
}

const parseDay = (day: Element) => {
  const dataLevel = day.attribs['data-level']

  if (!dataLevel) {
    throw Error('Unable to parse contribution level attribute.')
  }
  const level = parseInt(dataLevel) as Level

  if (isNaN(level)) {
    throw Error('Unable to parse contribution level.')
  }
  return level
}

export class UserNotFoundError extends Error {
  constructor(username: string) {
    super(`User "${username}" not found.`)
  }
}
