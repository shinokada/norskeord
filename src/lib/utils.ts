// Paths worth restoring on next visit — excludes auth, api, admin, and static routes.
export const validFlashcardPathPattern =
  /^\/(?:learn|grammar|norskproven|quiz|blog|resources|guide|[a-z]\d(?:\/[^/]+)?|c(?:\/[^/]+)?)(?:\/.*)?$|^\/$/;

export function removeHyphensAndCapitalize(str: string) {
  if (!str) return str;

  // Capitalize the first letter of every word (including after hyphens)
  const capitalized = str.replace(/(^|\s|-)\w/g, (match) => match.toUpperCase());

  // Remove hyphens and collapse extra spaces
  return capitalized.replace(/-|\s{2,}/g, ' ');
}

export function randomword(wordList: string[]) {
  if (wordList.length === 0) {
    throw new Error('wordList must not be empty');
  }
  return wordList[Math.floor(Math.random() * wordList.length)];
}

export function getRandomItemFromDictionary<T>(dictionary: { [key: string]: T }): {
  [key: string]: T;
} {
  const keys = Object.keys(dictionary);
  if (keys.length === 0) {
    throw new Error('dictionary must not be empty');
  }
  const randomKey = keys[Math.floor(Math.random() * keys.length)];

  return {
    [randomKey]: dictionary[randomKey]
  };
}

export const randomNumberGenerator = (
  min: number,
  max: number,
  maxConsecutiveRepeats: number
): (() => number) => {
  const rangeSize = max - min + 1;
  if (rangeSize <= 0) {
    throw new Error('Invalid range: min must be <= max');
  }
  const windowSize = Math.min(Math.max(maxConsecutiveRepeats, 0), rangeSize - 1);
  const previousNumbers: number[] = [];

  return () => {
    let randomNumber;

    do {
      randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    } while (previousNumbers.includes(randomNumber));

    previousNumbers.push(randomNumber);

    if (previousNumbers.length > windowSize) {
      previousNumbers.shift();
    }

    return randomNumber;
  };
};

interface Word {
  norsk: string;
  english: string;
  norskexplanation?: string; // Optional property for verbs
}

export function getRandomPair(
  jsonData: Word[],
  langlang: string,
  isExplain = false,
  maxConsecutiveRepeats = 50
) {
  const randomIndexFn = randomNumberGenerator(0, jsonData.length - 1, maxConsecutiveRepeats);

  const randomIndex = randomIndexFn();
  // console.log(randomIndex)
  const randomPair = jsonData[randomIndex];
  // console.log('randomPair', randomPair)
  let front;
  let back;

  if (isExplain) {
    const { norsk, english, norskexplanation } = randomPair;

    if (langlang === 'noreng') {
      front = norsk;
      back = english;
    } else if (langlang === 'engnor') {
      front = english;
      back = norsk;
    } else if (langlang === 'nornor') {
      front = norskexplanation;
      back = norsk;
    }

    return { front, back, norskexplanation };
  } else {
    const { norsk, english } = randomPair;

    if (langlang === 'noreng') {
      front = norsk;
      back = english;
    } else if (langlang === 'engnor') {
      front = english;
      back = norsk;
    }

    return { front, back };
  }
}

export function openTab(word: string, website: string) {
  const baseUrl =
    website === 'google'
      ? 'https://translate.google.com/?hl=en&tab=TT&sl=no&tl=en&op=translate&text='
      : 'https://ordbokene.no/bm/search?q=';

  const url = baseUrl + encodeURIComponent(word);
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function cleanWord(word: string) {
  // Remove characters after '/'
  const withoutSlash = word.replace(/\/.*$/, '');

  // Remove characters after ','
  const withoutComma = withoutSlash.replace(/,.*/, '');

  // Remove characters after ' -'
  const withoutHyphen = withoutComma.replace(/ -.*/, '');

  return withoutHyphen.trim(); // Trim to remove leading/trailing spaces
}
