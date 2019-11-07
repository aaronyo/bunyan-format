// When in heroku, we there are a variety of fields we ignore because heroku
// adds them (e.g. time, host name).
//
// Additionally, we want all messages to be on a single line so that they are
// easy to filter with papertrail.
//

import chalk from 'chalk';
import fp from 'lodash/fp';
import readline from 'readline';

// Forcecolors enabled even when not logging to tty. This makes colors show
// up in papertrail.
chalk.enabled = true;
chalk.level = 16;

function levelName(level: number) {
  return ({
    10: 'TRACE',
    20: 'DEBUG',
    30: ' INFO',
    40: ' WARN',
    50: 'ERROR',
    60: 'FATAL',
  } as any)[level];
}

const ignoredFields = ['name', 'hostname', 'pid', 'time', 'v'];

function formatLine(line: string) {
  const json = JSON.parse(line);
  const dataFields = fp.omit(ignoredFields, json);
  const dataStr = !fp.isEmpty(fp.omit(['reqId'], dataFields))
    ? JSON.stringify(dataFields)
    : null;
  const message = !fp.isEmpty(json.msg)
    ? `${levelName(json.level)}: ` +
      json.msg +
      (json.reqId ? ' reqId=' + json.reqId : '')
    : null;
  return fp.compose(
    fp.join('\n'),
    fp.reject(fp.isEmpty),
  )([
    message,
    json.err
      ? '# Error stack: ' + fp.join('\n#', fp.split('\n', json.err.stack))
      : '',
    dataStr ? '       ' + chalk.cyan('[json] ' + dataStr) : '',
  ]);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', (line: string) => {
  try {
    console.log(formatLine(line));
  } catch (e) {
    console.log(chalk.cyan('> ' + line));
  }
});
