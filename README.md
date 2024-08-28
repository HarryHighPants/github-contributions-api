# Minimal GitHub Contributions API

![CI](https://github.com/grubersjoe/github-contributions-api/actions/workflows/test.yml/badge.svg)

An API that returns minimal GitHub contributions data for a user.

## How to run

```shell
npm install
npm start
```

For development:

```shell
npm run dev
```

## Usage

Send a GET request to the API in the following format:

```shell
https://contributions-api.harryab.com/GITHUB_USERNAME?weeks=2
```

And you will receive an array of the contribution levels over that time:

```json
[0, 1, 3, 0, 0, 1, 0, 0, 1, 3, 0, 0, 1, 0]
```

```typescript
type Level = 0 | 1 | 2 | 3 | 4
export type Response = Level[]
```

The original API repo fetches much more detailed info
