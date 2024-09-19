import camelcase from 'camelcase';

export function enhancedCamelCase (str, customStems = []) {
  const commonStems = [
    'x',
    'y',
    'w',
    'h',
    'face',
    'list',
    'id',
    'img',
    'digits',
    'state',
    'idx',
    'want',
    'master',
    'time',
    'pos',
    'dest',
    'script',
    'fn',
    'line',
    'tempo',
    'change',
    'set',
    'flag',
    'key',
    'what',
    'units',
    'name',
    'source',
    'dir',
    'play',
    'gang',
    'api',
    'url',
    'rate', 
    'arm', 
    'rpc',
    'uuid',
    ...customStems];

  function findLongestStem (word, stems) {
    return stems.reduce((longest, stem) =>
      word.toLowerCase().includes(stem.toLowerCase()) && stem.length > longest.length ? stem : longest
      , '');
  }

  let result = camelcase(str);

  if (!/[A-Z]/.test(result.slice(1))) {
    let word = result;
    let newResult = '';
    while (word.length > 0) {
      const stem = findLongestStem(word, commonStems);
      if (stem && word.toLowerCase().indexOf(stem.toLowerCase()) > 0) {
        const index = word.toLowerCase().indexOf(stem.toLowerCase());
        newResult += word.slice(0, index) + stem.charAt(0).toUpperCase() + stem.slice(1).toLowerCase();
        word = word.slice(index + stem.length);
      } else {
        newResult += word.charAt(0);
        word = word.slice(1);
      }
    }
    result = newResult.charAt(0).toLowerCase() + newResult.slice(1);
  }

  commonStems.forEach(stem => {
    const lowercaseStem = stem.toLowerCase();
    let index = result.toLowerCase().indexOf(lowercaseStem);
    while (index > 0) {
      result =
        result.slice(0, index) +
        result.charAt(index).toUpperCase() +
        result.slice(index + 1);
      index = result.toLowerCase().indexOf(lowercaseStem, index + 1);
    }
  });

  return result;
}