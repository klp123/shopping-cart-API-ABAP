
const axios = require("axios");
const BASE_URL = "http://localhost:4000/odata";

async function fetchProductsFromOData(query) {
  let params = [];
  if (query && query.minPrice) params.push(`$filter=price gt ${query.minPrice}`);
  if (query && query.limit) params.push(`$top=${query.limit}`);
  const qs = params.join("&");
  const url = `${BASE_URL}/Products?${qs}`;
  const res = await axios.get(url);
  return res.data.value;
}

module.exports = { fetchProductsFromOData };
