export interface ICastHeader {
  version: number
  width: number
  height: number,
  duration: number
}

export interface ICastEvent {
  time: number
  type: string
  data: string
}

export interface ICastObject {
  header: ICastHeader
  events: ICastEvent[]
}

export interface ICastParser {
  parse(text: string): ICastObject
}

export class AsciinemaCastParser implements ICastParser {
  public parse(text: string): ICastObject {
    try {
      return new AsciinemaCastV1Parser().parse(text)
    } catch (err) {
      return new AsciinemaCastV2Parser().parse(text)
    }
  }
}

/**
 * Asciinema cast v1 parser
 * https://github.com/asciinema/asciinema/blob/master/doc/asciicast-v1.md
 */
// tslint:disable-next-line: max-classes-per-file
export class AsciinemaCastV1Parser implements ICastParser {
  public parse(text: string): ICastObject {
    const j = JSON.parse(text)
    const stdouts: Array<[number, string]> = j.stdout

    let timestamp = 0.0
    const events = stdouts.map((e: [number, string]) => {
      timestamp += e[0]
      return {
        time: timestamp,
        type: 'o',
        data: e[1]
      }
    })

    return {
      header: {
        version: 1,
        width: j.width,
        height: j.height,
        duration: j.duration
      },
      events
    }
  }
}

/**
 * Asciinema cast v2 parser
 * https://github.com/asciinema/asciinema/blob/master/doc/asciicast-v2.md
 */
// tslint:disable-next-line: max-classes-per-file
export class AsciinemaCastV2Parser implements ICastParser {
  public parse(text: string): ICastObject {
    const lines = text.trim().split('\n').filter(txt => txt)

    if (lines.length) {
      const header = JSON.parse(lines[0])
      const events = lines.slice(1)

      const cast: ICastObject = {
        header,
        events: events.map(e => {
          const j = JSON.parse(e)
          return {
            time: j[0],
            type: j[1],
            data: j[2]
          }
        })
      }

      cast.header.duration = cast.events[cast.events.length - 1].time

      return cast
    } else {
      throw new Error('Invalid cast format')
    }
  }
}
