type Encode = (value: string) => string;
type Decode = (value: string) => string;
type Token = string | Key;
type Match<P extends ParamData> = false | MatchResult<P>;
type MatchFunction<P extends ParamData> = ((path: string) => Match<P>) & { re: RegExp };
type ParamData = Partial<Record<string, string | string[]>>;
type TokenType =
  | '{'
  | '}'
  | ';'
  | '*'
  | '+'
  | '?'
  | 'NAME'
  | 'PATTERN'
  | 'CHAR'
  | 'ESCAPED'
  | 'END'
  // Reserved for use.
  | '!'
  | '@'
  | ',';

interface ParseOptions {
  delimiter?: string;
  encodePath?: Encode;
}

interface PathOptions {
  sensitive?: boolean;
}

interface MatchOptions extends PathOptions {
  decode?: Decode | false;
  end?: boolean;
}

interface LexToken {
  type: TokenType;
  index: number;
  value: string;
}

interface MatchResult<P extends ParamData> {
  path: string;
  params: P;
}

interface Key {
  name: string;
  prefix?: string;
  suffix?: string;
  pattern?: string;
  modifier?: string;
  separator?: string;
}

const DEFAULT_DELIMITER = '/';
const ID_START = /^[$_\p{ID_Start}]$/u;
const ID_CONTINUE = /^[$\u200c\u200d\p{ID_Continue}]$/u;
const SIMPLE_TOKENS: Record<string, TokenType> = {
  '!': '!',
  '@': '@',
  ';': ';',
  ',': ',',
  '*': '*',
  '+': '+',
  '?': '?',
  '{': '{',
  '}': '}',
};

function NOOP_VALUE(value: string) {
  return value;
}

function isEnd(input: string, match: string) {
  return input.length === match.length;
}

function isDelimiterOrEnd(delimiter: string) {
  return (input: string, match: string) =>
    match.length === input.length || input.slice(match.length, match.length + delimiter.length) === delimiter;
}

function lexer(str: string) {
  const chars = [...str];
  const tokens: LexToken[] = [];
  let i = 0;

  while (i < chars.length) {
    const value = chars[i];
    const type = SIMPLE_TOKENS[value];

    if (type) {
      tokens.push({ type, index: i++, value });
      continue;
    }

    if (value === '\\') {
      tokens.push({ type: 'ESCAPED', index: i++, value: chars[i++] });
      continue;
    }

    if (value === ':') {
      let name = '';

      if (ID_START.test(chars[++i])) {
        name += chars[i];
        while (ID_CONTINUE.test(chars[++i])) {
          name += chars[i];
        }
      } else if (chars[i] === '"') {
        let pos = i;

        while (i < chars.length) {
          if (chars[++i] === '"') {
            i++;
            pos = 0;
            break;
          }

          if (chars[i] === '\\') {
            name += chars[++i];
          } else {
            name += chars[i];
          }
        }

        if (pos) {
          throw new TypeError(`Unterminated quote at ${pos}`);
        }
      }

      if (!name) {
        throw new TypeError(`Missing parameter name at ${i}`);
      }

      tokens.push({ type: 'NAME', index: i, value: name });
      continue;
    }

    if (value === '(') {
      const pos = i++;
      let count = 1;
      let pattern = '';

      if (chars[i] === '?') {
        throw new TypeError(`Pattern cannot start with "?" at ${i}`);
      }

      while (i < chars.length) {
        if (chars[i] === '\\') {
          pattern += chars[i++] + chars[i++];
          continue;
        }

        if (chars[i] === ')') {
          count--;
          if (count === 0) {
            i++;
            break;
          }
        } else if (chars[i] === '(') {
          count++;
          if (chars[i + 1] !== '?') {
            throw new TypeError(`Capturing groups are not allowed at ${i}`);
          }
        }

        pattern += chars[i++];
      }

      if (count) {
        throw new TypeError(`Unbalanced pattern at ${pos}`);
      }

      if (!pattern) {
        throw new TypeError(`Missing pattern at ${pos}`);
      }

      tokens.push({ type: 'PATTERN', index: i, value: pattern });
      continue;
    }

    if (value === ')') {
      throw new TypeError(`Unmatched ) at ${i}`);
    }

    tokens.push({ type: 'CHAR', index: i, value: chars[i++] });
  }

  tokens.push({ type: 'END', index: i, value: '' });

  return new Iter(tokens);
}

class Iter {
  index = 0;

  constructor(private tokens: LexToken[]) {}

  peek(): LexToken {
    return this.tokens[this.index];
  }

  tryConsume(type: LexToken['type']): string | undefined {
    const token = this.peek();
    if (token.type !== type) return;
    this.index++;
    return token.value;
  }

  consume(type: LexToken['type']): string {
    const value = this.tryConsume(type);
    if (value !== undefined) return value;
    const { type: nextType, index } = this.peek();
    throw new TypeError(`Unexpected ${nextType} at ${index}, expected ${type}`);
  }

  text(): string {
    let result = '';
    let value: string | undefined;
    while ((value = this.tryConsume('CHAR') || this.tryConsume('ESCAPED'))) {
      result += value;
    }
    return result;
  }

  modifier(): string | undefined {
    return this.tryConsume('?') || this.tryConsume('*') || this.tryConsume('+');
  }
}

class TokenData {
  constructor(
    public readonly tokens: Token[],
    public readonly delimiter: string,
  ) {}
}

function parse(str: string, options: ParseOptions = {}): TokenData {
  const { encodePath = NOOP_VALUE, delimiter = encodePath(DEFAULT_DELIMITER) } = options;
  const tokens: Token[] = [];
  const it = lexer(str);
  let key = 0;

  do {
    const path = it.text();
    if (path) tokens.push(encodePath(path));

    const name = it.tryConsume('NAME');
    const pattern = it.tryConsume('PATTERN');

    if (name || pattern) {
      tokens.push({
        name: name || String(key++),
        pattern,
      });

      const next = it.peek();
      if (next.type === '*') {
        throw new TypeError(`Unexpected * at ${next.index}, you probably want \`/*\` or \`{/:foo}*\``);
      }

      continue;
    }

    const asterisk = it.tryConsume('*');
    if (asterisk) {
      tokens.push({
        name: String(key++),
        pattern: `${negate(escape(delimiter))}*`,
        modifier: '*',
        separator: delimiter,
      });
      continue;
    }

    const open = it.tryConsume('{');
    if (open) {
      const prefix = it.text();
      const name = it.tryConsume('NAME');
      const pattern = it.tryConsume('PATTERN');
      const suffix = it.text();
      const separator = it.tryConsume(';') && it.text();

      it.consume('}');

      const modifier = it.modifier();

      tokens.push({
        name: name || (pattern ? String(key++) : ''),
        prefix: encodePath(prefix),
        suffix: encodePath(suffix),
        pattern,
        modifier,
        separator,
      });
      continue;
    }

    it.consume('END');
    break;
  } while (true);

  return new TokenData(tokens, delimiter);
}

function isRepeat(key: Key) {
  return key.modifier === '+' || key.modifier === '*';
}

function $match<P extends ParamData>(data: TokenData, options: MatchOptions = {}): MatchFunction<P> {
  const { decode = decodeURIComponent, end = true } = options;
  const re = tokensToRegexp(data, options);

  const decoders = re.keys.map((key) => {
    if (decode && (key.modifier === '+' || key.modifier === '*')) {
      const { prefix = '', suffix = '', separator = suffix + prefix } = key;
      return (value: string) => value.split(separator).map(decode);
    }

    return decode || NOOP_VALUE;
  });

  const validate = end ? isEnd : isDelimiterOrEnd(data.delimiter);

  return Object.assign(
    function match(input: string) {
      const m = re.exec(input);
      if (!m) return false;

      const { 0: path } = m;
      if (!validate(input, path)) return false;
      const params = Object.create(null);

      for (let i = 1; i < m.length; i++) {
        if (m[i] === undefined) continue;

        const key = re.keys[i - 1];
        const decoder = decoders[i - 1];
        params[key.name] = decoder(m[i]);
      }

      return { path, params };
    },
    { re },
  );
}

function match<P extends ParamData>(path: string, options: MatchOptions & ParseOptions = {}): MatchFunction<P> {
  return $match(parse(path, options), options);
}

function escape(str: string) {
  return str.replace(/[.+*?^${}()[\]|/\\]/g, '\\$&');
}

function toFlags(options: { sensitive?: boolean }) {
  return options.sensitive ? 's' : 'is';
}

function tokensToRegexp(data: TokenData, options: PathOptions) {
  const flags = toFlags(options);
  const keys: Key[] = [];
  const sources = toRegExpSource(data, keys);
  const regexp = new RegExp(`^${sources.join('')}`, flags);
  return Object.assign(regexp, { keys });
}

function toRegExpSource(data: TokenData, keys: Key[]): string[] {
  const delim = escape(data.delimiter);
  const sources = Array(data.tokens.length);
  let backtrack = '';

  let i = data.tokens.length;

  while (i--) {
    const token = data.tokens[i];

    if (typeof token === 'string') {
      sources[i] = backtrack = escape(token);
      continue;
    }

    const { prefix = '', suffix = '', separator = suffix + prefix, modifier = '' } = token;

    const pre = escape(prefix);
    const post = escape(suffix);

    if (token.name) {
      let pattern = token.pattern || '';

      keys.unshift(token);

      if (isRepeat(token)) {
        const mod = modifier === '*' ? '?' : '';
        const sep = escape(separator);

        if (!sep) {
          throw new TypeError(`Missing separator for "${token.name}"`);
        }

        pattern ||= `${negate(delim, sep, post || backtrack)}+`;
        sources[i] = `(?:${pre}((?:${pattern})(?:${sep}(?:${pattern}))*)${post})${mod}`;
      } else {
        pattern ||= `${negate(delim, post || backtrack)}+`;
        sources[i] = `(?:${pre}(${pattern})${post})${modifier}`;
      }

      backtrack = pre || pattern;
    } else {
      sources[i] = `(?:${pre}${post})${modifier}`;
      backtrack = `${pre}${post}`;
    }
  }

  return sources;
}

function negate(...args: string[]) {
  const values = Array.from(new Set(args)).filter(Boolean);
  return `(?:(?!${values.join('|')}).)`;
}

function makeMatchers(routes: Array<string>) {
  return routes.map((route) => match(route));
}

export function createRouteMatcher(getRoutes: () => Array<string>) {
  const allRoutes = [];
  const matchers = makeMatchers(allRoutes);

  return (path: string): [route: string, params: Record<string, string | Array<string>>] | undefined => {
    if (allRoutes.length === 0) {
      const newRoutes = getRoutes();
      allRoutes.push(...newRoutes);
      matchers.push(...makeMatchers(newRoutes));
    }

    for (let i = 0; i < matchers.length; i++) {
      const matcher = matchers[i];
      const result = matcher(path);

      if (result) {
        return [allRoutes[i], result.params];
      }
    }

    return undefined;
  };
}
