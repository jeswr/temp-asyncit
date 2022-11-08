// TODO: Have a custom implementation of https://github.com/Borewit/readable-web-to-node-stream/blob/master/lib/index.ts

import { end } from "./src/emitters";
import { AsyncIterator } from "./src/iterators/AsyncIterator";
import { RdfaParser } from 'rdfa-streaming-parser';

const decoder = new TextDecoder();

const streamDecoder = new TextDecoderStream();

decoder.decode

// async function main() {
//   let t = Date.now()

//   fetch('https://www.rubensworks.net/')
//     .then(res => {
//       const reader = res.body?.getReader();

//       let i = 0;


//       function runRead() {
//         reader?.read().then(value => {
//           if (value.done) {
//             console.log('done!', Date.now() - t)
//           } else {
//             console.log(i++, Date.now() - t);
//             decoder.decode(value.value);
//             runRead();
//           }
//         })
//       }

//       setTimeout(() => {
//         runRead();
//       }, 5000);
//     });
// }


// main();

export class ReadableWebToAsyncIterator extends AsyncIterator<Uint8Array> {
  private reader: ReadableStreamDefaultReader<Uint8Array>;
  private chunk: Uint8Array | null = null;
  private ending = false;

  constructor(stream: ReadableStream) {
    super();
    this.reader = stream.getReader();
    this.load();
  }

  load() {
    this.reader
      .read()
      .then(value => {
        if (value.done) {
          this.ending = true;
          this.readable = !this.done;
        }
        else {
          // TODO: Check we can assume value is defined
          this.chunk = value.value!;
          this.readable = true;
        }


        // if (value.value) {
        //   this.chunk = value.value;
        //   this.readable = true;
        // }
        // else {
        //   throw new Error('Expected value when not done');
        // }
      });
  }

  read(): Uint8Array | null {
    const { chunk } = this;
    if (chunk === null) {

      if (this.ending) {
        end.call(this);
      } else {
        this.readable = false;
      }

    } else {
      this.chunk = null;
      this.load();
    }

    return chunk;
  }
}


function createMap() {
  const htmlParseListener = new RdfaParser({ baseIRI: 'https://www.rubensworks.net/', profile: 'xhtml' });

  return (data: string) => {
    htmlParseListener.onText(data);
  };
}


async function m() {
  const m = await fetch('https://www.rubensworks.net/');


  

  const it = new ReadableWebToAsyncIterator(m.body!)
    .map(d => decoder.decode(d));

  it.on('data', d => {
    console.log(d)
  })

  it.on('end', () => {
    console.log('end')
  })
}

m();
