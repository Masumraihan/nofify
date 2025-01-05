const pick = <T extends Record<string, unknown>, K extends keyof T>(
  query: T,
  fields: K[],
): Partial<T> => {
  const finalQuery: Partial<T> = {};
  for (const key of fields) {
    if (query && query.hasOwnProperty.call(query, key)) {
      finalQuery[key] = query[key];
    }
  }
  return finalQuery;
};
export default pick;
