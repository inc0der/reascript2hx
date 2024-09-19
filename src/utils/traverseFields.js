export function traverseFields (ast, callback) {
  const length = ast.length;

  for (let i = length - 1; i >= 0; i--) {
    const field = ast[i];
    callback(field);
  }
}
