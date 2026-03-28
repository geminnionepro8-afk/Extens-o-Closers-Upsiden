try {
  const pg = require('pg');
  console.log('PG Found at:', require.resolve('pg'));
} catch (e) {
  console.log('PG NOT FOUND');
}
