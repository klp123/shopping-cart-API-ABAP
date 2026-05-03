
const axios = require("axios");
const BASE_URL = "http://localhost:4000/odata";

async function fetchProductsFromOData(query) {
  const filters = [];
  if (query && query.minPrice) filters.push(`price gt ${query.minPrice}`);
  if (query && query.maxPrice) filters.push(`price lt ${query.maxPrice}`);
  if (query && query.category) filters.push(`category eq '${query.category}'`);

  // Use axios params object so special chars (spaces, quotes) are URL-encoded automatically
  const params = {};
  if (filters.length)   params['$filter'] = filters.join(' and ');
  if (query && query.limit) params['$top']    = query.limit;
  if (query && query.skip)  params['$skip']   = query.skip;

  const res = await axios.get(`${BASE_URL}/Products`, { params });
  return {
    count: res.data['@odata.count'],
    products: res.data.value,
  };
}

module.exports = { fetchProductsFromOData };
